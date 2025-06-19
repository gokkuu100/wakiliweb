'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Eye,
  Download,
  MessageSquare,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { getSentContracts } from '@/lib/database/contracts';
import type { Contract } from '@/lib/database/contracts';

function SentContractsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSentContracts() {
      if (!user) return;
      
      try {
        setLoading(true);
        const sentContracts = await getSentContracts(user.id);
        setContracts(sentContracts);
      } catch (err) {
        console.error('Error loading sent contracts:', err);
        setError('Failed to load sent contracts');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadSentContracts();
    }
  }, [user, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800">Signed</Badge>;
      case 'pending_signature':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending_signature':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Send className="h-5 w-5 text-gray-600" />;
    }
  };

  const totalSent = contracts.length;
  const pendingCount = contracts.filter(c => c.status === 'pending_signature').length;
  const signedCount = contracts.filter(c => c.status === 'signed').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading sent contracts...</p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sent Contracts</h1>
          <p className="text-gray-600">Track contracts you've sent for signature</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSent}</div>
              <p className="text-xs text-muted-foreground">
                All contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting signature
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{signedCount}</div>
              <p className="text-xs text-muted-foreground">
                Completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSent > 0 ? Math.round((signedCount / totalSent) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sent Contracts */}
        <div className="space-y-4">
          {contracts.map((contract) => {
            const primaryParty = contract.parties?.[0];

            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(contract.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.title}
                        </h3>
                        {getStatusBadge(contract.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Sent To</p>
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <p className="font-medium text-sm">
                              {primaryParty?.email || 'No parties assigned'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contract Value</p>
                          <p className="font-medium">
                            {contract.value_amount 
                              ? `${contract.value_currency || 'KSH'} ${contract.value_amount.toLocaleString()}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="font-medium">
                            {new Date(contract.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Sent: {new Date(contract.created_at).toLocaleDateString()}
                        </div>
                        {contract.signed_date && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
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
                      {contract.status !== 'signed' && (
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {contracts.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Send className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No sent contracts
                </h3>
                <p className="mt-2 text-gray-600">
                  You haven't sent any contracts yet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function SentContractsPageWithAuth() {
  return (
    <AuthGuard>
      <SentContractsPage />
    </AuthGuard>
  );
}

export default SentContractsPageWithAuth;