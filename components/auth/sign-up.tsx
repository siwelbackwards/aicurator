"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingCart, Store } from "lucide-react";

interface SignUpProps {
  onModeChange: () => void;
  onClose: () => void;
  onSignUpComplete?: (userId: string, userEmail: string) => void;
  onSellerSignUp?: () => void;
  onAuthSuccess?: () => void;
  redirectPath?: string;
}

export default function SignUp({ 
  onModeChange, 
  onClose, 
  onSignUpComplete, 
  onSellerSignUp, 
  onAuthSuccess,
  redirectPath 
}: SignUpProps) {
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
    setError(null);

    try {
      // If buyer type and onSignUpComplete exists, trigger onboarding
      if (formData.userType === 'buyer' && onSignUpComplete) {
        // Pass the email the user entered in the form
        onSignUpComplete("temp-id", formData.email);
        setLoading(false);
        return;
      } else {
        // For sellers, redirect to seller registration if available
        if (onSellerSignUp) {
          onSellerSignUp();
        } else {
          // Fallback if seller registration is not available
          toast.info('Seller registration coming soon!');
          onClose();
          
          // Handle direct redirect if auth success
          if (onAuthSuccess) {
            onAuthSuccess();
          } else if (redirectPath) {
            router.push(redirectPath);
          }
        }
      }
    } catch (error) {
      console.error('Error in selection process:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
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
    <div className="px-6 pb-6">
      <h3 className="font-semibold text-xl mb-4 text-center">Choose Your Path</h3>

      {connectionError && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700 mb-4">
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
        <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700 mb-4">
          <p className="font-bold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 mb-6">
          <RadioGroup 
            value={formData.userType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, userType: value as 'buyer' | 'seller' }))}
            className="grid grid-cols-2 gap-4"
          >
            <div 
              className={`flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer hover:border-primary transition-colors ${formData.userType === 'buyer' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
              onClick={() => setFormData(prev => ({ ...prev, userType: 'buyer' }))}
            >
              <ShoppingCart className="h-10 w-10 mb-2 text-gray-500" />
              <span className="font-medium">Buy</span>
            </div>
            <div 
              className={`flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer hover:border-primary transition-colors ${formData.userType === 'seller' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
              onClick={() => setFormData(prev => ({ ...prev, userType: 'seller' }))}
            >
              <Store className="h-10 w-10 mb-2 text-gray-500" />
              <span className="font-medium">Sell</span>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Your email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : 'Continue'}
        </Button>
        
        <div className="text-center text-sm mt-4">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onModeChange}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}