'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lightbulb, AlertCircle, Sparkles } from 'lucide-react';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';

import { Step1Data, AIAnalysisResult, ContractTemplate, ContractSession, AnalyzePromptRequest } from '../types';

interface Step1InitialPromptProps {
  data: Step1Data;
  onComplete: (data: Step1Data) => void;
  onSessionCreated: (session: ContractSession | null) => void;
  loading: boolean;
}

export default function Step1InitialPrompt({ 
  data, 
  onComplete, 
  onSessionCreated,
  loading: parentLoading 
}: Step1InitialPromptProps) {
  const [userPrompt, setUserPrompt] = useState(data.user_prompt || '');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(data.ai_analysis || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examples = [
    "I would like to secure my contract so that whoever I talk to is not allowed to share my details of the contract",
    "I need an agreement with my employee about their role and responsibilities",
    "I want to create a rental agreement for my property with clear terms",
    "I need a service agreement for my consulting business"
  ];

  const handleAnalyzePrompt = async () => {
    if (userPrompt.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      const requestData: AnalyzePromptRequest = {
        user_prompt: userPrompt.trim()
      };

      const response = await makeAuthenticatedRequest('/api/contract-generation/analyze-prompt', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze prompt');
      }

      const analysisResult: AIAnalysisResult = await response.json();
      
      setAiAnalysis(analysisResult);
      
      // Create a temporary session object with AI analysis data
      const tempSession: ContractSession = {
        id: 'temp-session-' + Date.now(),
        user_id: '',
        session_status: 'analyzing',
        initial_user_prompt: userPrompt,
        ai_suggested_template_type: '',
        current_stage: 'template_selection',
        current_stage_name: 'Template Selection',
        current_step: 1,
        total_steps: 5,
        completion_percentage: '20',
        contract_type: '',
        session_data: {},
        ai_analysis_data: analysisResult,
        template_suggestions: [],
        clause_progress: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        activity_log: [],
        current_mandatory_section: 0,
        mandatory_sections_data: {},
        ai_generated_clauses: {}
      };
      
      // Pass session to parent
      onSessionCreated(tempSession);
      
      // Prepare the complete step data
      const stepData: Step1Data = {
        user_prompt: userPrompt,
        ai_analysis: analysisResult
      };

      // Pass data back to parent
      onComplete(stepData);

    } catch (error) {
      console.error('Error analyzing prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze prompt');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseExample = (example: string) => {
    setUserPrompt(example);
    setError(null);
  };

  const wordCount = userPrompt.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <span>Describe Your Contract Needs</span>
          </CardTitle>
          <p className="text-gray-600">
            Tell us what kind of contract you want to create. Our AI will analyze your needs 
            and suggest the best template to get started.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">
              What kind of contract do you want to create?
            </Label>
            <Textarea
              id="prompt"
              placeholder="Describe your contract needs in detail..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={analyzing || parentLoading}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Be as specific as possible about your requirements</span>
              <span>{wordCount} words</span>
            </div>
          </div>

          {/* Example prompts */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Example prompts:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleUseExample(example)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border text-sm transition-colors"
                  disabled={analyzing || parentLoading}
                >
                  &quot;{example}&quot;
                </button>
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Analyze button */}
          <Button
            onClick={handleAnalyzePrompt}
            disabled={userPrompt.trim().length < 10 || analyzing || parentLoading}
            className="w-full flex items-center space-x-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing your requirements...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Requirements</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span>AI Analysis Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiAnalysis.can_handle ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Great news!</strong> {aiAnalysis.reasoning}
                  </AlertDescription>
                </Alert>

                {aiAnalysis.suggested_templates && aiAnalysis.suggested_templates.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Recommended Templates:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiAnalysis.suggested_templates.slice(0, 3).map((template: any) => (
                        <div 
                          key={template.template_id} 
                          className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-blue-900">
                              {template.name}
                            </h5>
                            {template.confidence_score && (
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {Math.round(template.confidence_score * 100)}% match
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-700">
                            {template.template_data?.description || 'No description available'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      // Move to step 2 with the analysis results
                      onComplete({
                        user_prompt: userPrompt,
                        ai_analysis: aiAnalysis
                      });
                    }}
                  >
                    Continue to Template Selection
                  </Button>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {aiAnalysis.unsupported_message || 
                   "Unfortunately, we don't currently support this type of contract. Please try a different description or contact support."}
                </AlertDescription>
              </Alert>
            )}

            {/* Extracted keywords */}
            {aiAnalysis.extracted_keywords && aiAnalysis.extracted_keywords.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Extracted Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.extracted_keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
