'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText,
  Eye,
  Sparkles,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { uploadDocument, getDocumentsWithAnalyses } from '@/lib/database/documents';
import type { DocumentWithAnalysis } from '@/lib/database/documents';

function UploadContractPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recentUploads, setRecentUploads] = useState<DocumentWithAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadRecentUploads() {
      if (!user) return;
      
      try {
        const documents = await getDocumentsWithAnalyses(user.id);
        // Filter for contract-related documents and take only the most recent 5
        const contractDocs = documents
          .filter(doc => 
            doc.document_type === 'contract' || 
            doc.original_filename.toLowerCase().includes('contract') ||
            doc.original_filename.toLowerCase().includes('agreement')
          )
          .slice(0, 5);
        setRecentUploads(contractDocs);
      } catch (err) {
        console.error('Error loading recent uploads:', err);
      }
    }

    if (!authLoading && user) {
      loadRecentUploads();
    }
  }, [user, authLoading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setError(`${file.name} is not a supported file type. Please upload PDF, DOC, or DOCX files.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Maximum file size is 10MB.`);
        return false;
      }
      
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user || uploadedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = uploadedFiles.map(file => 
        uploadDocument(user.id, file, 'contract')
      );

      await Promise.all(uploadPromises);
      
      // Refresh recent uploads
      const documents = await getDocumentsWithAnalyses(user.id);
      const contractDocs = documents
        .filter(doc => 
          doc.document_type === 'contract' || 
          doc.original_filename.toLowerCase().includes('contract') ||
          doc.original_filename.toLowerCase().includes('agreement')
        )
        .slice(0, 5);
      setRecentUploads(contractDocs);
      
      // Clear uploaded files
      setUploadedFiles([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <Badge className="bg-green-100 text-green-800">Analyzed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'uploaded':
        return <Badge className="bg-yellow-100 text-yellow-800">Uploaded</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Contract</h1>
          <p className="text-gray-600">Upload your existing contracts for AI analysis and storage</p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Contract</CardTitle>
            <CardDescription>
              Drag and drop your contract file or click to browse. We support PDF, DOC, and DOCX files up to 10MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop your contract here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse from your computer
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Selected Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Files:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading & Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {uploadedFiles.length} File{uploadedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Options */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Sparkles className="mr-2 h-5 w-5" />
              AI Analysis Options
            </CardTitle>
            <CardDescription className="text-blue-700">
              Choose what you'd like our AI to analyze in your contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Generate summary</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Identify key terms</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Check for potential issues</span>
                </label>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Compare with Kenyan law</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Suggest improvements</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Extract important dates</span>
                </label>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Additional Instructions (Optional)
              </label>
              <Textarea
                placeholder="Tell our AI what specific aspects you'd like analyzed or any concerns you have about this contract..."
                className="bg-white border-blue-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        {recentUploads.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
            <div className="space-y-4">
              {recentUploads.map((upload) => (
                <Card key={upload.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {upload.original_filename}
                          </h3>
                          {getStatusBadge(upload.status)}
                        </div>
                        
                        {upload.analyses?.[0]?.summary && (
                          <p className="text-gray-600 mt-2">
                            {upload.analyses[0].summary}
                          </p>
                        )}

                        <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Uploaded: {new Date(upload.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            Size: {Math.round(upload.file_size / 1024)} KB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {upload.status === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Recent Uploads */}
        {recentUploads.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No uploads yet
                </h3>
                <p className="mt-2 text-gray-600">
                  Upload your first contract to get started with AI analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function UploadContractPageWithAuth() {
  return (
    <AuthGuard>
      <UploadContractPage />
    </AuthGuard>
  );
}

export default UploadContractPageWithAuth;