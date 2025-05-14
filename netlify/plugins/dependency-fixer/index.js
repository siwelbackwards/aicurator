/**
 * Netlify Plugin to automatically install commonly missing dependencies
 */
const { execSync } = require('child_process');

module.exports = {
  onPreBuild: async ({ inputs, utils }) => {
    console.log('Dependency Fixer Plugin: Starting');
    
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
      'next-auth'
    ];
    
    try {
      console.log('Installing potentially missing dependencies...');
      
      // Install all dependencies with --no-save to not modify package.json
      const command = `npm install --no-save ${dependencies.join(' ')}`;
      console.log(`Running: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      
      console.log('Successfully installed all potential dependencies');
    } catch (error) {
      console.error('Error installing dependencies:', error);
      // Don't fail the build if some dependencies can't be installed
      console.log('Continuing with build despite dependency installation issues');
    }
  }
}; 