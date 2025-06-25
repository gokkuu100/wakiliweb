'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Send,
  Eye,
  MessageSquare,
  Calendar,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { getContractsByStatus } from '@/lib/database/contracts';
import type { Contract } from '@/lib/database/contracts';

function PendingContractsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPendingContracts() {
      if (!user) return;
      
      try {
        setLoading(true);
        const pendingContracts = await getContractsByStatus(user.id, 'pending_signature');
        setContracts(pendingContracts);
      } catch (err) {
        console.error('Error loading pending contracts:', err);
        setError('Failed to load pending contracts');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadPendingContracts();
    }
  }, [user, authLoading]);

  const calculateDaysWaiting = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (daysWaiting: number): 'low' | 'medium' | 'high' => {
    if (daysWaiting > 7) return 'high';
    if (daysWaiting > 3) return 'medium';
    return 'low';
  };

  const getUrgencyBadge = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Follow Up</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Recent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const urgentContracts = contracts.filter(contract => {
    const daysWaiting = calculateDaysWaiting(contract.created_at);
    return getUrgencyLevel(daysWaiting) === 'high';
  });

  const averageWaitTime = contracts.length > 0 
    ? Math.round(contracts.reduce((acc, contract) => {
        return acc + calculateDaysWaiting(contract.created_at);
      }, 0) / contracts.length)
    : 0;

  if (loading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading pending contracts...</p>
          </div>
        </div>
      
    );
  }

  if (error) {
    return (
      
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
      
    );
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Signatures</h1>
          <p className="text-gray-600">Contracts waiting for signatures from other parties</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Signature</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
              <p className="text-xs text-muted-foreground">
                Contracts pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Wait Time</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageWaitTime} days</div>
              <p className="text-xs text-muted-foreground">
                Current average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Follow Up</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urgentContracts.length}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Contracts */}
        <div className="space-y-4">
          {contracts.map((contract) => {
            const daysWaiting = calculateDaysWaiting(contract.created_at);
            const urgencyLevel = getUrgencyLevel(daysWaiting);
            const primaryParty = contract.parties?.[0];

            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.title}
                        </h3>
                        {getUrgencyBadge(urgencyLevel)}
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
                          <p className="text-sm text-gray-500">Waiting Time</p>
                          <p className="font-medium text-orange-600">
                            {daysWaiting} days
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Send className="h-4 w-4 mr-1" />
                          Sent: {new Date(contract.created_at).toLocaleDateString()}
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
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Send Reminder
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
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No pending signatures
                </h3>
                <p className="mt-2 text-gray-600">
                  All your contracts have been signed or are still in draft.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    
  );
}

export default PendingContractsPage;