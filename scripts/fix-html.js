const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

try {
  const outDir = join(__dirname, '..', 'out');
  
  // Ensure output directory exists
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  
  // Copy env.js to output directory
  copyFileSync(
    join(__dirname, '..', 'public', 'env.js'),
    join(outDir, 'env.js')
  );
  console.log('Successfully copied env.js to output directory');
} catch (error) {
  console.error('Error copying env.js:', error);
} 