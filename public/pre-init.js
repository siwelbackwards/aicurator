/**
 * Pre-initialization script to help prevent multiple Supabase client instances
 * This runs before any other scripts to ensure consistent global state
 */
(function() {
  // Setup global namespace for tracking client instances
  window.__SUPABASE_INSTANCES = {
    count: 0,
    lastReset: Date.now()
  };
  
  // Setup global reset function
  window.__RESET_SUPABASE = function() {
    console.debug('[pre-init] Resetting Supabase client instances');
    window.__SUPABASE_CLIENT__ = undefined;
    window.__SUPABASE_ADMIN__ = undefined;
    window.__SHARED_GOTRUE__ = undefined;
    window.__GO_TRUE_CLIENT__ = undefined;
    window.__SUPABASE_INSTANCES.count = 0;
    window.__SUPABASE_INSTANCES.lastReset = Date.now();
  };
  
  // Set up reload protection
  window.__DETECT_RELOAD_LOOP = function() {
    try {
      // Get existing values from session storage
      const now = Date.now();
      const lastLoad = parseInt(sessionStorage.getItem('__SUPABASE_LAST_LOAD') || '0');
      const loadCount = parseInt(sessionStorage.getItem('__SUPABASE_LOAD_COUNT') || '0');
      
      // Update session storage
      sessionStorage.setItem('__SUPABASE_LAST_LOAD', now.toString());
      
      // If less than 3 seconds between loads, increment counter
      // Otherwise reset counter
      if (lastLoad > 0 && now - lastLoad < 3000) {
        sessionStorage.setItem('__SUPABASE_LOAD_COUNT', (loadCount + 1).toString());
      } else {
        sessionStorage.setItem('__SUPABASE_LOAD_COUNT', '1');
      }
      
      // Return true if in a reload loop (3+ quick loads)
      return loadCount >= 2;
    } catch (e) {
      // If there's an error (like sessionStorage not available), assume not in a loop
      return false;
    }
  };
  
  // Check for reload loops on initialization
  const inReloadLoop = window.__DETECT_RELOAD_LOOP();
  if (inReloadLoop) {
    console.warn('[pre-init] Reload loop detected. Preventing automatic actions.');
    
    // Save to indicate we detected a loop
    sessionStorage.setItem('__SUPABASE_IN_RELOAD_LOOP', 'true');
    
    // Try to break the loop by showing an alert to user after a delay
    if (parseInt(sessionStorage.getItem('__SUPABASE_LOOP_ALERT') || '0') < 1) {
      sessionStorage.setItem('__SUPABASE_LOOP_ALERT', '1');
      setTimeout(() => {
        try {
          // Show an alert to the user and prevent further reloads
          const alertElement = document.createElement('div');
          alertElement.style.position = 'fixed';
          alertElement.style.top = '0';
          alertElement.style.left = '0';
          alertElement.style.right = '0';
          alertElement.style.padding = '10px';
          alertElement.style.backgroundColor = '#f44336';
          alertElement.style.color = 'white';
          alertElement.style.textAlign = 'center';
          alertElement.style.zIndex = '9999';
          alertElement.innerHTML = 'Reload loop detected. <a href="/" style="color:white;text-decoration:underline">Click here</a> to reload manually.';
          
          // Add to body when ready
          if (document.body) {
            document.body.appendChild(alertElement);
          } else {
            // If body isn't ready, wait for it
            window.addEventListener('DOMContentLoaded', () => {
              document.body.appendChild(alertElement);
            });
          }
        } catch (e) {
          // Fail silently to avoid making things worse
          console.error('[pre-init] Error showing reload alert:', e);
        }
      }, 1000);
    }
  } else {
    // Clear any previous reload loop indicators
    sessionStorage.removeItem('__SUPABASE_IN_RELOAD_LOOP');
    sessionStorage.removeItem('__SUPABASE_LOOP_ALERT');
  }
  
  // Run an initial reset
  window.__RESET_SUPABASE();
  
  console.debug('[pre-init] Supabase pre-initialization complete');
})(); 