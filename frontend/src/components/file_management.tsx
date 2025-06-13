import React, { useState } from 'react';
import UploadFile from './upload_file';
import FileList from './file_list';

function FileManagement() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to refresh file list after successful upload
  const handleFileUploaded = () => {
    // Increment refresh trigger to cause FileList to refresh
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>File Management</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <UploadFile 
          allowedFileTypes={['application/pdf', 'text/plain', 'image/jpeg', 'image/png']}
          maxFileSizeInMB={10}
          onFileUploaded={handleFileUploaded}
        />
      </div>
      
      <FileList refreshTrigger={refreshTrigger} />
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Thai Filename Support</h3>
        <p>This application supports uploading files with Thai filenames.</p>
        <p>Try uploading a file with a Thai name to test this feature!</p>
        <p><strong>Example:</strong> ทดสอบภาษาไทย.txt</p>
      </div>
    </div>
  );
}

export default FileManagement;
