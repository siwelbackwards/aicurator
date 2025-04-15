/**
 * Pre-initialization script to prevent multiple GoTrueClient instances
 * This runs before React initializes and before any Supabase code is loaded
 */
(function() {
  console.log('[PreInit] Setting up early interception for GoTrueClient');
  
  // Create a shared container for all Supabase instances
  window.__SUPABASE_SINGLETONS = {
    goTrueClient: null,
    standardClient: null,
    adminClient: null,
    storageKey: null
  };
  
  // Early interception of GoTrueClient constructor
  let _origGoTrueClient = null;
  
  // Create getters/setters for properties we want to intercept
  Object.defineProperty(window, 'GoTrueClient', {
    get: function() {
      console.log('[PreInit] GoTrueClient getter called');
      return _origGoTrueClient;
    },
    set: function(value) {
      console.log('[PreInit] Intercepted GoTrueClient constructor');
      
      // Store the original constructor
      _origGoTrueClient = function() {
        console.log('[PreInit] GoTrueClient instantiation intercepted');
        
        // If we already have an instance, return it
        if (window.__SUPABASE_SINGLETONS.goTrueClient) {
          console.log('[PreInit] Returning existing GoTrueClient singleton');
          return window.__SUPABASE_SINGLETONS.goTrueClient;
        }
        
        // Otherwise create a new instance and store it
        console.log('[PreInit] Creating new GoTrueClient singleton');
        const instance = new value(...arguments);
        window.__SUPABASE_SINGLETONS.goTrueClient = instance;
        
        // Also store in the standard locations for compatibility
        window.__SHARED_GOTRUE__ = instance;
        window.__GO_TRUE_CLIENT__ = instance;
        
        return instance;
      };
      
      // Copy over prototype and static properties
      _origGoTrueClient.prototype = value.prototype;
      for (var prop in value) {
        if (value.hasOwnProperty(prop)) {
          _origGoTrueClient[prop] = value[prop];
        }
      }
    },
    configurable: true
  });
  
  // Expose a reset function that can be called from anywhere
  window.__RESET_SUPABASE = function() {
    console.log('[PreInit] Resetting Supabase singletons');
    window.__SUPABASE_SINGLETONS.goTrueClient = null;
    window.__SUPABASE_SINGLETONS.standardClient = null;
    window.__SUPABASE_SINGLETONS.adminClient = null;
    window.__SHARED_GOTRUE__ = null;
    window.__GO_TRUE_CLIENT__ = null;
    window.__SUPABASE_CLIENT__ = null;
    window.__SUPABASE_ADMIN__ = null;
    
    // Also clear any supabase auth related localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase.auth') || key.includes('gotrue') || key.includes('aicurator')) {
        console.log(`[PreInit] Removing storage key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  };
  
  // Add a function to simulate the multiple clients warning for testing
  window.__SIMULATE_MULTIPLE_CLIENTS = function() {
    console.log('[PreInit] Simulating multiple GoTrueClient instances warning');
    setTimeout(function() {
      console.warn('Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.');
    }, 1000); // Delay to allow components to initialize
  };
  
  console.log('[PreInit] Early interception setup complete');
})(); 