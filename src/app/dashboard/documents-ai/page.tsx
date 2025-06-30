'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuthContext';
import { 
  Upload,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  ArrowLeft
} from 'lucide-react';

import DocumentUploader from '@/components/dashboard/aidocument/DocumentUploader';
import DocumentList from '@/components/dashboard/aidocument/DocumentList';
import DocumentAnalysis from '@/components/dashboard/aidocument/DocumentAnalysis';
import DocumentChat from '@/components/dashboard/aidocument/DocumentChat';
import { documentService } from '@/lib/services/documentService';
import { Document, DocumentStats } from '@/types/documents';

export default function VaultPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'analysis' | 'chat'>('list');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDocuments();
      loadStats();
    }
  }, [isAuthenticated, user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentService.getUserDocuments();
      setDocuments(response.documents);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await documentService.getUserStats();
      setStats(response);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleUploadSuccess = (document: Document) => {
    setDocuments(prev => [document, ...prev]);
    loadStats(); // Refresh stats
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setActiveView('analysis');
  };

  const handleStartChat = (document: Document) => {
    setSelectedDocument(document);
    setActiveView('chat');
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      loadStats();
      
      // If deleted document was selected, reset view
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setActiveView('list');
      }
    } catch (err: any) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  const handleReprocess = async (documentId: string) => {
    try {
      await documentService.reprocessDocument(documentId);
      // Refresh the specific document
      const updatedDoc = await documentService.getDocument(documentId);
      setDocuments(prev => 
        prev.map(doc => doc.id === documentId ? updatedDoc : doc)
      );
    } catch (err: any) {
      setError('Failed to reprocess document');
      console.error('Error reprocessing document:', err);
    }
  };

  const handleBackToList = () => {
    setSelectedDocument(null);
    setActiveView('list');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please sign in to access your document vault.</p>
      </div>
    );
  }

  // Show analysis view
  if (activeView === 'analysis' && selectedDocument) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Document Analysis</h1>
            <p className="text-gray-600">{selectedDocument.original_filename}</p>
          </div>
        </div>
        
        <DocumentAnalysis 
          document={selectedDocument}
          onStartChat={() => setActiveView('chat')}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // Show chat view
  if (activeView === 'chat' && selectedDocument) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Document Chat</h1>
            <p className="text-gray-600">{selectedDocument.original_filename}</p>
          </div>
        </div>
        
        <DocumentChat 
          document={selectedDocument}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // Main vault view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Legal Document Vault</h1>
          <p className="text-gray-600 mt-2">
            Upload and analyze legal documents with AI-powered insights
          </p>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{stats.total_documents}</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{stats.questions_asked}</div>
              <div className="text-sm text-gray-600">Questions Asked</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload legal documents for AI analysis and storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploader 
            onUploadStart={() => {}}
            onUploadComplete={() => {}}
            onUploadSuccess={handleUploadSuccess}
            onError={setError}
          />
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Your Documents
          </CardTitle>
          <CardDescription>
            Manage and analyze your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : (
            <DocumentList
              documents={documents}
              loading={loading}
              onDocumentSelect={handleDocumentSelect}
              onDocumentDelete={handleDocumentDelete}
              onStartChat={handleStartChat}
              onReprocess={handleReprocess}
              selectedDocument={selectedDocument}
            />
          )}
        </CardContent>
      </Card>

      {/* Stats Section */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_documents}</div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.documents_this_month}</div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.questions_asked}</div>
                <div className="text-sm text-gray-600">Questions Asked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(stats.storage_used_mb)}MB</div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
            </div>
            
            {stats.subscription_limits && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Subscription Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between">
                      <span>Documents/Month:</span>
                      <span>{stats.documents_this_month}/{stats.subscription_limits.max_documents_per_month}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span>{Math.round(stats.storage_used_mb)}MB/{stats.subscription_limits.max_storage_mb}MB</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Questions/Doc:</span>
                      <span>Up to {stats.subscription_limits.max_questions_per_document}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
