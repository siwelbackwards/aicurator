/**
 * Monkey-patch script for GoTrueClient
 * This script intercepts the creation of any GoTrueClient instances
 * and ensures only one exists in the application
 */
(function() {
  console.log('[GoTruePatch] Initializing GoTrueClient patch...');
  
  // Variable to hold the singleton instance
  var goTrueInstance = null;
  
  // Function to wait for the GoTrueClient to become available
  function waitForGoTrueClient(callback, maxAttempts = 50) {
    var attempts = 0;
    var checkInterval = setInterval(function() {
      attempts++;
      
      // Check if the class is available in the global scope
      if (window.GoTrueClient) {
        clearInterval(checkInterval);
        console.log('[GoTruePatch] GoTrueClient found in global scope after ' + attempts + ' attempts');
        callback(window.GoTrueClient);
      } 
      // Check in supabase module if present
      else if (window.supabase && window.supabase.GoTrueClient) {
        clearInterval(checkInterval);
        console.log('[GoTruePatch] GoTrueClient found in supabase module after ' + attempts + ' attempts');
        callback(window.supabase.GoTrueClient);
      }
      // Give up after maximum attempts
      else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.log('[GoTruePatch] Could not find GoTrueClient after ' + maxAttempts + ' attempts');
      }
    }, 100);
  }
  
  // Monkey-patch the constructor
  function patchGoTrueClient(GoTrueClient) {
    // Store the original constructor
    var OriginalGoTrueClient = GoTrueClient;
    
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
      
      return goTrueInstance;
    };
    
    // Copy over prototype and static properties
    PatchedGoTrueClient.prototype = OriginalGoTrueClient.prototype;
    for (var prop in OriginalGoTrueClient) {
      if (OriginalGoTrueClient.hasOwnProperty(prop)) {
        PatchedGoTrueClient[prop] = OriginalGoTrueClient[prop];
      }
    }
    
    // Replace the original constructor with our patched one
    window.GoTrueClient = PatchedGoTrueClient;
    if (window.supabase && window.supabase.GoTrueClient) {
      window.supabase.GoTrueClient = PatchedGoTrueClient;
    }
    
    console.log('[GoTruePatch] Successfully patched GoTrueClient constructor');
  }
  
  // Start the patching process
  waitForGoTrueClient(patchGoTrueClient);
})(); 