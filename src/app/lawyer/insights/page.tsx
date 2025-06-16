'use client';

import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp,
  Users,
  FileText,
  Search,
  MessageSquare,
  Clock,
  Calendar,
  Download,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export default function LawyerInsightsPage() {
  const usageAnalytics = {
    totalQueries: 156,
    documentsAnalyzed: 45,
    researchHours: 28.5,
    clientInteractions: 23,
    averageResponseTime: '2.3 minutes',
    topCategories: [
      { name: 'Contract Analysis', count: 32, percentage: 71 },
      { name: 'Legal Research', count: 28, percentage: 62 },
      { name: 'Case Law Search', count: 24, percentage: 53 },
      { name: 'Document Drafting', count: 18, percentage: 40 }
    ]
  };

  const clientInteractions = [
    {
      id: 1,
      clientName: 'TechCorp Limited',
      totalInteractions: 15,
      lastInteraction: '2024-01-15',
      contractsReviewed: 3,
      avgResponseTime: '1.2 hours',
      status: 'active'
    },
    {
      id: 2,
      clientName: 'StartupXYZ',
      totalInteractions: 8,
      lastInteraction: '2024-01-14',
      contractsReviewed: 2,
      avgResponseTime: '45 minutes',
      status: 'active'
    },
    {
      id: 3,
      clientName: 'Business Partners Ltd',
      totalInteractions: 12,
      lastInteraction: '2024-01-12',
      contractsReviewed: 4,
      avgResponseTime: '2.1 hours',
      status: 'completed'
    }
  ];

  const monthlyTrends = [
    { month: 'Dec 2023', queries: 89, documents: 23, clients: 8 },
    { month: 'Jan 2024', queries: 156, documents: 45, clients: 12 },
    { month: 'Projected Feb', queries: 180, documents: 52, clients: 15 }
  ];

  const aiEfficiencyMetrics = {
    timesSaved: '45.2 hours',
    accuracyRate: '94.8%',
    clientSatisfaction: '4.7/5',
    costSavings: 'KSh 125,000'
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insights & Analytics</h1>
            <p className="text-gray-600">Track your AI usage and client interactions</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageAnalytics.totalQueries}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                +23% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents Analyzed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageAnalytics.documentsAnalyzed}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                +18% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageAnalytics.researchHours}h</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                -35% time saved with AI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Interactions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageAnalytics.clientInteractions}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="usage" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              AI Usage Analytics
            </TabsTrigger>
            <TabsTrigger value="interactions" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Client Interactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            {/* AI Efficiency Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>AI Efficiency Impact</CardTitle>
                <CardDescription>How AI is improving your legal practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{aiEfficiencyMetrics.timesSaved}</div>
                    <p className="text-sm text-gray-600">Time Saved</p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{aiEfficiencyMetrics.accuracyRate}</div>
                    <p className="text-sm text-gray-600">Accuracy Rate</p>
                    <p className="text-xs text-gray-500">AI predictions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{aiEfficiencyMetrics.clientSatisfaction}</div>
                    <p className="text-sm text-gray-600">Client Satisfaction</p>
                    <p className="text-xs text-gray-500">Average rating</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{aiEfficiencyMetrics.costSavings}</div>
                    <p className="text-sm text-gray-600">Cost Savings</p>
                    <p className="text-xs text-gray-500">Estimated value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top AI Usage Categories</CardTitle>
                <CardDescription>Your most frequently used AI features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usageAnalytics.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm text-gray-600">{category.count} uses</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Your usage patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyTrends.map((trend, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{trend.month}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">{trend.queries}</p>
                        <p className="text-xs text-gray-500">Queries</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{trend.documents}</p>
                        <p className="text-xs text-gray-500">Documents</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-purple-600">{trend.clients}</p>
                        <p className="text-xs text-gray-500">Clients</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            {clientInteractions.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {client.clientName}
                        </h3>
                        {getStatusBadge(client.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Interactions</p>
                          <p className="font-medium text-lg">{client.totalInteractions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contracts Reviewed</p>
                          <p className="font-medium text-lg">{client.contractsReviewed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Avg Response Time</p>
                          <p className="font-medium text-lg">{client.avgResponseTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Interaction</p>
                          <p className="font-medium">
                            {new Date(client.lastInteraction).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Performance Summary */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-800">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-indigo-700">
              <div>
                <h4 className="font-medium mb-2">This Month's Highlights:</h4>
                <ul className="text-sm space-y-1">
                  <li>• 23% increase in AI query efficiency</li>
                  <li>• 35% reduction in research time</li>
                  <li>• 94.8% AI accuracy rate maintained</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Client Satisfaction:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Average rating: 4.7/5</li>
                  <li>• 12% increase in interactions</li>
                  <li>• Faster response times achieved</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Cost Benefits:</h4>
                <ul className="text-sm space-y-1">
                  <li>• KSh 125,000 estimated savings</li>
                  <li>• 45.2 hours of time saved</li>
                  <li>• Improved practice efficiency</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LawyerDashboardLayout>
  );
}