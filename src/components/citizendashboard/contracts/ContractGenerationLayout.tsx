/**
 * Contract Generation Layout - Main Container
 * Production-level contract creation workflow with AI assistance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Bot,
  Sparkles,
  HelpCircle,
  FileText,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

import { useContractGeneration, WORKFLOW_STEPS } from './ContractGenerationContext';
import { AIAssistantPanel } from './AIAssistantPanel';
import { ContractSidebar } from './ContractSidebar';
import { 
  UserInputStep,
  TemplateSelectionStep,
  ContractDetailsStep,
  MandatoryClausesStep,
  OptionalClausesStep,
  RecipientStep,
  FinalReviewStep,
  SignatureStep
} from './steps';

// =============================================================================
// STEP COMPONENTS MAP
// =============================================================================

const StepComponents = {
  UserInputStep,
  TemplateSelectionStep,
  ContractDetailsStep,
  MandatoryClausesStep,
  OptionalClausesStep,
  RecipientStep,
  FinalReviewStep,
  SignatureStep,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContractGenerationLayout() {
  const {
    state,
    nextStep,
    previousStep,
    goToStep,
    setError,
    setSuccess,
    isStepCompleted,
    isStepAccessible,
    getStepStatus,
  } = useContractGeneration();

  const [showSidebar, setShowSidebar] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentStepData = WORKFLOW_STEPS.find(step => step.id === state.currentStep);
  const CurrentStepComponent = currentStepData ? StepComponents[currentStepData.component as keyof typeof StepComponents] : null;

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && state.currentContract) {
      const saveTimer = setTimeout(() => {
        // Auto-save logic here
        setLastSaved(new Date());
      }, 5000); // Save every 5 seconds

      return () => clearTimeout(saveTimer);
    }
  }, [state.currentContract, autoSave]);

  const handleStepNavigation = (stepId: number) => {
    if (isStepAccessible(stepId)) {
      goToStep(stepId);
    }
  };

  const handleNext = () => {
    if (state.currentStep < state.totalSteps) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (state.currentStep > 1) {
      previousStep();
    }
  };

  const handleSaveAndExit = () => {
    // Save current progress and navigate to contracts list
    setSuccess('Progress saved successfully');
    // Navigate to contracts list
  };

  return (
    <div className="p-6">
      {/* Simple Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Create Contract
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {state.currentStep} of {state.totalSteps}
            </span>
            <div className="w-32">
              <Progress value={state.completionPercentage} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {currentStepData?.icon} {currentStepData?.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {currentStepData?.description}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {CurrentStepComponent && <CurrentStepComponent />}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={state.currentStep === 1 || state.loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={state.currentStep === state.totalSteps || !isStepCompleted(state.currentStep) || state.loading}
        >
          {state.loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : state.currentStep === state.totalSteps ? (
            'Complete'
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
