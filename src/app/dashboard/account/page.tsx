'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
import { getUserProfile } from '@/lib/database/citizen-dashboard';
import { getUserUsageStats, getPaymentHistory } from '@/lib/database/billing';

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - in real app, get from auth context
  const userId = 'user-id-placeholder';

  useEffect(() => {
    async function loadAccountData() {
      try {
        setLoading(true);
        const [profileData, statsData, historyData] = await Promise.all([
          getUserProfile(userId),
          getUserUsageStats(userId),
          getPaymentHistory(userId)
        ]);
        setUserProfile(profileData);
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
  }, [userId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your account...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userProfile || !usageStats) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">No account data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
                <h2 className="text-xl font-semibold text-blue-900">{userProfile.name}</h2>
                <p className="text-blue-700">{userProfile.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-blue-100 text-blue-800">{userProfile.plan}</Badge>
                  {usageStats.isTrialing && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Trial: {usageStats.daysRemainingInTrial} days left
                    </Badge>
                  )}
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <Input defaultValue={userProfile.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <Input defaultValue={userProfile.email} type="email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <Input placeholder="Enter phone number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input placeholder="Enter location" />
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>Your account usage and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{usageStats.contractsUsed}</div>
                    <p className="text-sm text-gray-600">Contracts Created</p>
                    <p className="text-xs text-gray-500">This billing cycle</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {usageStats.contractsLimit ? usageStats.contractsLimit - usageStats.contractsUsed : '∞'}
                    </div>
                    <p className="text-sm text-gray-600">Contracts Remaining</p>
                    <p className="text-xs text-gray-500">This billing cycle</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{usageStats.aiQueriesUsed}</div>
                    <p className="text-sm text-gray-600">AI Queries Used</p>
                    <p className="text-xs text-gray-500">This billing cycle</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            {/* Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Current Plan & Usage
                </CardTitle>
                <CardDescription>Your subscription details and usage limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Plan Info */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{userProfile.plan}</h3>
                      <p className="text-sm text-gray-600">
                        {usageStats.isTrialing ? 'Free Trial' : 'Active Subscription'}
                      </p>
                      {usageStats.trialEndsAt && (
                        <p className="text-xs text-gray-500">
                          Trial ends: {new Date(usageStats.trialEndsAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline">Upgrade Plan</Button>
                      {!usageStats.isTrialing && (
                        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                          Cancel Plan
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Usage Bars */}
                  <div className="space-y-4">
                    {/* Contracts */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Contracts Used</span>
                        <span>
                          {usageStats.contractsUsed} / {usageStats.contractsLimit || '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: usageStats.contractsLimit 
                              ? `${Math.min((usageStats.contractsUsed / usageStats.contractsLimit) * 100, 100)}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* AI Queries */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AI Queries Used</span>
                        <span>
                          {usageStats.aiQueriesUsed} / {usageStats.aiQueriesLimit || '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: usageStats.aiQueriesLimit 
                              ? `${Math.min((usageStats.aiQueriesUsed / usageStats.aiQueriesLimit) * 100, 100)}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Document Analysis */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Documents Analyzed</span>
                        <span>
                          {usageStats.documentsAnalyzedUsed} / {usageStats.documentsAnalyzedLimit || '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: usageStats.documentsAnalyzedLimit 
                              ? `${Math.min((usageStats.documentsAnalyzedUsed / usageStats.documentsAnalyzedLimit) * 100, 100)}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {billingHistory.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{bill.description}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(bill.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold">
                            {bill.currency} {bill.amount.toLocaleString()}
                          </span>
                          <Badge className={
                            bill.status === 'succeeded' 
                              ? 'bg-green-100 text-green-800'
                              : bill.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }>
                            {bill.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No billing history yet</p>
                    <p className="text-sm text-gray-500">Your payment history will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Password & Security
                </CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Authentication</h4>
                    <p className="text-sm text-gray-600">Receive verification codes via SMS</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>Email notifications for contract signatures</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>SMS alerts for urgent actions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Marketing emails and product updates</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>AI response notifications</span>
                  </label>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Customize your app experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option>English</option>
                    <option>Swahili</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option>East Africa Time (EAT)</option>
                  </select>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}