# RAG Solution with Azure Blob Storage Integration

This project demonstrates a RAG (Retrieval-Augmented Generation) solution that integrates with Azure Blob Storage.

## Backend Setup

The backend is built with Express and serves as an API for file uploads to Azure Blob Storage.

### Prerequisites

1. Node.js and npm
2. Azure Storage Account

### Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```
AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
AZURE_STORAGE_CONTAINER_NAME=rag-container
```

To get your Azure Storage connection string:

1. Go to the Azure Portal
2. Navigate to your Storage Account
3. Go to "Access keys" under "Settings"
4. Copy the "Connection string" value
5. Paste it in your `.env` file

### Running the Backend

```bash
cd backend
npm install
npm run dev
```

## API Endpoints

### Upload File

- **URL**: `/api/upload`
- **Method**: `POST`
- **Content Type**: `multipart/form-data`
- **Request Body**:
  - `file`: The file to upload

**Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully to Azure Blob Storage",
  "file": {
    "filename": "example.pdf",
    "originalname": "example.pdf",
    "decodedName": "example.pdf",
    "blobName": "example-123456789.pdf",
    "mimetype": "application/pdf",
    "size": 12345,
    "url": "https://yourstorageaccount.blob.core.windows.net/rag-container/example-123456789.pdf"
  }
}
```

## File Name Handling

The system is designed to preserve original filenames, including those with Thai characters or other non-ASCII characters. When you upload a file:

1. The original filename is preserved in the system and returned in the API response
2. For compatibility with Azure Blob Storage, a URL-safe version of the filename is created for storage
3. The original filename is stored in the blob's metadata for retrieval
4. When listing files, both the Azure blob name and the original filename are available

### Thai Language Support

The system fully supports Thai language filenames:

- Thai filenames are preserved in their original form
- Files can be searched and retrieved using their Thai names
- The frontend displays Thai filenames correctly
- Base64 encoding is used to ensure proper storage of Thai characters in metadata

## Frontend

The frontend is a React application that provides a user interface for uploading files to the backend.

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

## How It Works

1. User selects a file to upload through the frontend interface
2. Frontend sends the file to the backend API
3. Backend uploads the file to Azure Blob Storage
4. Backend returns the file details including the public URL
5. Frontend displays the success message to the user

## Security Considerations

- The application uses Azure Blob Storage's SAS tokens for secure access
- Files are stored securely in Azure Blob Storage
- Connection strings should be kept confidential and not committed to version control
