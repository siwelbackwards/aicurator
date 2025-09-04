'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DatabaseInfo {
  hasUserStatusColumn: boolean;
  hasAdminNotesColumn: boolean;
  hasRejectionReasonColumn: boolean;
  totalUsers: number;
  adminUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  error?: string;
}

export default function DatabaseStatusPage() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      setLoading(true);
      console.log('🔍 DB Status: Checking database status...');

      const info: DatabaseInfo = {
        hasUserStatusColumn: false,
        hasAdminNotesColumn: false,
        hasRejectionReasonColumn: false,
        totalUsers: 0,
        adminUsers: 0,
        pendingUsers: 0,
        approvedUsers: 0,
        rejectedUsers: 0
      };

      // Check if columns exist by trying to query them
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, user_status, admin_notes, rejection_reason')
          .limit(1);

        if (!error) {
          info.hasUserStatusColumn = true;
          info.hasAdminNotesColumn = true;
          info.hasRejectionReasonColumn = true;
        }
      } catch (error) {
        console.log('🔍 DB Status: Some columns missing, checking individually...');
      }

      // Get basic user counts
      try {
        const { data: allUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, role, user_status');

        if (!usersError && allUsers) {
          info.totalUsers = allUsers.length;
          info.adminUsers = allUsers.filter(u => u.role === 'admin').length;
          
          if (info.hasUserStatusColumn) {
            info.pendingUsers = allUsers.filter(u => u.user_status === 'pending' || u.user_status === null).length;
            info.approvedUsers = allUsers.filter(u => u.user_status === 'approved').length;
            info.rejectedUsers = allUsers.filter(u => u.user_status === 'rejected').length;
          }
        }
      } catch (error) {
        console.error('🔍 DB Status: Error getting user counts:', error);
        info.error = 'Error getting user counts';
      }

      setDbInfo(info);
    } catch (error) {
      console.error('🔍 DB Status: Error checking database:', error);
      setDbInfo({
        hasUserStatusColumn: false,
        hasAdminNotesColumn: false,
        hasRejectionReasonColumn: false,
        totalUsers: 0,
        adminUsers: 0,
        pendingUsers: 0,
        approvedUsers: 0,
        rejectedUsers: 0,
        error: 'Failed to check database status'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Database Status</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p>Checking database status...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Database Status</h1>
      <p className="text-gray-600 mb-6">This page shows the current state of your database schema and data.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schema Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>user_status column:</span>
              <span className={dbInfo?.hasUserStatusColumn ? 'text-green-600' : 'text-red-600'}>
                {dbInfo?.hasUserStatusColumn ? '✅ Exists' : '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>admin_notes column:</span>
              <span className={dbInfo?.hasAdminNotesColumn ? 'text-green-600' : 'text-red-600'}>
                {dbInfo?.hasAdminNotesColumn ? '✅ Exists' : '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>rejection_reason column:</span>
              <span className={dbInfo?.hasRejectionReasonColumn ? 'text-green-600' : 'text-red-600'}>
                {dbInfo?.hasRejectionReasonColumn ? '✅ Exists' : '❌ Missing'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Total Users:</span>
              <span className="font-semibold">{dbInfo?.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Admin Users:</span>
              <span className="font-semibold text-blue-600">{dbInfo?.adminUsers}</span>
            </div>
            {dbInfo?.hasUserStatusColumn && (
              <>
                <div className="flex justify-between items-center">
                  <span>Pending Users:</span>
                  <span className="font-semibold text-yellow-600">{dbInfo?.pendingUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Approved Users:</span>
                  <span className="font-semibold text-green-600">{dbInfo?.approvedUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rejected Users:</span>
                  <span className="font-semibold text-red-600">{dbInfo?.rejectedUsers}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {dbInfo?.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-2">Error:</h3>
          <p className="text-red-800">{dbInfo.error}</p>
        </div>
      )}

      {!dbInfo?.hasUserStatusColumn && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Missing Columns Detected</h3>
          <p className="text-yellow-800 mb-4">
            The user approval system requires additional database columns. 
            Run the SQL script below in your Supabase SQL Editor to add them.
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
            <div className="mb-2 text-gray-400">-- Copy this SQL and run it in Supabase SQL Editor</div>
            <div>ALTER TABLE public.profiles ADD COLUMN user_status TEXT DEFAULT 'pending';</div>
            <div>ALTER TABLE public.profiles ADD COLUMN admin_notes TEXT;</div>
            <div>ALTER TABLE public.profiles ADD COLUMN rejection_reason TEXT;</div>
            <div>UPDATE public.profiles SET user_status = 'approved' WHERE role = 'admin';</div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Quick Actions:</h3>
        <div className="space-y-2">
          <Button
            onClick={checkDatabaseStatus}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Refresh Status
          </Button>
          <a
            href="/admin/approvals"
            className="inline-block ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Approvals
          </a>
          <a
            href="/test-auth"
            className="inline-block ml-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Test Auth
          </a>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Console Debug:</h3>
        <p className="text-sm text-gray-600">
          Check your browser console (F12) for detailed database query logs and errors.
        </p>
      </div>
    </div>
  );
}
