/**
 * Contract Creation Workflow - Step-by-step AI-powered contract creation
 * Handles the complete workflow from user input to final contract
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Bot,
  User,
  Send,
  Lightbulb,
  Shield,
  Users,
  Building,
  Check,
  XIcon
} from 'lucide-react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface WorkflowStep {
  id: number;
  name: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isCompleted: boolean;
  canSkip: boolean;
}

interface ContractSession {
  id?: string;
  user_id: string;
  initial_user_prompt: string;
  ai_suggested_template_type?: string;
  selected_template_id?: string;
  current_stage: string;
  current_stage_name: string;
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  contract_title?: string;
  contract_type?: string;
  session_data: any;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  contract_type: string;
  use_cases: string[];
  keywords: string[];
}

// =============================================================================
// WORKFLOW STEPS CONFIGURATION
// =============================================================================

const WORKFLOW_STEPS = [
  { id: 1, name: 'initial_prompt', title: 'Describe Your Needs', description: 'Tell us what you want to create' },
  { id: 2, name: 'template_selection', title: 'AI Template Suggestion', description: 'Review AI-suggested templates' },
  { id: 3, name: 'party_details', title: 'Party Information', description: 'Enter details for all parties' },
  { id: 4, name: 'mandatory_clauses', title: 'Essential Clauses', description: 'Review mandatory contract terms' },
  { id: 5, name: 'optional_clauses', title: 'Additional Terms', description: 'Add optional clauses' },
  { id: 6, name: 'review', title: 'Final Review', description: 'Review complete contract' },
  { id: 7, name: 'completion', title: 'Contract Ready', description: 'Download and share your contract' }
];

// Sample prompting examples
const PROMPT_EXAMPLES = [
  "I want to protect this idea I have from being stolen by people who I talk to",
  "I need to hire a new employee for my company and want a proper employment contract",
  "I want to rent out my property and need a rental agreement",
  "I'm providing consulting services and need a service agreement",
  "I want to sell my car and need a sale agreement"
];

// =============================================================================
// STEP COMPONENTS
// =============================================================================

// Step 1: Initial User Prompt
function InitialPromptStep({ session, onNext, onUpdate }: any) {
  const [userPrompt, setUserPrompt] = useState(session?.initial_user_prompt || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!userPrompt.trim()) return;
    
    setIsLoading(true);
    try {
      // Call AI to analyze user prompt and suggest templates
      const response = await fetch('/api/ai/analyze-contract-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
      });
      
      const analysis = await response.json();
      
      // Update session with AI analysis
      await onUpdate({
        initial_user_prompt: userPrompt,
        ai_analysis_data: analysis,
        current_stage: 'template_selection',
        current_stage_name: 'AI Template Suggestion',
        current_step: 2,
        completion_percentage: 25
      });
      
      onNext();
    } catch (error) {
      console.error('Error analyzing prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">What kind of contract do you need?</h2>
        <p className="text-gray-600">Describe your situation in plain language, and our AI will help create the perfect contract.</p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Example: I want to protect this idea I have from being stolen by people who I talk to..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={4}
          className="w-full"
        />

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-blue-600" />
            Need inspiration? Try these examples:
          </h3>
          <div className="space-y-2">
            {PROMPT_EXAMPLES.map((example, index) => (
              <button
                key={index}
                onClick={() => setUserPrompt(example)}
                className="text-left text-sm text-blue-600 hover:text-blue-800 block"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button 
        onClick={handleContinue}
        disabled={!userPrompt.trim() || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Bot className="h-4 w-4 mr-2 animate-pulse" />
            AI is analyzing your request...
          </>
        ) : (
          <>
            Continue with AI Analysis
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}

// Step 2: Template Selection
function TemplateSelectionStep({ session, onNext, onUpdate }: any) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load suggested templates based on AI analysis
    loadSuggestedTemplates();
  }, []);

  const loadSuggestedTemplates = async () => {
    try {
      // Simulate AI-suggested templates based on user prompt
      const mockTemplates = [
        {
          id: 'nda_template',
          name: 'Non-Disclosure Agreement (NDA)',
          description: 'Protect confidential information and trade secrets',
          contract_type: 'nda',
          use_cases: ['protect business ideas', 'confidential discussions', 'sharing sensitive information'],
          keywords: ['confidential', 'secret', 'protect idea', 'business information']
        },
        {
          id: 'employment_template',
          name: 'Employment Contract',
          description: 'Standard employment agreement for Kenyan employees',
          contract_type: 'employment',
          use_cases: ['hiring employees', 'employment terms', 'job contracts'],
          keywords: ['employment', 'job', 'hire', 'employee', 'work']
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const template = templates.find(t => t.id === templateId);
    
    await onUpdate({
      selected_template_id: templateId,
      contract_type: template?.contract_type,
      contract_title: template?.name,
      current_stage: 'party_details',
      current_stage_name: 'Party Information',
      current_step: 3,
      completion_percentage: 40
    });
    
    onNext();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">AI is analyzing your request...</h2>
        <p className="text-gray-600">Finding the best contract template for your needs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">AI Recommends These Templates</h2>
        <p className="text-gray-600">Based on your description, here are the best contract templates for your needs.</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Bot className="h-4 w-4" />
        <AlertDescription>
          <strong>AI Analysis:</strong> Based on your request "{session?.initial_user_prompt}", 
          I recommend these contract templates that will best protect your interests.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {template.contract_type === 'nda' && <Shield className="h-5 w-5 text-blue-600" />}
                    {template.contract_type === 'employment' && <Users className="h-5 w-5 text-green-600" />}
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.use_cases.slice(0, 3).map((useCase, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {useCase}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="ml-4">
                  {selectedTemplate === template.id ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="h-6 w-6 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={() => selectedTemplate && handleTemplateSelect(selectedTemplate)}
        disabled={!selectedTemplate}
        className="w-full"
        size="lg"
      >
        Use Selected Template
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Step 3: Party Details (Placeholder)
function PartyDetailsStep({ session, onNext, onUpdate }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Party Information</h2>
        <p className="text-gray-600">Enter details for all parties involved in this contract.</p>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-yellow-800">This step is under development. For now, we'll proceed with default party information.</p>
      </div>

      <Button onClick={onNext} className="w-full" size="lg">
        Continue to Contract Creation
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Step 4: Mandatory Clauses Creation
function MandatoryClausesStep({ session, onNext, onUpdate }: any) {
  const [clauses, setClauses] = useState<any[]>([]);
  const [currentClauseIndex, setCurrentClauseIndex] = useState(0);
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadMandatoryClauses();
  }, []);

  const loadMandatoryClauses = () => {
    // Mock mandatory clauses for NDA
    const ndaClauses = [
      {
        id: 'nda_parties',
        title: 'Parties',
        description: 'Identifies the parties to the agreement',
        ai_generated_content: '',
        user_approved: false,
        order: 1,
        variables: ['disclosing_party_name', 'receiving_party_name', 'effective_date']
      },
      {
        id: 'nda_definition',
        title: 'Definition of Confidential Information',
        description: 'Defines what constitutes confidential information',
        ai_generated_content: '',
        user_approved: false,
        order: 2,
        variables: []
      },
      {
        id: 'nda_obligations',
        title: 'Obligations of Receiving Party',
        description: 'Sets out the receiving party\'s obligations',
        ai_generated_content: '',
        user_approved: false,
        order: 3,
        variables: []
      }
    ];
    setClauses(ndaClauses);
  };

  const generateClauseContent = async (clause: any) => {
    setIsGenerating(true);
    try {
      // Mock AI generation
      const mockContent = `This is AI-generated content for ${clause.title}. Based on your requirements, here is a legally compliant clause that protects your interests while being enforceable under Kenyan law.`;
      
      const updatedClauses = clauses.map(c => 
        c.id === clause.id ? { ...c, ai_generated_content: mockContent } : c
      );
      setClauses(updatedClauses);
    } catch (error) {
      console.error('Error generating clause:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const approveClause = (clauseId: string) => {
    const updatedClauses = clauses.map(c => 
      c.id === clauseId ? { ...c, user_approved: true } : c
    );
    setClauses(updatedClauses);
    
    // Move to next clause
    if (currentClauseIndex < clauses.length - 1) {
      setCurrentClauseIndex(currentClauseIndex + 1);
    }
  };

  const rejectClause = (clauseId: string) => {
    const updatedClauses = clauses.map(c => 
      c.id === clauseId ? { ...c, ai_generated_content: '', user_approved: false } : c
    );
    setClauses(updatedClauses);
  };

  const modifyClause = async (clauseId: string) => {
    if (!aiInput.trim()) return;
    
    setIsGenerating(true);
    try {
      // Mock AI modification
      const modifiedContent = `Modified content based on your input: "${aiInput}". Here is the updated clause that incorporates your requirements while maintaining legal compliance.`;
      
      const updatedClauses = clauses.map(c => 
        c.id === clauseId ? { ...c, ai_generated_content: modifiedContent } : c
      );
      setClauses(updatedClauses);
      setAiInput('');
    } catch (error) {
      console.error('Error modifying clause:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentClause = clauses[currentClauseIndex];
  const allApproved = clauses.every(c => c.user_approved);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Essential Contract Clauses</h2>
        <p className="text-gray-600">Review and approve each mandatory clause created by AI</p>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center space-x-2 mb-6">
        {clauses.map((clause, index) => (
          <div
            key={clause.id}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              clause.user_approved 
                ? 'bg-green-600 text-white' 
                : index === currentClauseIndex 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {clause.user_approved ? <Check className="h-5 w-5" /> : index + 1}
          </div>
        ))}
      </div>

      {currentClause && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentClause.title}</span>
              <Badge variant="outline">Clause {currentClauseIndex + 1} of {clauses.length}</Badge>
            </CardTitle>
            <p className="text-gray-600">{currentClause.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentClause.ai_generated_content ? (
              <div className="text-center py-8">
                <Button 
                  onClick={() => generateClauseContent(currentClause)}
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Bot className="h-4 w-4 mr-2 animate-pulse" />
                      AI is creating clause...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Bot className="h-4 w-4 mr-2 text-blue-600" />
                    AI-Generated Clause:
                  </h4>
                  <p className="text-gray-800 leading-relaxed">{currentClause.ai_generated_content}</p>
                </div>

                {!currentClause.user_approved && (
                  <div className="space-y-4">
                    {/* Modification input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Want to modify this clause?</label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Tell AI what to change..."
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => modifyClause(currentClause.id)}
                          disabled={!aiInput.trim() || isGenerating}
                          variant="outline"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Approve/Reject buttons */}
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => approveClause(currentClause.id)}
                        className="bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve Clause
                      </Button>
                      <Button 
                        onClick={() => rejectClause(currentClause.id)}
                        variant="outline"
                        size="lg"
                      >
                        <XIcon className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}

                {currentClause.user_approved && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800 font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Clause approved! Moving to next section...
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {allApproved && (
        <div className="text-center">
          <Button onClick={onNext} size="lg" className="bg-blue-600 hover:bg-blue-700">
            Continue to Optional Clauses
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Summary of approved clauses */}
      {clauses.some(c => c.user_approved) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approved Clauses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clauses.filter(c => c.user_approved).map((clause) => (
                <div key={clause.id} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>{clause.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// STEP 5: OPTIONAL CLAUSES
// =============================================================================

function OptionalClausesStep({ session, onNext, onUpdate }: any) {
  const [availableOptionalClauses, setAvailableOptionalClauses] = useState([
    {
      id: 'nda_additional_definitions',
      title: 'Additional Definitions',
      description: 'Define additional terms specific to your agreement',
      category: 'definitions',
      content: 'Additional definitions relevant to this agreement may include...',
      selected: false,
      customizable: true
    },
    {
      id: 'nda_indemnification',
      title: 'Indemnification',
      description: 'Protection against losses due to breach of agreement',
      category: 'protection',
      content: 'The Receiving Party agrees to indemnify and hold harmless the Disclosing Party...',
      selected: false,
      customizable: true
    },
    {
      id: 'nda_injunctive_relief',
      title: 'Injunctive Relief',
      description: 'Right to seek immediate court intervention for breaches',
      category: 'enforcement',
      content: 'The Disclosing Party may seek injunctive relief for any breach...',
      selected: false,
      customizable: false
    },
    {
      id: 'nda_assignment_restrictions',
      title: 'Assignment Restrictions',
      description: 'Limitations on transferring rights under this agreement',
      category: 'restrictions',
      content: 'This Agreement may not be assigned without written consent...',
      selected: false,
      customizable: true
    },
    {
      id: 'nda_entire_agreement',
      title: 'Entire Agreement',
      description: 'This document represents the complete agreement',
      category: 'general',
      content: 'This Agreement constitutes the entire agreement between the parties...',
      selected: false,
      customizable: false
    }
  ]);

  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});

  const toggleClause = (clauseId: string) => {
    setSelectedClauses(prev => 
      prev.includes(clauseId) 
        ? prev.filter(id => id !== clauseId)
        : [...prev, clauseId]
    );
  };

  const handleCustomization = (clauseId: string, content: string) => {
    setCustomizations(prev => ({
      ...prev,
      [clauseId]: content
    }));
  };

  const handleNext = async () => {
    const optionalClausesData = selectedClauses.map(clauseId => {
      const clause = availableOptionalClauses.find(c => c.id === clauseId);
      return {
        ...clause,
        customized_content: customizations[clauseId] || clause?.content
      };
    });

    await onUpdate({
      session_data: {
        ...session.session_data,
        optional_clauses: optionalClausesData,
        selected_optional_clause_ids: selectedClauses
      },
      current_stage: 'review',
      current_step: 6
    });
    
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Optional Clauses</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Add optional clauses to strengthen your contract. These are recommended but not required.
        </p>
      </div>

      <div className="grid gap-4">
        {availableOptionalClauses.map((clause) => (
          <Card key={clause.id} className={`cursor-pointer transition-all ${
            selectedClauses.includes(clause.id) ? 'ring-2 ring-blue-500' : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedClauses.includes(clause.id)}
                    onChange={() => toggleClause(clause.id)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <div>
                    <CardTitle className="text-lg">{clause.title}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {clause.description}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{clause.category}</Badge>
              </div>
            </CardHeader>
            
            {selectedClauses.includes(clause.id) && (
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium mb-2">Default Content:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {clause.content}
                    </p>
                  </div>
                  
                  {clause.customizable && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Customize this clause (optional):
                      </label>
                      <Textarea
                        value={customizations[clause.id] || ''}
                        onChange={(e) => handleCustomization(clause.id, e.target.value)}
                        placeholder="Enter your customized version of this clause..."
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={handleNext} size="lg" className="px-8">
          Continue to Review
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 6: REVIEW
// =============================================================================

function ReviewStep({ session, onNext, onUpdate }: any) {
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractPreview, setContractPreview] = useState<string | null>(null);

  useEffect(() => {
    generateContractPreview();
  }, []);

  const generateContractPreview = async () => {
    setIsGeneratingContract(true);
    // Simulate contract generation
    setTimeout(() => {
      const preview = `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()} between:

DISCLOSING PARTY: ${session?.session_data?.party_details?.disclosing_party_name || '[Party Name]'}
RECEIVING PARTY: ${session?.session_data?.party_details?.receiving_party_name || '[Party Name]'}

1. CONFIDENTIAL INFORMATION
The confidential information includes: ${session?.session_data?.party_details?.confidential_information_scope || '[Information Scope]'}

2. PURPOSE OF DISCLOSURE
The purpose of this disclosure is: ${session?.session_data?.party_details?.purpose_of_disclosure || '[Purpose]'}

3. OBLIGATIONS AND DUTIES
The Receiving Party agrees to maintain strict confidentiality...

[Additional clauses and terms would be generated here based on the session data]

This Agreement shall be governed by the laws of Kenya.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

DISCLOSING PARTY: _________________
RECEIVING PARTY: _________________
      `;
      setContractPreview(preview);
      setIsGeneratingContract(false);
    }, 2000);
  };

  const handleNext = async () => {
    await onUpdate({
      session_data: {
        ...session.session_data,
        contract_preview: contractPreview,
        final_review_completed: true
      },
      current_stage: 'completion',
      current_step: 7,
      completion_percentage: 100
    });
    
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Final Review</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Review your complete contract before finalizing
        </p>
      </div>

      {/* Contract Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Contract Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Contract Type:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {session?.selected_template_id?.toUpperCase() || 'Non-Disclosure Agreement'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Parties:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {session?.session_data?.party_details?.disclosing_party_name} & {session?.session_data?.party_details?.receiving_party_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Mandatory Clauses:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {session?.session_data?.mandatory_clauses?.filter((c: any) => c.user_approved).length || 0} approved
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Optional Clauses:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {session?.session_data?.selected_optional_clause_ids?.length || 0} selected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Contract Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGeneratingContract ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Generating contract...</span>
            </div>
          ) : contractPreview ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {contractPreview}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500">Failed to generate preview</p>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={handleNext} size="lg" className="px-8" disabled={isGeneratingContract}>
          Finalize Contract
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 7: COMPLETION
// =============================================================================

function CompletionStep({ session, onNext, onUpdate }: any) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Simulate file generation and download
    setTimeout(() => {
      // Create a blob with the contract content
      const contractContent = session?.session_data?.contract_preview || 'Contract content not available';
      const blob = new Blob([contractContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session?.contract_title || 'contract'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsDownloading(false);
    }, 1000);
  };

  const handleCreateAnother = () => {
    window.location.reload(); // Simple way to restart the process
  };

  const handleGoToDashboard = () => {
    window.location.href = '/citizen/contracts-generation/create';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Contract Ready!</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your contract has been successfully created and is ready for use
        </p>
      </div>

      {/* Success Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Contract Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Contract Type:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {session?.selected_template_id?.toUpperCase() || 'Non-Disclosure Agreement'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Session ID:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                {session?.id || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Created:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Status:</p>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Ready for Signing
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Download Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Download your contract as a text file or PDF
            </p>
            <Button onClick={handleDownload} disabled={isDownloading} className="w-full">
              {isDownloading ? 'Generating...' : 'Download Contract'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share & Sign</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Share with other parties for digital signing
            </p>
            <Button variant="outline" className="w-full" disabled>
              Share for Signing (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={handleCreateAnother}>
          Create Another Contract
        </Button>
        <Button onClick={handleGoToDashboard}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN WORKFLOW COMPONENT
// =============================================================================

interface ContractCreationWorkflowProps {
  onClose: () => void;
  sessionId?: string;
}

export function ContractCreationWorkflow({ onClose, sessionId }: ContractCreationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [session, setSession] = useState<ContractSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadExistingSession(sessionId);
    } else {
      initializeNewSession();
    }
  }, [sessionId]);

  const initializeNewSession = async () => {
    try {
      // Create new session
      const response = await fetch('/api/contracts/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: 'temp-user-id', // Will be replaced with actual user ID
          initial_prompt: '',
          contract_type: null
        })
      });
      
      if (response.ok) {
        const newSession = await response.json();
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadExistingSession = async (id: string) => {
    try {
      const response = await fetch(`/api/contracts/sessions/${id}`);
      if (response.ok) {
        const existingSession = await response.json();
        setSession(existingSession);
        setCurrentStep(existingSession.current_step || 1);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const updateSession = async (updates: Partial<ContractSession>) => {
    if (!session?.id) return;
    
    try {
      const response = await fetch(`/api/contracts/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedSession = await response.json();
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < WORKFLOW_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case 1: return <InitialPromptStep session={session} onNext={nextStep} onUpdate={updateSession} />;
      case 2: return <TemplateSelectionStep session={session} onNext={nextStep} onUpdate={updateSession} />;
      case 3: return <PartyDetailsStep session={session} onNext={nextStep} onUpdate={updateSession} />;
      case 4: return <MandatoryClausesStep session={session} onNext={nextStep} onUpdate={updateSession} />;
      case 5: return <OptionalClausesStep session={session} onNext={nextStep} onUpdate={updateSession} />;
      case 6: return <ReviewStep session={session} onNext={nextStep} onUpdate={updateSession} />;
      case 7: return <CompletionStep session={session} onNext={nextStep} onUpdate={updateSession} />;
      default: return <InitialPromptStep session={session} onNext={nextStep} onUpdate={updateSession} />;
    }
  };

  const currentStepData = WORKFLOW_STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">AI Contract Creation</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Step {currentStep} of {WORKFLOW_STEPS.length}: {currentStepData?.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-48">
              <Progress value={(currentStep / WORKFLOW_STEPS.length) * 100} />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {Math.round((currentStep / WORKFLOW_STEPS.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="p-8">
            {getStepComponent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={previousStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep > 1 && (
            <Button variant="outline" onClick={onClose}>
              Save & Exit
            </Button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            {WORKFLOW_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`w-3 h-3 rounded-full ${
                  index + 1 === currentStep 
                    ? 'bg-blue-600' 
                    : index + 1 < currentStep 
                    ? 'bg-green-600' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
