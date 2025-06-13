import React, { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

interface UploadFileProps {
  allowedFileTypes?: string[];
  maxFileSizeInMB?: number;
  onFileUploaded?: (file: File) => void;
}

function UploadFile({
  allowedFileTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSizeInMB = 10,
  onFileUploaded
}: UploadFileProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File | undefined) => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    // Check file type
    if (!allowedFileTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed types are: ${allowedFileTypes.join(', ')}`);
      return;
    }

    // Check file size
    const fileSizeInMB = selectedFile.size / 1024 / 1024;
    if (fileSizeInMB > maxFileSizeInMB) {
      setError(`File size exceeds ${maxFileSizeInMB} MB limit`);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Setup progress tracking
      const intervalId = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(intervalId);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      // Create form data and upload to our API
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the backend API endpoint
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Clear the interval and process the response
      clearInterval(intervalId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error uploading file');
      }
      
      const data = await response.json();
      console.log('Upload success:', data);
      
      setUploadProgress(100);
      setUploading(false);
      
      // Show the Azure blob URL in a more user-friendly way
      if (data.file && data.file.url) {
        console.log('File available at:', data.file.url);
        console.log('Original filename:', data.file.originalname);
        console.log('Decoded Thai filename:', data.file.decodedName || data.file.originalname);
        console.log('Actual blob name used in Azure:', data.file.blobName || data.file.filename);
      }
      
      // Call the callback if provided
      if (onFileUploaded) {
        onFileUploaded(file);
      }
      
      // Reset after successful upload
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file. Please try again.');
      setUploading(false);
      setUploadProgress(0);
      console.error('Upload error:', err);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type.includes('image/')) {
      return (
        <div className="file-preview">
          <img 
            src={URL.createObjectURL(file)} 
            alt="Preview" 
            style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'contain' }}
          />
        </div>
      );
    }
    
    return (
      <div className="file-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
          <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
      </div>
    );
  };

  return (
    <div className="upload-container" style={containerStyle}>
      <h2 style={headerStyle}>Upload File</h2>
      
      {!file ? (
        <div 
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          style={{
            ...uploadAreaStyle,
            ...(isDragging ? dragOverStyle : {})
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept={allowedFileTypes.join(',')}
          />
          
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" style={iconStyle}>
            <path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5c0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5l5 5h-3z"/>
          </svg>
          
          <p style={dropTextStyle}>Drag & Drop your file here</p>
          <p style={orTextStyle}>- OR -</p>
          <button 
            onClick={handleBrowseClick} 
            style={browseButtonStyle}
          >
            Browse Files
          </button>
          <p style={fileInfoStyle}>
            Allowed file types: {allowedFileTypes.map(type => type.split('/')[1]).join(', ')}
            <br />
            Maximum size: {maxFileSizeInMB} MB
          </p>
        </div>
      ) : (
        <div className="file-details" style={fileDetailsStyle}>
          {getFileIcon()}
          <div style={fileInfoContainerStyle}>
            <p style={fileNameStyle}>{file.name}</p>
            <p style={fileSizeStyle}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={progressContainerStyle}>
              <div style={{
                ...progressBarStyle,
                width: `${uploadProgress}%`
              }}></div>
              <span style={progressTextStyle}>{uploadProgress}%</span>
            </div>
          )}
          
          {uploadProgress === 100 ? (
            <div style={successMessageStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              Upload successful!
            </div>
          ) : (
            <div style={buttonsContainerStyle}>
              {!uploading && (
                <>
                  <button onClick={handleUpload} style={uploadButtonStyle}>
                    Upload
                  </button>
                  <button onClick={resetUpload} style={cancelButtonStyle}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 0 15px rgba(0,0,0,0.1)',
  backgroundColor: '#fff'
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
  color: '#333'
};

const uploadAreaStyle: React.CSSProperties = {
  border: '2px dashed #ccc',
  borderRadius: '8px',
  padding: '40px 20px',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  backgroundColor: '#f9f9f9'
};

const dragOverStyle: React.CSSProperties = {
  borderColor: '#3498db',
  backgroundColor: '#f0f8ff'
};

const iconStyle: React.CSSProperties = {
  color: '#3498db',
  marginBottom: '10px'
};

const dropTextStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '10px 0',
  color: '#555'
};

const orTextStyle: React.CSSProperties = {
  margin: '15px 0',
  color: '#777'
};

const browseButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'background-color 0.3s'
};

const fileInfoStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888',
  marginTop: '15px'
};

const fileDetailsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  border: '1px solid #eee',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9'
};

const fileInfoContainerStyle: React.CSSProperties = {
  marginTop: '15px',
  textAlign: 'center'
};

const fileNameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  margin: '5px 0',
  wordBreak: 'break-all',
  color: '#333'
};

const fileSizeStyle: React.CSSProperties = {
  color: '#777',
  margin: '5px 0'
};

const buttonsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginTop: '20px'
};

const uploadButtonStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px'
};

const errorStyle: React.CSSProperties = {
  color: '#e74c3c',
  marginTop: '10px',
  textAlign: 'center'
};

const progressContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '20px',
  backgroundColor: '#eee',
  borderRadius: '10px',
  marginTop: '20px',
  position: 'relative',
  overflow: 'hidden'
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: '#3498db',
  borderRadius: '10px',
  transition: 'width 0.3s ease'
};

const progressTextStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: '#fff',
  fontWeight: 'bold',
  textShadow: '0 0 3px rgba(0,0,0,0.5)'
};

const successMessageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: '#27ae60',
  fontWeight: 'bold',
  marginTop: '20px'
};

export default UploadFile;