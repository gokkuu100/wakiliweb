'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { documentService } from '@/lib/services/documentService';
import { Document } from '@/types/documents';

interface DocumentUploaderProps {
  onUploadStart: () => void;
  onUploadComplete: () => void;
  onUploadSuccess: (document: Document) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function DocumentUploader({
  onUploadStart,
  onUploadComplete,
  onUploadSuccess,
  onError,
  disabled = false
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState('contract');
  const [description, setDescription] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled || uploading) return;
    
    // Filter out files that are too large (50MB limit)
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        onError(`File ${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
  }, [disabled, uploading, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    multiple: false, // Only allow one file at a time
    disabled: disabled || uploading
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    onUploadStart();
    setUploadProgress(10);

    try {
      const file = selectedFiles[0];
      
      const uploadOptions = {
        document_type: documentType,
        description: description.trim() || undefined,
        enable_ai_analysis: true,
        tags: []
      };

      setUploadProgress(30);

      const response = await documentService.uploadDocument(file, uploadOptions);
      
      setUploadProgress(70);

      // Start polling for document status
      documentService.pollDocumentStatus(
        response.document_id,
        (status) => {
          if (status.progress) {
            setUploadProgress(70 + (status.progress * 0.3)); // 70-100%
          }
        }
      );

      setUploadProgress(100);
      
      // Create a Document object from the response
      const newDocument: Document = {
        id: response.id,
        original_filename: response.filename,
        file_path: '',
        file_size: response.file_size,
        content_type: file.type,
        document_type: documentType,
        description,
        tags: [],
        status: response.status as any,
        ai_analysis_enabled: response.ai_analysis_enabled,
        created_at: response.created_at,
        updated_at: response.created_at,
        user_id: ''
      };

      onUploadSuccess(newDocument);
      
      // Reset form
      setSelectedFiles([]);
      setDescription('');
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
      onUploadComplete();
    }
  };

  const removeFile = () => {
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Document Type</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'contract', label: 'Contract' },
            { value: 'legal_document', label: 'Legal Document' },
            { value: 'compliance', label: 'Compliance' },
            { value: 'other', label: 'Other' }
          ].map((type) => (
            <Button
              key={type.value}
              variant={documentType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDocumentType(type.value)}
              disabled={disabled || uploading}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Description (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the document..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-20 text-sm"
          disabled={disabled || uploading}
        />
      </div>

      {/* File Drop Zone */}
      {selectedFiles.length === 0 ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : disabled || uploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag & drop a file here, or click to select'}
          </p>
          <p className="text-xs text-gray-500">
            Supports PDF, DOCX, DOC, and TXT files (max 50MB)
          </p>
        </div>
      ) : (
        /* Selected File Display */
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-sm">{selectedFiles[0].name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFiles[0].size)} • {selectedFiles[0].type}
                </p>
              </div>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing document...
            </span>
            <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-xs text-gray-500">
            Document is being uploaded and analyzed. This may take a few minutes.
          </p>
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading || disabled}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload & Analyze Document
          </>
        )}
      </Button>

      {/* Upload restrictions notice */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Only one document can be processed at a time</p>
        <p>• Documents are automatically analyzed with AI</p>
        <p>• Analysis includes summary, key terms, and Q&A capability</p>
      </div>
    </div>
  );
}
