// This file is loaded at runtime to inject environment variables
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
});