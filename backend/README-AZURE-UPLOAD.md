# File Upload with Azure Blob Storage

This backend service provides an API to upload files (including files with Thai language names) to Azure Blob Storage.

## Setup

1. Create a `.env` file in the root of the backend folder with the following content:

```
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=rag-container
```

2. Make sure your Azure Storage Account is properly configured:
   - Create a storage account in the Azure portal if you don't have one
   - Create a container named "rag-container" or update the environment variable
   - Set the container's access level to "Blob" to allow public access to blobs

## Testing the Connection

Before using the service, test your Azure Storage connection:

```bash
npm run test-azure
```

To specifically test Thai language support:

```bash
npm run test-thai
```

This will verify:
- Connection to your Azure Storage account
- Container existence (and create it if missing)
- Ability to upload files with Thai language names

## API Endpoints

### POST /api/upload

Upload a file to Azure Blob Storage.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with a file field named `file`

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully to Azure Blob Storage",
  "file": {
    "filename": "encoded-filename.ext",
    "originalname": "original-filename.ext",
    "mimetype": "application/type",
    "size": 12345,
    "url": "https://yourstorage.blob.core.windows.net/rag-container/filename"
  }
}
```

## Handling Thai and International Characters

This service is specially designed to handle filenames with Thai and other international characters:

1. When uploading files with non-ASCII characters:
   - A safe, ASCII-compatible blob name is generated using timestamp and random ID
   - The original filename is preserved in metadata in both Base64 encoding and URL encoding
   - Both `originalName` and `decodedName` fields are returned to the client
   - The frontend displays the Thai filename correctly, regardless of blob storage limitations

2. Debug information is printed to the console to help with troubleshooting:
   - Hex encoding of original filenames
   - Character-by-character UTF-8 code points
   - Metadata verification after upload
   - Full connection details and error messages

3. The file_list.tsx component in the frontend properly displays the Thai filename by:
   - Preferring the decoded name when available
   - Falling back to the original name
   - Using the safe blob name only as a last resort

## Troubleshooting

If you encounter issues with file uploads:

1. Check your connection string in the `.env` file
2. Verify the Azure Storage container exists and has public access
3. Run the test script to validate the connection: `npm run test-azure`
4. Check server logs for detailed error messages
5. Ensure your frontend is correctly sending the file with proper encoding

For "URI does not represent any resource on the server" error, make sure:
- Your connection string is properly formatted
- You have write permission to the storage account
- The container exists and is accessible
