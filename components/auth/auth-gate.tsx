"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import AuthDialog from './auth-dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // Paths that don't require authentication
  const publicPaths = [
    '/',
    '/api',
    '/images',
    '/assets',
    '/favicon.ico',
    '/auth',
    '/_next'
  ];
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname?.startsWith(path + '/') ||
    // Special case for root path
    (path === '/' && pathname === '/')
  );

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // First check localStorage flag
        if (typeof window !== 'undefined') {
          const userAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
          if (userAuthenticated) {
            setIsAuthenticated(true);
            return;
          }
        }
      
        // Then verify with actual session
        const { data } = await supabase.auth.getSession();
        const hasSession = !!data?.session;
        
        if (hasSession && typeof window !== 'undefined') {
          localStorage.setItem('userAuthenticated', 'true');
        }
        
        setIsAuthenticated(hasSession);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
        localStorage.setItem('userAuthenticated', 'true');
      } else if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
        localStorage.removeItem('userAuthenticated');
      }
      
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // While checking authentication status, render nothing special
  if (isAuthenticated === null) {
    return <>{children}</>;
  }

  // If on a public path or authenticated, render content normally
  if (isPublicPath || isAuthenticated) {
    return <>{children}</>;
  }

  // For unauthenticated users on protected paths, blur the content and show auth prompt
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-md pointer-events-none">
        {children}
      </div>
      
      {/* Auth overlay */}
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Content Locked</h2>
          <p className="text-gray-600 mb-6">
            Member log in or create an account to access this content and enjoy all features of AI Curator.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => setAuthDialogOpen(true)}
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Auth dialog */}
      <AuthDialog 
        isOpen={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        initialMode="signUp"
        onAuthSuccess={() => {
          // Refresh the page to update authentication state but stay on the same page
          setIsAuthenticated(true);
          localStorage.setItem('userAuthenticated', 'true');
          window.location.reload();
        }}
      />
    </div>
  );
} 