'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
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
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getUserContracts, searchContracts } from '@/lib/database/contracts';

function ContractsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadContracts() {
      if (!user) return;
      
      try {
        setLoading(true);
        const userContracts = await getUserContracts(user.id);
        setContracts(userContracts);
      } catch (err) {
        console.error('Error loading contracts:', err);
        setError('Failed to load contracts');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadContracts();
    }
  }, [user, authLoading]);

  useEffect(() => {
    async function performSearch() {
      if (!user || !searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const results = await searchContracts(user.id, searchTerm);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching contracts:', err);
      } finally {
        setSearching(false);
      }
    }

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, user]);

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

  const displayContracts = searchTerm.trim() ? searchResults : contracts;

  const contractsByStatus = {
    all: displayContracts,
    draft: displayContracts.filter(c => c.status === 'draft'),
    pending: displayContracts.filter(c => c.status === 'pending_signature'),
    signed: displayContracts.filter(c => c.status === 'signed')
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your contracts...</p>
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
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
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
                        {searchTerm.trim() ? 'No contracts found' : 'No contracts found'}
                      </h3>
                      <p className="mt-2 text-gray-600">
                        {searchTerm.trim() 
                          ? `No contracts match "${searchTerm}"`
                          : status === 'all' 
                            ? "You haven't created any contracts yet."
                            : `No ${status} contracts found.`
                        }
                      </p>
                      {!searchTerm.trim() && (
                        <Button className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Contract
                        </Button>
                      )}
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
                                <p className="font-medium">{contract.contract_type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Parties</p>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                                  <p className="font-medium text-sm">
                                    {contract.parties?.map((p: any) => p.full_name).join(', ') || 'No parties'}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Value</p>
                                <p className="font-medium">
                                  {contract.value_amount 
                                    ? `${contract.value_currency || 'KSh'} ${contract.value_amount.toLocaleString()}`
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Created: {new Date(contract.created_at).toLocaleDateString()}
                              </div>
                              {contract.signed_date && (
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Signed: {new Date(contract.signed_date).toLocaleDateString()}
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

function ContractsPageWithAuth() {
  return (
    <AuthGuard>
      <ContractsPage />
    </AuthGuard>
  );
}

export default ContractsPageWithAuth;