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

// This file is a polyfill for the process object on the client-side
(function() {
  // Initialize environment variables container
  window.ENV = {};

  // Check if we're in a Netlify environment
  function isNetlify() {
    return typeof window !== 'undefined' && 
           (window.netlifyIdentity || 
            document.querySelector('[data-netlify]') || 
            window.location.hostname.includes('netlify.app') ||
            window.location.hostname.includes('netlify.live'));
  }

  // Function to log environment variable status
  function logEnvStatus() {
    if (typeof window === 'undefined') return;
    
    console.log('Environment variables loaded: ' + 
      'NEXT_PUBLIC_SUPABASE_URL ' + (window.ENV.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗') + ' ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY ' + (window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗')
    );
  }

  // Attempt to load environment variables
  function loadEnvVariables() {
    // Method 1: From Netlify runtime
    if (typeof window !== 'undefined' && window.netlifyEnv) {
      console.log('Loading environment variables from Netlify runtime');
      window.ENV = {
        ...window.ENV,
        ...window.netlifyEnv,
      };
    } 
    // Method 2: From Netlify injected script
    else if (typeof window !== 'undefined' && window._env_) {
      console.log('Loading environment variables from injected script');
      window.ENV = {
        ...window.ENV,
        ...window._env_,
      };
    } 
    // Method 3: Fall back to hardcoded values for Netlify preview deployments
    else if (isNetlify()) {
      console.log('Using fallback values for Netlify environment');
      // These will be replaced by the actual values during build
      window.ENV = {
        ...window.ENV,
        NEXT_PUBLIC_SUPABASE_URL: "https://cpzzmpgbyzcqbwkaaqdy.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw"
      };
    }
  }

  // Initialize process object for compatibility
  if (typeof window !== 'undefined' && !window.process) {
    window.process = {
      env: {}
    };
  }

  // Load environment variables
  loadEnvVariables();

  // Check if environment was loaded
  if (typeof window !== 'undefined') {
    if (!window.ENV) {
      console.warn('window.ENV not found - Netlify environment variables might not be injected properly');
    }
  }
  
  // Sync environment variables to process.env
  if (typeof window !== 'undefined' && window.process && window.ENV) {
    // Copy all environment variables from window.ENV to process.env
    Object.keys(window.ENV).forEach(key => {
      window.process.env[key] = window.ENV[key];
    });
  }

  // Log status of environment variables
  logEnvStatus();
})(); 