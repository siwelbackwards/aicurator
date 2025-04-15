/**
 * Netlify function to handle Supabase client management
 * This helps address the "Multiple GoTrueClient instances" warning
 * when the application is running in Netlify's production environment
 */
exports.handler = async function(event, context) {
  // Only handle GET requests to this endpoint
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Create a response with the helper script
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: `
      // Netlify Supabase Client Manager
      (function() {
        console.log('[NetlifySupabase] Initializing production client manager');
        
        // Track warnings
        let goTrueWarningDetected = false;
        
        // Fix function
        window.__NETLIFY_FIX_SUPABASE = function() {
          console.log('[NetlifySupabase] Applying production fix for multiple clients');
          
          // Clear any existing instances
          if (window.__RESET_SUPABASE) {
            window.__RESET_SUPABASE();
          }
          
          // Try to reset GoTrue client
          if (window.__GO_TRUE_CLIENT__) {
            window.__GO_TRUE_CLIENT__ = null;
          }
          
          if (window.__SHARED_GOTRUE__) {
            window.__SHARED_GOTRUE__ = null;
          }
          
          // Clear localStorage keys related to auth
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase.auth') || key.includes('gotrue') || key.includes('aicurator')) {
              localStorage.removeItem(key);
            }
          });
          
          console.log('[NetlifySupabase] Fix applied');
          
          // Reload the page after a delay if the issue was detected
          if (goTrueWarningDetected) {
            console.log('[NetlifySupabase] Reloading page in 2 seconds');
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        };
        
        // Intercept console warnings
        const originalConsoleWarn = console.warn;
        console.warn = function(...args) {
          if (args[0] && typeof args[0] === 'string' && args[0].includes('Multiple GoTrueClient instances')) {
            goTrueWarningDetected = true;
            console.log('[NetlifySupabase] GoTrueClient warning detected, applying fix');
            
            // Apply fix after a short delay
            setTimeout(() => {
              window.__NETLIFY_FIX_SUPABASE();
            }, 500);
          }
          
          // Pass through to original console.warn
          originalConsoleWarn.apply(console, args);
        };
        
        console.log('[NetlifySupabase] Production client manager initialized');
      })();
    `
  };
}; 