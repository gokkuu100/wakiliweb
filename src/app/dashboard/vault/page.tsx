'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderOpen, 
  Search,
  Upload,
  FileText,
  Eye,
  Download,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';

export default function VaultPage() {
  const documents = [
    {
      id: 1,
      name: 'Employment_Contract_Final.pdf',
      type: 'Contract',
      uploadDate: '2024-01-15',
      size: '2.3 MB',
      status: 'analyzed',
      summary: 'Standard employment contract with competitive salary and benefits package.'
    },
    {
      id: 2,
      name: 'NDA_TechSolutions.pdf',
      type: 'NDA',
      uploadDate: '2024-01-14',
      size: '1.8 MB',
      status: 'analyzed',
      summary: 'Comprehensive non-disclosure agreement protecting confidential business information.'
    },
    {
      id: 3,
      name: 'Lease_Agreement_Draft.docx',
      type: 'Lease',
      uploadDate: '2024-01-12',
      size: '1.2 MB',
      status: 'processing',
      summary: null
    }
  ];

  const summaries = [
    {
      id: 1,
      documentName: 'Employment_Contract_Final.pdf',
      generatedDate: '2024-01-15',
      keyPoints: [
        'Salary: KSh 120,000 per month',
        'Notice period: 30 days',
        'Probation: 6 months',
        'Benefits include health insurance and transport allowance'
      ],
      riskLevel: 'low',
      recommendations: ['Consider adding intellectual property clause', 'Clarify overtime compensation']
    },
    {
      id: 2,
      documentName: 'NDA_TechSolutions.pdf',
      generatedDate: '2024-01-14',
      keyPoints: [
        'Duration: 2 years from signing',
        'Covers all business information',
        'Penalty: KSh 500,000 for breach',
        'Mutual agreement between both parties'
      ],
      riskLevel: 'medium',
      recommendations: ['Define "confidential information" more specifically', 'Add return of materials clause']
    }
  ];

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      default:
        return <Badge>{level}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Legal Vault</h1>
            <p className="text-gray-600">Secure storage and AI analysis for all your legal documents</p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents by name, type, or content..."
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

        {/* Main Content */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">
              Uploaded Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="summaries">
              Document Summaries ({summaries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {doc.name}
                        </h3>
                        <Badge variant="outline">{doc.type}</Badge>
                        {doc.status === 'analyzed' ? (
                          <Badge className="bg-green-100 text-green-800">Analyzed</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Upload Date</p>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            <p className="font-medium text-sm">
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">File Size</p>
                          <p className="font-medium">{doc.size}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="font-medium">{doc.type}</p>
                        </div>
                      </div>

                      {doc.summary && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-900 font-medium mb-1">AI Summary:</p>
                          <p className="text-sm text-blue-800">{doc.summary}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {doc.status === 'analyzed' && (
                        <Button variant="outline" size="sm">
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="summaries" className="space-y-4">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                        {summary.documentName}
                      </CardTitle>
                      <CardDescription>
                        Generated on {new Date(summary.generatedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getRiskBadge(summary.riskLevel)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Points:</h4>
                    <ul className="space-y-1">
                      {summary.keyPoints.map((point, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">AI Recommendations:</h4>
                    <ul className="space-y-1">
                      {summary.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-orange-700 flex items-start">
                          <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex space-x-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Analysis
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Empty States */}
        {documents.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No documents uploaded yet
                </h3>
                <p className="mt-2 text-gray-600">
                  Upload your first legal document to get started with AI analysis.
                </p>
                <Button className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}