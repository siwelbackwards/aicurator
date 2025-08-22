'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useDataContext } from '@/lib/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { Users, Paintbrush, Clock, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { adminStats, isLoading, error, refreshAdminStats } = useDataContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Admin check
  useEffect(() => {
    if (!isClient) return;
    
    const abortController = new AbortController();
    
    const checkAdminStatus = async () => {
      try {
        if (abortController.signal.aborted) return;
        
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (!session) {
          if (!abortController.signal.aborted) {
            window.location.href = '/';
          }
          return;
        }

        if (abortController.signal.aborted) return;

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role !== 'admin') {
          if (!abortController.signal.aborted) {
            window.location.href = '/';
            toast.error('You do not have permission to access the admin area');
          }
          return;
        }

        if (!abortController.signal.aborted) {
          setIsAdmin(true);
          setAuthLoading(false);
          // Refresh stats if we don't have them or they're stale
          if (!adminStats) {
            refreshAdminStats();
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error checking admin status:', error);
          window.location.href = '/';
        }
      }
    };

    checkAdminStatus();
    
    return () => {
      abortController.abort();
    };
  }, [isClient, adminStats, refreshAdminStats]);

  if (!isClient || authLoading || !isAdmin) {
    return <div className="container mx-auto py-8">Loading admin panel...</div>;
  }

  const stats = adminStats || {
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalArtworks: 0,
    pendingArtworks: 0,
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error loading dashboard data: {error}</p>
          <button 
            onClick={refreshAdminStats}
            className="mt-2 text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/users">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? '...' : `${stats.totalBuyers} buyers, ${stats.totalSellers} sellers`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/artworks">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Artworks</CardTitle>
              <Paintbrush className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.totalArtworks}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/artworks?tab=pending">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.pendingArtworks}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Artworks awaiting review
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users?tab=verified">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                --
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Users with completed verification
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link 
              href="/admin/artworks?tab=pending" 
              className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="font-medium">Review Pending Artworks</div>
              <div className="text-sm text-gray-600">
                {isLoading ? 'Loading...' : `${stats.pendingArtworks} items awaiting approval`}
              </div>
            </Link>
            
            <Link 
              href="/admin/users" 
              className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="font-medium">Manage Users</div>
              <div className="text-sm text-gray-600">
                View and manage user accounts
              </div>
            </Link>
            
            <Link
              href="/admin/future-masters-artists"
              className="block p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="font-medium">Future Masters Artists</div>
              <div className="text-sm text-gray-600">
                Manage artists shown on Future Masters page
              </div>
            </Link>

            <Link
              href="/admin/trending-products"
              className="block p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="font-medium">Trending Products</div>
              <div className="text-sm text-gray-600">
                Manage homepage trending products
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="font-medium">Platform Settings</div>
              <div className="text-sm text-gray-600">
                Configure system settings and platform options
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest platform activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">New user registrations</span>
                <span className="text-sm font-medium">
                  {isLoading ? '...' : stats.totalUsers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Artworks submitted</span>
                <span className="text-sm font-medium">
                  {isLoading ? '...' : stats.totalArtworks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending reviews</span>
                <span className="text-sm font-medium">
                  {isLoading ? '...' : stats.pendingArtworks}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 