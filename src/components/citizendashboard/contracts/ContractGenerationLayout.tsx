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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Contract Generation
                </h1>
              </div>
            </div>

            {/* Center - Progress */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Step {state.currentStep} of {state.totalSteps}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {state.completionPercentage}% Complete
                  </span>
                </div>
                <Progress value={state.completionPercentage} className="h-2" />
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              {/* AI Usage Stats */}
              <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Bot className="h-4 w-4" />
                  <span>{state.aiTokensUsed.toLocaleString()} tokens</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${state.aiCostUsd.toFixed(4)}</span>
                </div>
              </div>

              {/* Save Status */}
              {lastSaved && (
                <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}

              {/* AI Assistant Toggle */}
              <Button
                variant={state.showAIHelp ? "default" : "outline"}
                size="sm"
                onClick={() => {/* Toggle AI panel */}}
                className="hidden md:flex"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>

              {/* Save & Exit */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndExit}
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          {showSidebar && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <ContractSidebar />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Status Messages */}
            {state.error && (
              <div className="mb-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              </div>
            )}

            {state.success && (
              <div className="mb-6">
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{state.success}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step Navigation Breadcrumb */}
            <div className="mb-6">
              <nav className="flex space-x-2 overflow-x-auto pb-2">
                {WORKFLOW_STEPS.map((step, index) => {
                  const status = getStepStatus(step.id);
                  const isClickable = isStepAccessible(step.id);
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => isClickable && handleStepNavigation(step.id)}
                      disabled={!isClickable}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                        ${status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : status === 'current'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : status === 'upcoming'
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          : 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600 cursor-not-allowed'
                        }
                      `}
                    >
                      <span className="text-lg">{step.icon}</span>
                      <span className="hidden sm:inline">{step.title}</span>
                      {status === 'completed' && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {status === 'current' && state.loading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Step Content */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <span className="text-2xl">{currentStepData?.icon}</span>
                      <span>{currentStepData?.title}</span>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {currentStepData?.description}
                    </CardDescription>
                  </div>
                  
                  {/* Step Actions */}
                  <div className="flex items-center space-x-2">
                    {state.aiAssistanceActive && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Active
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* Show help */}}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div key={state.currentStep}>
                  {CurrentStepComponent && <CurrentStepComponent />}
                </div>
              </CardContent>

              {/* Step Navigation Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={state.currentStep === 1 || state.loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-2">
                    {/* Mobile Progress */}
                    <div className="md:hidden flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{state.currentStep}/{state.totalSteps}</span>
                      <div className="w-20">
                        <Progress value={state.completionPercentage} className="h-1" />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={state.currentStep === state.totalSteps || !isStepCompleted(state.currentStep) || state.loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
            </Card>

            {/* Contract Summary Card */}
            {state.currentContract && (
              <div className="mt-6">
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {state.currentContract.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Contract #{state.currentContract.contract_number}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Created {new Date(state.currentContract.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {state.currentContract.contract_value && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {new Intl.NumberFormat('en-KE', {
                                style: 'currency',
                                currency: 'KES'
                              }).format(state.currentContract.contract_value)}
                            </span>
                          </div>
                        )}
                        
                        <Badge variant="outline" className="text-xs">
                          {state.currentContract.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* AI Assistant Panel */}
          {state.showAIHelp && (
            <div className="hidden xl:block w-80 flex-shrink-0">
              <AIAssistantPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
