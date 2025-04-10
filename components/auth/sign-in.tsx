"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SignInProps {
  onModeChange: () => void;
  onClose: () => void;
}

export default function SignIn({ onModeChange, onClose }: SignInProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [connectionError, setConnectionError] = useState(false);
  const [environmentDebug, setEnvironmentDebug] = useState<Record<string, any>>({});

  // Log public environment variables for debugging
  useEffect(() => {
    // Check if we're on Netlify
    const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
    
    // Get environment variables from different sources
    const windowEnv = typeof window !== 'undefined' ? (window as any).env : null;
    const processEnv = process.env;
    const netlifyEnv = typeof window !== 'undefined' ? (window as any)._env || (window as any).ENV || {} : {};
    
    // Collect debug info
    const debugInfo = {
      isNetlify,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      windowEnvExists: Boolean(windowEnv),
      processEnvExists: Boolean(processEnv),
      supabaseUrlFromWindow: windowEnv?.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      supabaseUrlFromProcess: processEnv.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      supabaseUrlFromNetlify: netlifyEnv.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
    };
    
    // Save debug info for potential display
    setEnvironmentDebug(debugInfo);
    
    // Log to console
    console.log('Environment debug info:', debugInfo);
    
    // Test connection to Supabase
    const testConnection = async () => {
      try {
        // Simple ping request
        const { data } = await supabase.from('profiles').select('count').limit(1);
        console.log('Connection test successful:', data);
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionError(true);
      }
    };
    
    testConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConnectionError(false);

    try {
      // Try to verify connection to Supabase
      try {
        // Simple ping request to check connectivity
        await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || "", { 
          method: 'HEAD', 
          mode: 'no-cors' 
        });
      } catch (connError) {
        console.error("Connection test failed:", connError);
        setConnectionError(true);
        // Continue anyway, as the no-cors mode might not return a valid response
      }

      console.log('Attempting sign in with:', { email: formData.email, password: '******' });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Auth error response:', error);
        throw error;
      }

      if (data.user) {
        // Ensure session is set
        console.log('Sign in successful, getting session');
        await supabase.auth.getSession();
        
        toast.success('Signed in successfully!');
        onClose();
        
        // Get the redirect URL from the query parameters
        const redirectedFrom = searchParams.get('redirectedFrom');
        if (redirectedFrom) {
          router.push(redirectedFrom);
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      
      // Check if it's a connection error
      if (error instanceof Error && error.message.includes("fetch")) {
        toast.error("Cannot connect to authentication service. Please check your internet connection.");
        setConnectionError(true);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showEnvironmentDebug = () => {
    console.log('Full environment debug:', environmentDebug);
    alert(JSON.stringify(environmentDebug, null, 2));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {connectionError && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
          <p className="font-bold">Connection error: Cannot connect to authentication service.</p>
          <p>This may be due to:</p>
          <ul className="list-disc ml-4 mt-1">
            <li>Network connectivity issues</li>
            <li>Incorrect Supabase URL configuration</li>
            <li>Supabase service being temporarily unavailable</li>
          </ul>
          <button 
            type="button" 
            onClick={showEnvironmentDebug}
            className="text-xs text-blue-600 underline mt-2"
          >
            Show Environment Debug Info
          </button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onModeChange}
          className="text-sm text-blue-600 hover:underline"
        >
          Create an account
        </button>
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}