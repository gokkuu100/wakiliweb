'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  FolderOpen, 
  Search,
  Upload,
  FileText,
  Eye,
  Download,
  Sparkles,
  Calendar,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  getDocumentsWithAnalyses, 
  searchDocuments, 
  getDocumentUsageStats 
} from '@/lib/database/documents';

function VaultPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash === 'documents' || hash === 'summaries') {
        setActiveTab(hash);
      }
    };

    // Set initial tab from hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash to match active tab
    window.history.replaceState(null, '', `#${value}`);
  };

  useEffect(() => {
    async function loadVaultData() {
      if (!user) return;
      
      try {
        setLoading(true);
        const [documentsData, statsData] = await Promise.all([
          getDocumentsWithAnalyses(user.id),
          getDocumentUsageStats(user.id)
        ]);
        setDocuments(documentsData);
        setUsageStats(statsData);
      } catch (err) {
        console.error('Error loading vault data:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadVaultData();
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
        const results = await searchDocuments(user.id, searchTerm);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching documents:', err);
      } finally {
        setSearching(false);
      }
    }

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, user]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <Badge className="bg-green-100 text-green-800">Analyzed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'uploaded':
        return <Badge className="bg-gray-100 text-gray-800">Uploaded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const displayDocuments = searchTerm.trim() ? searchResults : documents;
  const analyzedDocuments = displayDocuments.filter(doc => doc.analyses && doc.analyses.length > 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your documents...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Legal Vault</h1>
            <p className="text-gray-600">Secure storage and AI analysis for all your legal documents</p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* Usage Stats */}
        {usageStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.documentsUploaded}</div>
                <p className="text-xs text-muted-foreground">Total uploads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Analyzed</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.documentsAnalyzed}</div>
                <p className="text-xs text-muted-foreground">AI processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyses Used</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.analysesUsed}</div>
                <p className="text-xs text-muted-foreground">
                  {usageStats.analysesLimit ? `of ${usageStats.analysesLimit}` : 'unlimited'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0) / 1024 / 1024)}MB
                </div>
                <p className="text-xs text-muted-foreground">Total storage</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents by name, type, or content..."
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

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">
              Uploaded Documents ({displayDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="summaries">
              Document Summaries ({analyzedDocuments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {displayDocuments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {searchTerm.trim() ? 'No documents found' : 'No documents uploaded yet'}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      {searchTerm.trim() 
                        ? `No documents match "${searchTerm}"`
                        : 'Upload your first legal document to get started with AI analysis.'
                      }
                    </p>
                    {!searchTerm.trim() && (
                      <Button className="mt-4">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Your First Document
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              displayDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {doc.original_filename}
                          </h3>
                          <Badge variant="outline">{doc.document_type || 'Document'}</Badge>
                          {getStatusBadge(doc.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Upload Date</p>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                              <p className="font-medium text-sm">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">File Size</p>
                            <p className="font-medium">
                              {Math.round(doc.file_size / 1024)} KB
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-medium">{doc.mime_type}</p>
                          </div>
                        </div>

                        {doc.analyses && doc.analyses.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-900 font-medium mb-1">AI Analysis Available:</p>
                            <p className="text-sm text-blue-800">
                              {doc.analyses[0].summary || 'Analysis completed successfully'}
                            </p>
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
                        {doc.status === 'uploaded' && (
                          <Button variant="outline" size="sm">
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="summaries" className="space-y-4">
            {analyzedDocuments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No document summaries yet
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Upload and analyze documents to see AI-generated summaries here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              analyzedDocuments.map((doc) => (
                doc.analyses.map((analysis: any) => (
                  <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                            {doc.original_filename}
                          </CardTitle>
                          <CardDescription>
                            Generated on {new Date(analysis.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {analysis.risk_level && getRiskBadge(analysis.risk_level)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.summary && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{analysis.summary}</p>
                        </div>
                      )}

                      {analysis.key_points && analysis.key_points.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Points:</h4>
                          <ul className="space-y-1">
                            {analysis.key_points.map((point: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">AI Recommendations:</h4>
                          <ul className="space-y-1">
                            {analysis.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-orange-700 flex items-start">
                                <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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
                ))
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function VaultPageWithAuth() {
  return (
    <AuthGuard>
      <VaultPage />
    </AuthGuard>
  );
}