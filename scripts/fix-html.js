const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const outputDir = path.join(__dirname, '../out');

// Ensure the output directory exists before proceeding
if (!fs.existsSync(outputDir)) {
  console.warn(`Output directory ${outputDir} not found. Attempting to create it.`);
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Successfully created output directory: ${outputDir}`);
  } catch (err) {
    console.error(`Failed to create output directory ${outputDir}:`, err);
    // If we can't create the output directory, subsequent steps will likely fail.
    // It might be better to exit, but let's see if other processes handle it.
  }
}

// Define the path to env.js within the output directory
const envJsInOutputDir = path.join(outputDir, 'env.js');

// Check if env.js exists in the output directory (should have been copied by Next.js)
if (!fs.existsSync(envJsInOutputDir)) {
  console.error('env.js not found in the output directory (out/env.js). Make sure Next.js copies files from /public correctly or that inject-env plugin creates it.');
  console.warn('Continuing build without env.js for HTML injection. Site functionality might be affected.');
} else {
  console.log('env.js found in output directory. Proceeding with HTML injection.');
  // Find all HTML files in the output directory
  const htmlFiles = globSync(path.join(outputDir, '/**/*.html'));

  // Inject env.js script into each HTML file
  htmlFiles.forEach(file => {
    try {
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
        content = content.replace(/<script/, '<script src="/env.js"></script><script');
      }
      
      fs.writeFileSync(file, content);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  });
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
  // This is a critical failure for Netlify SPA behavior if not using the plugin's redirects.
}