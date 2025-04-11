// This file injects environment variables for static builds
window.ENV = {
  // These values will be replaced during deployment by Netlify's environment variables
  NEXT_PUBLIC_SUPABASE_URL: "https://cpzzmpgbyzcqbwkaaqdy.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw"
};

// Set up process.env for compatibility with Next.js
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} };
}

// Copy environment variables to process.env
if (typeof window !== 'undefined' && window.process) {
  Object.keys(window.ENV).forEach(key => {
    window.process.env[key] = window.ENV[key];
  });
}

console.log('Environment variables loaded:', 
  'NEXT_PUBLIC_SUPABASE_URL ✓',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY ✓', 
  'SUPABASE_SERVICE_ROLE_KEY ✓'
); 