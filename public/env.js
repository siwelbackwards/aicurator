// This file will be included in the HTML and will inject environment variables at runtime
(function() {
  // Initialize environment variables container
  window.env = window.env || {};
  
  // Set placeholder values that will be replaced during build or runtime
  window.env.NEXT_PUBLIC_SUPABASE_URL = '%NEXT_PUBLIC_SUPABASE_URL%';
  window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '%NEXT_PUBLIC_SUPABASE_ANON_KEY%';
  
  // Special handling for Netlify
  if (window.location.hostname.includes('netlify.app')) {
    // Log that we're on Netlify
    console.log('Detected Netlify environment, attempting to load environment variables');
    
    // Try to look for Netlify's injected environment variables
    // These might be in various locations depending on the Netlify setup
    const netlifyEnv = window._env || window.ENV || {};
    
    // Only override if the values are not placeholders
    if (netlifyEnv.NEXT_PUBLIC_SUPABASE_URL && 
        netlifyEnv.NEXT_PUBLIC_SUPABASE_URL !== '%NEXT_PUBLIC_SUPABASE_URL%') {
      window.env.NEXT_PUBLIC_SUPABASE_URL = netlifyEnv.NEXT_PUBLIC_SUPABASE_URL;
      console.log('Loaded Supabase URL from Netlify environment');
    }
    
    if (netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
        netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY !== '%NEXT_PUBLIC_SUPABASE_ANON_KEY%') {
      window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log('Loaded Supabase Anon Key from Netlify environment');
    }
  }
  
  // Log environment status (without revealing the actual values)
  console.log('Environment variables loaded:', {
    NEXT_PUBLIC_SUPABASE_URL: window.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: window.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
  });
})(); 