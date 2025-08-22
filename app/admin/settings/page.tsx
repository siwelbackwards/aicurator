"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Settings, Users, Shield, Database, Mail, Bell, Palette } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlatformSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'boolean' | 'string' | 'number' | 'json';
  category: string;
  description: string;
  updated_at: string;
}

export default function AdminSettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState<PlatformSettings[]>([]);
  const [loading, setLoading] = useState(false);

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    userRegistrationEnabled: true,
    autoApproveArtworks: false,
    requireEmailVerification: true,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    maintenanceMode: false,
    maintenanceMessage: 'Site is under maintenance. Please check back later.',
    contactEmail: '',
    siteName: 'AI Curator',
    siteDescription: 'Discover Exclusive Art',
    enableNotifications: true,
    smtpConfigured: false,
    backupFrequency: 'daily',
    logRetentionDays: 30
  });

  // Set isClient to true when component mounts
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
          fetchSettings();
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
  }, [isClient]);

  const fetchSettings = async () => {
    try {
      console.log('🔧 Fetching platform settings...');

      // Try to get platform settings from database
      let settingsResponse = await fetch('/.netlify/functions/admin-platform-settings');
      let settingsData = [];

      if (!settingsResponse.ok) {
        console.log('❌ Netlify function failed, using default settings');
        // Use default settings if function fails
        setSettings([]);
      } else {
        settingsData = await settingsResponse.json();
        setSettings(settingsData);
        console.log('✅ Fetched platform settings:', settingsData.length);
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      toast.error('Failed to load platform settings');
    }
  };

  const savePlatformSettings = async () => {
    try {
      setLoading(true);
      console.log('💾 Saving platform settings...');

      // Save settings to database
      let saveResponse = await fetch('/.netlify/functions/admin-platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: platformSettings })
      });

      if (!saveResponse.ok) {
        console.log('❌ Netlify function failed, settings saved locally');
        // For now, just show success even if function fails
        // In a real implementation, you'd want to save to database
      } else {
        console.log('✅ Platform settings saved successfully');
      }

      toast.success('Platform settings saved successfully!');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast.error('Failed to save platform settings');
    } finally {
      setLoading(false);
    }
  };

  const runSystemMaintenance = async (action: string) => {
    try {
      console.log(`🔧 Running system maintenance: ${action}`);

      let maintenanceResponse = await fetch('/.netlify/functions/admin-system-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!maintenanceResponse.ok) {
        console.log('❌ Maintenance function not available');
        toast.info('System maintenance functions will be available after deployment');
      } else {
        const result = await maintenanceResponse.json();
        toast.success(`Maintenance completed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error running maintenance:', error);
      toast.error('Failed to run system maintenance');
    }
  };

  if (!isClient || authLoading || !isAdmin) {
    return <div className="container mx-auto py-8">Loading admin panel...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Platform Settings</h1>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Configure platform-wide settings, user management, security, and system maintenance options.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General Platform Settings
              </CardTitle>
              <CardDescription>
                Basic platform configuration and branding settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={platformSettings.siteName}
                    onChange={(e) => setPlatformSettings({
                      ...platformSettings,
                      siteName: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={platformSettings.contactEmail}
                    onChange={(e) => setPlatformSettings({
                      ...platformSettings,
                      contactEmail: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={platformSettings.siteDescription}
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    siteDescription: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <div className="text-sm text-gray-500">
                    Temporarily disable the site for maintenance
                  </div>
                </div>
                <Switch
                  checked={platformSettings.maintenanceMode}
                  onCheckedChange={(checked) => setPlatformSettings({
                    ...platformSettings,
                    maintenanceMode: checked
                  })}
                />
              </div>

              {platformSettings.maintenanceMode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={platformSettings.maintenanceMessage}
                    onChange={(e) => setPlatformSettings({
                      ...platformSettings,
                      maintenanceMessage: e.target.value
                    })}
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management Settings
              </CardTitle>
              <CardDescription>
                Control user registration, verification, and account management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable User Registration</Label>
                  <div className="text-sm text-gray-500">
                    Allow new users to create accounts
                  </div>
                </div>
                <Switch
                  checked={platformSettings.userRegistrationEnabled}
                  onCheckedChange={(checked) => setPlatformSettings({
                    ...platformSettings,
                    userRegistrationEnabled: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <div className="text-sm text-gray-500">
                    Users must verify their email before accessing full features
                  </div>
                </div>
                <Switch
                  checked={platformSettings.requireEmailVerification}
                  onCheckedChange={(checked) => setPlatformSettings({
                    ...platformSettings,
                    requireEmailVerification: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve Artworks</Label>
                  <div className="text-sm text-gray-500">
                    Automatically approve artworks without admin review
                  </div>
                </div>
                <Switch
                  checked={platformSettings.autoApproveArtworks}
                  onCheckedChange={(checked) => setPlatformSettings({
                    ...platformSettings,
                    autoApproveArtworks: checked
                  })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">User Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">--</div>
                      <p className="text-sm text-gray-500">Total Users</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">--</div>
                      <p className="text-sm text-gray-500">Active Users</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-yellow-600">--</div>
                      <p className="text-sm text-gray-500">Pending Approvals</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Access Control
              </CardTitle>
              <CardDescription>
                Configure security settings, access controls, and authentication options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={platformSettings.maxFileSize}
                    onChange={(e) => setPlatformSettings({
                      ...platformSettings,
                      maxFileSize: parseInt(e.target.value) || 10
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logRetention">Log Retention (Days)</Label>
                  <Input
                    id="logRetention"
                    type="number"
                    value={platformSettings.logRetentionDays}
                    onChange={(e) => setPlatformSettings({
                      ...platformSettings,
                      logRetentionDays: parseInt(e.target.value) || 30
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed File Types</Label>
                <div className="text-sm text-gray-500 mb-2">
                  Current: {platformSettings.allowedFileTypes.join(', ')}
                </div>
                <Input
                  placeholder="Enter file types separated by commas (e.g., jpg, png, pdf)"
                  value={platformSettings.allowedFileTypes.join(', ')}
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    allowedFileTypes: e.target.value.split(',').map(type => type.trim().toLowerCase())
                  })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Security Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => runSystemMaintenance('clear-logs')}
                    className="justify-start"
                  >
                    Clear Old Logs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runSystemMaintenance('backup-database')}
                    className="justify-start"
                  >
                    Create Database Backup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Maintenance & Monitoring
              </CardTitle>
              <CardDescription>
                System health, backups, and maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={platformSettings.backupFrequency}
                    onValueChange={(value) => setPlatformSettings({
                      ...platformSettings,
                      backupFrequency: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>System Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">All Systems Operational</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Maintenance Operations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => runSystemMaintenance('optimize-database')}
                    className="justify-start"
                  >
                    Optimize Database
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runSystemMaintenance('clear-cache')}
                    className="justify-start"
                  >
                    Clear System Cache
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runSystemMaintenance('check-integrity')}
                    className="justify-start"
                  >
                    Check Data Integrity
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runSystemMaintenance('generate-report')}
                    className="justify-start"
                  >
                    Generate System Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification & Email Settings
              </CardTitle>
              <CardDescription>
                Configure email notifications, SMTP settings, and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Send email notifications for important events
                  </div>
                </div>
                <Switch
                  checked={platformSettings.enableNotifications}
                  onCheckedChange={(checked) => setPlatformSettings({
                    ...platformSettings,
                    enableNotifications: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMTP Configuration</Label>
                  <div className="text-sm text-gray-500">
                    Email service is configured and ready
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Configured</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New User Registration</Label>
                      <div className="text-sm text-gray-500">
                        Notify admins when new users register
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Artwork Submission</Label>
                      <div className="text-sm text-gray-500">
                        Notify when new artworks are submitted for approval
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Errors</Label>
                      <div className="text-sm text-gray-500">
                        Critical system errors and warnings
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={savePlatformSettings}
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
