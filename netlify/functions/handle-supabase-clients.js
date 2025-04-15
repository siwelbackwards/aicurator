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
        
        // Track warnings and prevent infinite reload loops
        let goTrueWarningDetected = false;
        let fixAttempted = false;
        
        // Check if we're in a reload loop
        const checkReloadLoop = () => {
          const now = Date.now();
          const lastReload = parseInt(sessionStorage.getItem('lastReload') || '0');
          const reloadCount = parseInt(sessionStorage.getItem('reloadCount') || '0');
          
          if (now - lastReload < 5000) {
            sessionStorage.setItem('reloadCount', (reloadCount + 1).toString());
          } else {
            sessionStorage.setItem('reloadCount', '1');
          }
          
          sessionStorage.setItem('lastReload', now.toString());
          
          // If more than 2 reloads in 5 seconds, we're in a loop
          return reloadCount >= 2;
        };
        
        // Fix function
        window.__NETLIFY_FIX_SUPABASE = function() {
          // Prevent multiple fix attempts
          if (fixAttempted) return;
          fixAttempted = true;
          
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
          
          console.log('[NetlifySupabase] Fix applied');
          
          // REMOVED: Auto page reload 
          // We'll let the components handle refreshing if needed
        };
        
        // Intercept console warnings
        const originalConsoleWarn = console.warn;
        console.warn = function(...args) {
          if (args[0] && typeof args[0] === 'string' && args[0].includes('Multiple GoTrueClient instances')) {
            goTrueWarningDetected = true;
            console.log('[NetlifySupabase] GoTrueClient warning detected, applying fix');
            
            // Only apply fix if we're not in a reload loop
            if (!checkReloadLoop()) {
              // Apply fix after a short delay
              setTimeout(() => {
                window.__NETLIFY_FIX_SUPABASE();
              }, 500);
            } else {
              console.warn('[NetlifySupabase] Reload loop detected! Skipping auto-fix.');
            }
          }
          
          // Pass through to original console.warn
          originalConsoleWarn.apply(console, args);
        };
        
        console.log('[NetlifySupabase] Production client manager initialized');
      })();
    `
  };
}; 