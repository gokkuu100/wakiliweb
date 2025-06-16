'use client';

import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  FileText, 
  Upload, 
  Search, 
  Settings, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  AlertCircle,
  X,
  Eye,
  Calendar,
  User
} from 'lucide-react';

export default function LawyerNotificationsPage() {
  const documentUpdates = [
    {
      id: 1,
      title: 'Document analysis completed for TechCorp Merger Agreement',
      description: 'AI analysis has identified 3 potential risk areas and provided recommendations.',
      time: '2 hours ago',
      type: 'analysis_complete',
      urgent: false,
      documentName: 'TechCorp_Merger_Agreement.pdf'
    },
    {
      id: 2,
      title: 'New version uploaded: Employment Contract Template',
      description: 'Client has uploaded a revised version with updated salary terms.',
      time: '4 hours ago',
      type: 'document_updated',
      urgent: true,
      documentName: 'Employment_Contract_v2.docx'
    }
  ];

  const clientSubmissions = [
    {
      id: 1,
      title: 'New contract submission from StartupXYZ',
      description: 'Partnership agreement needs review and legal opinion.',
      time: '1 hour ago',
      clientName: 'StartupXYZ Ltd',
      contractType: 'Partnership Agreement',
      urgent: true
    },
    {
      id: 2,
      title: 'Contract revision from TechCorp',
      description: 'Updated service agreement with modified payment terms.',
      time: '3 hours ago',
      clientName: 'TechCorp Limited',
      contractType: 'Service Agreement',
      urgent: false
    }
  ];

  const researchResults = [
    {
      id: 1,
      title: 'Legal research completed: Employment termination procedures',
      description: 'Found 15 relevant cases and 3 applicable statutes.',
      time: '30 minutes ago',
      query: 'Employment termination notice periods Kenya',
      resultsCount: 15
    },
    {
      id: 2,
      title: 'Case law comparison ready',
      description: 'Document comparison against relevant precedents completed.',
      time: '2 hours ago',
      query: 'Contract breach remedies commercial law',
      resultsCount: 8
    }
  ];

  const systemUpdates = [
    {
      id: 1,
      title: 'New AI model deployed',
      description: 'Enhanced legal research capabilities with improved accuracy.',
      time: '1 day ago',
      type: 'feature_update'
    },
    {
      id: 2,
      title: 'Scheduled maintenance completed',
      description: 'System performance improvements and bug fixes applied.',
      time: '2 days ago',
      type: 'maintenance'
    }
  ];

  const allNotifications = [
    ...documentUpdates.map(n => ({ ...n, category: 'document' })),
    ...clientSubmissions.map(n => ({ ...n, category: 'client' })),
    ...researchResults.map(n => ({ ...n, category: 'research' })),
    ...systemUpdates.map(n => ({ ...n, category: 'system' }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const getNotificationIcon = (category: string, urgent?: boolean) => {
    switch (category) {
      case 'document':
        return <FileText className={`h-5 w-5 ${urgent ? 'text-red-600' : 'text-blue-600'}`} />;
      case 'client':
        return <Upload className={`h-5 w-5 ${urgent ? 'text-red-600' : 'text-green-600'}`} />;
      case 'research':
        return <Search className="h-5 w-5 text-purple-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getUrgencyBadge = (urgent?: boolean) => {
    if (urgent) {
      return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
    }
    return null;
  };

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your legal practice activities</p>
          </div>
          <Button variant="outline">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unread</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                Notifications pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Updates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentUpdates.length}</div>
              <p className="text-xs text-muted-foreground">
                Analysis completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Submissions</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientSubmissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Results</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{researchResults.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready for review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All ({allNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({documentUpdates.length})
            </TabsTrigger>
            <TabsTrigger value="clients">
              Clients ({clientSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="research">
              Research ({researchResults.length})
            </TabsTrigger>
            <TabsTrigger value="system">
              System ({systemUpdates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allNotifications.map((notification) => (
              <Card key={`${notification.category}-${notification.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.category, notification.urgent)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {getUrgencyBadge(notification.urgent)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {documentUpdates.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <FileText className={`h-5 w-5 ${notification.urgent ? 'text-red-600' : 'text-blue-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {getUrgencyBadge(notification.urgent)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <p className="text-sm font-medium text-blue-600 mb-2">{notification.documentName}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Eye className="mr-2 h-4 w-4" />
                        View Analysis
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            {clientSubmissions.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Upload className={`h-5 w-5 ${notification.urgent ? 'text-red-600' : 'text-green-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {getUrgencyBadge(notification.urgent)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="font-medium text-green-600">{notification.clientName}</span>
                          </div>
                          <span className="text-gray-500">{notification.contractType}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="research" className="space-y-4">
            {researchResults.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Search className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <p className="text-sm font-medium text-purple-600 mb-2">"{notification.query}"</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{notification.resultsCount} results found</span>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.time}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Eye className="mr-2 h-4 w-4" />
                        View Results
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            {systemUpdates.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Settings className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </LawyerDashboardLayout>
  );
}