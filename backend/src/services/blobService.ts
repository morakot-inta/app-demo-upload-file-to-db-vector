import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'rag-container';

if (!connectionString) {
  console.error('Azure Storage connection string is not set in environment variables.');
}

// Get BlobServiceClient
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function ensureContainerExists(): Promise<void> {
  try {
    console.log(`Attempting to ensure container "${containerName}" exists...`);
    console.log(`Using connection string: ${connectionString ? 'Connection string is set' : 'Connection string is NOT set'}`);
    
    // Check if we can access the storage account
    try {
      const accountInfo = await blobServiceClient.getAccountInfo();
      console.log(`Successfully connected to storage account. Account kind: ${accountInfo.accountKind}`);
    } catch (accountError) {
      console.error(`Error connecting to storage account: ${accountError instanceof Error ? accountError.message : 'Unknown error'}`);
      console.error('Full error:', accountError);
    }

    // List existing containers
    console.log('Listing existing containers:');
    let containerCount = 0;
    for await (const container of blobServiceClient.listContainers()) {
      console.log(`- ${container.name}`);
      containerCount++;
    }
    console.log(`Total containers: ${containerCount}`);

    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob' // Public access level: 'blob' allows public access to blobs but not container metadata
    });
    console.log(`Container "${containerName}" is ready.`);
  } catch (error) {
    console.error(`Error ensuring container exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('Full error details:', error);
    throw error;
  }
}

export async function uploadFileToBlob(filePath: string, fileBuffer: Buffer, contentType: string): Promise<{url: string, originalName: string, decodedName: string, blobName: string}> {
  try {
    console.log(`Uploading file "${filePath}" (${fileBuffer.length} bytes) to container "${containerName}"...`);
    
    // Check if the filename contains non-ASCII characters (like Thai)
    const hasNonAsciiChars = /[^\x00-\x7F]/.test(filePath);
    let safeBlobName = filePath;
    
    // For non-ASCII filenames (like Thai), create a UUID-based name but keep the extension
    if (hasNonAsciiChars) {
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = filePath.includes('.') ? filePath.substring(filePath.lastIndexOf('.')) : '';
      safeBlobName = `file-${timestamp}-${randomId}${extension}`;
    }
    
    console.log(`Using blob name: "${safeBlobName}"`);
    
    // Get BlockBlobClient with the original filename (properly encoded)
    const blockBlobClient = containerClient.getBlockBlobClient(safeBlobName);
    console.log(`Blob URL that will be used: ${blockBlobClient.url}`);
    
    // Store the original filename in multiple formats to ensure preservation of Thai characters
    const originalFilenameEncoded = Buffer.from(filePath).toString('base64'); // Base64 encode to preserve all characters
    const originalNameUtf8 = encodeURIComponent(filePath); // URL encode for extra safety
    
    // Create additional fields to help with debugging
    const encodingDetails = {
      filePathHex: Buffer.from(filePath).toString('hex'),
      utf8Details: Array.from(filePath).map(char => ({ 
        char, 
        codePoint: char.codePointAt(0)?.toString(16) 
      }))
    };
    console.log('Encoding details for debugging:', JSON.stringify(encodingDetails, null, 2));
    
    // Store comprehensive metadata
    const metadata = {
      originalFilename: originalFilenameEncoded,
      originalNameUtf8: originalNameUtf8,
      dateUploaded: new Date().toISOString()
    };
    
    console.log(`Original filename stored in metadata (base64): ${originalFilenameEncoded}`);
    console.log(`Original filename stored in metadata (UTF8): ${originalNameUtf8}`);
    
    // Upload file buffer
    const uploadResponse = await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: { blobContentType: contentType },
      metadata: metadata
    });
    
    console.log('Upload completed successfully.');
    
    // Add extra verification step - read back the metadata to ensure it was stored correctly
    const properties = await blockBlobClient.getProperties();
    console.log('Stored metadata:', properties.metadata);
    
    // Return the URL to access the blob and both the original and decoded filenames
    return {
      url: blockBlobClient.url,
      originalName: filePath,
      decodedName: Buffer.from(originalFilenameEncoded, 'base64').toString(),
      blobName: safeBlobName
    };
  } catch (error) {
    console.error(`Error uploading to Azure Blob Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('Full error details:', error);
    throw error;
  }
}

export async function getBlobUrl(filePath: string): Promise<string> {
  const blockBlobClient = containerClient.getBlockBlobClient(filePath);
  return blockBlobClient.url;
}

export async function getBlobMetadata(blobName: string): Promise<any> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const properties = await blockBlobClient.getProperties();
  return properties.metadata;
}

export async function getOriginalFileName(blobName: string): Promise<string | null> {
  try {
    const metadata = await getBlobMetadata(blobName);
    if (metadata && metadata.originalFilename) {
      // Decode the base64-encoded original filename
      return Buffer.from(metadata.originalFilename, 'base64').toString();
    }
    return null;
  } catch (error) {
    console.error('Error retrieving original filename:', error);
    return null;
  }
}

export async function listBlobs(): Promise<Array<{name: string, url: string, originalName: string | null, decodedName: string | null}>> {
  const blobs: Array<{name: string, url: string, originalName: string | null, decodedName: string | null}> = [];
  
  for await (const blob of containerClient.listBlobsFlat()) {
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
    const metadata = await getBlobMetadata(blob.name);
    let originalName = null;
    let decodedName = null;
    
    if (metadata && metadata.originalfilename) {
      try {
        originalName = metadata.originalfilename;
        decodedName = Buffer.from(metadata.originalfilename, 'base64').toString();
      } catch (error) {
        console.error(`Error decoding filename for blob ${blob.name}:`, error);
      }
    }
    
    blobs.push({
      name: blob.name,
      url: blockBlobClient.url,
      originalName,
      decodedName
    });
  }
  
  return blobs;
}

export default { 
  ensureContainerExists, 
  uploadFileToBlob,
  getBlobUrl,
  getBlobMetadata,
  getOriginalFileName,
  listBlobs
};
