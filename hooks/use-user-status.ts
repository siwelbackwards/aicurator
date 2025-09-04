import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export interface UserStatus {
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  changedAt: string | null;
  changedBy: string | null;
  notes: string | null;
  rejectionReason: string | null;
}

export function useUserStatus(userId?: string) {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkUserStatus = async (targetUserId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const idToCheck = targetUserId || userId;
      if (!idToCheck) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('No user found');
          return null;
        }
        targetUserId = user.id;
      }

      const { data, error: statusError } = await supabase
        .rpc('get_user_status', { user_id: targetUserId });

      if (statusError) {
        console.error('Error fetching user status:', statusError);
        setError(statusError.message);
        return null;
      }

      if (data && data.length > 0) {
        const statusData = data[0];
        const userStatus: UserStatus = {
          status: statusData.status,
          changedAt: statusData.changed_at,
          changedBy: statusData.changed_by,
          notes: statusData.notes,
          rejectionReason: statusData.rejection_reason
        };

        setStatus(userStatus);
        return userStatus;
      } else {
        setError('No status data found');
        return null;
      }
    } catch (err) {
      console.error('Error in checkUserStatus:', err);
      setError('Failed to check user status');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnStatus = (userStatus: UserStatus) => {
    const currentPath = window.location.pathname;

    if (userStatus.status === 'pending' && !currentPath.includes('/auth/pending-approval')) {
      router.push('/auth/pending-approval');
      return true;
    }

    if (userStatus.status === 'rejected' && !currentPath.includes('/auth/pending-approval')) {
      router.push('/auth/pending-approval');
      return true;
    }

    if (userStatus.status === 'approved') {
      // Allow access to approved users
      return false;
    }

    // Unknown status, redirect to pending
    if (!currentPath.includes('/auth/pending-approval')) {
      router.push('/auth/pending-approval');
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (userId) {
      checkUserStatus(userId);
    }
  }, [userId]);

  return {
    status,
    loading,
    error,
    checkUserStatus,
    redirectBasedOnStatus,
    refetch: () => checkUserStatus(userId)
  };
}
