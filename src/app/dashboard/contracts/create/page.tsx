'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  Building,
  Home,
  Briefcase,
  Heart,
  Car,
  Laptop
} from 'lucide-react';

export default function CreateContractPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const contractTemplates = [
    {
      id: 'nda',
      title: 'Non-Disclosure Agreement (NDA)',
      description: 'Protect confidential information and trade secrets',
      icon: Shield,
      category: 'Business',
      popular: true
    },
    {
      id: 'service',
      title: 'Service Agreement',
      description: 'Define terms for professional services',
      icon: Briefcase,
      category: 'Business',
      popular: true
    },
    {
      id: 'employment',
      title: 'Employment Contract',
      description: 'Formal employment terms and conditions',
      icon: Users,
      category: 'Employment',
      popular: false
    },
    {
      id: 'rental',
      title: 'Rental Agreement',
      description: 'Residential or commercial property lease',
      icon: Home,
      category: 'Property',
      popular: true
    },
    {
      id: 'sale',
      title: 'Sale Agreement',
      description: 'Buy or sell goods, property, or assets',
      icon: Building,
      category: 'Property',
      popular: false
    },
    {
      id: 'freelance',
      title: 'Freelance Contract',
      description: 'Independent contractor agreements',
      icon: Laptop,
      category: 'Business',
      popular: false
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Contract</h1>
          <p className="text-gray-600">Choose a contract template to get started</p>
        </div>

        {/* AI Description Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Sparkles className="mr-2 h-5 w-5" />
              Describe Your Need
            </CardTitle>
            <CardDescription className="text-blue-700">
              Tell our AI what you need and we'll suggest the best contract type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Example: I want to hire a freelancer to design my website and need to protect my business ideas..."
              className="min-h-[100px] bg-white border-blue-200"
            />
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Get AI Suggestions
            </Button>
          </CardContent>
        </Card>

        {/* Contract Templates */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Or choose from popular templates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <template.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.title}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    {template.popular && (
                      <Badge className="bg-green-100 text-green-800">Popular</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                  >
                    {selectedTemplate === template.id ? "Selected" : "Use Template"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        {selectedTemplate && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Ready to proceed?</h3>
                  <p className="text-green-700">We'll guide you through creating your contract step by step.</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}