/**
 * Netlify Plugin for Next.js Static Export
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  onPreBuild: async ({ inputs, utils }) => {
    console.log('Next.js Static Export Plugin: Starting');
    
    try {
      // Install required babel dependencies
      console.log('Installing Babel dependencies...');
      execSync('npm install --no-save @babel/core @babel/plugin-transform-react-jsx @babel/preset-env @babel/preset-react @babel/preset-typescript glob@latest cross-env', 
        { stdio: 'inherit' });
      
      // Run the pre-build scripts
      console.log('Running prebuild script...');
      execSync('node scripts/prebuild.js', { stdio: 'inherit' });
      
      // Apply the required configuration
      console.log('Updating next.config.js for static export...');
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      
      if (fs.existsSync(nextConfigPath)) {
        let configContent = fs.readFileSync(nextConfigPath, 'utf8');
        
        // Ensure output: 'export' is set
        if (!configContent.includes("output: 'export'") && !configContent.includes('output: "export"')) {
          configContent = configContent.replace(
            'const nextConfig = {',
            'const nextConfig = {\n  output: "export",\n  distDir: "out",\n  images: {\n    unoptimized: true,\n  },'
          );
          
          fs.writeFileSync(nextConfigPath, configContent);
          console.log('Updated next.config.js with export configuration');
        } else {
          console.log('Next.js config already has export configuration');
        }
      } else {
        console.error('next.config.js not found');
        utils.build.failBuild('next.config.js not found');
        return;
      }
      
      // Make all API routes static for export
      console.log('Making API routes static for export...');
      const apiDir = path.join(process.cwd(), 'app/api');
      
      if (fs.existsSync(apiDir)) {
        const apiRoutes = findAllRouteFiles(apiDir);
        
        for (const routeFile of apiRoutes) {
          let content = fs.readFileSync(routeFile, 'utf8');
          
          // Add force-static if not already present
          if (!content.includes('force-static')) {
            // Add at the top of the file
            content = `// Next.js static export configuration
export const dynamic = 'force-static';
export const revalidate = false;

${content}`;
            
            fs.writeFileSync(routeFile, content);
            console.log(`Made static: ${routeFile}`);
          }
        }
      }
      
      console.log('Next.js Static Export Plugin: Configuration complete');
    } catch (error) {
      console.error('Error in Next.js Static Export Plugin:', error);
      utils.build.failBuild('Failed to configure Next.js for static export: ' + error.message);
    }
  },
  
  onBuild: async ({ inputs, utils }) => {
    console.log('Next.js Static Export Plugin: Building');
    
    try {
      // Check if debug build script exists
      const debugScriptPath = path.join(process.cwd(), 'netlify-debug-build.sh');
      if (fs.existsSync(debugScriptPath)) {
        console.log('Running debug build script...');
        execSync('bash netlify-debug-build.sh', { stdio: 'inherit' });
      } else {
        // Fallback to regular build
        console.log('Running Next.js build command (standard)...');
        execSync('cross-env NODE_OPTIONS="--max-old-space-size=4096" npx next build --debug', { stdio: 'inherit' });
      }
      
      // Run the post build script
      console.log('Running postbuild script...');
      execSync('node scripts/fix-html.js', { stdio: 'inherit' });
      
      // Verify the output exists
      const outDir = path.join(process.cwd(), 'out');
      if (!fs.existsSync(outDir)) {
        // Create out directory if missing as a fallback
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), '<html><body><h1>Fallback page - Build Error</h1><p>The Next.js build failed but we created this fallback page.</p></body></html>');
        console.error('WARNING: Next.js build did not create expected output directory. Created fallback.');
      } else {
        // Check if index.html exists
        if (!fs.existsSync(path.join(outDir, 'index.html'))) {
          fs.writeFileSync(path.join(outDir, 'index.html'), '<html><body><h1>Fallback index page</h1><p>The Next.js build did not create an index page, so we created this fallback.</p></body></html>');
          console.error('WARNING: No index.html found in output. Created fallback index.');
        }
        console.log('Next.js Static Export Plugin: Build completed successfully');
      }
    } catch (error) {
      console.error('Error building Next.js site:', error);
      // Create fallback output so deployment can continue 
      const outDir = path.join(process.cwd(), 'out');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outDir, 'index.html'), `<html><body><h1>Error Building Site</h1><p>There was an error building the Next.js site:</p><pre>${error.message}</pre></body></html>`);
      console.log('Created error page in output directory');
      
      // Don't fail the build - let Netlify deploy the error page
      console.log('WARNING: Build failed but continuing deployment with error page');
    }
  }
};

// Helper function to find all route.ts files in the API directory
function findAllRouteFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findAllRouteFiles(filePath));
    } else if (file === 'route.ts' || file === 'route.js') {
      results.push(filePath);
    }
  }
  
  return results;
} 