'use client';

import { useState } from 'react';
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
  X
} from 'lucide-react';

export default function UploadContractPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

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
      // Handle file upload
      console.log('Files dropped:', e.dataTransfer.files);
    }
  };

  const recentUploads = [
    {
      id: 1,
      name: 'Employment_Contract_Draft.pdf',
      uploadDate: '2024-01-15',
      status: 'analyzed',
      summary: 'Standard employment contract with competitive salary terms and comprehensive benefits package.'
    },
    {
      id: 2,
      name: 'Lease_Agreement_Review.pdf',
      uploadDate: '2024-01-14',
      status: 'processing',
      summary: null
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Contract</h1>
          <p className="text-gray-600">Upload your existing contracts for AI analysis and storage</p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Contract</CardTitle>
            <CardDescription>
              Drag and drop your contract file or click to browse. We support PDF, DOC, and DOCX files.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Your recently uploaded contracts and their analysis status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentUploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">{upload.name}</h4>
                    <p className="text-sm text-gray-600">
                      Uploaded: {new Date(upload.uploadDate).toLocaleDateString()}
                    </p>
                    {upload.summary && (
                      <p className="text-sm text-gray-700 mt-1 max-w-md">
                        {upload.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {upload.status === 'analyzed' ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Analyzed
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Processing
                    </Badge>
                  )}
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}