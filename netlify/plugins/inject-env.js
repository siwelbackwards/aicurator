const fs = require('fs');
const path = require('path');

// Custom Netlify plugin to inject environment variables
module.exports = {
  onPostBuild: ({ constants, utils }) => {
    const { PUBLISH_DIR } = constants;
    const envFile = path.join(PUBLISH_DIR, 'env.js');

    if (!fs.existsSync(envFile)) {
      utils.build.failBuild(`env.js not found in ${PUBLISH_DIR}`);
      return;
    }

    try {
      // Read the env.js file
      let content = fs.readFileSync(envFile, 'utf8');

      // Get the environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      // Log but don't expose full values
      console.log('Injecting environment variables:');
      console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
      console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✓' : '✗'}`);

      // Replace the placeholders
      content = content.replace(
        /window\.ENV\.NEXT_PUBLIC_SUPABASE_URL\s*=\s*window\.ENV\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*"[^"]*"/,
        `window.ENV.NEXT_PUBLIC_SUPABASE_URL = "${supabaseUrl}"`
      );
      
      content = content.replace(
        /window\.ENV\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*window\.ENV\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\|\|\s*"[^"]*"/,
        `window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "${supabaseKey}"`
      );

      // Write the updated file
      fs.writeFileSync(envFile, content);
      
      console.log('Successfully injected environment variables into env.js');
    } catch (error) {
      utils.build.failBuild(`Error injecting environment variables: ${error.message}`);
    }
  }
};