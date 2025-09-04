'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  user_type: string;
  role: string;
  phone: string;
  full_address: string;
  photo_id_url: string | null;
  proof_of_address_url: string | null;
  date_of_birth: string | null;
  is_mobile: boolean;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  interested_categories: string[];
  // User preferences (may be null)
  preferences?: {
    previously_transacted: boolean;
    communication_preference: boolean;
    collection_description: string;
    wishlist: string;
    collection_interests: string;
    budget_range: string;
    experience_level: string;
    preferred_art_periods: string;
  };
  // User settings
  settings?: {
    notifications: {
      email: boolean;
      updates: boolean;
      marketing: boolean;
    };
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);
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
          .select('role, user_status')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role !== 'admin') {
          window.location.href = '/';
          toast.error('You do not have permission to access the admin area');
          return;
        }

        // For admins, we allow access regardless of user_status

        setIsAdmin(true);
        setInitialized(true);
        fetchUsers('all');
      } catch (error) {
        console.error('Error checking admin status:', error);
        window.location.href = '/';
      }
    };

    checkAdminStatus();
  }, [isClient]);

  const fetchUsers = async (userType = 'all') => {
    if (!initialized) return;
    
    setLoading(true);
    try {
      // Build the query based on the selected tab
      let query = supabase.from('profiles').select('*');
      
      if (userType !== 'all') {
        query = query.eq('user_type', userType);
      }
      
      // Execute the query
      const { data: usersData, error } = await query;
      
      if (error) throw error;
      
      if (!usersData || usersData.length === 0) {
        setUsers([]);
        return;
      }
      
      // Get user IDs for preferences and settings lookup
      const userIds = usersData.map(user => user.id);
      
      // Fetch user preferences if available
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .in('user_id', userIds);
        
      if (preferencesError) {
        console.error('Error fetching user preferences:', preferencesError);
      }
      
      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .in('user_id', userIds);
        
      if (settingsError) {
        console.error('Error fetching user settings:', settingsError);
      }
      
      // Create lookup maps
      const preferencesMap = (preferencesData || []).reduce((acc, pref) => {
        acc[pref.user_id] = pref;
        return acc;
      }, {});
      
      const settingsMap = (settingsData || []).reduce((acc, setting) => {
        acc[setting.user_id] = setting;
        return acc;
      }, {});
      
      // Combine the data
      const usersWithExtras = usersData.map(user => ({
        ...user,
        preferences: preferencesMap[user.id] || null,
        settings: settingsMap[user.id] || null
      }));
      
      setUsers(usersWithExtras);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  if (!isClient || !initialized) {
    return <div className="container mx-auto py-8">Loading admin panel...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      <div className="flex justify-between items-center mb-6">
        <Tabs value={currentTab} onValueChange={(value) => { setCurrentTab(value); fetchUsers(value); }} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="buyer">Buyers</TabsTrigger>
            <TabsTrigger value="seller">Sellers</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          onClick={() => fetchUsers(currentTab)} 
          disabled={loading}
          variant="outline"
          className="ml-4"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">
          {currentTab === 'all' ? 'All Users' : 
           currentTab === 'buyer' ? 'Buyers' : 'Sellers'} ({users.length})
        </h2>
        
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`}
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                        {user.role || 'user'}
                      </Badge>
                      <Badge variant="secondary">
                        {user.user_type || 'unknown'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  
                  {user.avatar_url && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <SupabaseImage
                        src={user.avatar_url}
                        alt={user.full_name || 'User avatar'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm">Contact Information</h3>
                      <p className="text-sm">Phone: {user.phone || 'Not provided'}</p>
                      <p className="text-sm">Address: {user.full_address || 'Not provided'}</p>
                      <p className="text-sm">Date of Birth: {formatDate(user.date_of_birth)}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm">Account Details</h3>
                      <p className="text-sm">Created: {formatDate(user.created_at)}</p>
                      <p className="text-sm">Last Updated: {formatDate(user.updated_at)}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">ID Verification</p>
                        <div className="flex gap-2">
                          <Badge variant={user.photo_id_url ? "success" : "outline"}>
                            {user.photo_id_url ? "ID Provided" : "No ID"}
                          </Badge>
                          <Badge variant={user.proof_of_address_url ? "success" : "outline"}>
                            {user.proof_of_address_url ? "Address Proof Provided" : "No Address Proof"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {user.interested_categories && user.interested_categories.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm">Interests</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.interested_categories.map(category => (
                            <Badge key={category} variant="secondary">{category}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {user.preferences && (
                      <div>
                        <h3 className="font-medium text-sm">Preferences</h3>
                        <p className="text-sm">
                          Previously Transacted: {user.preferences.previously_transacted ? 'Yes' : 'No'}
                        </p>
                        {user.preferences.collection_description && (
                          <p className="text-sm">Collection: {user.preferences.collection_description}</p>
                        )}
                        {user.preferences.budget_range && (
                          <p className="text-sm">Budget Range: {user.preferences.budget_range}</p>
                        )}
                        {user.preferences.experience_level && (
                          <p className="text-sm">Experience: {user.preferences.experience_level}</p>
                        )}
                      </div>
                    )}
                    
                    {user.settings && (
                      <div>
                        <h3 className="font-medium text-sm">Notification Settings</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={user.settings.notifications?.email ? "default" : "outline"}>
                            Email: {user.settings.notifications?.email ? "On" : "Off"}
                          </Badge>
                          <Badge variant={user.settings.notifications?.updates ? "default" : "outline"}>
                            Updates: {user.settings.notifications?.updates ? "On" : "Off"}
                          </Badge>
                          <Badge variant={user.settings.notifications?.marketing ? "default" : "outline"}>
                            Marketing: {user.settings.notifications?.marketing ? "On" : "Off"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs">
                      View Verification Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 