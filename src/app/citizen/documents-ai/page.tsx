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

import DocumentUploader from '@/components/citizendashboard/aidocument/DocumentUploader';
import DocumentList from '@/components/citizendashboard/aidocument/DocumentList';
import DocumentAnalysis from '@/components/citizendashboard/aidocument/DocumentAnalysis';
import DocumentChat from '@/components/citizendashboard/aidocument/DocumentChat';
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
      console.log('Stats response:', response); // Debug log
      setStats(response);
    } catch (err) {
      console.error('Error loading stats:', err);
      // Set default stats if API fails
      setStats({
        total_documents: documents.length,
        documents_this_month: 0,
        questions_asked: 0,
        questions_this_month: 0,
        storage_used_mb: 0,
        subscription_limits: {
          max_documents_per_month: 50,
          max_questions_per_document: 5,
          max_storage_mb: 1000
        }
      });
    }
  };

  const handleUploadSuccess = (document: Document) => {
    setDocuments(prev => [document, ...prev]);
    loadStats(); // Refresh stats
  };

  const handleStatsRefresh = () => {
    loadStats();
  };

  const handleDocumentRefresh = async (documentId: string) => {
    try {
      // Refresh the specific document data
      const response = await documentService.getDocumentStatus(documentId);
      
      // Update the document in the list
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, questions_used: response.questions_used, questions_remaining: response.questions_remaining }
          : doc
      ));
      
      // Update selected document if it's the same one
      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument(prev => prev ? {
          ...prev,
          questions_used: response.questions_used,
          questions_remaining: response.questions_remaining
        } : null);
      }
      
      // Also refresh stats
      loadStats();
    } catch (err) {
      console.error('Error refreshing document:', err);
    }
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
          onStatsRefresh={handleStatsRefresh}
          onDocumentRefresh={handleDocumentRefresh}
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
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>
              Your document and question activity overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stats.total_documents || 0}</div>
                <div className="text-sm text-gray-600 font-medium">Total Documents</div>
                <div className="text-xs text-gray-500 mt-1">Uploaded to your vault</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100">
                <div className="text-4xl font-bold text-green-600 mb-2">{stats.questions_asked || 0}</div>
                <div className="text-sm text-gray-600 font-medium">Questions Asked</div>
                <div className="text-xs text-gray-500 mt-1">AI interactions total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
