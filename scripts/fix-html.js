const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// Copy env.js to output directory
const envJsSource = path.join(__dirname, '../public/env.js');
const envJsTarget = path.join(__dirname, '../out/env.js');

// Make sure env.js exists
if (!fs.existsSync(envJsSource)) {
  console.error('env.js not found in public directory');
  process.exit(1);
}

// Copy env.js to output directory
try {
  fs.copyFileSync(envJsSource, envJsTarget);
  console.log('Successfully copied env.js to output directory');
} catch (err) {
  console.error('Error copying env.js:', err);
  process.exit(1);
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
    
    // Add env.js before the first script tag
    content = content.replace(/<script/, '<script src="/env.js"></script><script');
    
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