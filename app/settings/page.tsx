"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
    updates: true
  });

  const handleNotificationChange = async (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications: notifications,
          updated_at: new Date()
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
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
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}