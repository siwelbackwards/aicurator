"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AvatarUpload from '@/components/profile/avatar-upload';

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
    updates: true
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist yet, create a new one
            console.log('Profile not found, creating a new one...');
            await createInitialProfile(user.id, user.email);
            return;
          }
          throw error;
        }
        
        setProfile(data);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const createInitialProfile = async (userId: string, email?: string) => {
      try {
        const newProfile = {
          id: userId,
          full_name: '',
          email: email || '',
          avatar_url: null,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('profiles')
          .insert(newProfile);
        
        if (error) throw error;
        
        setProfile(newProfile as Profile);
      } catch (error) {
        console.error('Error creating initial profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        throw new Error('No user found');
      }

      const updates = {
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      
      setProfile(prev => ({
        ...prev!,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: updates.updated_at
      }));
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUploaded = (url: string) => {
    setAvatarUrl(url);
  };

  const handleSaveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First check if user settings already exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications: notifications,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile details and avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    {userId && (
                      <AvatarUpload
                        userId={userId}
                        url={avatarUrl}
                        onUpload={handleAvatarUploaded}
                        size={150}
                      />
                    )}
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleProfileUpdate} 
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <div className="text-sm text-gray-500">
                      Receive notifications about your account activity
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationChange('email')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Communications</Label>
                    <div className="text-sm text-gray-500">
                      Receive updates about new features and promotions
                    </div>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={() => handleNotificationChange('marketing')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Product Updates</Label>
                    <div className="text-sm text-gray-500">
                      Get notified about new items matching your interests
                    </div>
                  </div>
                  <Switch
                    checked={notifications.updates}
                    onCheckedChange={() => handleNotificationChange('updates')}
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSaveSettings} className="w-full">
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}