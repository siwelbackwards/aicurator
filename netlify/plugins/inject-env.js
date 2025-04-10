module.exports = {
  onPostBuild: async ({ constants, utils }) => {
    const fs = require('fs');
    const path = require('path');

    // Path to the env.js file in the publish directory
    const envPath = path.join(constants.PUBLISH_DIR, 'env.js');

    // Check if file exists
    if (!fs.existsSync(envPath)) {
      utils.build.failBuild('env.js file not found in publish directory');
      return;
    }

    try {
      // Read current content
      let content = fs.readFileSync(envPath, 'utf8');

      // Replace placeholders with actual environment variables
      content = content.replace('%NEXT_PUBLIC_SUPABASE_URL%', process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      content = content.replace('%NEXT_PUBLIC_SUPABASE_ANON_KEY%', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

      // Write updated content
      fs.writeFileSync(envPath, content);

      console.log('Successfully injected environment variables into env.js');
    } catch (error) {
      utils.build.failBuild(`Failed to inject environment variables: ${error.message}`);
    }
  }
}; 