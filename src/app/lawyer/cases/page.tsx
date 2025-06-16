'use client';

import { useState } from 'react';
import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderOpen, 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function LawyerCasesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const cases = [
    {
      id: 1,
      title: 'Corporate Merger - TechCorp Ltd',
      client: 'TechCorp Limited',
      caseNumber: 'TC-2024-001',
      status: 'active',
      priority: 'high',
      createdDate: '2024-01-10',
      lastActivity: '2024-01-15',
      nextDeadline: '2024-01-25',
      description: 'Merger and acquisition legal support for technology company'
    },
    {
      id: 2,
      title: 'Employment Dispute - Jane Doe',
      client: 'Jane Doe',
      caseNumber: 'ED-2024-002',
      status: 'review',
      priority: 'medium',
      createdDate: '2024-01-08',
      lastActivity: '2024-01-14',
      nextDeadline: '2024-01-30',
      description: 'Wrongful termination and compensation claim'
    },
    {
      id: 3,
      title: 'Property Transaction - Westlands',
      client: 'Property Investors Ltd',
      caseNumber: 'PT-2024-003',
      status: 'completed',
      priority: 'low',
      createdDate: '2024-01-05',
      lastActivity: '2024-01-13',
      nextDeadline: null,
      description: 'Commercial property purchase and due diligence'
    },
    {
      id: 4,
      title: 'Contract Dispute - Supply Agreement',
      client: 'Manufacturing Co.',
      caseNumber: 'CD-2024-004',
      status: 'pending',
      priority: 'high',
      createdDate: '2024-01-12',
      lastActivity: '2024-01-15',
      nextDeadline: '2024-01-20',
      description: 'Breach of contract and damages claim'
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
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
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

  const filteredCases = cases.filter(case_ =>
    case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const casesByStatus = {
    all: filteredCases,
    active: filteredCases.filter(c => c.status === 'active'),
    review: filteredCases.filter(c => c.status === 'review'),
    pending: filteredCases.filter(c => c.status === 'pending'),
    completed: filteredCases.filter(c => c.status === 'completed')
  };

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cases & Matters</h1>
            <p className="text-gray-600">Manage all your legal cases and client matters</p>
          </div>
          <Button className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add New Case
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases by title, client, or case number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cases Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All ({casesByStatus.all.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({casesByStatus.active.length})
            </TabsTrigger>
            <TabsTrigger value="review">
              Review ({casesByStatus.review.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({casesByStatus.pending.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({casesByStatus.completed.length})
            </TabsTrigger>
          </TabsList>

          {Object.entries(casesByStatus).map(([status, cases]) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {cases.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        No cases found
                      </h3>
                      <p className="mt-2 text-gray-600">
                        {status === 'all' 
                          ? "You haven't created any cases yet."
                          : `No ${status} cases found.`
                        }
                      </p>
                      <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Case
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {cases.map((case_) => (
                    <Card key={case_.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <FolderOpen className="h-5 w-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {case_.title}
                              </h3>
                              {getStatusBadge(case_.status)}
                              {getPriorityBadge(case_.priority)}
                            </div>
                            
                            <p className="text-gray-600 mb-3">{case_.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-sm text-gray-500">Case Number</p>
                                <p className="font-medium">{case_.caseNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Client</p>
                                <div className="flex items-center">
                                  <User className="h-4 w-4 text-gray-400 mr-1" />
                                  <p className="font-medium text-sm">{case_.client}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Last Activity</p>
                                <p className="font-medium">
                                  {new Date(case_.lastActivity).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Next Deadline</p>
                                <p className={`font-medium ${case_.nextDeadline ? 'text-orange-600' : 'text-gray-400'}`}>
                                  {case_.nextDeadline 
                                    ? new Date(case_.nextDeadline).toLocaleDateString()
                                    : 'No deadline'
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Created: {new Date(case_.createdDate).toLocaleDateString()}
                              </div>
                              {case_.nextDeadline && (
                                <div className="flex items-center text-orange-600">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Deadline in {Math.ceil((new Date(case_.nextDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </LawyerDashboardLayout>
  );
}