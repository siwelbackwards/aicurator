'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { Users, Paintbrush, Clock, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalArtworks: 0,
    pendingArtworks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Admin check
  useEffect(() => {
    if (!isClient) return;
    
    const checkAdminStatus = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (!session) {
          window.location.href = '/';
          return;
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role !== 'admin') {
          window.location.href = '/';
          toast.error('You do not have permission to access the admin area');
          return;
        }

        setIsAdmin(true);
        fetchStats();
      } catch (error) {
        console.error('Error checking admin status:', error);
        window.location.href = '/';
      }
    };

    checkAdminStatus();
  }, [isClient]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;
      
      // Fetch buyers count
      const { count: totalBuyers, error: buyersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'buyer');
      
      if (buyersError) throw buyersError;
      
      // Fetch sellers count
      const { count: totalSellers, error: sellersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'seller');
      
      if (sellersError) throw sellersError;
      
      // Fetch total artworks count
      const { count: totalArtworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true });
      
      if (artworksError) throw artworksError;
      
      // Fetch pending artworks count
      const { count: pendingArtworks, error: pendingError } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (pendingError) throw pendingError;
      
      setStats({
        totalUsers: totalUsers || 0,
        totalBuyers: totalBuyers || 0,
        totalSellers: totalSellers || 0,
        totalArtworks: totalArtworks || 0,
        pendingArtworks: pendingArtworks || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || !isAdmin) {
    return <div className="container mx-auto py-8">Loading admin panel...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/users">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? '...' : `${stats.totalBuyers} buyers, ${stats.totalSellers} sellers`}
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
                {loading ? '...' : stats.totalArtworks}
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
                {loading ? '...' : stats.pendingArtworks}
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity tracking coming soon...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/artworks" className="block text-sm text-blue-600 hover:underline">
              Manage artwork listings
            </Link>
            <Link href="/admin/users" className="block text-sm text-blue-600 hover:underline">
              View user accounts
            </Link>
            <Link href="/admin/users?tab=verified" className="block text-sm text-blue-600 hover:underline">
              Review verification documents
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 