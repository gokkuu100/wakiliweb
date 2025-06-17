'use client';

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
  Bell,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAuth, useDashboardStats } from '@/hooks/useDatabase';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const { 
    totalContracts,
    pendingSignatureContracts,
    signedContracts,
    draftContracts,
    totalDocuments,
    unreadNotifications,
    recentContracts,
    recentNotifications,
    recentActivity,
    isLoading, 
    error,
    subscriptionStatus,
    // Access lawyer-specific stats if needed
    totalCases,
    activeCases,
    clientCount
  } = useDashboardStats();

  return (
    <AuthGuard>
      <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {userProfile && userProfile.full_name ? userProfile.full_name : (user?.user_metadata?.full_name || 'User')}!</h1>
          <p className="text-blue-100 mb-4">
            You're on the {subscriptionStatus?.subscription_plans?.name || 'Free'} Plan.
            {userProfile?.user_type === 'lawyer' && <span className="ml-2 font-semibold">• Lawyer Account</span>}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : totalContracts || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : pendingSignatureContracts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Require action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signed Contracts</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : signedContracts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : unreadNotifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                Unread messages
              </p>
            </CardContent>
          </Card>
          
          {/* Additional stats based on user type */}
          {userProfile?.user_type === 'lawyer' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? '...' : totalCases || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? '...' : activeCases || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    In progress
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? '...' : clientCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Unique clients
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Show documents for all users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : totalDocuments || 0}</div>
              <p className="text-xs text-muted-foreground">
                In your vault
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contracts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Contracts</CardTitle>
              <CardDescription>Your latest contract activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentContracts?.length > 0 ? (
                    recentContracts.map((contract: any) => (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <h4 className="font-semibold">{contract.title}</h4>
                            <p className="text-sm text-gray-600">{contract.type || "Contract"}</p>
                            <p className="text-xs text-gray-500">
                              Parties: {contract.contract_parties?.map((p: any) => p.name).join(', ') || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={
                              contract.status === 'signed' 
                                ? 'bg-green-100 text-green-800' 
                                : contract.status === 'pending_signature'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {contract.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(contract.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No contracts yet. Create your first contract to get started!
                    </div>
                  )}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4">
                <ArrowRight className="mr-2 h-4 w-4" />
                View All Contracts
              </Button>
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
              {/*{pendingActions.map((action) => (*/}
              {/*  <div key={action.id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">*/}
              {/*    <div className="flex-1">*/}
              {/*      <h4 className="font-medium text-orange-900">{action.title}</h4>*/}
              {/*      <p className="text-sm text-orange-700">*/}
              {/*        {new Date(action.date).toLocaleDateString()}*/}
              {/*      </p>*/}
              {/*    </div>*/}
              {/*    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">*/}
              {/*      Take Action*/}
              {/*    </Button>*/}
              {/*  </div>*/}
              {/*))}*/}
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
              {/*{recentChats.map((chat) => (*/}
              {/*  <div key={chat.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">*/}
              {/*    <h4 className="font-medium">{chat.title}</h4>*/}
              {/*    <p className="text-sm text-gray-600 mt-1">{chat.preview}</p>*/}
              {/*    <p className="text-xs text-gray-500 mt-2">*/}
              {/*      {new Date(chat.date).toLocaleDateString()}*/}
              {/*    </p>*/}
              {/*  </div>*/}
              {/*))}*/}
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

        {/* Upcoming Features or Tips */}
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
    </AuthGuard>
  );
}