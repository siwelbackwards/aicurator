// Netlify function to inject environment variables into env.js
exports.handler = async function(event, context) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Path to the env.js file
    const envJsPath = path.join(__dirname, '../../out/env.js');
    
    // Get environment variables from Netlify
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Read the current content of env.js
    let content = fs.existsSync(envJsPath) 
      ? fs.readFileSync(envJsPath, 'utf8')
      : '// Env file not found';
    
    // Replace the placeholders with actual values
    content = content.replace(
      /window\.ENV\.NEXT_PUBLIC_SUPABASE_URL\s*=\s*window\.ENV\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*"[^"]*"/,
      `window.ENV.NEXT_PUBLIC_SUPABASE_URL = "${supabaseUrl}"`
    );
    
    content = content.replace(
      /window\.ENV\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*window\.ENV\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\|\|\s*"[^"]*"/,
      `window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "${supabaseKey}"`
    );
    
    // Write the updated content back to env.js
    fs.writeFileSync(envJsPath, content);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Environment variables injected successfully' })
    };
  } catch (error) {
    console.error('Error injecting environment variables:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error injecting environment variables', error: error.toString() })
    };
  }
};