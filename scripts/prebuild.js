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