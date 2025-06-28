'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Edit,
  Lock,
  CreditCard,
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { useUserData } from '@/hooks/useUserData';
import { getUserUsageStats, getPaymentHistory } from '@/lib/database/billing';
import { AIPreferencesSettings } from '@/components/dashboard/AIPreferencesSettings';

export default function AccountPage() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const { profile, stats, isLoading: userDataLoading } = useUserData();
  const [usageStats, setUsageStats] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['profile', 'usage', 'security', 'preferences'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, '', `#${value}`);
  };

  useEffect(() => {
    async function loadAccountData() {
      if (!user || authLoading) return;
      
      try {
        setLoading(true);
        const [statsData, historyData] = await Promise.all([
          getUserUsageStats(user.id),
          getPaymentHistory(user.id)
        ]);
        setUsageStats(statsData);
        setBillingHistory(historyData);
      } catch (err) {
        console.error('Error loading account data:', err);
        setError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [user, authLoading]);

  if (authLoading || userDataLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No account data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-600">Manage your profile, billing, and account settings</p>
      </div>

      {/* Account Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-blue-900">{userProfile.full_name}</h2>
              <p className="text-blue-700">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {profile?.plan || 'Free Plan'}
                </Badge>
                {userProfile.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Eye className="w-4 h-4 mr-2" />
            Usage & Plan
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" id="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input defaultValue={userProfile.full_name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input defaultValue={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input defaultValue={userProfile.phone_number || ''} placeholder="Enter phone number" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input defaultValue={userProfile.location || ''} placeholder="Enter location" />
                </div>
              </div>
              <Button className="w-full md:w-auto">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage & Plan Tab */}
        <TabsContent value="usage" id="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{profile?.plan || 'Free Plan'}</h3>
                    <p className="text-sm text-gray-600">Monthly billing</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Contracts Used</span>
                      <span className="text-sm font-medium">
                        {stats?.contractsUsed || 0} / {stats?.contractsLimit || '∞'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: stats?.contractsLimit 
                            ? `${((stats?.contractsUsed || 0) / stats.contractsLimit) * 100}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Contracts</span>
                    <span className="font-medium">{stats?.totalContracts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">AI Conversations</span>
                    <span className="font-medium">{stats?.aiConversations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending Actions</span>
                    <span className="font-medium">{stats?.pendingActions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your recent payment and billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistory && billingHistory.length > 0 ? (
                <div className="space-y-3">
                  {billingHistory.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{payment.currency} {payment.amount}</p>
                        <Badge 
                          className={
                            payment.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No billing history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" id="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Change Password</h3>
                  <div className="space-y-3">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                    <Button>Update Password</Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Verification</h3>
                    <p className="text-sm text-gray-600">
                      {userProfile.is_verified ? 'Your email is verified' : 'Your email is not verified'}
                    </p>
                  </div>
                  {userProfile.is_verified ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm">
                      Verify Email
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" id="preferences" className="space-y-6">
          {/* AI Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                AI Preferences
              </CardTitle>
              <CardDescription>
                Customize how AI responds to your queries and choose your preferred models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIPreferencesSettings />
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Contract Updates</h3>
                    <p className="text-sm text-gray-600">Get notified when contracts are signed or updated</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">AI Responses</h3>
                    <p className="text-sm text-gray-600">Get notified when AI completes your requests</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Updates</h3>
                    <p className="text-sm text-gray-600">Get notified about platform updates and maintenance</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
