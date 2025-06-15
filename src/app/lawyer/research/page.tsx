'use client';

import { useState } from 'react';
import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Upload,
  BookOpen,
  Scale,
  FileText,
  Clock,
  Eye,
  Download,
  History,
  Sparkles
} from 'lucide-react';

export default function LawyerResearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [compareQuery, setCompareQuery] = useState('');

  const researchHistory = [
    {
      id: 1,
      query: 'Employment termination notice periods Kenya',
      type: 'case_law',
      date: '2024-01-15',
      results: 15,
      summary: 'Found relevant cases on employment termination procedures and notice requirements under Kenyan law.'
    },
    {
      id: 2,
      query: 'Corporate merger regulations Competition Act',
      type: 'statutes',
      date: '2024-01-14',
      results: 8,
      summary: 'Research on merger approval processes and competition law compliance requirements.'
    },
    {
      id: 3,
      query: 'Property transfer stamp duty rates',
      type: 'general',
      date: '2024-01-13',
      results: 12,
      summary: 'Current stamp duty rates and exemptions for property transactions in Kenya.'
    }
  ];

  const quickSearches = [
    'Employment Act 2007 amendments',
    'Contract law breach remedies',
    'Property registration requirements',
    'Company incorporation procedures',
    'Intellectual property protection',
    'Tax law updates 2024'
  ];

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  const handleCompareUpload = () => {
    console.log('Uploading document for comparison');
  };

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Research Assistant</h1>
          <p className="text-gray-600">AI-powered research across Kenyan law, case precedents, and legal statutes</p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search Case Law & Statutes</TabsTrigger>
            <TabsTrigger value="compare">Upload & Compare</TabsTrigger>
            <TabsTrigger value="history">Research History ({researchHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5 text-indigo-600" />
                  Legal Research Query
                </CardTitle>
                <CardDescription>
                  Search across Kenyan case law, statutes, and legal precedents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Research Query
                    </label>
                    <Textarea
                      placeholder="Enter your legal research question or topic. Be specific for better results. Example: 'What are the requirements for valid consideration in contract law under Kenyan law?'"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Research Type
                      </label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="all">All Sources</option>
                        <option value="case_law">Case Law Only</option>
                        <option value="statutes">Statutes & Acts</option>
                        <option value="regulations">Regulations</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jurisdiction
                      </label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="kenya">Kenya</option>
                        <option value="east_africa">East Africa</option>
                        <option value="commonwealth">Commonwealth</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Range
                      </label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="all">All Dates</option>
                        <option value="last_year">Last Year</option>
                        <option value="last_5_years">Last 5 Years</option>
                        <option value="last_10_years">Last 10 Years</option>
                      </select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Start AI Research
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Searches */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Research Topics</CardTitle>
                <CardDescription>Common legal research queries to get you started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {quickSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => setSearchQuery(search)}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
                      {search}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            {/* Document Upload for Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5 text-indigo-600" />
                  Upload Document for Legal Comparison
                </CardTitle>
                <CardDescription>
                  Upload a legal document to compare against relevant case law and statutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Legal Document
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload contracts, briefs, or legal documents for AI comparison
                  </p>
                  <Button onClick={handleCompareUpload} className="bg-indigo-600 hover:bg-indigo-700">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500 mt-4">
                    Supported formats: PDF, DOC, DOCX (Max 25MB)
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comparison Instructions
                    </label>
                    <Textarea
                      placeholder="Specify what aspects you want to compare. Example: 'Compare this employment contract against standard Kenyan employment law requirements and identify any non-compliant clauses.'"
                      value={compareQuery}
                      onChange={(e) => setCompareQuery(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span>Compare against case law</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span>Check statutory compliance</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span>Identify precedent conflicts</span>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span>Suggest alternative clauses</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span>Risk assessment</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span>Enforcement likelihood</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {researchHistory.map((research) => (
              <Card key={research.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Search className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {research.query}
                        </h3>
                        <Badge variant="outline" className="capitalize">
                          {research.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{research.summary}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(research.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {research.results} results found
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {researchHistory.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <History className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No research history yet
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Your legal research queries will appear here for easy reference.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Research Tips */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-800">💡 Research Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-indigo-700">
              <div>
                <h4 className="font-medium mb-2">For Better Results:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Be specific with your legal questions</li>
                  <li>• Include relevant case names if known</li>
                  <li>• Specify the area of law (e.g., contract, tort, criminal)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Search Examples:</h4>
                <ul className="text-sm space-y-1">
                  <li>• "Breach of contract remedies under Kenyan law"</li>
                  <li>• "Employment termination procedures Employment Act 2007"</li>
                  <li>• "Property transfer requirements Land Registration Act"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LawyerDashboardLayout>
  );
}