"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import AuthDialog from '@/components/auth/auth-dialog';
import { toast } from 'sonner';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams ? searchParams.get('redirect') : null;
  const [authDialogOpen, setAuthDialogOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    // Check if the user is already authenticated
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (session) {
          // User is already authenticated, redirect them
          console.log("Auth page: User is authenticated, redirecting to", redirectPath || '/dashboard');
          localStorage.setItem('userAuthenticated', 'true');
          
          if (redirectPath) {
            router.push(redirectPath);
          } else {
            router.push('/dashboard');
          }
        } else {
          // User needs to authenticate
          console.log("Auth page: User needs to authenticate");
          localStorage.removeItem('userAuthenticated');
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectPath]);

  const handleAuthSuccess = () => {
    // Set flag to prevent loops
    setAuthAttempted(true);
    localStorage.setItem('userAuthenticated', 'true');
    
    // After successful authentication, redirect to the specified path
    console.log("Auth success, redirecting to", redirectPath || '/dashboard');
    toast.success('Successfully signed in!');
    
    setTimeout(() => {
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    }, 500); // Small delay to ensure session is properly set
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthDialog
        isOpen={authDialogOpen}
        onOpenChange={(open) => {
          setAuthDialogOpen(open);
          // If they close the dialog without authenticating, redirect to home
          if (!open && !authAttempted) {
            router.push('/');
          }
        }}
        initialMode="signIn"
        redirectPath={redirectPath || undefined}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
} 