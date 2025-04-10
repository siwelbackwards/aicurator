// Inject environment variables into the env.js file
const fs = require('fs');
const path = require('path');

console.log('Starting environment variables injection...');

// Path to the env.js file in the output directory
const envPath = path.join(__dirname, '..', 'out', 'env.js');

// Check if output directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'out'))) {
  console.error('Output directory does not exist. Build may have failed.');
  process.exit(1);
}

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

try {
  // Read current content
  let content = fs.readFileSync(envPath, 'utf8');
  console.log('Read env.js file');

  // Replace placeholders with actual environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    content = content.replace('%NEXT_PUBLIC_SUPABASE_URL%', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Injected NEXT_PUBLIC_SUPABASE_URL');
  } else {
    console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL environment variable not found');
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    content = content.replace('%NEXT_PUBLIC_SUPABASE_ANON_KEY%', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('Injected NEXT_PUBLIC_SUPABASE_ANON_KEY');
  } else {
    console.warn('Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable not found');
  }

  // Write updated content
  fs.writeFileSync(envPath, content);
  console.log('Successfully injected environment variables into env.js');
} catch (error) {
  console.error('Error injecting environment variables:', error);
  process.exit(1);
} 