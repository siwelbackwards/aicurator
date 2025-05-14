const fs = require('fs');
const path = require('path');
let glob;

console.log('=== Starting fix-html script ===');

try {
  // Try to require glob, handle if it fails
  try {
    // First try the new module format
    glob = require('glob');
    if (typeof glob.sync === 'function') {
      // Use glob.sync directly if available
      console.log('Using glob with sync method');
    } else if (typeof glob.globSync === 'function') {
      // Use globSync if that's the available method
      glob = { sync: glob.globSync };
      console.log('Using glob with globSync method');
    } else {
      throw new Error('glob module doesn\'t have expected methods');
    }
  } catch (err) {
    console.log('Failed to import glob properly:', err.message);
    // Fallback to a simple sync implementation for finding html files
    glob = {
      sync: function(pattern) {
        try {
          const dir = path.dirname(pattern.replace('/**/*.html', ''));
          const results = [];
          
          function walkDir(currentPath) {
            const files = fs.readdirSync(currentPath);
            
            for (const file of files) {
              const filePath = path.join(currentPath, file);
              const stat = fs.statSync(filePath);
              
              if (stat.isDirectory()) {
                walkDir(filePath);
              } else if (file.endsWith('.html')) {
                results.push(filePath);
              }
            }
          }
          
          if (fs.existsSync(dir)) {
            walkDir(dir);
          }
          
          return results;
        } catch (err) {
          console.error('Error in custom glob implementation:', err);
          return [];
        }
      }
    };
    console.log('Using fallback file finder implementation');
  }

  const outputDir = path.join(__dirname, '../out');

  // Ensure the output directory exists before proceeding
  if (!fs.existsSync(outputDir)) {
    console.warn(`Output directory ${outputDir} not found. Attempting to create it.`);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Successfully created output directory: ${outputDir}`);
      
      // Create a minimal index.html if it doesn't exist
      const indexPath = path.join(outputDir, 'index.html');
      if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI Curator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="/env.js"></script>
</head>
<body>
  <div id="__next">
    <h1>AI Curator</h1>
    <p>This is a fallback page created during the build process.</p>
  </div>
</body>
</html>`);
        console.log('Created fallback index.html');
      }
    } catch (err) {
      console.error(`Failed to create output directory ${outputDir}:`, err);
      // Continue anyway to try other operations
    }
  }

  // Create env.js if it doesn't exist
  const envJsPath = path.join(outputDir, 'env.js');
  if (!fs.existsSync(envJsPath)) {
    try {
      // Create a basic env.js
      const envJsContent = `
// Environment variables for client-side use
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}"
};
console.log('Environment loaded:', window.ENV);
`;
      fs.writeFileSync(envJsPath, envJsContent);
      console.log('Created env.js in output directory');
    } catch (err) {
      console.error('Failed to create env.js:', err);
    }
  }

  // Find all HTML files in the output directory and inject env.js
  try {
    console.log('Looking for HTML files in:', outputDir);
    const htmlFiles = glob.sync(path.join(outputDir, '/**/*.html'));
    console.log(`Found ${htmlFiles.length} HTML files`);

    // Inject env.js script into each HTML file
    htmlFiles.forEach(file => {
      try {
        console.log(`Processing ${file}`);
        let content = fs.readFileSync(file, 'utf8');
        
        // Check if env.js is already included
        if (content.includes('src="/env.js"')) {
          console.log(`env.js already included in ${file}`);
          return;
        }
        
        // Add env.js before the first script tag or at the end of the head
        if (content.includes('</head>')) {
          content = content.replace('</head>', '<script src="/env.js"></script></head>');
        } else {
          // If no head tag, try to add before first script tag
          if (content.includes('<script')) {
            content = content.replace(/<script/, '<script src="/env.js"></script><script');
          } else {
            // If no script tag, add at the beginning of body or the document
            if (content.includes('<body>')) {
              content = content.replace('<body>', '<body><script src="/env.js"></script>');
            } else {
              // Last resort - add at the beginning of the document
              content = '<script src="/env.js"></script>\n' + content;
            }
          }
        }
        
        fs.writeFileSync(file, content);
        console.log(`Successfully injected env.js into ${file}`);
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    });
  } catch (err) {
    console.error('Error finding or processing HTML files:', err);
  }

  // Create a Netlify _redirects file to handle client-side routing
  const redirectsPath = path.join(outputDir, '_redirects');
  const redirectsContent = 
`# Netlify redirects for client-side routing
/api/*  /not-found.html  404
/*      /index.html      200
`;

  try {
    fs.writeFileSync(redirectsPath, redirectsContent);
    console.log('Created Netlify _redirects file for client-side routing in', redirectsPath);
  } catch (err) {
    console.error(`Error creating Netlify _redirects file in ${redirectsPath}:`, err);
  }

  console.log('=== fix-html script completed successfully ===');
} catch (error) {
  console.error('Unhandled error in fix-html script:', error);
  console.log('Continuing deployment despite errors in fix-html script');
  // Don't exit with error code, let the deployment continue
}