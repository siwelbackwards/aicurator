const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('===== BUILD DEBUG SCRIPT =====');

// Check if out directory exists and if it's writable
const outDir = path.join(__dirname, '../out');
console.log(`Checking if out directory exists: ${fs.existsSync(outDir)}`);

if (fs.existsSync(outDir)) {
  try {
    // Try to create a test file in the out directory
    const testFile = path.join(outDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    console.log('Successfully wrote to out directory');
    fs.unlinkSync(testFile);
    console.log('Successfully removed test file');
  } catch (err) {
    console.error('Error accessing out directory:', err);
  }
  
  // List files in the out directory
  try {
    console.log('Files in out directory:', fs.readdirSync(outDir));
  } catch (err) {
    console.error('Error listing files in out directory:', err);
  }
}

// Try to run the prebuild script
try {
  console.log('Running prebuild script...');
  execSync('node scripts/prebuild.js', { stdio: 'inherit' });
  console.log('Prebuild script completed successfully');
} catch (err) {
  console.error('Error running prebuild script:', err);
}

// Try to run next build with verbose logging
try {
  console.log('Running next build...');
  execSync('npx next build --debug', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (err) {
  console.error('Error running next build:', err);
}

console.log('===== DEBUG SCRIPT COMPLETED ====='); 