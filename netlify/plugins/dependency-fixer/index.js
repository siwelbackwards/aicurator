/**
 * Netlify Plugin to automatically install commonly missing dependencies
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  onPreBuild: async ({ inputs, utils }) => {
    console.log('Dependency Fixer Plugin: Starting');
    
    // Debug environment
    console.log('Node version:', process.version);
    console.log('Current directory:', process.cwd());
    console.log('Directory contents:', fs.readdirSync(process.cwd()));
    
    // List of dependencies that are commonly missing in Next.js builds
    const dependencies = [
      // Core dependencies
      'sharp',
      'esbuild',
      
      // Babel dependencies
      '@babel/core',
      '@babel/preset-env',
      '@babel/preset-react',
      '@babel/preset-typescript',
      '@babel/plugin-transform-react-jsx',
      
      // TypeScript types
      '@types/babel__core',
      '@types/node',
      
      // PostCSS plugins
      'postcss-flexbugs-fixes',
      'postcss-preset-env',
      
      // Next.js peer dependencies
      'react',
      'react-dom',
      'next-auth',
      
      // Updated dependencies
      'glob@latest',
      'cross-env'
    ];
    
    try {
      console.log('Installing potentially missing dependencies...');
      
      // Install all dependencies with --no-save to not modify package.json
      const command = `npm install --no-save ${dependencies.join(' ')}`;
      console.log(`Running: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      
      console.log('Successfully installed all potential dependencies');
      
      // Create a debug file
      fs.writeFileSync('debug-packages.json', JSON.stringify({
        node: process.version,
        dependencies: dependencies,
        installed: true,
        timestamp: new Date().toISOString()
      }, null, 2));
      
    } catch (error) {
      console.error('Error installing dependencies:', error);
      // Don't fail the build if some dependencies can't be installed
      console.log('Continuing with build despite dependency installation issues');
    }
    
    // Set up debug log for the actual build step
    try {
      const debugScript = `
        # Debug script for Netlify build
        set -e
        echo "Starting debug build script"
        echo "Node version: $(node -v)"
        echo "NPM version: $(npm -v)"
        
        # Check dependencies
        echo "Checking for critical dependencies:"
        npm list next --depth=0 || echo "next not found!"
        npm list glob --depth=0 || echo "glob not found!"
        npm list sharp --depth=0 || echo "sharp not found!"
        
        # List env vars without revealing secrets
        echo "Environment variables:"
        env | grep -v "SECRET\\|TOKEN\\|KEY\\|PASSWORD" | sort
        
        # Try building with verbose logging
        echo "Running Next.js build with verbose logging"
        npx next build --debug
        
        echo "Build completed successfully!"
      `;
      
      fs.writeFileSync('netlify-debug-build.sh', debugScript);
      fs.chmodSync('netlify-debug-build.sh', '755');
      console.log('Created debug build script');
    } catch (err) {
      console.error('Error creating debug script:', err);
    }
  }
}; 