'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatSupabaseUrl } from '@/lib/utils';
import { SupabaseImage } from '@/components/ui/supabase-image';

export default function ImageDebugPage() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [formattedUrl, setFormattedUrl] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  
  const testImage = async () => {
    if (!imageUrl) return;
    
    // Format the URL
    const formatted = formatSupabaseUrl(imageUrl);
    setFormattedUrl(formatted);
    
    // Test the URL with our debug API
    try {
      const response = await fetch('/api/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: formatted }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Image URL Debug Tool</h1>
      
      <div className="mb-8 grid gap-4">
        <div className="flex gap-4">
          <Input 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL or path to test"
            className="flex-1"
          />
          <Button onClick={testImage}>Test URL</Button>
        </div>
        
        {formattedUrl && (
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold mb-2">Formatted URL:</h2>
            <p className="text-sm break-all">{formattedUrl}</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="text-sm overflow-auto p-2 bg-gray-200 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {formattedUrl && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Image Preview</h2>
          <div className="w-64 h-64 relative border rounded overflow-hidden">
            <SupabaseImage
              src={imageUrl}
              alt="Image preview"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
      
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
        <h2 className="font-semibold mb-2">Common Issues:</h2>
        <ul className="list-disc pl-4 space-y-2 text-sm">
          <li>Make sure your storage bucket is set to public access</li>
          <li>Check for duplicate path segments like "artwork-images/artwork-images"</li>
          <li>Ensure the file exists in the specified bucket</li>
          <li>Verify CORS settings allow access from your domain</li>
          <li>Check if your file names have unusual characters or spaces</li>
        </ul>
      </div>
    </div>
  );
} 