'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Eye,
  Download,
  Share,
  Calendar,
  User,
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { getSignedContracts } from '@/lib/database/contracts';
import type { Contract } from '@/lib/database/contracts';

function SignedContractsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSignedContracts() {
      if (!user) return;
      
      try {
        setLoading(true);
        const signedContracts = await getSignedContracts(user.id);
        setContracts(signedContracts);
      } catch (err) {
        console.error('Error loading signed contracts:', err);
        setError('Failed to load signed contracts');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadSignedContracts();
    }
  }, [user, authLoading]);

  const thisMonthContracts = contracts.filter(contract => {
    const contractDate = new Date(contract.signed_date || contract.created_at);
    const now = new Date();
    return contractDate.getMonth() === now.getMonth() && contractDate.getFullYear() === now.getFullYear();
  });

  const totalValue = contracts.reduce((sum, contract) => {
    return sum + (contract.value_amount || 0);
  }, 0);

  const expiringContracts = contracts.filter(contract => {
    if (!contract.signed_date) return false;
    const signedDate = new Date(contract.signed_date);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    // Assuming contracts expire 1 year after signing
    const expiryDate = new Date(signedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate <= sixMonthsFromNow;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading signed contracts...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Signed Contracts</h1>
          <p className="text-gray-600">All your completed and legally binding contracts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
              <p className="text-xs text-muted-foreground">
                Active contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisMonthContracts.length}</div>
              <p className="text-xs text-muted-foreground">
                Recently signed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Contract value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiringContracts.length}</div>
              <p className="text-xs text-muted-foreground">
                Within 6 months
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Signed Contracts */}
        <div className="space-y-4">
          {contracts.map((contract) => {
            const primaryParty = contract.parties?.[0];
            const expiryDate = contract.signed_date ? 
              new Date(new Date(contract.signed_date).setFullYear(new Date(contract.signed_date).getFullYear() + 1)) : 
              null;

            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.title}
                        </h3>
                        <Badge className="bg-green-100 text-green-800">Signed</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="font-medium">{contract.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Parties</p>
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <p className="font-medium text-sm">
                              {contract.parties?.map(p => p.name).join(', ') || 'No parties'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Value</p>
                          <p className="font-medium">
                            {contract.value_amount 
                              ? `${contract.value_currency || 'KSH'} ${contract.value_amount.toLocaleString()}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valid Until</p>
                          <p className="font-medium">
                            {expiryDate ? expiryDate.toLocaleDateString() : 'Indefinite'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Signed: {contract.signed_date ? 
                            new Date(contract.signed_date).toLocaleDateString() : 
                            'Date not available'
                          }
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
                        <Share className="h-4 w-4" />
                      </Button>
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
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No signed contracts yet
                </h3>
                <p className="mt-2 text-gray-600">
                  Once contracts are signed, they'll appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function SignedContractsPageWithAuth() {
  return (
    <AuthGuard>
      <SignedContractsPage />
    </AuthGuard>
  );
}

export default SignedContractsPageWithAuth;