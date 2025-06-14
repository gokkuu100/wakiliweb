'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  Share,
  MoreHorizontal,
  Plus,
  Calendar,
  Users
} from 'lucide-react';

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const contracts = [
    {
      id: 1,
      title: 'Non-Disclosure Agreement',
      type: 'NDA',
      status: 'signed',
      parties: ['John Doe', 'Tech Solutions Ltd'],
      createdDate: '2024-01-15',
      signedDate: '2024-01-16',
      value: 'N/A'
    },
    {
      id: 2,
      title: 'Service Agreement',
      type: 'Service Contract',
      status: 'pending_signature',
      parties: ['John Doe', 'Marketing Agency'],
      createdDate: '2024-01-14',
      signedDate: null,
      value: 'KSh 150,000'
    },
    {
      id: 3,
      title: 'Employment Contract',
      type: 'Employment',
      status: 'draft',
      parties: ['John Doe'],
      createdDate: '2024-01-13',
      signedDate: null,
      value: 'KSh 80,000/month'
    },
    {
      id: 4,
      title: 'Rental Agreement',
      type: 'Lease',
      status: 'signed',
      parties: ['John Doe', 'Property Owner'],
      createdDate: '2024-01-10',
      signedDate: '2024-01-12',
      value: 'KSh 45,000/month'
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

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const contractsByStatus = {
    all: filteredContracts,
    draft: filteredContracts.filter(c => c.status === 'draft'),
    pending: filteredContracts.filter(c => c.status === 'pending_signature'),
    signed: filteredContracts.filter(c => c.status === 'signed')
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Contracts</h1>
            <p className="text-gray-600">Manage all your legal contracts in one place</p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            Create New Contract
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contracts by name or type..."
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

        {/* Contracts Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({contractsByStatus.all.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Drafts ({contractsByStatus.draft.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({contractsByStatus.pending.length})
            </TabsTrigger>
            <TabsTrigger value="signed">
              Signed ({contractsByStatus.signed.length})
            </TabsTrigger>
          </TabsList>

          {Object.entries(contractsByStatus).map(([status, contracts]) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {contracts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        No contracts found
                      </h3>
                      <p className="mt-2 text-gray-600">
                        {status === 'all' 
                          ? "You haven't created any contracts yet."
                          : `No ${status} contracts found.`
                        }
                      </p>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Contract
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {contracts.map((contract) => (
                    <Card key={contract.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {contract.title}
                              </h3>
                              {getStatusBadge(contract.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <p className="text-sm text-gray-500">Type</p>
                                <p className="font-medium">{contract.type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Parties</p>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                                  <p className="font-medium text-sm">
                                    {contract.parties.join(', ')}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Value</p>
                                <p className="font-medium">{contract.value}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Created: {new Date(contract.createdDate).toLocaleDateString()}
                              </div>
                              {contract.signedDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Signed: {new Date(contract.signedDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            {contract.status === 'draft' && (
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Share className="h-4 w-4" />
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
    </DashboardLayout>
  );
}