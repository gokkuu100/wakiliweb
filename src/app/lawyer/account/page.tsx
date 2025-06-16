'use client';

import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Edit,
  Scale,
  CreditCard,
  Shield,
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Lock,
  Eye,
  Download,
  CheckCircle
} from 'lucide-react';

export default function LawyerAccountPage() {
  const lawyerProfile = {
    name: 'Sarah Mwangi',
    email: 'sarah.mwangi@mwangilaw.co.ke',
    phone: '+254 722 123 456',
    location: 'Nairobi, Kenya',
    joinDate: '2023-08-15',
    plan: 'Legal Professional',
    planPrice: 'KSh 8,500/month',
    firmName: 'Mwangi & Associates',
    barNumber: 'LSK/ADV/12345',
    yearsExperience: 15,
    practiceAreas: ['Corporate Law', 'Contract Law', 'Employment Law', 'Intellectual Property'],
    education: 'LLB University of Nairobi, LLM Harvard Law School',
    isVerified: true,
    nextBilling: '2024-02-15'
  };

  const usageStats = {
    queriesUsed: 156,
    queriesLimit: null, // unlimited
    documentsAnalyzed: 45,
    researchHours: 28.5,
    clientCollaborations: 12
  };

  const billingHistory = [
    {
      id: 1,
      date: '2024-01-15',
      amount: 'KSh 8,500',
      status: 'paid',
      description: 'Legal Professional Plan - January 2024'
    },
    {
      id: 2,
      date: '2023-12-15',
      amount: 'KSh 8,500',
      status: 'paid',
      description: 'Legal Professional Plan - December 2023'
    },
    {
      id: 3,
      date: '2023-11-15',
      amount: 'KSh 8,500',
      status: 'paid',
      description: 'Legal Professional Plan - November 2023'
    }
  ];

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600">Manage your professional profile, practice details, and account settings</p>
        </div>

        {/* Account Overview */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-semibold text-indigo-900">{lawyerProfile.name}</h2>
                  {lawyerProfile.isVerified && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <p className="text-indigo-700">{lawyerProfile.email}</p>
                <p className="text-sm text-indigo-600">{lawyerProfile.firmName}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-indigo-100 text-indigo-800">{lawyerProfile.plan}</Badge>
                  <span className="text-sm text-indigo-600">
                    Member since {new Date(lawyerProfile.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
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
            <TabsTrigger value="practice">Practice Details</TabsTrigger>
            <TabsTrigger value="billing">Billing & Plan</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
                    <Input defaultValue={lawyerProfile.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <Input defaultValue={lawyerProfile.email} type="email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <Input defaultValue={lawyerProfile.phone} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input defaultValue={lawyerProfile.location} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
                  <Textarea 
                    placeholder="Brief description of your legal practice and expertise..."
                    className="min-h-[100px]"
                  />
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Your account activity and AI usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{usageStats.queriesUsed}</div>
                    <p className="text-sm text-gray-600">AI Queries</p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{usageStats.documentsAnalyzed}</div>
                    <p className="text-sm text-gray-600">Documents Analyzed</p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{usageStats.researchHours}h</div>
                    <p className="text-sm text-gray-600">Research Time</p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{usageStats.clientCollaborations}</div>
                    <p className="text-sm text-gray-600">Client Projects</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 h-5 w-5" />
                  Practice Information
                </CardTitle>
                <CardDescription>Manage your legal practice details and credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Firm Name</label>
                    <Input defaultValue={lawyerProfile.firmName} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bar Number</label>
                    <Input defaultValue={lawyerProfile.barNumber} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <Input defaultValue={lawyerProfile.yearsExperience} type="number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <Input defaultValue={lawyerProfile.education} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Practice Areas</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {lawyerProfile.practiceAreas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <Input placeholder="Add new practice area..." />
                </div>

                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Update Practice Details
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Professional Verification
                </CardTitle>
                <CardDescription>Your verification status and credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">Verified Legal Professional</h4>
                      <p className="text-sm text-green-700">Your credentials have been verified</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{lawyerProfile.plan}</h3>
                    <p className="text-sm text-gray-600">{lawyerProfile.planPrice}</p>
                    <p className="text-xs text-gray-500">
                      Next billing: {new Date(lawyerProfile.nextBilling).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="text-green-600">✓ Unlimited AI queries</span>
                      <span className="text-green-600">✓ Document analysis</span>
                      <span className="text-green-600">✓ Priority support</span>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline">Manage Plan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingHistory.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{bill.description}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(bill.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{bill.amount}</span>
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <Button className="bg-indigo-600 hover:bg-indigo-700">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>Allow profile to be visible in lawyer directory</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>Enable client referrals through platform</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Share anonymized usage data for platform improvement</span>
                  </label>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LawyerDashboardLayout>
  );
}