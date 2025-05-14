/**
 * Netlify Plugin to inject environment variables
 */
const fs = require('fs');
const path = require('path');

module.exports = {
  onPreBuild: async ({ inputs, utils, constants }) => {
    console.log('Environment variable injection plugin: Starting');
    
    try {
      // Create a JS file with environment variables
      const envVarsJs = `
// Environment variables for client-side use
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
  // Add other variables as needed
};
console.log('Environment loaded:', window.ENV);
`;

      // Create a directory for public files
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Write the file to the public directory
      fs.writeFileSync(path.join(publicDir, 'env.js'), envVarsJs);
      console.log('Created env.js in public directory');
      
      console.log('Environment variable injection complete');
    } catch (error) {
      console.error('Error injecting environment variables:', error);
      // Don't fail the build if injection fails
      console.log('Continuing with build despite environment variable injection issues');
    }
  },
  
  onPostBuild: async ({ inputs, utils, constants }) => {
    console.log('Post-build environment variable injection: Starting');
    
    try {
      // Check if the out directory exists
      const outDir = path.join(process.cwd(), 'out');
      if (!fs.existsSync(outDir)) {
        console.log('Output directory not found, skipping post-build injection');
        return;
      }
      
      // Copy env.js to the output directory
      const publicEnvJs = path.join(process.cwd(), 'public', 'env.js');
      if (fs.existsSync(publicEnvJs)) {
        fs.copyFileSync(publicEnvJs, path.join(outDir, 'env.js'));
        console.log('Copied env.js to output directory');
      } else {
        console.log('env.js not found in public directory, creating in output directory');
        
        // Create env.js directly in output directory
        const envVarsJs = `
// Environment variables for client-side use
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
  // Add other variables as needed
};
console.log('Environment loaded:', window.ENV);
`;
        fs.writeFileSync(path.join(outDir, 'env.js'), envVarsJs);
        console.log('Created env.js in output directory');
      }
      
      console.log('Post-build environment variable injection complete');
    } catch (error) {
      console.error('Error in post-build environment variable injection:', error);
      // Don't fail the build
      console.log('Continuing deployment despite post-build injection issues');
    }
  }
}; 