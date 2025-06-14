'use client';

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
  TrendingUp
} from 'lucide-react';

export default function SignedContractsPage() {
  const signedContracts = [
    {
      id: 1,
      title: 'Non-Disclosure Agreement',
      parties: ['John Doe', 'Tech Solutions Ltd'],
      signedDate: '2024-01-16',
      value: 'N/A',
      type: 'NDA',
      validUntil: '2025-01-16'
    },
    {
      id: 2,
      title: 'Rental Agreement',
      parties: ['John Doe', 'Property Owner'],
      signedDate: '2024-01-12',
      value: 'KSh 45,000/month',
      type: 'Lease',
      validUntil: '2025-01-12'
    },
    {
      id: 3,
      title: 'Consulting Agreement',
      parties: ['John Doe', 'Business Consultant'],
      signedDate: '2024-01-11',
      value: 'KSh 200,000',
      type: 'Service Contract',
      validUntil: '2024-07-11'
    }
  ];

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
              <div className="text-2xl font-bold">3</div>
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
              <div className="text-2xl font-bold">2</div>
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
              <div className="text-2xl font-bold">KSh 245K</div>
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
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Within 6 months
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Signed Contracts */}
        <div className="space-y-4">
          {signedContracts.map((contract) => (
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
                            {contract.parties.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Value</p>
                        <p className="font-medium">{contract.value}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Valid Until</p>
                        <p className="font-medium">
                          {new Date(contract.validUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Signed: {new Date(contract.signedDate).toLocaleDateString()}
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
          ))}
        </div>

        {/* Empty State */}
        {signedContracts.length === 0 && (
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