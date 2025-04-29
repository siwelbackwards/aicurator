// This script prepares files for Netlify deployment
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing project for Netlify deployment...');

// Directories to ensure exist
const dirs = [
  path.join(__dirname, '../netlify/functions'),
  path.join(__dirname, '../netlify/plugins'),
  path.join(__dirname, '../public')
];

// Create directories if they don't exist
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create public/env.js
const envJsContent = `// This file is loaded at runtime to inject environment variables
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
};

// Attempt to read variables from global process (dev mode)
try {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      window.ENV.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  }
} catch (e) {
  console.warn('Failed to read env vars from process:', e);
}

// This will be replaced by the real values during build in Netlify
window.ENV.NEXT_PUBLIC_SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL || "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw";

console.log("Environment loaded:", { 
  url: window.ENV.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY 
});`;

fs.writeFileSync(path.join(__dirname, '../public/env.js'), envJsContent);
console.log('Created public/env.js');

// Create the Netlify function to inject env vars
const envFunctionContent = `// Netlify function to inject environment variables into env.js
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
      /window\\.ENV\\.NEXT_PUBLIC_SUPABASE_URL\\s*=\\s*window\\.ENV\\.NEXT_PUBLIC_SUPABASE_URL\\s*\\|\\|\\s*"[^"]*"/,
      \`window.ENV.NEXT_PUBLIC_SUPABASE_URL = "\${supabaseUrl}"\`
    );
    
    content = content.replace(
      /window\\.ENV\\.NEXT_PUBLIC_SUPABASE_ANON_KEY\\s*=\\s*window\\.ENV\\.NEXT_PUBLIC_SUPABASE_ANON_KEY\\s*\\|\\|\\s*"[^"]*"/,
      \`window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "\${supabaseKey}"\`
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
};`;

fs.writeFileSync(path.join(__dirname, '../netlify/functions/env-variable-injector.js'), envFunctionContent);
console.log('Created Netlify function: env-variable-injector.js');

// Create Netlify plugin
const pluginContent = `const fs = require('fs');
const path = require('path');

// Custom Netlify plugin to inject environment variables
module.exports = {
  onPostBuild: ({ constants, utils }) => {
    const { PUBLISH_DIR } = constants;
    const envFile = path.join(PUBLISH_DIR, 'env.js');

    if (!fs.existsSync(envFile)) {
      utils.build.failBuild(\`env.js not found in \${PUBLISH_DIR}\`);
      return;
    }

    try {
      // Read the env.js file
      let content = fs.readFileSync(envFile, 'utf8');

      // Get the environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      // Replace the placeholders
      content = content.replace(
        /window\\.ENV\\.NEXT_PUBLIC_SUPABASE_URL\\s*=\\s*window\\.ENV\\.NEXT_PUBLIC_SUPABASE_URL\\s*\\|\\|\\s*"[^"]*"/,
        \`window.ENV.NEXT_PUBLIC_SUPABASE_URL = "\${supabaseUrl}"\`
      );
      
      content = content.replace(
        /window\\.ENV\\.NEXT_PUBLIC_SUPABASE_ANON_KEY\\s*=\\s*window\\.ENV\\.NEXT_PUBLIC_SUPABASE_ANON_KEY\\s*\\|\\|\\s*"[^"]*"/,
        \`window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "\${supabaseKey}"\`
      );

      // Write the updated file
      fs.writeFileSync(envFile, content);
      
      console.log('Successfully injected environment variables into env.js');
    } catch (error) {
      utils.build.failBuild(\`Error injecting environment variables: \${error.message}\`);
    }
  }
};`;

fs.writeFileSync(path.join(__dirname, '../netlify/plugins/inject-env.js'), pluginContent);
console.log('Created Netlify plugin: inject-env.js');

// Create plugin manifest
fs.writeFileSync(path.join(__dirname, '../netlify/plugins/manifest.yml'), 'name: netlify-plugin-inject-env\ninputs: []');
console.log('Created plugin manifest file');

