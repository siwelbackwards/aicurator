'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      setUserEmail(user.email || '');

      // Check user status and role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_status, rejection_reason, admin_notes, role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user status:', error);
        toast.error('Error checking account status');
        return;
      }

      setUserStatus(profile.user_status);

      // Admin users can access admin areas even if pending
      if (profile.role === 'admin') {
        if (profile.user_status === 'approved') {
          toast.success('Welcome back, admin!');
          router.push('/admin');
          return;
        } else {
          // Admin is pending - show special admin message
          setUserStatus('admin_pending');
          return;
        }
      }

      // If approved, redirect to dashboard
      if (profile.user_status === 'approved') {
        toast.success('Your account has been approved! Welcome to AI Curator.');
        router.push('/dashboard');
        return;
      }

      // If rejected, show rejection page
      if (profile.user_status === 'rejected') {
        // Handle rejection case
        return;
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleRefresh = () => {
    setLoading(true);
    checkUserStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your account status...</p>
        </div>
      </div>
    );
  }

  if (userStatus === 'approved') {
    return null; // Will redirect
  }

  if (userStatus === 'admin_pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Account Pending Approval
            </CardTitle>
            <CardDescription className="text-lg">
              Your admin account is currently pending final approval.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                As an administrator, you can still access most admin functions while your account is being reviewed.
              </p>

              {userStatus === 'admin_pending' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-orange-800 font-medium mb-2">Admin Access Available:</p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• User management and approvals</li>
                    <li>• Content moderation</li>
                    <li>• System settings</li>
                    <li>• Analytics and reports</li>
                  </ul>
                </div>
              )}

              {userStatus === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Current Restrictions:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Limited access to most features</li>
                    <li>• Cannot upload or sell artworks</li>
                    <li>• Cannot browse full marketplace</li>
                    <li>• Can only view account status</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Account Details</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {userEmail}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Role:</span> Administrator
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Status:</span> Pending Final Approval
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleRefresh} variant="outline" className="flex-1">
                Check Status
              </Button>
              <Button
                onClick={() => window.location.href = '/admin'}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Access Admin Panel
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Questions? Contact the system administrator or support team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Account Not Approved</CardTitle>
            <CardDescription>
              Unfortunately, your account application was not approved at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              If you believe this is an error or would like to reapply, please contact our support team.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSignOut} variant="outline" className="flex-1">
                Sign Out
              </Button>
              <Button onClick={() => window.location.href = 'mailto:support@aicurator.com'} className="flex-1">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Account Pending Approval
          </CardTitle>
          <CardDescription className="text-lg">
            Thank you for registering with AI Curator!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your account is currently under review by our team. This process typically takes 1-2 business days.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-900">Current Access Restrictions</span>
              </div>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• You can only view this status page and the home page</p>
                <p>• Most app features are restricted until approval</p>
                <p>• You cannot upload, sell, or browse artworks</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">What happens next?</span>
              </div>
              <p className="text-sm text-blue-800">
                Once approved, you'll receive an email notification and will be able to access your account immediately.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span>Your registration information has been received</span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span>Our team is reviewing your application</span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
              <span>Waiting for final approval</span>
            </div>
          </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Account Details</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {userEmail}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Status:</span>
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  Pending Approval
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Access Level:</span>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                  Restricted
                </span>
              </p>
            </div>

          <div className="flex gap-3">
            <Button onClick={handleRefresh} variant="outline" className="flex-1">
              Check Status
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex-1">
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Questions? Contact our support team at support@aicurator.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
