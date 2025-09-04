'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSessionAndProfile();
  }, []);

  const checkSessionAndProfile = async () => {
    try {
      console.log('🔍 Debug Page: Starting session check...');

      // Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 Debug Page: Session result:', sessionData);
      setSessionInfo({
        session: sessionData?.session ? 'EXISTS' : 'NULL',
        user: sessionData?.session?.user ? {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email,
          created_at: sessionData.session.user.created_at
        } : null,
        error: sessionError
      });

      // Check profile if we have a user
      if (sessionData?.session?.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, user_status, email')
          .eq('id', sessionData.session.user.id)
          .single();

        console.log('🔍 Debug Page: Profile result:', profile);
        setProfileInfo({
          profile: profile,
          error: profileError
        });
      }
    } catch (error) {
      console.error('💥 Debug Page: Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p>Loading session information...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p className="text-gray-600 mb-6">This page helps debug authentication and admin access issues.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Session Information</h2>
          <pre className="text-sm bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-900">Profile Information</h2>
          <pre className="text-sm bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(profileInfo, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">Quick Actions:</h3>
        <div className="space-y-2">
          <button
            onClick={checkSessionAndProfile}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Refresh Session Info
          </button>
          <a
            href="/admin"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-2"
          >
            Try Admin Access
          </a>
          <a
            href="/admin/approvals"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-2"
          >
            Try Approvals Page
          </a>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Console Debug Info:</h3>
        <p className="text-sm text-gray-600">
          Check your browser's developer console (F12) for detailed debug logs from the AuthGate and admin pages.
        </p>
      </div>
    </div>
  );
}