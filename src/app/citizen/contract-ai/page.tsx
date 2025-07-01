'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Sparkles,
  ArrowRight,
  MessageSquare,
  FileText,
  Lightbulb,
  Zap
} from 'lucide-react';

export default function ContractAIPage() {
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const examplePrompts = [
    "I want to hire a freelancer to design my website and need to protect my business ideas",
    "I'm renting out my apartment and need a lease agreement",
    "I want to start a consulting business and need service agreements",
    "I need an employment contract for my new hire"
  ];

  const handleAnalyze = () => {
    // Simulate AI analysis
    setSuggestions([
      {
        type: 'Non-Disclosure Agreement (NDA)',
        confidence: 95,
        reason: 'Perfect for protecting business ideas and confidential information',
        features: ['Confidentiality clauses', 'Non-compete terms', 'Penalty provisions']
      },
      {
        type: 'Freelance Service Agreement',
        confidence: 88,
        reason: 'Defines scope of work and payment terms for freelance projects',
        features: ['Scope of work', 'Payment schedule', 'Intellectual property rights']
      }
    ]);
  };

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Contract AI Assistant</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Describe your legal need in plain English, and our AI will suggest the perfect contract type 
            and guide you through creating it step by step.
          </p>
        </div>

        {/* Main Input */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
              Describe Your Legal Need
            </CardTitle>
            <CardDescription>
              Tell us what you want to achieve. Be as detailed as possible for better suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Example: I want to hire a freelancer to design my website. I need to protect my business ideas and ensure the work is delivered on time with proper payment terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
            <Button 
              onClick={handleAnalyze}
              disabled={!description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="mr-2 h-4 w-4" />
              Analyze & Get Suggestions
            </Button>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">AI Recommendations</CardTitle>
              <CardDescription className="text-green-700">
                Based on your description, here are the best contract types for your needs:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{suggestion.type}</h3>
                      <p className="text-gray-600 text-sm">{suggestion.reason}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {suggestion.confidence}% match
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Key Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.features.map((feature: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Create {suggestion.type}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Example Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
              Need Inspiration?
            </CardTitle>
            <CardDescription>
              Try these example prompts to see how our AI works
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {examplePrompts.map((prompt, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setDescription(prompt)}
              >
                <p className="text-sm text-gray-700">"{prompt}"</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Describe</h3>
                <p className="text-sm text-gray-600">
                  Tell us your legal need in plain English
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">2. AI Analysis</h3>
                <p className="text-sm text-gray-600">
                  Our AI analyzes and suggests contract types
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Create</h3>
                <p className="text-sm text-gray-600">
                  Get guided through creating your contract
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}