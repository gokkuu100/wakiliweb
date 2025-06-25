'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuthContext';
import { 
  Upload,
  FileText,
  Eye,
  Download,
  Brain,
  Scale,
  CheckCircle,
  AlertCircle,
  File,
  Trash2,
  Loader2
} from 'lucide-react';

interface UploadedDocument {
  id: string;
  title: string;
  file_size: number;
  file_type: string;
  upload_status: string;
  created_at: string;
  document_analysis?: {
    id: string;
    analysis_type: string;
    summary: string;
    confidence_score: number;
    created_at: string;
  }[];
}

export default function VaultPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('summary');

  const loadDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/ai/documents');
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      } else {
        throw new Error('Failed to load documents');
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('analysisType', selectedAnalysisType);

        const response = await fetch('/api/ai/documents', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        setUploadProgress(prev => prev + (100 / acceptedFiles.length));
      }

      await loadDocuments();

    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload one or more files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user, selectedAnalysisType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('word') || fileType.includes('document')) return File;
    return File;
  };

  const getAnalysisIcon = (analysisType: string) => {
    switch (analysisType) {
      case 'legal_review': return Scale;
      case 'risk_assessment': return AlertCircle;
      case 'compliance_check': return CheckCircle;
      default: return Brain;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Legal Document Vault</h1>
        <p className="text-gray-600 mt-2">
          Upload and analyze legal documents with AI-powered insights
        </p>
      </div>

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
        <CardContent className="space-y-4">
          {/* Analysis Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Analysis Type</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'summary', label: 'Document Summary', icon: Eye },
                { value: 'legal_review', label: 'Legal Review', icon: Scale },
                { value: 'compliance_check', label: 'Compliance Check', icon: CheckCircle },
                { value: 'risk_assessment', label: 'Risk Assessment', icon: AlertCircle },
              ].map((type) => {
                const IconComponent = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={selectedAnalysisType === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAnalysisType(type.value)}
                  >
                    <IconComponent className="h-4 w-4 mr-1" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the documents here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop documents here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX, and TXT files
                </p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uploading...</span>
                <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents ({documents.length})</CardTitle>
          <CardDescription>
            Manage your uploaded documents and their AI analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents uploaded yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Upload your first document to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const FileIcon = getFileIcon(doc.file_type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <Badge variant="outline">{doc.upload_status}</Badge>
                        </div>
                        {doc.document_analysis && doc.document_analysis.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.document_analysis.map((analysis) => {
                              const AnalysisIcon = getAnalysisIcon(analysis.analysis_type);
                              return (
                                <Badge key={analysis.id} variant="outline" className="text-xs">
                                  <AnalysisIcon className="h-3 w-3 mr-1" />
                                  {analysis.analysis_type.replace('_', ' ')}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Analysis
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
