import React from 'react';
import { useState } from 'react';

const ImageUploadTest: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testImageAccess = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        addTestResult(`✅ Image accessible: ${url}`);
      } else {
        addTestResult(`❌ Image not accessible: ${url} (Status: ${response.status})`);
      }
    } catch (error) {
      addTestResult(`❌ Error accessing image: ${url} - ${error}`);
    }
  };

  const handleImageChange = async (url: string) => {
    setImageUrl(url);
    addTestResult(`📤 Image uploaded: ${url}`);
    
    // Test immediate access
    setTimeout(() => testImageAccess(url), 1000);
    setTimeout(() => testImageAccess(url), 5000);
    setTimeout(() => testImageAccess(url), 10000);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Image Upload Test</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Current Image URL:</h3>
          <p className="text-sm text-gray-600 break-all">{imageUrl || 'No image uploaded'}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Image Preview:</h3>
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="max-w-xs h-auto border rounded"
              onLoad={() => addTestResult('✅ Image loaded in browser')}
              onError={() => addTestResult('❌ Image failed to load in browser')}
            />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
          <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm mb-1">{result}</div>
              ))
            )}
          </div>
          <button 
            onClick={clearResults}
            className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>

        <div>
          <button
            onClick={() => {
              if (imageUrl) {
                testImageAccess(imageUrl);
              } else {
                addTestResult('❌ No image URL to test');
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Test Current Image Access
          </button>
          
          <button
            onClick={() => {
              const testUrl = '/uploads/4126af7e-f99d-42dc-88a4-94ba349b537a.png';
              testImageAccess(testUrl);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Known Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadTest;
