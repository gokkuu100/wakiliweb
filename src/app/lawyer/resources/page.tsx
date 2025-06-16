'use client';

import { useState } from 'react';
import { LawyerDashboardLayout } from '@/components/lawyer/LawyerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Search,
  BookOpen,
  Scale,
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
  ExternalLink,
  Star,
  Bookmark
} from 'lucide-react';

export default function LawyerResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const kenyanStatutes = [
    {
      id: 1,
      title: 'Constitution of Kenya 2010',
      category: 'Constitutional Law',
      lastUpdated: '2024-01-10',
      sections: 264,
      description: 'The supreme law of Kenya',
      bookmarked: true
    },
    {
      id: 2,
      title: 'Employment Act 2007',
      category: 'Employment Law',
      lastUpdated: '2023-12-15',
      sections: 85,
      description: 'Comprehensive employment legislation',
      bookmarked: false
    },
    {
      id: 3,
      title: 'Companies Act 2015',
      category: 'Corporate Law',
      lastUpdated: '2024-01-05',
      sections: 1024,
      description: 'Corporate governance and company law',
      bookmarked: true
    },
    {
      id: 4,
      title: 'Land Registration Act 2012',
      category: 'Property Law',
      lastUpdated: '2023-11-20',
      sections: 156,
      description: 'Land registration and property rights',
      bookmarked: false
    }
  ];

  const judicialPrecedents = [
    {
      id: 1,
      caseTitle: 'Republic v. Kenya National Examination Council & 2 others Ex Parte Audrey Mbugua Ithibu',
      court: 'High Court of Kenya',
      year: '2014',
      citation: '[2014] eKLR',
      category: 'Constitutional Law',
      summary: 'Landmark case on gender identity and constitutional rights',
      relevance: 'high'
    },
    {
      id: 2,
      caseTitle: 'Trusted Society of Human Rights Alliance v. Attorney General & 2 others',
      court: 'High Court of Kenya',
      year: '2013',
      citation: '[2013] eKLR',
      category: 'Human Rights',
      summary: 'Case on freedom of association and assembly',
      relevance: 'medium'
    },
    {
      id: 3,
      caseTitle: 'Communications Commission of Kenya & 5 others v. Royal Media Services Limited & 5 others',
      court: 'Court of Appeal',
      year: '2014',
      citation: '[2014] eKLR',
      category: 'Media Law',
      summary: 'Broadcasting regulations and media freedom',
      relevance: 'high'
    }
  ];

  const templateLibrary = [
    {
      id: 1,
      name: 'Employment Contract Template',
      category: 'Employment',
      description: 'Comprehensive employment agreement for Kenya',
      downloads: 1250,
      rating: 4.8,
      lastUpdated: '2024-01-10',
      clauses: 15
    },
    {
      id: 2,
      name: 'Service Agreement Template',
      category: 'Commercial',
      description: 'Professional services contract template',
      downloads: 890,
      rating: 4.6,
      lastUpdated: '2024-01-08',
      clauses: 12
    },
    {
      id: 3,
      name: 'Non-Disclosure Agreement',
      category: 'Confidentiality',
      description: 'Standard NDA template for business relationships',
      downloads: 2100,
      rating: 4.9,
      lastUpdated: '2024-01-05',
      clauses: 8
    },
    {
      id: 4,
      name: 'Partnership Agreement',
      category: 'Corporate',
      description: 'Business partnership formation template',
      downloads: 650,
      rating: 4.7,
      lastUpdated: '2024-01-03',
      clauses: 20
    }
  ];

  const getRelevanceBadge = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Relevance</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge>{relevance}</Badge>;
    }
  };

  return (
    <LawyerDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Tools & Resources</h1>
          <p className="text-gray-600">Access comprehensive legal databases and resources for Kenya</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search statutes, cases, or templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="statutes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="statutes" className="flex items-center">
              <Scale className="mr-2 h-4 w-4" />
              Kenyan Statutes ({kenyanStatutes.length})
            </TabsTrigger>
            <TabsTrigger value="precedents" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Judicial Precedents ({judicialPrecedents.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Templates Library ({templateLibrary.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statutes" className="space-y-4">
            {kenyanStatutes.map((statute) => (
              <Card key={statute.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Scale className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {statute.title}
                        </h3>
                        <Badge variant="outline">{statute.category}</Badge>
                        {statute.bookmarked && (
                          <Bookmark className="h-4 w-4 text-yellow-600 fill-current" />
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{statute.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Sections</p>
                          <p className="font-medium">{statute.sections}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-medium">{statute.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="font-medium">
                            {new Date(statute.lastUpdated).toLocaleDateString()}
                          </p>
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
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="precedents" className="space-y-4">
            {judicialPrecedents.map((precedent) => (
              <Card key={precedent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {precedent.caseTitle}
                        </h3>
                        <Badge variant="outline">{precedent.category}</Badge>
                        {getRelevanceBadge(precedent.relevance)}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{precedent.summary}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Court</p>
                          <p className="font-medium">{precedent.court}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Year</p>
                          <p className="font-medium">{precedent.year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Citation</p>
                          <p className="font-medium">{precedent.citation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {templateLibrary.map((template) => (
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
                      <div className="flex items-center space-x-4">
                        <span>{template.clauses} clauses</span>
                        <span>{template.downloads} downloads</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{template.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Updated: {new Date(template.lastUpdated).toLocaleDateString()}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                        <Download className="mr-2 h-4 w-4" />
                        Download
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

        {/* Quick Access */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-800">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4">
                <Scale className="mr-3 h-5 w-5 text-indigo-600" />
                <div className="text-left">
                  <div className="font-medium">Kenya Law Reports</div>
                  <div className="text-sm text-gray-600">Access full case reports</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <BookOpen className="mr-3 h-5 w-5 text-indigo-600" />
                <div className="text-left">
                  <div className="font-medium">Legal Forms</div>
                  <div className="text-sm text-gray-600">Court forms and applications</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <Database className="mr-3 h-5 w-5 text-indigo-600" />
                <div className="text-left">
                  <div className="font-medium">Legal Dictionary</div>
                  <div className="text-sm text-gray-600">Legal terms and definitions</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </LawyerDashboardLayout>
  );
}