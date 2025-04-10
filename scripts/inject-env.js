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

// Function to validate URL
const isValidUrl = (urlString) => {
  try {
    if (!urlString || urlString.includes('placeholder')) return false;
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

// Get environment variables with fallbacks for production
const FALLBACK_SUPABASE_URL = 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate URL and use fallback if needed
if (!isValidUrl(supabaseUrl)) {
  console.warn('Invalid or missing NEXT_PUBLIC_SUPABASE_URL, using fallback for production');
  supabaseUrl = FALLBACK_SUPABASE_URL;
}

if (!supabaseAnonKey) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY, using fallback for production');
  supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY;
}

const environmentVariables = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey
};

console.log('Using environment variables:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl.slice(0, 12)}...`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey.slice(0, 12)}...`);

// Inject environment variables into env.js
try {
  // Read current content of env.js
  let content = fs.readFileSync(envPath, 'utf8');
  console.log('Read env.js file');

  // Write a new version with direct assignment of values
  const envContent = `// This file is loaded before any app code and provides environment variables
// for static site generation deployments like Netlify, Vercel, etc.

// Create a global process object if it doesn't exist (for client-side environment)
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
}

// Validate URL format
const isValidUrl = (urlString) => {
  try {
    if (!urlString || urlString.includes('placeholder')) return false;
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

// Environment variables container
window.env = {
  // Production values for AI Curator
  NEXT_PUBLIC_SUPABASE_URL: '${supabaseUrl}',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '${supabaseAnonKey}',
};

// Copy environment variables to process.env for compatibility
if (window.process && window.process.env) {
  window.process.env.NEXT_PUBLIC_SUPABASE_URL = window.env.NEXT_PUBLIC_SUPABASE_URL;
  window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Handle Netlify-specific environment variables
(function() {
  // Check if we're running on Netlify by checking the hostname
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     document.querySelector('meta[name="netlify"]'));
  
  if (isNetlify) {
    console.log('Detected Netlify environment, checking for injected variables');
    
    // Check for Netlify environment variables
    // Method 1: Check for window.ENV (from inject-env.js)
    if (window.ENV) {
      console.log('Found window.ENV, using those variables');
      if (window.ENV.NEXT_PUBLIC_SUPABASE_URL && isValidUrl(window.ENV.NEXT_PUBLIC_SUPABASE_URL)) {
        window.env.NEXT_PUBLIC_SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
        window.process.env.NEXT_PUBLIC_SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
      }
      
      if (window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    }
  }
  
  // Log status of environment variables (without revealing values)
  console.log('Environment variables loaded:',
    'NEXT_PUBLIC_SUPABASE_URL', window.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗'
  );
})();`;

  // Write updated content
  fs.writeFileSync(envPath, envContent);
  console.log('Successfully created env.js with environment variables');
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
  window.ENV.NEXT_PUBLIC_SUPABASE_URL = "${supabaseUrl}";
  window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "${supabaseAnonKey}";
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