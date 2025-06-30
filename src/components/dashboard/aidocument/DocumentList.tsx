'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Eye, 
  Trash2, 
  MessageSquare, 
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Document } from '@/types/documents';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
  onStartChat: (document: Document) => void;
  onReprocess: (documentId: string) => void;
  selectedDocument: Document | null;
}

export default function DocumentList({
  documents,
  loading,
  onDocumentSelect,
  onDocumentDelete,
  onStartChat,
  onReprocess,
  selectedDocument
}: DocumentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload your first document to get started with AI analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <div
          key={document.id}
          className={`border rounded-lg p-4 transition-colors cursor-pointer ${
            selectedDocument?.id === document.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onDocumentSelect(document)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {document.original_filename}
                </h4>
                
                <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>{formatDate(document.created_at)}</span>
                </div>

                {document.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {document.description}
                  </p>
                )}

                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(document.status)}
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(document.status)}`}
                    >
                      {document.status}
                    </Badge>
                  </div>

                  {document.ai_analysis_enabled && document.ai_analysis_status && (
                    <Badge variant="outline" className="text-xs">
                      AI: {document.ai_analysis_status}
                    </Badge>
                  )}

                  {document.chunks_count && (
                    <Badge variant="outline" className="text-xs">
                      {document.chunks_count} chunks
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-2">
              {document.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartChat(document);
                  }}
                  title="Start Q&A Chat"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDocumentSelect(document);
                }}
                title="View Analysis"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {document.status === 'failed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReprocess(document.id);
                  }}
                  title="Reprocess Document"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete "${document.original_filename}"?`)) {
                    onDocumentDelete(document.id);
                  }
                }}
                title="Delete Document"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Processing Status */}
          {document.status === 'processing' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  {document.ai_analysis_status === 'processing' 
                    ? 'Analyzing document with AI...' 
                    : 'Processing document...'}
                </span>
              </div>
            </div>
          )}

          {/* Error Status */}
          {document.status === 'failed' && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <div className="flex items-center space-x-2 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>Processing failed. Click the refresh button to retry.</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
