'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Laptop,
  Loader2,
  AlertCircle,
  CheckCircle,
  Bot,
  Play,
  Save
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';

interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  estimated_completion_time: string;
  is_ai_powered: boolean;
}

interface GenerationStep {
  step_number: number;
  step_title: string;
  step_description: string;
  required_input: string[];
  ai_assistance?: string;
}

interface GenerationSession {
  id: string;
  completion_percentage: number;
  current_step?: GenerationStep;
  ai_conversation_history?: any[];
}

function CreateContractPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // AI Generation State
  const [generationSession, setGenerationSession] = useState<GenerationSession | null>(null);
  const [currentStep, setCurrentStep] = useState<GenerationStep | null>(null);
  const [stepInput, setStepInput] = useState<Record<string, any>>({});
  const [processing, setProcessing] = useState(false);
  const [parties, setParties] = useState([{ name: '', type: 'individual' as const, email: '' }]);

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        // Fetch templates from backend API
        const response = await fetch('/api/contracts/templates');
        if (response.ok) {
          const contractTemplates = await response.json();
          setTemplates(contractTemplates);
        } else {
          throw new Error('Failed to load templates');
        }
      } catch (err) {
        console.error('Error loading contract templates:', err);
        setError('Failed to load contract templates');
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const getTemplateIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'business':
        return Briefcase;
      case 'employment':
        return Users;
      case 'property':
        return Building;
      case 'residential':
        return Home;
      case 'legal':
        return Shield;
      case 'technology':
        return Laptop;
      case 'automotive':
        return Car;
      case 'personal':
        return Heart;
      default:
        return FileText;
    }
  };

  const startContractGeneration = async () => {
    if (!selectedTemplate || !user) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          templateId: selectedTemplate,
          title: aiPrompt ? `Contract based on: ${aiPrompt.substring(0, 50)}...` : undefined,
          description: aiPrompt,
          parties,
          jurisdiction: 'Kenya',
          language: 'en'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate contract');
      }

      const result = await response.json();
      
      if (result.success) {
        // Contract generated successfully
        alert('Contract generated successfully! Redirecting to view...');
        // TODO: Redirect to contract view page
        window.location.href = `/dashboard/contracts/${result.contract_id}`;
      } else {
        throw new Error(result.message || 'Generation failed');
      }

    } catch (err) {
      console.error('Error generating contract:', err);
      setError('Failed to generate contract. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const processStep = async () => {
    if (!generationSession || !currentStep) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/ai/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process_step',
          sessionId: generationSession.id,
          data: {
            stepNumber: currentStep.step_number,
            userInput: stepInput,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process step');
      }

      const result = await response.json();
      setCurrentStep(result.nextStep);
      
      // Update session data
      const updatedSession = { ...generationSession };
      setGenerationSession(updatedSession);

      // Clear step input for next step
      setStepInput({});

    } catch (err) {
      console.error('Error processing step:', err);
      setError('Failed to process step. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const finalizeContract = async () => {
    if (!generationSession) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/ai/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'finalize',
          sessionId: generationSession.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to finalize contract');
      }

      const result = await response.json();
      // Handle final contract result
      console.log('Contract finalized:', result);

    } catch (err) {
      console.error('Error finalizing contract:', err);
      setError('Failed to finalize contract. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const addParty = () => {
    setParties([...parties, { name: '', type: 'individual', email: '' }]);
  };

  const updateParty = (index: number, field: string, value: string) => {
    const updated = [...parties];
    updated[index] = { ...updated[index], [field]: value };
    setParties(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading contract templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
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
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
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
          {templates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No templates available
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Contact support to get contract templates added to your account.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => {
                const IconComponent = getTemplateIcon(template.category);
                return (
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
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {template.is_ai_powered && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Bot className="h-3 w-3 mr-1" />
                              AI Powered
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                      <div className="text-xs text-gray-500 mt-2">
                        Estimated time: {template.estimated_completion_time}
                      </div>
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
                );
              })}
            </div>
          )}
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
  );
}

export default CreateContractPage;