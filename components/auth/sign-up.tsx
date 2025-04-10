"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SignUpProps {
  onModeChange: () => void;
  onClose: () => void;
}

export default function SignUp({ onModeChange, onClose }: SignUpProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    title: '',
    firstName: '',
    lastName: '',
    userType: 'buyer' as 'buyer' | 'seller',
  });
  const [envStatus, setEnvStatus] = useState<{hasUrl: boolean, hasKey: boolean}>({
    hasUrl: false,
    hasKey: false
  });

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
        console.log('Connection test successful');
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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: formData.userType,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: formData.userType,
          });

        if (profileError) {
          throw profileError;
        }

        toast.success('Account created successfully!');
        onClose();
        router.refresh();
      }
    } catch (error) {
      console.error('Error signing up:', error);
      
      // Check if it's a connection error
      if (error instanceof Error && 
          (error.message.includes("fetch") || error.message.includes("network"))) {
        toast.error("Cannot connect to authentication service. Please check your internet connection.");
        setConnectionError(true);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <select
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select title</option>
          <option value="Mr">Mr</option>
          <option value="Mrs">Mrs</option>
          <option value="Ms">Ms</option>
          <option value="Dr">Dr</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userType">I want to</Label>
        <select
          id="userType"
          name="userType"
          value={formData.userType}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        >
          <option value="buyer">Buy Art</option>
          <option value="seller">Sell Art</option>
        </select>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
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
          Already have an account? Sign in
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}