// This file is loaded before any app code and provides environment variables
// for static site generation deployments like Netlify, Vercel, etc.

// Create a global process object if it doesn't exist (for client-side environment)
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
}

// Validate URL format
const isValidUrl = (urlString) => {
  try {
    if (!urlString || urlString.includes('placeholder')) return false;
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

// Environment variables container
window.env = {
  // Default values (will be empty unless injected at build time)
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
};

// Copy environment variables to process.env for compatibility
if (window.process && window.process.env) {
  window.process.env.NEXT_PUBLIC_SUPABASE_URL = window.env.NEXT_PUBLIC_SUPABASE_URL;
  window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Handle Netlify-specific environment variables
(function() {
  // Check if we're running on Netlify
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     document.querySelector('meta[name="netlify"]'));
  
  if (isNetlify) {
    console.log('Detected Netlify environment, checking for injected variables');
    
    // Method 1: Check for window.ENV (from inject-env.js)
    if (window.ENV) {
      console.log('Found window.ENV, using those variables');
      
      // Only use these if they're valid
      if (window.ENV.NEXT_PUBLIC_SUPABASE_URL && isValidUrl(window.ENV.NEXT_PUBLIC_SUPABASE_URL)) {
        window.env.NEXT_PUBLIC_SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
        window.process.env.NEXT_PUBLIC_SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
        console.log('Using Supabase URL from Netlify ENV');
      } else {
        console.error('Netlify ENV contains invalid Supabase URL');
      }
      
      if (window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        console.log('Using Supabase Anon Key from Netlify ENV');
      } else {
        console.error('Netlify ENV missing Supabase Anon Key');
      }
    } else {
      console.error('window.ENV not found - Netlify environment variables might not be injected properly');
    }
    
    // Method 2: Look for other Netlify-specific environment objects
    if (!window.env.NEXT_PUBLIC_SUPABASE_URL) {
      const netlifyEnv = window._env || window.netlifyEnv || {};
      if (netlifyEnv.NEXT_PUBLIC_SUPABASE_URL && isValidUrl(netlifyEnv.NEXT_PUBLIC_SUPABASE_URL)) {
        console.log('Found Netlify-injected variables via _env');
        window.env.NEXT_PUBLIC_SUPABASE_URL = netlifyEnv.NEXT_PUBLIC_SUPABASE_URL;
        window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        // Update process.env as well
        window.process.env.NEXT_PUBLIC_SUPABASE_URL = netlifyEnv.NEXT_PUBLIC_SUPABASE_URL;
        window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    }
  }
  
  // Log status of environment variables (without revealing values)
  console.log('Environment variables loaded:',
    'NEXT_PUBLIC_SUPABASE_URL', window.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗'
  );
})(); 