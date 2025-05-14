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
      // Use npx to ensure we find the executable
      console.log('Running Next.js build command...');
      execSync('npx next build', { stdio: 'inherit' });
      
      // Run the post build script
      console.log('Running postbuild script...');
      execSync('node scripts/fix-html.js', { stdio: 'inherit' });
      
      // Verify the output exists
      const outDir = path.join(process.cwd(), 'out');
      if (!fs.existsSync(outDir)) {
        utils.build.failBuild('Build failed: out directory not created');
        return;
      }
      
      console.log('Next.js Static Export Plugin: Build completed successfully');
    } catch (error) {
      console.error('Error building Next.js site:', error);
      utils.build.failBuild('Failed to build Next.js site: ' + error.message);
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