// Inject environment variables into the env.js file and HTML files
const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Starting environment variables injection...');

// Path to the output directory
const outputDir = path.join(__dirname, '..', 'out');

// Check if output directory exists
if (!fs.existsSync(outputDir)) {
  console.error('Output directory does not exist. Build may have failed.');
  process.exit(1);
}

// Path to the env.js file in the output directory
const envPath = path.join(outputDir, 'env.js');

// Copy env.js from public to out if it doesn't exist
if (!fs.existsSync(envPath)) {
  console.log('env.js not found in output directory, copying from public...');
  try {
    // Ensure the public env.js exists
    const publicEnvPath = path.join(__dirname, '..', 'public', 'env.js');
    if (!fs.existsSync(publicEnvPath)) {
      console.error('env.js not found in public directory.');
      process.exit(1);
    }
    
    // Copy the file
    fs.copyFileSync(publicEnvPath, envPath);
    console.log('Successfully copied env.js to output directory');
  } catch (error) {
    console.error('Error copying env.js:', error);
    process.exit(1);
  }
}

// Get environment variables
const environmentVariables = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
};

// Inject environment variables into env.js
try {
  // Read current content of env.js
  let content = fs.readFileSync(envPath, 'utf8');
  console.log('Read env.js file');

  // Replace placeholders with actual environment variables
  Object.entries(environmentVariables).forEach(([key, value]) => {
    if (value) {
      content = content.replace(`%${key}%`, value);
      console.log(`Injected ${key} into env.js`);
    } else {
      console.warn(`Warning: ${key} environment variable not found`);
    }
  });

  // Write updated content
  fs.writeFileSync(envPath, content);
  console.log('Successfully injected environment variables into env.js');
} catch (error) {
  console.error('Error injecting environment variables into env.js:', error);
  process.exit(1);
}

// Find all HTML files
try {
  const htmlFiles = glob.sync(path.join(outputDir, '**', '*.html'));
  console.log(`Found ${htmlFiles.length} HTML files to process`);

  // Create a script tag with environment variables
  const envScript = `
<script>
  window.ENV = window.ENV || {};
  window.ENV.NEXT_PUBLIC_SUPABASE_URL = "${environmentVariables.NEXT_PUBLIC_SUPABASE_URL}";
  window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "${environmentVariables.NEXT_PUBLIC_SUPABASE_ANON_KEY}";
</script>
`;

  // Inject the script tag into each HTML file before </head>
  htmlFiles.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${envScript}</head>`);
        fs.writeFileSync(file, content);
        console.log(`Injected environment variables into ${file}`);
      } else {
        console.warn(`Warning: Could not find </head> tag in ${file}`);
      }
    } catch (fileError) {
      console.error(`Error processing ${file}:`, fileError);
    }
  });

  console.log('Successfully processed all HTML files');
} catch (error) {
  console.error('Error processing HTML files:', error);
  process.exit(1);
} 