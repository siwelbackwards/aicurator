// Static page that redirects on the client side
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Artwork',
  description: 'Upload and create a new artwork listing',
};

// Use a static HTML page that redirects on mount
export default function CreateArtworkPage() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Create New Artwork</title>
        <meta name="description" content="Upload and create a new artwork listing" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Client-side redirect using vanilla JS
            window.onload = function() {
              window.location.href = '/create-artwork';
            }
          `,
        }} />
      </head>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Create New Artwork
          </h1>
          <p>Redirecting to artwork creation page...</p>
          <div style={{ margin: '2rem auto', width: '2rem', height: '2rem', border: '2px solid #6366f1', borderBottomColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <noscript>
            <p>JavaScript is required for this page. Please <a href="/create-artwork">click here</a> to continue.</p>
          </noscript>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `,
          }} />
        </div>
      </body>
    </html>
  );
} 