'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  AlertCircle
} from 'lucide-react';

export default function PendingContractsPage() {
  const pendingContracts = [
    {
      id: 1,
      title: 'Service Agreement with Marketing Agency',
      sentTo: 'jane.doe@marketingpro.co.ke',
      sentDate: '2024-01-14',
      daysWaiting: 3,
      value: 'KSh 150,000',
      urgency: 'high'
    },
    {
      id: 2,
      title: 'Freelance Web Design Contract',
      sentTo: 'mike.designer@gmail.com',
      sentDate: '2024-01-12',
      daysWaiting: 5,
      value: 'KSh 75,000',
      urgency: 'medium'
    }
  ];

  const getUrgencyBadge = (urgency: string, days: number) => {
    if (urgency === 'high' || days > 7) {
      return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
    } else if (days > 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Follow Up</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Recent</Badge>;
  };

  return (
    <DashboardLayout>
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
              <div className="text-2xl font-bold">2</div>
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
              <div className="text-2xl font-bold">4 days</div>
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
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Contracts */}
        <div className="space-y-4">
          {pendingContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contract.title}
                      </h3>
                      {getUrgencyBadge(contract.urgency, contract.daysWaiting)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Sent To</p>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="font-medium text-sm">{contract.sentTo}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contract Value</p>
                        <p className="font-medium">{contract.value}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Waiting Time</p>
                        <p className="font-medium text-orange-600">
                          {contract.daysWaiting} days
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Send className="h-4 w-4 mr-1" />
                        Sent: {new Date(contract.sentDate).toLocaleDateString()}
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
          ))}
        </div>

        {/* Empty State */}
        {pendingContracts.length === 0 && (
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
    </DashboardLayout>
  );
}