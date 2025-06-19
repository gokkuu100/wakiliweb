'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  getDashboardStats, 
  getRecentContracts, 
  getRecentChats, 
  getPendingActions, 
  getUserProfile 
} from '@/lib/database/citizen-dashboard';
import { useAuth } from '@/hooks/useAuthContext';

interface DashboardData {
  stats: any;
  recentContracts: any[];
  recentChats: any[];
  pendingActions: any[];
  userProfile: any;
}

function DashboardPage() {
  const { user, userProfile: authProfile, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || authLoading) return;
      
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [stats, recentContracts, recentChats, pendingActions, userProfileData] = await Promise.all([
          getDashboardStats(user.id),
          getRecentContracts(user.id, 3),
          getRecentChats(user.id, 2),
          getPendingActions(user.id),
          getUserProfile(user.id)
        ]);

        setDashboardData({
          stats,
          recentContracts,
          recentChats,
          pendingActions,
          userProfile: userProfileData
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800">Signed</Badge>;
      case 'pending_signature':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Signature</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your dashboard...</p>
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

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, recentContracts, recentChats, pendingActions, userProfile } = dashboardData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {userProfile?.name || authProfile?.full_name}!</h1>
          <p className="text-blue-100 mb-4">
            You're on the {userProfile?.plan}. You've used {userProfile?.contractsUsed} of {(userProfile?.contractsRemaining || 0) + (userProfile?.contractsUsed || 0)} contracts this month.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              <FileText className="mr-2 h-4 w-4" />
              Create New Contract
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask Legal Question
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingActions}</div>
              <p className="text-xs text-muted-foreground">
                Require your attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.aiConversations}</div>
              <p className="text-xs text-muted-foreground">
                Total conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contracts Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contractsRemaining}</div>
              <p className="text-xs text-muted-foreground">
                This billing cycle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contracts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Contracts</CardTitle>
                  <CardDescription>Your latest contract activity</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentContracts.length > 0 ? (
                recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium">{contract.title}</h4>
                      <p className="text-sm text-gray-600">
                        {contract.parties.join(' • ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(contract.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(contract.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No contracts yet</p>
                  <Button className="mt-2" size="sm">
                    Create Your First Contract
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-orange-600" />
                Pending Actions
              </CardTitle>
              <CardDescription>Items that need your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingActions.length > 0 ? (
                pendingActions.slice(0, 3).map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900">{action.title}</h4>
                      <p className="text-sm text-orange-700">
                        {new Date(action.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Take Action
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-600">All caught up!</p>
                  <p className="text-sm text-gray-500">No pending actions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent AI Chats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent AI Conversations</CardTitle>
                  <CardDescription>Your latest legal questions</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentChats.length > 0 ? (
                recentChats.map((chat) => (
                  <div key={chat.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <h4 className="font-medium">{chat.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{chat.preview}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(chat.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No conversations yet</p>
                  <Button className="mt-2" size="sm">
                    Ask Your First Question
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Create Employment Contract
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Create NDA
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask About Contract Terms
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Find a Lawyer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Usage Progress */}
        {stats.contractsLimit && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">📊 Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Contracts Used</span>
                    <span>{stats.contractsUsed} / {stats.contractsLimit}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.contractsUsed / stats.contractsLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-blue-700 text-sm">
                  You have {stats.contractsRemaining} contracts remaining this billing cycle.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal Tip */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">💡 Legal Tip of the Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              Always ensure that both parties fully understand the terms of a contract before signing. 
              Use our AI assistant to clarify any legal terms you're unsure about.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Wrap the component with AuthGuard
function DashboardPageWithAuth() {
  return (
    <AuthGuard requiredUserType="citizen" requireVerification={true}>
      <DashboardPage />
    </AuthGuard>
  );
}

export default DashboardPageWithAuth;