"use client";

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({
    windowEnv: {},
    windowENV: {},
    processEnv: {},
    hostname: '',
    supabaseTest: 'Not tested',
    netlifyVars: {}
  });

  useEffect(() => {
    // Gather debug information
    const windowEnv = typeof window !== 'undefined' ? (window as any).env || {} : {};
    const windowENV = typeof window !== 'undefined' ? (window as any).ENV || {} : {};
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isNetlify = hostname.includes('netlify.app');
    const netlifyVars = typeof window !== 'undefined' ? (window as any)._env || {} : {};

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
        isValidUrl: validateUrl(windowEnv.NEXT_PUBLIC_SUPABASE_URL),
      },
      windowENV: {
        exists: Boolean(windowENV),
        NEXT_PUBLIC_SUPABASE_URL: windowENV.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY_partial: sanitizeKey(windowENV.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        isValidUrl: validateUrl(windowENV.NEXT_PUBLIC_SUPABASE_URL),
      },
      processEnv: {
        exists: Boolean(process.env),
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY_partial: sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string),
        isValidUrl: validateUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
      },
      netlifyVars: {
        isNetlify,
        netlifyEnvExists: Boolean(netlifyVars),
        NEXT_PUBLIC_SUPABASE_URL: netlifyVars.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY_partial: sanitizeKey(netlifyVars.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        isValidUrl: validateUrl(netlifyVars.NEXT_PUBLIC_SUPABASE_URL),
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

  // Simple URL validator
  function validateUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Hostname</h2>
        <p className="font-mono">{debugInfo.hostname}</p>
        <p className="text-sm mt-1">
          {debugInfo.hostname.includes('netlify.app') 
            ? '✅ Running on Netlify' 
            : '❌ Not running on Netlify'}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>
        <p className={`font-mono ${debugInfo.supabaseTest === 'Connection successful' ? 'text-green-600' : 'text-red-600'}`}>
          {debugInfo.supabaseTest}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">window.env</h2>
          <div className="text-xs mb-2">
            {debugInfo.windowEnv.isValidUrl 
              ? <span className="text-green-600">✅ Valid URL</span> 
              : <span className="text-red-600">❌ Invalid URL</span>}
          </div>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo.windowEnv, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">window.ENV (Netlify)</h2>
          <div className="text-xs mb-2">
            {debugInfo.windowENV.isValidUrl 
              ? <span className="text-green-600">✅ Valid URL</span> 
              : <span className="text-red-600">❌ Invalid URL</span>}
          </div>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo.windowENV, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">process.env</h2>
          <div className="text-xs mb-2">
            {debugInfo.processEnv.isValidUrl 
              ? <span className="text-green-600">✅ Valid URL</span> 
              : <span className="text-red-600">❌ Invalid URL</span>}
          </div>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo.processEnv, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Netlify _env</h2>
          <div className="text-xs mb-2">
            {debugInfo.netlifyVars.isValidUrl 
              ? <span className="text-green-600">✅ Valid URL</span> 
              : <span className="text-red-600">❌ Invalid URL</span>}
          </div>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo.netlifyVars, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li className="font-semibold">Set your environment variables in Netlify:</li>
          <li className="ml-5">Go to Netlify dashboard → Site settings → Environment variables</li>
          <li className="ml-5">Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> with value <code className="bg-gray-100 px-1 rounded">https://cpzzmpgbyzcqbwkaaqdy.supabase.co</code></li>
          <li className="ml-5">Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> with the correct anon key from your Supabase project</li>
          <li className="font-semibold mt-3">After setting variables:</li>
          <li className="ml-5">Trigger a new deployment from the Netlify dashboard</li>
          <li className="ml-5">Or push a new commit to your repository</li>
        </ul>
      </div>
    </div>
  );
} 