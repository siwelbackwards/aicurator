"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import AuthDialog from './auth-dialog';
import { Button } from '@/components/ui/button';
import { Lock, Clock } from 'lucide-react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
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

  // Paths that are allowed for pending/rejected users (VERY LIMITED)
  const statusPaths = ['/auth/pending-approval'];
  const isStatusPath = statusPaths.some(path => pathname?.startsWith(path));

  // Paths that pending users can access (besides status pages)
  const limitedPaths = ['/', '/auth/sign-out'];
  const isLimitedPath = limitedPaths.some(path => pathname === path);

  const checkUserStatus = async (userId: string) => {
    try {
      console.log('🔍 AuthGate: Checking user status for:', userId);
      setIsCheckingStatus(true);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_status, rejection_reason, role')
        .eq('id', userId)
        .single();

      console.log('🔍 AuthGate: Profile query result:', profile);
      console.log('🔍 AuthGate: Profile query error:', error);

      if (error) {
        console.error('❌ AuthGate: Error fetching user status:', error);
        return null;
      }

      setUserStatus(profile.user_status);
      console.log('✅ AuthGate: User status set to:', profile.user_status);
      return profile;
    } catch (error) {
      console.error('💥 AuthGate: Exception in checkUserStatus:', error);
      return null;
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        console.log('🔐 AuthGate: Starting authentication check...');

        // First check localStorage flag
        if (typeof window !== 'undefined') {
          const userAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
          console.log('🔐 AuthGate: localStorage authenticated:', userAuthenticated);
          if (userAuthenticated) {
            console.log('🔐 AuthGate: Found cached auth, checking session...');
          }
        }

        // Then verify with actual session
        const { data, error } = await supabase.auth.getSession();
        console.log('🔐 AuthGate: Session data:', data);
        console.log('🔐 AuthGate: Session error:', error);

        // If no session but we have localStorage flag, try to refresh
        if (!data?.session && typeof window !== 'undefined' && localStorage.getItem('userAuthenticated') === 'true') {
          console.log('🔐 AuthGate: No session but localStorage says authenticated, trying refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          console.log('🔐 AuthGate: Refresh result:', refreshData);
          console.log('🔐 AuthGate: Refresh error:', refreshError);

          if (refreshData?.session) {
            console.log('🔐 AuthGate: Session refreshed successfully');
            // Use the refreshed session
            data.session = refreshData.session;
          } else {
            console.log('🔐 AuthGate: Session refresh failed, clearing localStorage');
            localStorage.removeItem('userAuthenticated');
          }
        }

        const hasSession = !!data?.session;
        console.log('🔐 AuthGate: Has session:', hasSession);

        if (hasSession && data.session?.user?.id) {
          console.log('🔐 AuthGate: Found session, checking user status...');

          // Check user status and role
          const profile = await checkUserStatus(data.session.user.id);
          console.log('🔐 AuthGate: User profile:', profile);

          // Admin users get special treatment
          if (profile?.role === 'admin') {
            console.log('🔐 AuthGate: User is admin, granting access');
            if (typeof window !== 'undefined') {
              localStorage.setItem('userAuthenticated', 'true');
            }
            setIsAuthenticated(true);
          } else {
            // Regular users follow normal approval flow
            if (profile?.user_status === 'approved') {
              if (typeof window !== 'undefined') {
                localStorage.setItem('userAuthenticated', 'true');
              }
              setIsAuthenticated(true);
            } else if (profile?.user_status === 'pending') {
              // PENDING USERS: Very restricted access
              if (isStatusPath || isLimitedPath) {
                setIsAuthenticated(true); // Allow access to status page and limited paths
              } else {
                // Redirect to pending approval for any other pages
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/pending-approval';
                  return;
                }
              }
            } else if (profile?.user_status === 'rejected') {
              // REJECTED USERS: Very restricted access
              if (isStatusPath || isLimitedPath) {
                setIsAuthenticated(true); // Allow access to status page and limited paths
              } else {
                // Redirect to pending approval for any other pages
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/pending-approval';
                  return;
                }
              }
            } else {
              // Unknown status, treat as pending
              if (isStatusPath || isLimitedPath) {
                setIsAuthenticated(true);
              } else {
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/pending-approval';
                  return;
                }
              }
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Check user status when signing in
        const profile = await checkUserStatus(session.user.id);

        // Admin users get special treatment
        if (profile?.role === 'admin') {
          if (profile.user_status === 'approved') {
            if (typeof window !== 'undefined') {
              localStorage.setItem('userAuthenticated', 'true');
            }
            setIsAuthenticated(true);
          } else {
            // Admin pending - allow access to admin areas and status pages
            if (pathname?.startsWith('/admin') || isStatusPath) {
              setIsAuthenticated(true);
            } else {
              // Redirect to pending approval for non-admin pages
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/pending-approval';
                return;
              }
            }
          }
        } else {
          // Regular users follow normal approval flow
          if (profile?.user_status === 'approved') {
            if (typeof window !== 'undefined') {
              localStorage.setItem('userAuthenticated', 'true');
            }
            setIsAuthenticated(true);
          } else if (profile?.user_status === 'pending' || profile?.user_status === 'rejected') {
            // PENDING/REJECTED USERS: Very restricted access
            if (isStatusPath || isLimitedPath) {
              setIsAuthenticated(true); // Allow access to status page and limited paths
            } else {
              // Redirect to pending approval for any other pages
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/pending-approval';
                return;
              }
            }
          } else {
            // Unknown status, treat as pending
            if (isStatusPath || isLimitedPath) {
              setIsAuthenticated(true);
            } else {
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/pending-approval';
                return;
              }
            }
          }
        }
      } else if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
        localStorage.removeItem('userAuthenticated');
        setUserStatus(null);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // While checking authentication status, render nothing special
  if (isAuthenticated === null || isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your account status...</p>
        </div>
      </div>
    );
  }

  // If on a public path, render content normally
  if (isPublicPath) {
    return <>{children}</>;
  }

  // If authenticated and approved, render content normally
  if (isAuthenticated && userStatus === 'approved') {
    return <>{children}</>;
  }

  // If authenticated but pending/rejected, show restricted view
  if (isAuthenticated && (userStatus === 'pending' || userStatus === 'rejected' || userStatus === 'admin_pending')) {
    return (
      <div className="relative">
        {/* Restricted content overlay */}
        <div className="blur-sm pointer-events-none opacity-50">
          {children}
        </div>

        {/* Restricted access banner */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-3 text-center font-medium">
          ⚠️ Account Under Review - Limited Access Only
        </div>

        {/* Pending approval overlay */}
        <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {userStatus === 'admin_pending' ? 'Admin Account Under Review' : 'Account Under Review'}
            </h2>
            <p className="text-gray-600 mb-6">
              {userStatus === 'admin_pending'
                ? 'Your admin account is being reviewed. You can access admin functions while waiting.'
                : 'Your account is currently under review. Access is limited until approval.'
              }
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = '/auth/pending-approval'}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                View Account Status
              </Button>
              <Button
                onClick={() => supabase.auth.signOut()}
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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