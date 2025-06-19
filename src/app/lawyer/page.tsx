'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
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
  Scale,
  BookOpen,
  Search,
  Upload
} from 'lucide-react';

export default function LawyerDashboardPageWithAuth() {
  return (
    <AuthGuard requiredUserType="lawyer" requireVerification={true}>
      <LawyerDashboardPage />
    </AuthGuard>
  );
}

function LawyerDashboardPage() {
  const [lawyer] = useState({
    name: 'Sarah Mwangi',
    firm: 'Mwangi & Associates',
    plan: 'Legal Professional',
    activeCases: 12,
    documentsAnalyzed: 45,
    researchQueries: 28
  });

  const recentCases = [
    {
      id: 1,
      title: 'Corporate Merger - TechCorp Ltd',
      client: 'TechCorp Limited',
      status: 'active',
      lastActivity: '2024-01-15',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Employment Dispute - Jane Doe',
      client: 'Jane Doe',
      status: 'review',
      lastActivity: '2024-01-14',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Property Transaction - Westlands',
      client: 'Property Investors Ltd',
      status: 'completed',
      lastActivity: '2024-01-13',
      priority: 'low'
    }
  ];

  const recentDocuments = [
    {
      id: 1,
      name: 'Merger Agreement Draft.pdf',
      type: 'Contract Analysis',
      uploadDate: '2024-01-15',
      status: 'analyzed'
    },
    {
      id: 2,
      name: 'Employment Contract Review.docx',
      type: 'Document Review',
      uploadDate: '2024-01-14',
      status: 'processing'
    }
  ];

  const pendingActions = [
    {
      id: 1,
      type: 'client_contract',
      title: 'New contract from TechCorp needs review',
      date: '2024-01-15'
    },
    {
      id: 2,
      type: 'research_ready',
      title: 'Legal research on employment law completed',
      date: '2024-01-15'
    },
    {
      id: 3,
      type: 'document_analysis',
      title: 'Document analysis report ready for review',
      date: '2024-01-14'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {lawyer.name}!</h1>
          <p className="text-indigo-100 mb-4">
            {lawyer.firm} • {lawyer.plan} Plan • {lawyer.activeCases} active cases
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-white text-indigo-600 hover:bg-gray-100">
              <Upload className="mr-2 h-4 w-4" />
              Analyze Document
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
              <Search className="mr-2 h-4 w-4" />
              Legal Research
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lawyer.activeCases}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents Analyzed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lawyer.documentsAnalyzed}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Queries</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lawyer.researchQueries}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingActions.length}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Cases</CardTitle>
                  <CardDescription>Your latest case activity</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentCases.map((case_) => (
                <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium">{case_.title}</h4>
                    <p className="text-sm text-gray-600">{case_.client}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last activity: {new Date(case_.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 space-y-1">
                    {getStatusBadge(case_.status)}
                    {getPriorityBadge(case_.priority)}
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
                    Review
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Document Analysis</CardTitle>
                  <CardDescription>Your latest document uploads</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-gray-600">{doc.type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={doc.status === 'analyzed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {doc.status === 'analyzed' ? 'Ready' : 'Processing'}
                    </Badge>
                  </div>
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
                Add New Case File
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document for Analysis
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Search Case Law
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Legal Drafting
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">🤖 AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700">
              Based on your recent case activity, consider reviewing the latest amendments to the Employment Act 2007 
              for your ongoing employment dispute cases. Our AI has identified 3 relevant precedents that might strengthen your arguments.
            </p>
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
              View Detailed Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    </LawyerDashboardLayout>
  );
}