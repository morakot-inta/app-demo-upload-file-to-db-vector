# RAG Solution Backend

This is the backend service for the RAG (Retrieval-Augmented Generation) solution.

## API Endpoints

### File Upload

`POST /api/upload`

Uploads a file to the server.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with a 'file' field containing the file to upload

**Response:**
- Status: 200 OK
- Body:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "filename": "example-1234567890.pdf",
    "originalname": "example.pdf",
    "mimetype": "application/pdf",
    "size": 1234567,
    "path": "/path/to/uploaded/file"
  }
}
```

**Error Response:**
- Status: 400 Bad Request (if no file was uploaded)
- Status: 500 Internal Server Error (if there was an error during upload)
- Body:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error message"
}
```

## File Size Limit

The maximum file size allowed is 10 MB.

## Supported File Types

By default, the frontend supports the following file types:
- PDF (.pdf)
- Plain text (.txt)
- Word documents (.doc, .docx)

## Running the Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The server will run on http://localhost:3000 by default.
