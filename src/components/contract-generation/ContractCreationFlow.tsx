'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';

// Import step components
import Step1InitialPrompt from './steps/Step1InitialPrompt';
import Step2TemplateSelection from './steps/Step2TemplateSelection';
import Step3ContractRequirements from './steps/Step3';
import Step4CustomClauses from './steps/Step4CustomClauses';
import Step5FinalReview from './steps/Step5FinalReview';

// Import types
import { 
  ContractSession, 
  Step1Data, 
  Step2Data, 
  Step3Data, 
  Step4Data, 
  Step5Data,
  ContractError 
} from './types';

interface ContractCreationFlowProps {
  onComplete?: (session: ContractSession) => void;
  onCancel?: () => void;
  existingSessionId?: string;
}

const STEPS = [
  { id: 1, name: 'Initial Prompt', description: 'Describe your contract needs' },
  { id: 2, name: 'Template Selection', description: 'Choose a contract template' },
  { id: 3, name: 'Clause Creation', description: 'Generate and review mandatory clauses' },
  { id: 4, name: 'Custom Clauses', description: 'Add optional and custom clauses' },
  { id: 5, name: 'Final Review', description: 'Review and complete contract' },
];

export default function ContractCreationFlow({ 
  onComplete, 
  onCancel, 
  existingSessionId 
}: ContractCreationFlowProps) {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [contractSession, setContractSession] = useState<ContractSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ContractError | null>(null);
  
  // Step data states
  const [step1Data, setStep1Data] = useState<Step1Data>({ user_prompt: '' });
  const [step2Data, setStep2Data] = useState<Step2Data>({ available_templates: [] });
  const [step3Data, setStep3Data] = useState<Step3Data>({ 
    user_explanation: '', 
    mandatory_fields: {
      party1: {
        app_id: '',
        name: '',
        email: '',
        party_type: 'individual'
      },
      contract_details: {
        jurisdiction: 'Kenya'
      }
    },
    generated_clauses: [],
    current_clause_index: 0
  });
  const [step4Data, setStep4Data] = useState<Step4Data>({ 
    optional_clauses: [], 
    custom_clauses: [],
    selected_optional_clauses: []
  });
  const [step5Data, setStep5Data] = useState<Step5Data>({ 
    contract_preview: {
      html_content: '',
      legal_compliance_score: 0,
      risk_assessment: {},
      kenyan_law_compliance: false,
      final_contract_text: ''
    },
    final_contract: null
  });

  // Load existing session if provided
  useEffect(() => {
    if (existingSessionId) {
      loadExistingSession(existingSessionId);
    }
  }, [existingSessionId]);

  const loadExistingSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading existing session:', sessionId);
      
      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${sessionId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load session');
      }

      const session = await response.json();
      
      console.log('Loaded session data:', session);
      
      setContractSession(session);
      
      // Use validated current_step from backend (which includes Step 3 completion validation)
      const validatedStep = session.current_step || 1;
      setCurrentStep(validatedStep);
      
      console.log(`📍 Setting current step to: ${validatedStep}`);
      
      // If we're resuming Step 3 and have resume data, log it
      if (validatedStep === 3 && session.step3_resume_data) {
        console.log('📋 Step 3 resume data available:', session.step3_resume_data);
      }
      
      // Load step data from session if available
      loadStepDataFromSession(session);
      
    } catch (error: any) {
      console.error('Error loading existing session:', error);
      setError({ 
        message: `Failed to load session: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStepDataFromSession = (session: ContractSession) => {
    const sessionData = session.session_data || {};
    
    console.log('Loading step data from session:', sessionData);
    
    // Load step 1 data
    if (sessionData.initial_prompt || session.initial_user_prompt) {
      setStep1Data({ 
        user_prompt: sessionData.initial_prompt || session.initial_user_prompt || '',
        ai_analysis: sessionData.ai_analysis 
      });
    }
    
    // Load step 2 data
    if (sessionData.selected_template) {
      setStep2Data({ 
        selected_template: sessionData.selected_template,
        available_templates: sessionData.available_templates || []
      });
    }
    
    // Load step 3 data
    if (sessionData.mandatory_fields || sessionData.generated_clauses) {
      setStep3Data(prevData => ({
        ...prevData,
        user_explanation: sessionData.user_explanation || '',
        mandatory_fields: sessionData.mandatory_fields || prevData.mandatory_fields,
        generated_clauses: sessionData.generated_clauses || [],
        current_clause_index: sessionData.current_clause_index || 0
      }));
    }
    
    // Load step 4 data
    if (sessionData.optional_clauses || sessionData.custom_clauses) {
      setStep4Data(prevData => ({
        ...prevData,
        optional_clauses: sessionData.optional_clauses || [],
        custom_clauses: sessionData.custom_clauses || [],
        selected_optional_clauses: sessionData.selected_optional_clauses || []
      }));
    }
    
    // Load step 5 data
    if (sessionData.contract_preview || sessionData.final_contract) {
      setStep5Data(prevData => ({
        ...prevData,
        contract_preview: sessionData.contract_preview || prevData.contract_preview,
        final_contract: sessionData.final_contract || null
      }));
    }
  };

  const handleStepComplete = async (stepNumber: number, stepData: any) => {
    try {
      setLoading(true);
      setError(null);

      // Update the appropriate step data state
      switch (stepNumber) {
        case 1:
          setStep1Data(stepData as Step1Data);
          break;
        case 2:
          setStep2Data(stepData as Step2Data);
          break;
        case 3:
          setStep3Data(stepData as Step3Data);
          break;
        case 4:
          setStep4Data(stepData as Step4Data);
          break;
        case 5:
          setStep5Data(stepData as Step5Data);
          break;
      }

      // Move to next step if not the last step
      if (stepNumber < STEPS.length) {
        setCurrentStep(stepNumber + 1);
      } else {
        // Contract completion
        if (onComplete && contractSession) {
          onComplete(contractSession);
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      setError({ message: 'Failed to complete step' });
    } finally {
      setLoading(false);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateProgress = () => {
    return ((currentStep - 1) / (STEPS.length - 1)) * 100;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1InitialPrompt
            data={step1Data}
            onComplete={(data) => handleStepComplete(1, data)}
            onSessionCreated={setContractSession}
            loading={loading}
          />
        );
      case 2:
        return (
          <Step2TemplateSelection
            data={step2Data}
            session={contractSession}
            onComplete={(data) => handleStepComplete(2, data)}
            onSessionUpdated={setContractSession}
            loading={loading}
          />
        );
      case 3:
        return (
          <Step3ContractRequirements
            data={step3Data}
            session={contractSession}
            onComplete={(data) => handleStepComplete(3, data)}
            onSessionUpdated={setContractSession}
            loading={loading}
          />
        );
      case 4:
        return (
          <Step4CustomClauses
            data={step4Data}
            session={contractSession}
            onComplete={(data) => handleStepComplete(4, data)}
            onSessionUpdated={setContractSession}
            loading={loading}
          />
        );
      case 5:
        return (
          <Step5FinalReview
            data={step5Data}
            session={contractSession}
            onComplete={(data) => handleStepComplete(5, data)}
            onSessionUpdated={setContractSession}
            loading={loading}
          />
        );
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Legal Contract</h1>
          <p className="text-gray-600 mt-1">
            AI-powered contract generation for Kenyan legal standards
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Progress Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(calculateProgress())}% Complete
              </span>
            </div>
            
            <Progress value={calculateProgress()} className="w-full" />
            
            {/* Step indicators */}
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 ${
                    step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step.id < currentStep 
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : step.id === currentStep
                      ? 'border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">{step.name}</div>
                    <div className="text-xs text-gray-500 hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Current Step Content */}
      <div className="min-h-[500px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleStepBack}
              disabled={currentStep <= 1 || loading}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {contractSession && (
                <span>
                  Session: {contractSession.id.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
