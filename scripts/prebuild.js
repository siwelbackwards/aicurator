const fs = require('fs');
const path = require('path');

// Copy middleware.static.ts to middleware.ts
const middlewareStaticPath = path.join(__dirname, '../middleware.static.ts');
const middlewarePath = path.join(__dirname, '../middleware.ts');

if (fs.existsSync(middlewareStaticPath)) {
  fs.copyFileSync(middlewareStaticPath, middlewarePath);
  console.log('Middleware file copied for static export');
} else {
  console.error('Middleware static file not found');
  process.exit(1);
}

// Create empty module for NextAuth to fix build errors
const emptyModulePath = path.join(__dirname, 'empty-module.js');
fs.writeFileSync(emptyModulePath, '// This is an empty module to resolve the NextAuth path error during build\nmodule.exports = {};');
console.log('Created empty module for NextAuth resolution');

// Check for pages directory and create if needed
const pagesDir = path.join(__dirname, '../pages');
const pagesApiDir = path.join(pagesDir, 'api');
const pagesApiAuthDir = path.join(pagesApiDir, 'auth');

// Create directories if they don't exist
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir);
  console.log('Created pages directory');
}

if (!fs.existsSync(pagesApiDir)) {
  fs.mkdirSync(pagesApiDir);
  console.log('Created pages/api directory');
}

if (!fs.existsSync(pagesApiAuthDir)) {
  fs.mkdirSync(pagesApiAuthDir);
  console.log('Created pages/api/auth directory');
}

// Create empty nextauth file
const nextAuthPath = path.join(pagesApiAuthDir, '[...nextauth].js');
fs.writeFileSync(nextAuthPath, '// Empty file to satisfy build\nexport default () => null;');
console.log('Created empty NextAuth file to resolve build error'); 