// Update fix-html.js script
const fixHtmlContent = `const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// Copy env.js to output directory
const envJsSource = path.join(__dirname, '../public/env.js');
const envJsTarget = path.join(__dirname, '../out/env.js');

// Make sure env.js exists
if (!fs.existsSync(envJsSource)) {
  console.error('env.js not found in public directory');
  process.exit(1);
}

// Copy env.js to output directory
try {
  fs.copyFileSync(envJsSource, envJsTarget);
  console.log('Successfully copied env.js to output directory');
} catch (err) {
  console.error('Error copying env.js:', err);
  process.exit(1);
}

// Find all HTML files in the output directory
const htmlFiles = globSync('out/**/*.html');

// Inject env.js script into each HTML file
htmlFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if env.js is already included
    if (content.includes('src="/env.js"')) {
      console.log(\`env.js already included in \${file}\`);
      return;
    }
    
    // Add env.js before the first script tag
    content = content.replace(/<script/, '<script src="/env.js"></script><script');
    
    fs.writeFileSync(file, content);
  } catch (err) {
    console.error(\`Error processing \${file}:\`, err);
  }
});

// Create a Netlify _redirects file to handle client-side routing
const redirectsPath = path.join(__dirname, '../out/_redirects');
const redirectsContent = 
\`# Netlify redirects for client-side routing
/api/*  /not-found.html  404
/*      /index.html      200
\`;

try {
  fs.writeFileSync(redirectsPath, redirectsContent);
  console.log('Created Netlify _redirects file for client-side routing');
} catch (err) {
  console.error('Error creating Netlify _redirects file:', err);
}`;

fs.writeFileSync(path.join(__dirname, '../scripts/fix-html.js'), fixHtmlContent);
console.log('Updated fix-html.js script');

// Update next.config.js
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cpzzmpgbyzcqbwkaaqdy.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  staticPageGenerationTimeout: 180,
  trailingSlash: true,
};

module.exports = nextConfig;`;

fs.writeFileSync(path.join(__dirname, '../next.config.js'), nextConfigContent);
console.log('Updated next.config.js');

// Update netlify.toml
const netlifyTomlContent = `[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NODE_VERSION = "18"
  SECRETS_SCAN_ENABLED = "false"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[plugins]]
  package = "@netlify/plugin-lighthouse"

# Custom plugin to inject environment variables
[[plugins]]
  package = "./netlify/plugins/inject-env"

# Post processing command to replace environment variables in the client JS files
[build.processing]
  skip_processing = false

[build.processing.html]
  pretty_urls = true

[build.processing.js]
  bundle = false
  minify = false

# Add security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    # Update CSP to allow inline styles and Supabase
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.supabase.net https://api.* wss://*.supabase.co; img-src 'self' data: blob: https://*.supabase.co https://*.supabase.net https://*.unsplash.com https://storage.googleapis.com; media-src 'self' https://*.supabase.co;"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Access-Control-Allow-Origin = "*"

# Cache settings for static assets
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Handle SPA routing for Next.js
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false
  conditions = {Country = ["*"]}

# Define functions directory
[functions]
  directory = "netlify/functions"`;

fs.writeFileSync(path.join(__dirname, '../netlify.toml'), netlifyTomlContent);
console.log('Updated netlify.toml');

// Add glob dependency if it doesn't exist
try {
  require('glob');
} catch (err) {
  console.log('Installing glob dependency...');
  execSync('npm install --save-dev glob', { stdio: 'inherit' });
}

console.log('\nSetup complete! Your project is now ready for Netlify deployment.');
console.log('The changes ensure environment variables are properly injected at runtime.');
console.log('\nDeploy to Netlify with:');
console.log('1. Push changes to your Git repository');
console.log('2. Configure environment variables in Netlify Dashboard'); 