"use client";

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({
    windowEnv: {},
    windowENV: {},
    processEnv: {},
    hostname: '',
    supabaseTest: 'Not tested',
  });

  useEffect(() => {
    // Gather debug information
    const windowEnv = typeof window !== 'undefined' ? (window as any).env || {} : {};
    const windowENV = typeof window !== 'undefined' ? (window as any).ENV || {} : {};
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

    // Only collect partial key info for security
    const sanitizeKey = (key: string) => {
      if (!key) return 'Not set';
      if (key.length < 10) return 'Invalid (too short)';
      return `${key.substring(0, 10)}...`;
    };

    const info = {
      windowEnv: {
        exists: Boolean(windowEnv),
        NEXT_PUBLIC_SUPABASE_URL: windowEnv.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY_partial: sanitizeKey(windowEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
      windowENV: {
        exists: Boolean(windowENV),
        NEXT_PUBLIC_SUPABASE_URL: windowENV.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY_partial: sanitizeKey(windowENV.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
      processEnv: {
        exists: Boolean(process.env),
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY_partial: sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string),
      },
      hostname,
      supabaseTest: 'Running test...',
    };

    setDebugInfo(info);

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          setDebugInfo(prev => ({
            ...prev,
            supabaseTest: `Error: ${error.message}`,
          }));
        } else {
          setDebugInfo(prev => ({
            ...prev,
            supabaseTest: 'Connection successful',
          }));
        }
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          supabaseTest: `Exception: ${error instanceof Error ? error.message : String(error)}`,
        }));
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Hostname</h2>
        <p className="font-mono">{debugInfo.hostname}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>
        <p className={`font-mono ${debugInfo.supabaseTest === 'Connection successful' ? 'text-green-600' : 'text-red-600'}`}>
          {debugInfo.supabaseTest}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">window.env</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo.windowEnv, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">window.ENV</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo.windowENV, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">process.env</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo.processEnv, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>Check if the environment variables are properly loaded in any of the three sources</li>
          <li>Verify if the Supabase URL format is valid</li>
          <li>Make sure the Supabase connection test is successful</li>
          <li>If using window.env, ensure env.js is being loaded before the app</li>
          <li>If using window.ENV, check that inject-env.js executed successfully</li>
        </ul>
      </div>
    </div>
  );
} 