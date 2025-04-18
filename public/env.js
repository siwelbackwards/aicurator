// This file injects environment variables for static builds
(function() {
  console.log('Initializing environment variables');
  
  // Create window.ENV container
  window.ENV = {
    // Explicit hardcoded values that will be available even if Netlify environment variables fail
    NEXT_PUBLIC_SUPABASE_URL: "https://cpzzmpgbyzcqbwkaaqdy.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.yN5KM7w8AjsXFOwdpQ4Oy7-Pf7D58fohL1tgnFBK_os",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw"
  };

  // Set up process.env for compatibility with Next.js
  if (!window.process) {
    window.process = { env: {} };
  }

  // Copy environment variables to process.env
  Object.keys(window.ENV).forEach(key => {
    window.process.env[key] = window.ENV[key];
  });

  // Add global initialization guard to prevent multiple client creation
  window.__SUPABASE_INITIALIZED = false;
  window.__SUPABASE_INIT_GUARD = function() {
    if (window.__SUPABASE_INITIALIZED) return;
    
    // Set a flag to prevent multiple initializations
    window.__SUPABASE_INITIALIZED = true;
    
    // Create storage keys that match the ones used in the clients
    const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    window.__SUPABASE_STORAGE_KEY = `aicurator_auth_${ENV_PREFIX}`;
    
    console.log('Supabase initialization guard activated');
    console.log('Storage key set to:', window.__SUPABASE_STORAGE_KEY);
  };
  
  // Call the guard immediately to set things up
  window.__SUPABASE_INIT_GUARD();

  console.log('Environment variables loaded successfully');
  console.log('Supabase URL available: ' + (window.ENV.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗'));
  console.log('Supabase Anon Key available: ' + (window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗'));
  console.log('Service Role Key available: ' + (window.ENV.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗'));
})(); 