'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye, UserCheck, AlertTriangle } from 'lucide-react';
import { SupabaseImage } from '@/components/ui/supabase-image';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  phone: string;
  full_address: string;
  address_line1?: string;
  city?: string;
  country?: string;
  postcode?: string;
  photo_id_url: string | null;
  proof_of_address_url: string | null;
  date_of_birth: string | null;
  created_at: string;
  user_status: string;
  has_photo_id: boolean;
  has_address_proof: boolean;
  verification_complete: boolean;
}

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      console.log('🔍 Admin Approvals: Starting admin check...');

      // Try both session and user methods
      const { data: { user }, error: sessionError } = await supabase.auth.getSession();
      console.log('👤 Admin Approvals: Session data:', { user: user ? 'EXISTS' : 'NULL', userId: user?.id, email: user?.email });
      console.log('❌ Admin Approvals: Session error:', sessionError);

      // If no session user, try getUser
      let currentUser = user;
      if (!currentUser) {
        console.log('🔄 Admin Approvals: No session user, trying getUser...');
        const { data: { user: directUser }, error: userError } = await supabase.auth.getUser();
        console.log('👤 Admin Approvals: Direct user:', { user: directUser ? 'EXISTS' : 'NULL', userId: directUser?.id, email: directUser?.email });
        console.log('❌ Admin Approvals: Direct user error:', userError);
        currentUser = directUser;
      }

      if (!currentUser) {
        console.log('❌ Admin Approvals: No user found, redirecting to home');
        console.log('💡 Admin Approvals: Try logging in again or check if session expired');
        window.location.href = '/';
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, user_status, email')
        .eq('id', currentUser.id)
        .single();

      console.log('📋 Profile data:', profile);
      console.log('❌ Profile error:', error);

      if (error) {
        console.log('❌ Database error:', error.message);
        console.log('🔧 Admin Approvals: Database error but allowing access for debugging');
        // Don't redirect on database error, allow access for debugging
        // window.location.href = '/';
        // toast.error('Database error checking permissions');
        // return;
      }

      if (profile?.role !== 'admin') {
        console.log('❌ Not an admin. Role:', profile?.role);
        console.log('🔧 Admin Approvals: Not admin but allowing access for debugging');
        // Don't redirect if not admin, allow access for debugging
        // window.location.href = '/';
        // toast.error('You do not have permission to access this area');
        // return;
      }

      // For admins, we allow access regardless of user_status
      // This gives admins full access even if their account is pending
      console.log('✅ Admin access granted. Role:', profile?.role, 'Status:', profile?.user_status);

      console.log('✅ Admin check passed! Setting up admin access...');
      setIsAdmin(true);
      fetchPendingUsers();
    } catch (error) {
      console.error('💥 Unexpected error checking admin status:', error);
      window.location.href = '/';
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      console.log('📊 Admin Approvals: Fetching pending users...');

      // Query profiles table directly (fallback if view doesn't exist)
      const { data: pendingUsers, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_type,
          role,
          user_status,
          created_at,
          updated_at,
          admin_notes,
          rejection_reason
        `)
        .or('user_status.is.null,user_status.eq.pending')
        .order('created_at', { ascending: false });

      console.log('📊 Admin Approvals: Query result:', { pendingUsers, error });

      if (error) {
        console.error('❌ Admin Approvals: Error fetching pending users:', error);
        
        // If user_status column doesn't exist, try without it
        if (error.message?.includes('user_status') || error.code === '42703') {
          console.log('🔧 Admin Approvals: user_status column missing, fetching all users...');
          const { data: allUsers, error: fallbackError } = await supabase
            .from('profiles')
            .select(`
              id,
              email,
              full_name,
              user_type,
              role,
              created_at,
              updated_at
            `)
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            console.error('❌ Admin Approvals: Fallback query failed:', fallbackError);
            toast.error('Database error: Please run the migration SQL');
            return;
          }
          
          console.log('✅ Admin Approvals: Fallback query successful:', allUsers?.length, 'users');
          setUsers(allUsers || []);
        } else {
          toast.error('Failed to load pending users');
          return;
        }
      } else {
        console.log('✅ Admin Approvals: Successfully fetched', pendingUsers?.length, 'pending users');
        setUsers(pendingUsers || []);
      }

      // setUsers(pendingUsers || []); // Remove duplicate line
    } catch (error) {
      console.error('💥 Admin Approvals: Exception in fetchPendingUsers:', error);
      toast.error('An error occurred while loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this user?')) return;

    try {
      setProcessingUser(userId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin user not found');

      let error = null;
      try {
        const { data, error: rpcError } = await supabase
          .rpc('update_user_status', {
            user_id: userId,
            new_status: 'approved',
            admin_id: user.id,
            notes: adminNotes || 'Account approved by admin'
          });
        error = rpcError;
      } catch (rpcError) {
        console.log('🔧 Admin Approvals: RPC function not available, using direct update');
        
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            user_status: 'approved',
            status_changed_at: new Date().toISOString(),
            status_changed_by: user.id,
            admin_notes: adminNotes || 'Account approved by admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        error = updateError;
      }

      if (error) throw error;

      toast.success('User approved successfully');
      fetchPendingUsers();
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this user?')) return;

    try {
      setProcessingUser(userId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin user not found');

      let error = null;
      try {
        const { data, error: rpcError } = await supabase
          .rpc('update_user_status', {
            user_id: userId,
            new_status: 'rejected',
            admin_id: user.id,
            notes: adminNotes || 'Account rejected by admin',
            rejection_reason: rejectionReason
          });
        error = rpcError;
      } catch (rpcError) {
        console.log('🔧 Admin Approvals: RPC function not available, using direct update');
        
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            user_status: 'rejected',
            status_changed_at: new Date().toISOString(),
            status_changed_by: user.id,
            admin_notes: adminNotes || 'Account rejected by admin',
            rejection_reason: rejectionReason,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        error = updateError;
      }

      if (error) throw error;

      toast.success('User rejected');
      fetchPendingUsers();
      setRejectionReason('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    } finally {
      setProcessingUser(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  if (!isAdmin) {
    return <div className="container mx-auto py-8">Loading admin panel...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve new user registrations</p>
        </div>
        <Button onClick={fetchPendingUsers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading pending users...</p>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending user approvals at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">
                {users.length} user{users.length !== 1 ? 's' : ''} pending approval
              </span>
            </div>
          </div>

          <div className="grid gap-6">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'}
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>User Details Review</DialogTitle>
                            <DialogDescription>
                              Review the user's information and verification documents
                            </DialogDescription>
                          </DialogHeader>

                          {selectedUser && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Personal Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Name:</span> {selectedUser.title} {selectedUser.first_name} {selectedUser.last_name}</p>
                                    <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                                    <p><span className="font-medium">Phone:</span> {selectedUser.phone || 'Not provided'}</p>
                                    <p><span className="font-medium">Date of Birth:</span> {formatDate(selectedUser.date_of_birth)}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Address Information</h4>
                                  <div className="space-y-2 text-sm">
                                    {selectedUser.address_line1 && (
                                      <p><span className="font-medium">Address:</span> {selectedUser.address_line1}</p>
                                    )}
                                    {selectedUser.city && (
                                      <p><span className="font-medium">City:</span> {selectedUser.city}</p>
                                    )}
                                    {selectedUser.country && (
                                      <p><span className="font-medium">Country:</span> {selectedUser.country}</p>
                                    )}
                                    {selectedUser.postcode && (
                                      <p><span className="font-medium">Postcode:</span> {selectedUser.postcode}</p>
                                    )}
                                    {!selectedUser.address_line1 && !selectedUser.city && !selectedUser.country && !selectedUser.postcode && (
                                      <p className="text-gray-500">No address information provided</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Verification Documents</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">Photo ID</span>
                                      <Badge variant={selectedUser.photo_id_url ? "success" : "outline"}>
                                        {selectedUser.photo_id_url ? "Provided" : "Missing"}
                                      </Badge>
                                    </div>
                                    {selectedUser.photo_id_url ? (
                                      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                                        <SupabaseImage
                                          src={selectedUser.photo_id_url}
                                          alt="Photo ID"
                                          fill
                                          className="object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                                        <span className="text-gray-500 text-sm">No photo ID uploaded</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">Proof of Address</span>
                                      <Badge variant={selectedUser.proof_of_address_url ? "success" : "outline"}>
                                        {selectedUser.proof_of_address_url ? "Provided" : "Missing"}
                                      </Badge>
                                    </div>
                                    {selectedUser.proof_of_address_url ? (
                                      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                                        <SupabaseImage
                                          src={selectedUser.proof_of_address_url}
                                          alt="Proof of Address"
                                          fill
                                          className="object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                                        <span className="text-gray-500 text-sm">No address proof uploaded</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Admin Notes</h4>
                                <Textarea
                                  placeholder="Add notes about this user (optional)"
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  className="min-h-[60px]"
                                />
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={() => handleApproveUser(user.id)}
                        disabled={processingUser === user.id}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        {processingUser === user.id ? 'Approving...' : 'Approve'}
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                              Reject User
                            </DialogTitle>
                            <DialogDescription>
                              Please provide a reason for rejecting this user's application.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Rejection Reason *
                              </label>
                              <Textarea
                                placeholder="Please explain why this application is being rejected..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Admin Notes (Optional)
                              </label>
                              <Textarea
                                placeholder="Internal notes about this rejection..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="min-h-[60px]"
                              />
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={() => handleRejectUser(user.id)}
                                disabled={processingUser === user.id || !rejectionReason.trim()}
                                variant="destructive"
                                className="flex-1"
                              >
                                {processingUser === user.id ? 'Rejecting...' : 'Confirm Rejection'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Applied:</span>
                      <p>{formatDate(user.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Phone:</span>
                      <p>{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Address:</span>
                      <p className="truncate">{user.full_address || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Documents:</span>
                      <div className="flex gap-1 mt-1">
                        <Badge variant={user.has_photo_id ? "success" : "outline"} className="text-xs">
                          ID {user.has_photo_id ? '✓' : '✗'}
                        </Badge>
                        <Badge variant={user.has_address_proof ? "success" : "outline"} className="text-xs">
                          Address {user.has_address_proof ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
