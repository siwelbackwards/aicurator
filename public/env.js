// This file is loaded before any app code and provides environment variables
// for static site generation deployments like Netlify, Vercel, etc.

// Create a global process object if it doesn't exist (for client-side environment)
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
}

// Environment variables container
window.env = {
  // Default values (these get replaced at build time or runtime)
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
  // Check if we're running on Netlify by checking the hostname
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     document.querySelector('meta[name="netlify"]'));
  
  if (isNetlify) {
    console.log('Detected Netlify environment, checking for injected variables');
    
    // Check for Netlify environment variables
    // Method 1: Check for window.ENV (from inject-env.js)
    if (window.ENV) {
      console.log('Found window.ENV, using those variables');
      if (window.ENV.NEXT_PUBLIC_SUPABASE_URL) {
        window.env.NEXT_PUBLIC_SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
        window.process.env.NEXT_PUBLIC_SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
      }
      
      if (window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    }
    
    // Method 2: Look for other Netlify-specific environment objects
    const netlifyEnv = window._env || window.netlifyEnv || {};
    if (netlifyEnv.NEXT_PUBLIC_SUPABASE_URL && !window.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Found Netlify-injected variables via _env');
      window.env.NEXT_PUBLIC_SUPABASE_URL = netlifyEnv.NEXT_PUBLIC_SUPABASE_URL;
      window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Update process.env as well
      window.process.env.NEXT_PUBLIC_SUPABASE_URL = netlifyEnv.NEXT_PUBLIC_SUPABASE_URL;
      window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  }
  
  // Log status of environment variables (without revealing values)
  console.log('Environment variables loaded:',
    'NEXT_PUBLIC_SUPABASE_URL', window.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗'
  );
})(); 