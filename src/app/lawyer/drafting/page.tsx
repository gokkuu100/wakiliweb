'use client';

import { useState } from 'react';
import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Edit,
  Save,
  FileText,
  Eye,
  Download,
  Copy,
  Sparkles,
  Clock,
  Search
} from 'lucide-react';

export default function LawyerDraftingPage() {
  const [prompt, setPrompt] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const savedDrafts = [
    {
      id: 1,
      title: 'Employment Contract - Senior Developer',
      type: 'Employment Agreement',
      lastModified: '2024-01-15',
      wordCount: 2450,
      status: 'draft'
    },
    {
      id: 2,
      title: 'Service Agreement - IT Consulting',
      type: 'Service Contract',
      lastModified: '2024-01-14',
      wordCount: 1890,
      status: 'review'
    },
    {
      id: 3,
      title: 'NDA - Technology Partnership',
      type: 'Non-Disclosure Agreement',
      lastModified: '2024-01-13',
      wordCount: 1200,
      status: 'final'
    }
  ];

  const templates = [
    {
      id: 1,
      name: 'Employment Contract Template',
      category: 'Employment',
      description: 'Comprehensive employment agreement template for Kenya',
      clauses: 15,
      lastUpdated: '2024-01-10'
    },
    {
      id: 2,
      name: 'Service Agreement Template',
      category: 'Business',
      description: 'Professional services contract template',
      clauses: 12,
      lastUpdated: '2024-01-08'
    },
    {
      id: 3,
      name: 'Non-Disclosure Agreement',
      category: 'Confidentiality',
      description: 'Standard NDA template for business relationships',
      clauses: 8,
      lastUpdated: '2024-01-05'
    },
    {
      id: 4,
      name: 'Partnership Agreement',
      category: 'Business',
      description: 'Business partnership formation template',
      clauses: 20,
      lastUpdated: '2024-01-03'
    }
  ];

  const examplePrompts = [
    "Draft an employment contract for a senior software developer position with a 6-month probation period, KSh 150,000 monthly salary, and standard benefits including health insurance and transport allowance.",
    "Create a service agreement for IT consulting services with milestone-based payments, intellectual property clauses, and termination conditions.",
    "Generate a non-disclosure agreement for a technology partnership between two companies, covering mutual confidentiality and 3-year duration.",
    "Draft a commercial lease agreement for office space in Nairobi CBD with 3-year term and annual rent escalation clause."
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case 'final':
        return <Badge className="bg-green-100 text-green-800">Final</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredDrafts = savedDrafts.filter(draft =>
    draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Legal Drafting Assistant</h1>
          <p className="text-gray-600">Generate professional legal documents with AI assistance</p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate from Prompt</TabsTrigger>
            <TabsTrigger value="drafts">Saved Drafts ({savedDrafts.length})</TabsTrigger>
            <TabsTrigger value="templates">Document Templates ({templates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* AI Drafting Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-indigo-600" />
                  AI Document Generator
                </CardTitle>
                <CardDescription>
                  Describe the legal document you need and our AI will draft it for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Description
                  </label>
                  <Textarea
                    placeholder="Describe the legal document you need. Be specific about parties, terms, conditions, and any special requirements. Example: 'Draft an employment contract for a marketing manager position with KSh 80,000 salary, 3-month probation, and standard benefits.'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Auto-detect</option>
                      <option value="employment">Employment Contract</option>
                      <option value="service">Service Agreement</option>
                      <option value="nda">Non-Disclosure Agreement</option>
                      <option value="lease">Lease Agreement</option>
                      <option value="partnership">Partnership Agreement</option>
                      <option value="sale">Sale Agreement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jurisdiction
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="kenya">Kenya</option>
                      <option value="east_africa">East Africa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complexity Level
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="standard">Standard</option>
                      <option value="detailed">Detailed</option>
                      <option value="comprehensive">Comprehensive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Additional Options:</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Include standard legal clauses</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Add termination conditions</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Include dispute resolution clause</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Add intellectual property terms</span>
                    </label>
                  </div>
                </div>

                <Button 
                  disabled={!prompt.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Legal Document
                </Button>
              </CardContent>
            </Card>

            {/* Example Prompts */}
            <Card>
              <CardHeader>
                <CardTitle>Example Prompts</CardTitle>
                <CardDescription>Click on any example to use it as a starting point</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {examplePrompts.map((example, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setPrompt(example)}
                  >
                    <p className="text-sm text-gray-700">"{example}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search drafts by title or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Saved Drafts */}
            <div className="space-y-4">
              {filteredDrafts.map((draft) => (
                <Card key={draft.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Edit className="h-5 w-5 text-indigo-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {draft.title}
                          </h3>
                          {getStatusBadge(draft.status)}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{draft.type}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Modified: {new Date(draft.lastModified).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {draft.wordCount.toLocaleString()} words
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {template.category}
                        </Badge>
                      </div>
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{template.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{template.clauses} clauses</span>
                      <span>Updated: {new Date(template.lastUpdated).toLocaleDateString()}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                        <Edit className="mr-2 h-4 w-4" />
                        Use Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LawyerDashboardLayout>
  );
}