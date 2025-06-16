'use client';

import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Mail,
  Clock,
  Eye,
  MessageSquare,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';

export default function LawyerClientsPage() {
  const receivedContracts = [
    {
      id: 1,
      title: 'Service Agreement Review',
      clientName: 'TechCorp Limited',
      clientEmail: 'legal@techcorp.co.ke',
      receivedDate: '2024-01-15',
      status: 'pending_review',
      priority: 'high',
      contractType: 'Service Agreement',
      description: 'Review and provide feedback on IT consulting service agreement'
    },
    {
      id: 2,
      title: 'Employment Contract Drafting',
      clientName: 'StartupXYZ',
      clientEmail: 'hr@startupxyz.co.ke',
      receivedDate: '2024-01-14',
      status: 'in_progress',
      priority: 'medium',
      contractType: 'Employment Contract',
      description: 'Draft employment contracts for 5 new hires'
    }
  ];

  const pendingReviews = [
    {
      id: 1,
      title: 'Merger Agreement - Final Review',
      clientName: 'TechCorp Limited',
      submittedDate: '2024-01-13',
      deadline: '2024-01-20',
      status: 'awaiting_signature',
      changes: 3
    },
    {
      id: 2,
      title: 'Partnership Agreement Review',
      clientName: 'Business Partners Ltd',
      submittedDate: '2024-01-12',
      deadline: '2024-01-25',
      status: 'client_review',
      changes: 7
    }
  ];

  const auditTrails = [
    {
      id: 1,
      contractTitle: 'Service Agreement - TechCorp',
      action: 'Document reviewed and commented',
      timestamp: '2024-01-15 14:30',
      user: 'Sarah Mwangi',
      details: 'Added 3 comments on liability clauses'
    },
    {
      id: 2,
      contractTitle: 'Employment Contract - StartupXYZ',
      action: 'Draft submitted to client',
      timestamp: '2024-01-15 11:20',
      user: 'Sarah Mwangi',
      details: 'Initial draft sent for client review'
    },
    {
      id: 3,
      contractTitle: 'Merger Agreement - TechCorp',
      action: 'Client feedback incorporated',
      timestamp: '2024-01-14 16:45',
      user: 'Sarah Mwangi',
      details: 'Updated termination clauses per client request'
    }
  ];

  const chatHistory = [
    {
      id: 1,
      clientName: 'TechCorp Limited',
      lastMessage: 'Thank you for the quick review. We have a few questions about clause 5.2...',
      timestamp: '2024-01-15 15:30',
      unreadCount: 2,
      contractTitle: 'Service Agreement Review'
    },
    {
      id: 2,
      clientName: 'StartupXYZ',
      lastMessage: 'The employment contracts look good. Can we schedule a call to discuss?',
      timestamp: '2024-01-14 10:15',
      unreadCount: 0,
      contractTitle: 'Employment Contract Drafting'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge className="bg-orange-100 text-orange-800">Pending Review</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'awaiting_signature':
        return <Badge className="bg-yellow-100 text-yellow-800">Awaiting Signature</Badge>;
      case 'client_review':
        return <Badge className="bg-purple-100 text-purple-800">Client Review</Badge>;
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Collaboration</h1>
          <p className="text-gray-600">Manage client contracts, reviews, and communications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received Contracts</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receivedContracts.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews.length}</div>
              <p className="text-xs text-muted-foreground">
                Client responses needed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatHistory.length}</div>
              <p className="text-xs text-muted-foreground">
                Client conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chatHistory.reduce((sum, chat) => sum + chat.unreadCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="contracts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contracts">
              Received Contracts ({receivedContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Reviews ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="audit">
              Audit Trails
            </TabsTrigger>
            <TabsTrigger value="chat">
              Client Chats ({chatHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-4">
            {receivedContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Mail className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.title}
                        </h3>
                        {getStatusBadge(contract.status)}
                        {getPriorityBadge(contract.priority)}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{contract.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <p className="font-medium text-sm">{contract.clientName}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contract Type</p>
                          <p className="font-medium">{contract.contractType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Received</p>
                          <p className="font-medium">
                            {new Date(contract.receivedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <Eye className="mr-2 h-4 w-4" />
                        Review
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

          <TabsContent value="pending" className="space-y-4">
            {pendingReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {review.title}
                        </h3>
                        {getStatusBadge(review.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <p className="font-medium">{review.clientName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Submitted</p>
                          <p className="font-medium">
                            {new Date(review.submittedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Deadline</p>
                          <p className="font-medium text-orange-600">
                            {new Date(review.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {review.changes} changes made
                        </div>
                        <div className="flex items-center text-orange-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {Math.ceil((new Date(review.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
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

          <TabsContent value="audit" className="space-y-4">
            {auditTrails.map((audit) => (
              <Card key={audit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{audit.action}</h4>
                      <p className="text-sm text-gray-600 mt-1">{audit.contractTitle}</p>
                      <p className="text-sm text-gray-500 mt-1">{audit.details}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{audit.user}</span>
                        <span>{audit.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {chatHistory.map((chat) => (
              <Card key={chat.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <MessageSquare className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {chat.clientName}
                        </h3>
                        
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {chat.unreadCount} new
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{chat.contractTitle}</p>
                      <p className="text-gray-700 mb-3">"{chat.lastMessage}"</p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(chat.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Reply
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