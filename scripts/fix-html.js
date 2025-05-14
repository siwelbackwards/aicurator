const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// Define the path to env.js within the output directory
const envJsInOutputDir = path.join(__dirname, '../out/env.js');

// Check if env.js exists in the output directory (should have been copied by Next.js)
if (!fs.existsSync(envJsInOutputDir)) {
  console.error('env.js not found in the output directory (out/env.js). Make sure Next.js copies files from /public correctly.');
  // If critical, exit. Otherwise, HTML files just won't get the script.
  // For now, let's log an error and continue, as the inject-env plugin might still create it or handle it.
  // Consider if this should be a fatal error: process.exit(1); 
  console.warn('Continuing build without env.js. Site functionality might be affected.');
} else {
  console.log('env.js found in output directory. Proceeding with HTML injection.');
}

// Find all HTML files in the output directory
const htmlFiles = globSync('out/**/*.html');

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
      // Fallback if no </head> tag (less common for full HTML docs)
      content = content.replace(/<script/, '<script src="/env.js"></script><script');
    }
    
    fs.writeFileSync(file, content);
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});

// Create a Netlify _redirects file to handle client-side routing
const redirectsPath = path.join(__dirname, '../out/_redirects');
const redirectsContent = 
`# Netlify redirects for client-side routing
/api/*  /not-found.html  404
/*      /index.html      200
`;

try {
  fs.writeFileSync(redirectsPath, redirectsContent);
  console.log('Created Netlify _redirects file for client-side routing');
} catch (err) {
  console.error('Error creating Netlify _redirects file:', err);
}