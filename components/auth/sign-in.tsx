"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
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
  const [envStatus, setEnvStatus] = useState<{hasUrl: boolean, hasKey: boolean}>({
    hasUrl: false,
    hasKey: false
  });
  const [error, setError] = useState<string | null>(null);

  // Check environment variables and connection
  useEffect(() => {
    // Check environment variables
    const windowEnv = typeof window !== 'undefined' ? (window as any).env || (window as any).ENV || {} : {};
    
    // Check if we have the required environment variables
    const hasUrl = Boolean(
      windowEnv.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    
    const hasKey = Boolean(
      windowEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    setEnvStatus({ hasUrl, hasKey });
    
    // Test connection to Supabase
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) throw error;
        setConnectionError(false);
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionError(true);
      }
    };
    
    // Only test connection if we have the required environment variables
    if (hasUrl && hasKey) {
      testConnection();
    } else {
      setConnectionError(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email before signing in.');
        } else {
          setError(error.message);
        }
        return;
      }

      toast.success('Successfully signed in!');
      onClose();
      
      // Get the redirect URL from the query parameters
      const redirectedFrom = searchParams.get('redirectedFrom');
      if (redirectedFrom) {
        router.push(redirectedFrom);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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

  // Show a clear error if environment variables are missing
  if (!envStatus.hasUrl || !envStatus.hasKey) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded text-sm text-red-700">
        <p className="font-bold">Configuration Error</p>
        <p>The application is missing required environment variables:</p>
        <ul className="list-disc ml-4 mt-2">
          {!envStatus.hasUrl && <li>NEXT_PUBLIC_SUPABASE_URL is missing</li>}
          {!envStatus.hasKey && <li>NEXT_PUBLIC_SUPABASE_ANON_KEY is missing</li>}
        </ul>
        <p className="mt-2">
          Please ensure these environment variables are set in your deployment.
        </p>
      </div>
    );
  }

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
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
          <p className="font-bold">Error: {error}</p>
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