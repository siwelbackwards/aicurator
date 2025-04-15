/**
 * Monkey-patch script for GoTrueClient
 * This script intercepts the creation of any GoTrueClient instances
 * and ensures only one exists in the application
 */
(function() {
  console.log('[GoTruePatch] Initializing GoTrueClient patch...');
  
  // Variable to hold the singleton instance
  var goTrueInstance = null;
  
  // Track if we're still loading
  var isInitialized = false;
  
  // Define a more aggressive interception strategy
  function hijackGoTrueClient() {
    // If we're in a module system, we need to intercept the module loader
    if (typeof window !== 'undefined') {
      // Create getter/setter for GoTrueClient to intercept it as soon as it's defined
      var _GoTrueClient = null;
      Object.defineProperty(window, 'GoTrueClient', {
        get: function() {
          return _GoTrueClient;
        },
        set: function(value) {
          console.log('[GoTruePatch] GoTrueClient constructor intercepted!');
          // Store the original constructor
          _GoTrueClient = function() {
            console.log('[GoTruePatch] GoTrueClient instantiation intercepted');
            
            // If we already have an instance, return it
            if (goTrueInstance) {
              console.log('[GoTruePatch] Returning existing GoTrueClient instance');
              return goTrueInstance;
            }
            
            // Otherwise, create a new instance using the original constructor
            console.log('[GoTruePatch] Creating new GoTrueClient instance');
            goTrueInstance = new value(...arguments);
            
            // Store the instance in a global variable for cross-module access
            window.__GOTRUE_SINGLETON__ = goTrueInstance;
            window.__SHARED_GOTRUE__ = goTrueInstance;
            
            // Flag that we're initialized
            isInitialized = true;
            
            return goTrueInstance;
          };
          
          // Copy over prototype and static properties
          _GoTrueClient.prototype = value.prototype;
          for (var prop in value) {
            if (value.hasOwnProperty(prop)) {
              _GoTrueClient[prop] = value[prop];
            }
          }
        },
        configurable: true
      });
    }
  }
  
  // Run our interception immediately
  hijackGoTrueClient();
  
  // Set up an alternate strategy using a timer for dynamic loading
  function checkAndPatchDynamically() {
    var checkInterval = setInterval(function() {
      // If we succeeded with the property interceptor, we can stop
      if (isInitialized) {
        clearInterval(checkInterval);
        return;
      }
      
      // Check if the class is available in the global scope but our interceptor missed it
      if (window.GoTrueClient && !(window.GoTrueClient._intercepted)) {
        clearInterval(checkInterval);
        console.log('[GoTruePatch] GoTrueClient found in global scope - applying manual patch');
        
        // Store the original constructor
        var OriginalGoTrueClient = window.GoTrueClient;
        
        // Create the replacement constructor
        var PatchedGoTrueClient = function() {
          // If we already have an instance, return it
          if (goTrueInstance) {
            console.log('[GoTruePatch] Returning existing GoTrueClient instance');
            return goTrueInstance;
          }
          
          // Otherwise, create a new instance using the original constructor
          console.log('[GoTruePatch] Creating new GoTrueClient instance');
          goTrueInstance = new OriginalGoTrueClient(...arguments);
          
          // Store the instance in a global variable for cross-module access
          window.__GOTRUE_SINGLETON__ = goTrueInstance;
          window.__SHARED_GOTRUE__ = goTrueInstance;
          
          return goTrueInstance;
        };
        
        // Mark as intercepted so we don't try to patch it again
        PatchedGoTrueClient._intercepted = true;
        
        // Copy over prototype and static properties
        PatchedGoTrueClient.prototype = OriginalGoTrueClient.prototype;
        for (var prop in OriginalGoTrueClient) {
          if (OriginalGoTrueClient.hasOwnProperty(prop)) {
            PatchedGoTrueClient[prop] = OriginalGoTrueClient[prop];
          }
        }
        
        // Replace the original constructor with our patched one
        window.GoTrueClient = PatchedGoTrueClient;
        
        // Also check supabase module if present
        if (window.supabase && window.supabase.GoTrueClient) {
          window.supabase.GoTrueClient = PatchedGoTrueClient;
        }
        
        console.log('[GoTruePatch] Successfully patched GoTrueClient constructor');
      }
    }, 10); // Check more frequently (every 10ms)
    
    // Stop checking after 5 seconds
    setTimeout(function() {
      clearInterval(checkInterval);
      console.log('[GoTruePatch] Finished monitoring for GoTrueClient');
    }, 5000);
  }
  
  // Start the dynamic patching process
  checkAndPatchDynamically();
  
  // Expose a reset function to global scope for use by other components
  window.__RESET_GOTRUE__ = function() {
    console.log('[GoTruePatch] Resetting GoTrueClient instance');
    goTrueInstance = null;
    window.__GOTRUE_SINGLETON__ = null;
    window.__SHARED_GOTRUE__ = null;
  };
})(); 