"use client";

import { useEffect, useState, useRef } from 'react';
import { debugSupabaseClients, resetSupabaseClients } from '@/lib/supabase';
import { resetGoTrueClient, lockGoTrueClient } from '@/lib/gotrue-singleton';
import { Button } from '@/components/ui/button';

// Define a type for the client state
interface ClientState {
  moduleClients?: {
    regular: boolean;
    admin: boolean;
  };
  globalClients?: {
    regular: boolean;
    admin: boolean;
  };
  warningDetected?: boolean;
  lastWarning?: string;
  storageKeys?: string[];
  clientEquality?: boolean;
  adminEquality?: boolean;
}

/**
 * Component to display Supabase debug information and provide tools to fix common issues
 * Only visible in development mode
 */
export function SupabaseDebug() {
  const [isVisible, setIsVisible] = useState(false);
  const [clientStats, setClientStats] = useState<any>(null);
  const [multipleClientWarning, setMultipleClientWarning] = useState(false);
  const [autoFixActive, setAutoFixActive] = useState(true); // Default to auto-fix enabled
  const [isFixing, setIsFixing] = useState(false);
  const fixTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to fix the multiple clients issue
  const fixMultipleClients = () => {
    // Prevent multiple concurrent fixes
    if (isFixing) return;
    
    setIsFixing(true);
    console.debug('[SupabaseDebug] Automatically fixing multiple client instances');
    
    // Reset both client and auth
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
      }, 100);
    }, 100);
  };
  
  // Check for any console warnings about multiple clients
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Save original console.warn
    const originalWarn = console.warn;
    
    // Override to detect GoTrueClient warnings
    console.warn = function(...args: any[]) {
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('Multiple GoTrueClient instances')) {
        setMultipleClientWarning(true);
        
        // Auto-fix if enabled
        if (autoFixActive && !isFixing) {
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
    
    // Check for dev mode
    const isDev = process.env.NODE_ENV !== 'production';
    setIsVisible(isDev);
    
    // Get client statistics
    const stats = debugSupabaseClients();
    setClientStats(stats);
    
    // Restore original console.warn on cleanup
    return () => {
      console.warn = originalWarn;
      if (fixTimeoutRef.current) {
        clearTimeout(fixTimeoutRef.current);
      }
    };
  }, [autoFixActive, isFixing]);
  
  if (!isVisible) return null;
  
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