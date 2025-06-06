"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase, refreshSession, isSessionValid } from '@/lib/supabase-client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  const updateAuthState = useCallback((session: Session | null) => {
    setAuthState({
      user: session?.user || null,
      session,
      loading: false,
      isAuthenticated: !!session,
    });
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error checking session:', error);
        updateAuthState(null);
        return;
      }

      // Check if session is still valid
      if (session) {
        const isValid = await isSessionValid();
        if (!isValid) {
          console.log('🔄 Session expired, attempting refresh...');
          const refreshed = await refreshSession();
          if (!refreshed) {
            console.log('❌ Failed to refresh session, signing out...');
            await supabase.auth.signOut();
            updateAuthState(null);
            return;
          }
          // Get the new session after refresh
          const { data: { session: newSession } } = await supabase.auth.getSession();
          updateAuthState(newSession);
        } else {
          updateAuthState(session);
        }
      } else {
        updateAuthState(null);
      }
    } catch (error) {
      console.error('❌ Exception checking session:', error);
      updateAuthState(null);
    }
  }, [updateAuthState]);

  const handleSignOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error signing out:', error);
        throw error;
      }
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userAuthenticated');
      }
      
      updateAuthState(null);
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      // Even if sign out fails, clear local state
      updateAuthState(null);
      throw error;
    }
  }, [updateAuthState]);

  const handleRefreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const success = await refreshSession();
      if (success) {
        await checkSession();
      }
      return success;
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      return false;
    }
  }, [checkSession]);

  useEffect(() => {
    // Initial session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔄 Auth event:', event);
        
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in');
            updateAuthState(session);
            if (typeof window !== 'undefined') {
              localStorage.setItem('userAuthenticated', 'true');
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            updateAuthState(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('userAuthenticated');
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            updateAuthState(session);
            break;
            
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery');
            break;
            
          default:
            // Handle any other auth events
            updateAuthState(session);
        }
      }
    );

    // Listen for custom sign out events from other tabs
    const handleCustomSignOut = () => {
      console.log('👋 Sign out event from another tab');
      updateAuthState(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:signout', handleCustomSignOut);
    }

    // Periodic session validation (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      if (authState.isAuthenticated) {
        const isValid = await isSessionValid();
        if (!isValid) {
          console.log('🔄 Session validation failed, refreshing...');
          const refreshed = await handleRefreshSession();
          if (!refreshed) {
            console.log('❌ Session refresh failed, signing out...');
            await handleSignOut();
          }
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:signout', handleCustomSignOut);
      }
      clearInterval(sessionCheckInterval);
    };
  }, [authState.isAuthenticated, checkSession, handleRefreshSession, handleSignOut, updateAuthState]);

  return {
    ...authState,
    signOut: handleSignOut,
    refreshSession: handleRefreshSession,
    checkSession,
  };
} 