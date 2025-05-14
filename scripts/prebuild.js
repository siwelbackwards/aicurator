const fs = require('fs');
const path = require('path');

console.log('Starting prebuild process...');

// Create a minimal env.js file for environment variables
const envContent = `
// Environment variables for client-side use
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
};
console.log('Environment loaded:', window.ENV);
`;

// Ensure the public directory exists
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write env.js to the public directory
fs.writeFileSync(path.join(publicDir, 'env.js'), envContent);
console.log('Created env.js in public directory');

// Check for pages directory and create if needed for NextAuth
const pagesDir = path.join(__dirname, '../pages');
const pagesApiDir = path.join(pagesDir, 'api');
const pagesApiAuthDir = path.join(pagesApiDir, 'auth');

// Create directories if they don't exist
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

if (!fs.existsSync(pagesApiDir)) {
  fs.mkdirSync(pagesApiDir, { recursive: true });
}

if (!fs.existsSync(pagesApiAuthDir)) {
  fs.mkdirSync(pagesApiAuthDir, { recursive: true });
}

// Create empty nextauth file (TypeScript version)
const nextAuthTsPath = path.join(pagesApiAuthDir, '[...nextauth].ts');
fs.writeFileSync(nextAuthTsPath, `// Empty TypeScript file for static export
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ message: 'Static export - auth not available' });
}
`);
console.log('Created NextAuth TypeScript file');

// Make all API routes static for export
const apiDir = path.join(__dirname, '../app/api');
if (fs.existsSync(apiDir)) {
  makeAllApiRoutesStatic(apiDir);
}

console.log('Prebuild process completed successfully');

// Helper function to make all API routes static
function makeAllApiRoutesStatic(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      makeAllApiRoutesStatic(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (!content.includes('force-static')) {
        content = `// Next.js static export configuration
export const dynamic = 'force-static';
export const revalidate = false;

${content}`;
        
        fs.writeFileSync(fullPath, content);
        console.log(`Made static: ${fullPath}`);
      }
    }
  }
} 