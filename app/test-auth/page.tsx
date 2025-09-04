'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAuth();
  }, []);

  const testAuth = async () => {
    try {
      console.log('🧪 Test Auth: Starting authentication test...');

      // Test session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('🧪 Test Auth: Session result:', sessionData);

      // Test user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('🧪 Test Auth: User result:', userData);

      // Test profile (if user exists)
      let profileData = null;
      let profileError = null;
      if (userData?.user?.id) {
        const result = await supabase
          .from('profiles')
          .select('role, user_status, email')
          .eq('id', userData.user.id)
          .single();
        profileData = result.data;
        profileError = result.error;
        console.log('🧪 Test Auth: Profile result:', profileData);
      }

      setAuthStatus({
        session: {
          exists: !!sessionData?.session,
          user: sessionData?.session?.user ? {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email
          } : null,
          error: sessionError
        },
        user: {
          exists: !!userData?.user,
          data: userData?.user ? {
            id: userData.user.id,
            email: userData.user.email
          } : null,
          error: userError
        },
        profile: {
          exists: !!profileData,
          data: profileData,
          error: profileError
        }
      });

    } catch (error) {
      console.error('🧪 Test Auth: Error:', error);
      setAuthStatus({ error: error });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p>Testing authentication...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <p className="text-gray-600 mb-6">This page tests your authentication status and admin access.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Session Status</h2>
          <div className="text-sm space-y-2">
            <p><strong>Session Exists:</strong> {authStatus?.session?.exists ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User ID:</strong> {authStatus?.session?.user?.id || 'None'}</p>
            <p><strong>Email:</strong> {authStatus?.session?.user?.email || 'None'}</p>
            {authStatus?.session?.error && (
              <p className="text-red-600"><strong>Error:</strong> {authStatus.session.error.message}</p>
            )}
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-900">User Status</h2>
          <div className="text-sm space-y-2">
            <p><strong>User Exists:</strong> {authStatus?.user?.exists ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User ID:</strong> {authStatus?.user?.data?.id || 'None'}</p>
            <p><strong>Email:</strong> {authStatus?.user?.data?.email || 'None'}</p>
            {authStatus?.user?.error && (
              <p className="text-red-600"><strong>Error:</strong> {authStatus.user.error.message}</p>
            )}
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-900">Profile Status</h2>
          <div className="text-sm space-y-2">
            <p><strong>Profile Exists:</strong> {authStatus?.profile?.exists ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Role:</strong> {authStatus?.profile?.data?.role || 'None'}</p>
            <p><strong>User Status:</strong> {authStatus?.profile?.data?.user_status || 'None'}</p>
            <p><strong>Admin Access:</strong> {
              authStatus?.profile?.data?.role === 'admin'
                ? '✅ Yes'
                : '❌ No'
            }</p>
            {authStatus?.profile?.error && (
              <p className="text-red-600"><strong>Error:</strong> {authStatus.profile.error.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">Test Results:</h3>
        <div className="text-sm space-y-1">
          {authStatus?.session?.exists && authStatus?.user?.exists && authStatus?.profile?.exists && authStatus?.profile?.data?.role === 'admin' ? (
            <p className="text-green-700">✅ All checks passed! You should have admin access.</p>
          ) : (
            <div className="text-red-700 space-y-1">
              {!authStatus?.session?.exists && <p>❌ Session missing - try logging in again</p>}
              {!authStatus?.user?.exists && <p>❌ User missing - authentication issue</p>}
              {!authStatus?.profile?.exists && <p>❌ Profile missing - database issue</p>}
              {authStatus?.profile?.data?.role !== 'admin' && <p>❌ Not admin - role issue</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Actions:</h3>
        <div className="space-y-2">
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Re-test Authentication
          </button>
          <a
            href="/admin"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-2"
          >
            Try Admin Access
          </a>
          <a
            href="/debug"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ml-2"
          >
            Debug Page
          </a>
        </div>
      </div>

      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-900 mb-2">If Still Having Issues:</h3>
        <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
          <li>Try a hard refresh (Ctrl+F5)</li>
          <li>Clear browser cache and cookies</li>
          <li>Try logging out and logging back in</li>
          <li>Check browser console for detailed error messages</li>
        </ol>
      </div>
    </div>
  );
}
