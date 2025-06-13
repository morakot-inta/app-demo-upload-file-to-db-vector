import React, { useState, useEffect } from 'react';

interface FileListProps {
  refreshTrigger?: number;
  onFileSelected?: (url: string, filename: string) => void;
}

interface FileItem {
  name: string;
  url: string;
  originalName: string | null;
  decodedName?: string | null;
}

function FileList({ refreshTrigger = 0, onFileSelected }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the list of files from the backend
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/api/files');
      
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err instanceof Error ? err.message : 'Error fetching files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const handleFileClick = (url: string, filename: string) => {
    if (onFileSelected) {
      onFileSelected(url, filename);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Uploaded Files</h2>
      
      {loading && <p style={loadingStyle}>Loading files...</p>}
      
      {error && <p style={errorStyle}>{error}</p>}
      
      {!loading && !error && files.length === 0 && (
        <p style={noFilesStyle}>No files have been uploaded yet.</p>
      )}
      
      {files.length > 0 && (
        <div style={fileListStyle}>
          {files.map((file, index) => (
            <div 
              key={index} 
              style={fileItemStyle}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '')}
              onClick={() => handleFileClick(file.url, file.originalName || file.name)}
            >
              <div style={fileIconStyle}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path fill="#FFF" d="M14 3v5h5v11H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7z"/>
                </svg>
              </div>
              <div style={fileInfoStyle}>
                <p style={fileNameStyle}>{file.originalName || file.decodedName || file.name}</p>
                <p style={fileUrlStyle}>{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button 
        style={{
          ...refreshButtonStyle,
          ...(loading ? {
            backgroundColor: '#95a5a6',
            cursor: 'not-allowed'
          } : {})
        }} 
        onClick={fetchFiles} 
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh List'}
      </button>
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '20px auto',
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

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#666'
};

const errorStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#e74c3c',
  padding: '10px',
  border: '1px solid #e74c3c',
  borderRadius: '4px',
  backgroundColor: '#fadbd8'
};

const noFilesStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#666',
  fontStyle: 'italic'
};

const fileListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '20px'
};

const fileItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px',
  border: '1px solid #eee',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  // Hover effect will be added with actual CSS or inline JS
};

const fileIconStyle: React.CSSProperties = {
  marginRight: '15px',
  color: '#3498db'
};

const fileInfoStyle: React.CSSProperties = {
  flexGrow: 1
};

const fileNameStyle: React.CSSProperties = {
  margin: '0 0 5px 0',
  fontWeight: 'bold',
  color: '#333'
};

const fileUrlStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#888',
  wordBreak: 'break-all'
};

const refreshButtonStyle: React.CSSProperties = {
  padding: '10px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '100%',
  marginTop: '10px',
  fontSize: '16px'
  // Disabled state will be handled with conditional styling
};

export default FileList;
