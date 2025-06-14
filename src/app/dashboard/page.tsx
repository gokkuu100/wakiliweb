'use client';

import { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const [user] = useState({
    name: 'John Doe',
    plan: 'Individual Plan',
    contractsThisMonth: 3,
    contractsRemaining: 2
  });

  const recentContracts = [
    {
      id: 1,
      title: 'Non-Disclosure Agreement',
      status: 'signed',
      date: '2024-01-15',
      parties: ['John Doe', 'Tech Solutions Ltd']
    },
    {
      id: 2,
      title: 'Service Agreement',
      status: 'pending_signature',
      date: '2024-01-14',
      parties: ['John Doe', 'Marketing Agency']
    },
    {
      id: 3,
      title: 'Employment Contract',
      status: 'draft',
      date: '2024-01-13',
      parties: ['John Doe']
    }
  ];

  const recentChats = [
    {
      id: 1,
      title: 'Employment law in Kenya',
      date: '2024-01-15',
      preview: 'What are the notice periods for...'
    },
    {
      id: 2,
      title: 'Contract termination clauses',
      date: '2024-01-14',
      preview: 'How to properly terminate a...'
    }
  ];

  const pendingActions = [
    {
      id: 1,
      type: 'signature',
      title: 'Service Agreement needs your signature',
      date: '2024-01-14'
    },
    {
      id: 2,
      type: 'response',
      title: 'AI response ready for your legal question',
      date: '2024-01-15'
    }
  ];

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <p className="text-blue-100 mb-4">
            You're on the {user.plan}. You've used {user.contractsThisMonth} of 5 contracts this month.
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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +3 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
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
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contracts Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.contractsRemaining}</div>
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
              {recentContracts.map((contract) => (
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
              ))}
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
              {pendingActions.map((action) => (
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
              ))}
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
              {recentChats.map((chat) => (
                <div key={chat.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <h4 className="font-medium">{chat.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{chat.preview}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(chat.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
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
  );
}