'use client';

import { useState } from 'react';
import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText,
  Eye,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Search
} from 'lucide-react';

export default function LawyerAnalysisPage() {
  const [dragActive, setDragActive] = useState(false);

  const recentAnalyses = [
    {
      id: 1,
      name: 'Merger_Agreement_TechCorp.pdf',
      uploadDate: '2024-01-15',
      status: 'completed',
      riskLevel: 'medium',
      summary: 'Complex merger agreement with standard terms. Identified 3 potential risk areas requiring attention.',
      keyFindings: [
        'Indemnification clause may be too broad',
        'Termination conditions need clarification',
        'Intellectual property transfer terms are comprehensive'
      ],
      legalCitations: [
        'Companies Act 2015, Section 25',
        'Competition Act 2010, Section 42'
      ]
    },
    {
      id: 2,
      name: 'Employment_Contract_Review.docx',
      uploadDate: '2024-01-14',
      status: 'processing',
      riskLevel: null,
      summary: null,
      keyFindings: [],
      legalCitations: []
    },
    {
      id: 3,
      name: 'Property_Purchase_Agreement.pdf',
      uploadDate: '2024-01-13',
      status: 'completed',
      riskLevel: 'low',
      summary: 'Standard property purchase agreement compliant with Kenyan property law.',
      keyFindings: [
        'All required disclosures present',
        'Payment terms are standard',
        'Title verification clause included'
      ],
      legalCitations: [
        'Land Registration Act 2012',
        'Land Act 2012, Section 15'
      ]
    }
  ];

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
      console.log('Files dropped:', e.dataTransfer.files);
    }
  };

  const getRiskBadge = (level: string | null) => {
    if (!level) return null;
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
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Analysis & Summarizer</h1>
          <p className="text-gray-600">AI-powered legal document analysis with risk detection and insights</p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload for Analysis</TabsTrigger>
            <TabsTrigger value="summaries">Recent Summaries ({recentAnalyses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Legal Document</CardTitle>
                <CardDescription>
                  Upload contracts, agreements, or legal documents for comprehensive AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Drop your legal document here
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to browse from your computer
                  </p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500 mt-4">
                    Supported formats: PDF, DOC, DOCX (Max 25MB)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Options */}
            <Card className="border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-900">
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI Analysis Options
                </CardTitle>
                <CardDescription className="text-indigo-700">
                  Select the type of analysis you want our AI to perform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Document summary & key points</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Risk assessment & red flags</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Legal compliance check</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Clause-by-clause analysis</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Relevant legal citations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Compare with standard templates</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Negotiation recommendations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Alternative clause suggestions</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-indigo-900 mb-2">
                    Specific Analysis Instructions (Optional)
                  </label>
                  <Textarea
                    placeholder="Provide specific instructions for the AI analysis, such as particular clauses to focus on, specific legal concerns, or comparison requirements..."
                    className="bg-white border-indigo-200"
                  />
                </div>

                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start AI Analysis
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summaries" className="space-y-4">
            {recentAnalyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-indigo-600" />
                      <div>
                        <CardTitle className="text-lg">{analysis.name}</CardTitle>
                        <CardDescription>
                          Uploaded: {new Date(analysis.uploadDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(analysis.status)}
                      {getRiskBadge(analysis.riskLevel)}
                    </div>
                  </div>
                </CardHeader>
                
                {analysis.status === 'completed' && (
                  <CardContent className="space-y-4">
                    {/* Summary */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">AI Summary:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{analysis.summary}</p>
                    </div>

                    {/* Key Findings */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Findings:</h4>
                      <ul className="space-y-1">
                        {analysis.keyFindings.map((finding, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Legal Citations */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Relevant Legal Citations:</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.legalCitations.map((citation, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {citation}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Analysis
                      </Button>
                      <Button variant="outline" size="sm">
                        <Search className="mr-2 h-4 w-4" />
                        Research Citations
                      </Button>
                    </div>
                  </CardContent>
                )}

                {analysis.status === 'processing' && (
                  <CardContent>
                    <div className="flex items-center space-x-3 text-blue-600">
                      <Clock className="h-5 w-5 animate-spin" />
                      <span>AI analysis in progress... This may take a few minutes.</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </LawyerDashboardLayout>
  );
}