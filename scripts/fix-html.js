const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

console.log('Starting post-build HTML fixing process...');

const outputDir = path.join(__dirname, '../out');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  console.log('Output directory not found, creating it...');
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy env.js to the output directory if it exists in public
const publicEnvJs = path.join(__dirname, '../public/env.js');
if (fs.existsSync(publicEnvJs)) {
  fs.copyFileSync(publicEnvJs, path.join(outputDir, 'env.js'));
  console.log('Copied env.js to output directory');
} else {
  // Create env.js directly in the output directory if missing
  const envContent = `
// Environment variables for client-side use
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
};
console.log('Environment loaded:', window.ENV);
`;
  fs.writeFileSync(path.join(outputDir, 'env.js'), envContent);
  console.log('Created env.js in output directory');
}

// Find HTML files and inject env.js script
try {
  const htmlFiles = globSync(path.join(outputDir, '**/*.html'));
  console.log(`Found ${htmlFiles.length} HTML files`);
  
  htmlFiles.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      
      // Check if env.js is already included
      if (!content.includes('src="/env.js"')) {
        // Add env.js before the first script tag or at the end of the head
        content = content.replace('</head>', '<script src="/env.js"></script></head>');
        fs.writeFileSync(file, content);
        console.log(`Added env.js script to ${path.relative(outputDir, file)}`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  });
} catch (err) {
  console.error('Error finding HTML files:', err);
}

// Create a Netlify _redirects file
const redirectsPath = path.join(outputDir, '_redirects');
const redirectsContent = `
# Netlify redirects for client-side routing
/api/*  /not-found.html  404
/*      /index.html      200
`;

try {
  fs.writeFileSync(redirectsPath, redirectsContent);
  console.log('Created Netlify _redirects file');
} catch (err) {
  console.error('Error creating _redirects file:', err);
}

// Ensure index.html exists
if (!fs.existsSync(path.join(outputDir, 'index.html'))) {
  console.log('No index.html found, creating a minimal one...');
  const minimalIndexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Curator</title>
  <script src="/env.js"></script>
</head>
<body>
  <div id="__next">
    <h1>Loading app...</h1>
    <p>If this doesn't redirect, please <a href="/">click here</a>.</p>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(outputDir, 'index.html'), minimalIndexHtml);
}

console.log('Post-build HTML fixing process completed successfully');