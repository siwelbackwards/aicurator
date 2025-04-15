"use client";

import { useEffect, useState, useRef } from 'react';
import { debugSupabaseClients, resetSupabaseClients } from '@/lib/supabase';
import { resetGoTrueClient, lockGoTrueClient } from '@/lib/gotrue-singleton';
import { Button } from '@/components/ui/button';

/**
 * Component to display Supabase debug information and provide tools to fix common issues
 * Production mode will still apply fixes but with minimal UI
 */
export function SupabaseDebug() {
  const [isVisible, setIsVisible] = useState(false);
  const [clientStats, setClientStats] = useState<any>(null);
  const [multipleClientWarning, setMultipleClientWarning] = useState(false);
  const [autoFixActive, setAutoFixActive] = useState(true); // Default to auto-fix enabled
  const [isFixing, setIsFixing] = useState(false);
  const [isProduction, setIsProduction] = useState(false);
  const fixTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fixAttemptCount = useRef(0);
  
  // Function to fix the multiple clients issue
  const fixMultipleClients = () => {
    // Prevent multiple concurrent fixes
    if (isFixing) return;
    
    // Track fix attempts
    fixAttemptCount.current += 1;
    
    // Limit fix attempts to prevent infinite loops
    if (fixAttemptCount.current > 3) {
      console.warn('[SupabaseDebug] Multiple fix attempts detected - limiting further attempts');
      return;
    }
    
    setIsFixing(true);
    console.debug('[SupabaseDebug] Automatically fixing multiple client instances');
    
    // Reset both client and auth
    try {
      resetGoTrueClient();
      setTimeout(() => {
        resetSupabaseClients();
        // Lock the client to prevent further instances
        setTimeout(() => {
          lockGoTrueClient();
          setMultipleClientWarning(false);
          
          // Reload client stats
          const stats = debugSupabaseClients();
          setClientStats(stats);
          setIsFixing(false);
        }, 200);
      }, 200);
    } catch (error) {
      console.error('[SupabaseDebug] Error during fix:', error);
      setIsFixing(false);
    }
  };
  
  // Check for any console warnings about multiple clients
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're in production
    setIsProduction(process.env.NODE_ENV === 'production');
    
    // Save original console.warn
    const originalWarn = console.warn;
    
    // Override to detect GoTrueClient warnings
    console.warn = function(...args: any[]) {
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('Multiple GoTrueClient instances')) {
        setMultipleClientWarning(true);
        
        // Auto-fix if enabled (always in production)
        if ((autoFixActive || isProduction) && !isFixing) {
          // Clear any existing timeout
          if (fixTimeoutRef.current) {
            clearTimeout(fixTimeoutRef.current);
          }
          
          // Set a slight delay to avoid multiple fixes
          fixTimeoutRef.current = setTimeout(() => {
            fixMultipleClients();
          }, 500);
        }
      }
      originalWarn.apply(console, args);
    };
    
    // In development, always show the debug UI
    // In production, only show if there's an issue
    const isDev = process.env.NODE_ENV !== 'production';
    setIsVisible(isDev || multipleClientWarning);
    
    // Get client statistics
    const stats = debugSupabaseClients();
    setClientStats(stats);
    
    // Reset count on each mount
    fixAttemptCount.current = 0;
    
    // Restore original console.warn on cleanup
    return () => {
      console.warn = originalWarn;
      if (fixTimeoutRef.current) {
        clearTimeout(fixTimeoutRef.current);
      }
    };
  }, [autoFixActive, isFixing, isProduction, multipleClientWarning]);
  
  // Don't render anything in production unless there's an issue
  if (!isVisible) return null;
  
  // In production, only show minimal UI and only when there's an issue
  if (isProduction) {
    if (!multipleClientWarning) return null;
    
    return (
      <div className="fixed bottom-0 right-0 m-4 p-2 bg-slate-900 bg-opacity-50 rounded-lg z-50 text-xs opacity-60">
        {isFixing ? 
          <div className="text-amber-300">Fixing Supabase issues...</div> :
          <Button 
            size="sm" 
            variant="destructive"
            className="text-xs"
            onClick={fixMultipleClients}
          >
            Fix Supabase
          </Button>
        }
      </div>
    );
  }
  
  // Full debug UI for development
  return (
    <div className="fixed bottom-0 right-0 m-4 p-4 bg-slate-900 text-white rounded-lg shadow-lg z-50 max-w-sm text-xs opacity-80 hover:opacity-100 transition-opacity">
      <h3 className="font-bold mb-2 text-sm">Supabase Debug</h3>
      
      {multipleClientWarning && (
        <div className="mb-2 p-2 bg-red-800 rounded">
          <p className="font-bold text-red-200">⚠️ Multiple GoTrueClient instances detected</p>
          <div className="flex justify-between items-center mt-1">
            <Button 
              size="sm" 
              variant="destructive"
              className="w-3/4 text-xs"
              onClick={fixMultipleClients}
              disabled={isFixing}
            >
              {isFixing ? 'Fixing...' : 'Fix Multiple Clients'}
            </Button>
            <Button
              size="sm"
              variant={autoFixActive ? "default" : "outline"}
              className="ml-1 w-1/4 text-xs"
              onClick={() => setAutoFixActive(!autoFixActive)}
            >
              {autoFixActive ? 'Auto' : 'Manual'}
            </Button>
          </div>
        </div>
      )}
      
      <div className="mb-2">
        <p>Module clients: {clientStats?.moduleClients?.regular ? '✅' : '❌'} regular, {clientStats?.moduleClients?.admin ? '✅' : '❌'} admin</p>
        <p>Global clients: {clientStats?.globalClients?.regular ? '✅' : '❌'} regular, {clientStats?.globalClients?.admin ? '✅' : '❌'} admin</p>
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs"
          onClick={() => {
            const stats = debugSupabaseClients();
            setClientStats(stats);
          }}
        >
          Refresh Stats
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs"
          onClick={() => {
            resetSupabaseClients();
            resetGoTrueClient();
            lockGoTrueClient();
            
            // Reload after reset
            setTimeout(() => {
              const stats = debugSupabaseClients();
              setClientStats(stats);
            }, 100);
          }}
        >
          Reset Clients
        </Button>
      </div>
    </div>
  );
} 