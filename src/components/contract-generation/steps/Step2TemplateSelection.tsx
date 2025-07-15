'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, FileText, Star, ArrowRight } from 'lucide-react';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';

import { 
  Step2Data, 
  ContractTemplate, 
  ContractSession, 
  CreateSessionRequest,
  AIAnalysisResult 
} from '../types';

interface Step2TemplateSelectionProps {
  data: Step2Data;
  session: ContractSession | null;
  onComplete: (data: Step2Data) => void;
  onSessionUpdated: (session: ContractSession) => void;
  loading: boolean;
}

export default function Step2TemplateSelection({ 
  data, 
  session,
  onComplete, 
  onSessionUpdated,
  loading: parentLoading 
}: Step2TemplateSelectionProps) {
  const [availableTemplates, setAvailableTemplates] = useState<ContractTemplate[]>(data.available_templates || []);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | undefined>(data.selected_template);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  console.log('Step2 - Component initialized with availableTemplates:', availableTemplates.length);

  // Load templates from AI analysis if available
  useEffect(() => {
    console.log('Step2 - useEffect triggered');
    console.log('Step2 - session:', session);
    console.log('Step2 - session.ai_analysis_data:', session?.ai_analysis_data);
    
    if (session?.ai_analysis_data) {
      console.log('Step2 - AI analysis data found');
      // Check if we have suggested templates from AI analysis
      let suggestedTemplates: ContractTemplate[] = [];
      
      if (session.ai_analysis_data.suggested_templates) {
        console.log('Step2 - Processing suggested templates:', session.ai_analysis_data.suggested_templates);
        // Convert AI analysis format to ContractTemplate format
        suggestedTemplates = session.ai_analysis_data.suggested_templates.map((template: any) => {
          console.log('Step2 - Raw template data:', template);
          console.log('Step2 - Template keys:', Object.keys(template));
          
          const relevanceScore = Number(template.confidence_score) || 0; // Backend uses confidence_score
          const matchPercentage = Math.round(relevanceScore * 100);
          console.log('Step2 - Converting template:', template.name, 'confidence_score:', relevanceScore, 'match_percentage:', matchPercentage);
          
          return {
            id: template.template_id,
            template_name: template.name, // Backend uses 'name' instead of 'template_name'
            contract_type: template.template_type || 'unknown',
            description: template.template_data?.description || 'No description available',
            keywords: template.template_data?.keywords || [],
            use_cases: template.template_data?.use_cases || [],
            mandatory_clauses: template.template_data?.mandatory_clauses || {},
            optional_clauses: template.template_data?.optional_clauses || {},
            is_active: true,
            match_percentage: matchPercentage,
            confidence: template.confidence,
            explanation: template.reasoning, // Backend uses 'reasoning' instead of 'explanation'
            estimated_completion_time: template.estimated_completion_time,
            complexity: template.complexity
          };
        });
        
        console.log('Step2 - Converted templates:', suggestedTemplates);
      }
      
      // Filter templates with score >= 70% (0.7 relevance score)
      const filteredTemplates = suggestedTemplates.filter(template => {
        const matchPercentage = Number(template.match_percentage) || 0;
        console.log('Step2 - Filtering template:', template.template_name, 'match_percentage:', matchPercentage, 'type:', typeof matchPercentage, 'passes filter:', matchPercentage >= 70);
        return matchPercentage >= 70; // Back to 70% threshold
      });
      
      console.log('Step2 - Filtered templates (>=70%):', filteredTemplates);
      
      // Force re-render by setting a slightly different state
      if (filteredTemplates.length > 0) {
        console.log('Step2 - Setting available templates:', filteredTemplates);
        setAvailableTemplates([...filteredTemplates]); // Create new array to force re-render
        console.log('Step2 - Available templates after setting:', filteredTemplates);
      } else {
        console.log('Step2 - No templates meet threshold, showing all templates anyway');
        console.log('Step2 - All suggested templates:', suggestedTemplates);
        setAvailableTemplates([...suggestedTemplates]); // Create new array to force re-render
        console.log('Step2 - Available templates after setting all:', suggestedTemplates);
      }
    } else {
      console.log('Step2 - No AI analysis data found');
    }
  }, [session]);

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setError(null);
  };

  const handleCreateSession = async () => {
    if (!selectedTemplate) {
      setError('Please select a template to continue');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const requestData: CreateSessionRequest = {
        template_id: selectedTemplate.id,
        initial_prompt: session?.initial_user_prompt || '',
        ai_analysis_data: session?.ai_analysis_data || {} as AIAnalysisResult
      };

      const response = await makeAuthenticatedRequest('/api/contract-generation/create-session', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create contract session');
      }

      const newSession: ContractSession = await response.json();
      
      // Update session
      onSessionUpdated(newSession);
      
      // Complete step with selected template
      const stepData: Step2Data = {
        selected_template: selectedTemplate,
        available_templates: availableTemplates
      };

      onComplete(stepData);

    } catch (error) {
      console.error('Error creating session:', error);
      setError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const getConfidenceScore = (template: ContractTemplate) => {
    // Use the match_percentage from the template (already converted from relevance_score)
    return template.match_percentage || 0;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getRecommendationBadge = (template: ContractTemplate) => {
    const score = getConfidenceScore(template);
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800">Highly Recommended</Badge>;
    }
    if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">Good Match</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Alternative</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Select Contract Template</span>
          </CardTitle>
          <p className="text-gray-600">
            Based on your requirements, we&apos;ve identified the best contract templates. 
            Select the one that best matches your needs.
            <br />
            <small className="text-blue-600">Found {availableTemplates.length} template(s)</small>
          </p>
        </CardHeader>
        <CardContent>
          {/* AI Reasoning */}
          {session?.ai_analysis_data?.analysis_reasoning && (
            <Alert className="mb-4">
              <Star className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Analysis:</strong> {session.ai_analysis_data.analysis_reasoning}
              </AlertDescription>
            </Alert>
          )}

          {availableTemplates.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No templates are currently available. Please contact support.
                <br />
                <small>Debug: availableTemplates length: {availableTemplates.length}</small>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                const confidenceScore = getConfidenceScore(template);
                
                return (
                  <div
                    key={template.id}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Recommendation badge */}
                    <div className="mb-3">
                      {getRecommendationBadge(template)}
                    </div>

                    {/* Template info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">
                        {template.template_name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.description}
                      </p>

                      {/* AI Explanation */}
                      {template.explanation && (
                        <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                          <p className="text-xs text-blue-800">
                            <strong>Why this matches:</strong> {template.explanation}
                          </p>
                        </div>
                      )}

                      {/* Confidence score */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Match Score</span>
                        <div className={`px-2 py-1 rounded-full text-xs border ${getConfidenceColor(confidenceScore)}`}>
                          {Math.round(confidenceScore)}%
                        </div>
                      </div>

                      {/* Complexity and Time */}
                      {(template.complexity || template.estimated_completion_time) && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {template.complexity && (
                            <span>Complexity: <strong className="text-gray-700">{template.complexity}</strong></span>
                          )}
                          {template.estimated_completion_time && (
                            <span>Time: <strong className="text-gray-700">{template.estimated_completion_time}</strong></span>
                          )}
                        </div>
                      )}

                      {/* Keywords */}
                      {template.keywords && template.keywords.length > 0 && (
                        <div className="pt-2">
                          <div className="flex flex-wrap gap-1">
                            {template.keywords.slice(0, 3).map((keyword, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {keyword}
                              </span>
                            ))}
                            {template.keywords.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{template.keywords.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Use cases */}
                      {template.use_cases && template.use_cases.length > 0 && (
                        <div className="pt-1">
                          <p className="text-xs text-gray-500">
                            <strong>Best for:</strong> {template.use_cases[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Next button */}
          {availableTemplates.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={handleCreateSession}
                disabled={!selectedTemplate || creating || parentLoading}
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Contract Session...</span>
                  </>
                ) : (
                  <>
                    <span>Start Contract Creation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              
              {selectedTemplate && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Starting with: <strong>{selectedTemplate.template_name}</strong>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected template details */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Template Overview</h4>
              <p className="text-gray-600">{selectedTemplate.description}</p>
            </div>

            {selectedTemplate.use_cases && selectedTemplate.use_cases.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Common Use Cases</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedTemplate.use_cases.map((useCase, index) => (
                    <li key={index} className="text-sm text-gray-600">{useCase}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Contract Type: <strong>{selectedTemplate.contract_type}</strong></span>
              <span>Match Score: <strong>{Math.round(getConfidenceScore(selectedTemplate))}%</strong></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
