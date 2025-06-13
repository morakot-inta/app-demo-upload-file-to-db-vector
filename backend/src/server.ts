import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { ensureContainerExists, uploadFileToBlob, listBlobs, getOriginalFileName } from './services/blobService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for memory storage (for Azure Blob upload)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('File upload request received');
    
    if (!req.file) {
      console.warn('No file uploaded');
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);
    
    // Add specific Thai character debugging info
    if (/[\u0E00-\u0E7F]/.test(req.file.originalname)) {
      console.log('THAI FILENAME DETECTED - Detailed Analysis:');
      console.log('----------------------------------------');
      console.log(`Thai filename: ${req.file.originalname}`);
      console.log(`Characters: ${Array.from(req.file.originalname).join(' | ')}`);
      console.log(`Codepoints: ${Array.from(req.file.originalname).map(c => c.codePointAt(0)?.toString(16)).join(' | ')}`);
      console.log('----------------------------------------');
    }

    try {
      // Make sure container exists
      console.log('Ensuring container exists...');
      await ensureContainerExists();
      console.log('Container exists check completed');
    } catch (containerError) {
      console.error('Error ensuring container exists:', containerError);
      res.status(500).json({
        success: false,
        message: 'Error with Azure Blob Storage container',
        error: containerError instanceof Error ? containerError.message : 'Unknown container error',
      });
      return;
    }
    
    // We'll use the original filename when uploading to Azure Blob Storage
    console.log(`Original filename: ${req.file.originalname}`);
    console.log(`Original filename encoding check - Buffer: ${Buffer.from(req.file.originalname).toString('hex')}`);
    console.log(`Original filename UTF8: ${encodeURIComponent(req.file.originalname)}`);
    
    try {
      // Upload the file to Azure Blob Storage using original filename
      console.log('Uploading file to Azure Blob Storage with original filename...');
      const blobResult = await uploadFileToBlob(
        req.file.originalname, // Use the actual original name
        req.file.buffer,
        req.file.mimetype
      );
      console.log(`File uploaded successfully. URL: ${blobResult.url}`);
      
      // Return success response with file details including decoded Thai name
      res.status(200).json({
        success: true,
        message: 'File uploaded successfully to Azure Blob Storage',
        file: {
          filename: blobResult.originalName, // The original filename
          originalname: req.file.originalname,
          decodedName: blobResult.decodedName || req.file.originalname, // Include decoded Thai name
          blobName: blobResult.blobName, // The actual blob name used in Azure (URL-safe version)
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: blobResult.url,
        }
      });
    } catch (uploadError) {
      console.error('Error uploading file to Azure Blob Storage:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Error uploading file to Azure Blob Storage',
        error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error',
      });
    }
  } catch (error) {
    console.error('General error in upload endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file upload',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Add endpoint to list all files in the blob container
app.get('/api/files', async (req, res) => {
  try {
    console.log('Listing files from Azure Blob Storage...');
    const files = await listBlobs();
    
    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      files: files
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing files',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize Azure Blob Storage Container
ensureContainerExists().catch(err => {
  console.error('Failed to initialize Azure Blob Storage container:', err);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Azure Storage connection string is not set. File uploads will fail.');
    console.warn('\x1b[33m%s\x1b[0m', 'Please set AZURE_STORAGE_CONNECTION_STRING in the .env file.');
  }
});