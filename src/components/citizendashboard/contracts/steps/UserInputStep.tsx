/**
 * User Input Step - Step 1
 * Collects user requirements and suggests appropriate contract templates
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Loader2, 
  Lightbulb, 
  ArrowRight,
  Mic,
  MicOff,
  Bot,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

import { useContractGeneration } from '../ContractGenerationContext';
import { contractTemplatesApi, ContractSuggestionRequest } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface SuggestionExample {
  title: string;
  description: string;
  example: string;
  category: string;
}

// =============================================================================
// EXAMPLE SUGGESTIONS
// =============================================================================

const SUGGESTION_EXAMPLES: SuggestionExample[] = [
  {
    title: 'Non-Disclosure Agreement',
    description: 'Protect confidential information',
    example: 'I want to protect my business idea when discussing it with potential investors and partners. I need them to keep all information confidential.',
    category: 'Business Protection'
  },
  {
    title: 'Service Agreement',
    description: 'Define service delivery terms',
    example: 'I need a contract for my web design services. I charge KSH 50,000 per project and need clear payment terms and project scope.',
    category: 'Service Provider'
  },
  {
    title: 'Employment Contract',
    description: 'Hire employees with clear terms',
    example: 'I want to hire a full-time marketing manager for my company. Salary is KSH 80,000 per month with benefits and probation period.',
    category: 'Employment'
  },
  {
    title: 'Rental Agreement',
    description: 'Property rental terms',
    example: 'I want to rent out my 2-bedroom apartment in Nairobi for KSH 40,000 per month. Need deposit and tenant obligations clearly stated.',
    category: 'Real Estate'
  },
  {
    title: 'Sale Agreement',
    description: 'Buy or sell property/goods',
    example: 'I am selling my car for KSH 800,000. Need a contract that protects both buyer and seller with clear transfer terms.',
    category: 'Sales'
  },
  {
    title: 'Partnership Agreement',
    description: 'Business partnership terms',
    example: 'Starting a tech startup with my co-founder. We need to define equity split, responsibilities, and decision-making processes.',
    category: 'Business'
  }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UserInputStep() {
  const {
    state,
    dispatch,
    setLoading,
    setError,
    setSuccess,
    nextStep,
  } = useContractGeneration();

  const [userInput, setUserInput] = useState(state.userInput || '');
  const [isRecording, setIsRecording] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [selectedExample, setSelectedExample] = useState<SuggestionExample | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Update word count
  useEffect(() => {
    setWordCount(userInput.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [userInput]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  const handleInputChange = (value: string) => {
    setUserInput(value);
    dispatch({ type: 'SET_USER_INPUT', payload: value });
    
    // Hide examples once user starts typing
    if (value.length > 20 && showExamples) {
      setShowExamples(false);
    }
  };

  const handleExampleSelect = (example: SuggestionExample) => {
    setSelectedExample(example);
    setUserInput(example.example);
    dispatch({ type: 'SET_USER_INPUT', payload: example.example });
    setShowExamples(false);
    
    // Focus on textarea for editing
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Voice input is not supported in your browser');
      return;
    }

    try {
      if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          // Here you would send the audio to a speech-to-text service
          // For now, we'll just show a placeholder
          setError('Voice transcription service not yet implemented');
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } else {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      }
    } catch (error) {
      setError('Failed to access microphone');
      setIsRecording(false);
    }
  };

  const handleAnalyzeInput = async () => {
    if (userInput.length < 20) {
      setError('Please provide more details about your contract needs (at least 20 characters)');
      return;
    }

    setIsAnalyzing(true);
    setLoading(true);
    setError(null);

    try {
      const suggestionRequest: ContractSuggestionRequest = {
        user_input: userInput,
        complexity_preference: 'moderate',
        urgency_level: 'medium'
      };

      const suggestions = await contractTemplatesApi.suggestTemplates(suggestionRequest);
      
      dispatch({ type: 'SET_TEMPLATE_SUGGESTIONS', payload: suggestions });
      dispatch({ type: 'SET_SUGGESTED_TEMPLATES', payload: suggestions.suggested_templates });
      
      setSuccess(`Found ${suggestions.suggested_templates.length} suitable contract templates`);
      
      // Automatically proceed to next step
      setTimeout(() => {
        nextStep();
      }, 1500);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze your request');
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  const getInputValidation = () => {
    if (userInput.length === 0) {
      return { isValid: false, message: 'Please describe what kind of contract you need' };
    }
    if (userInput.length < 20) {
      return { isValid: false, message: 'Please provide more details (at least 20 characters)' };
    }
    if (wordCount < 5) {
      return { isValid: false, message: 'Please use at least 5 words to describe your needs' };
    }
    return { isValid: true, message: 'Great! Your description looks good' };
  };

  const validation = getInputValidation();

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Describe Your Contract Needs
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Tell us in your own words what kind of contract you need. Our AI will analyze your requirements 
          and suggest the best templates to get you started.
        </p>
      </div>

      {/* Examples Section */}
      {showExamples && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Need inspiration? Try these examples:
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Hide examples
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUGGESTION_EXAMPLES.map((example, index) => (
              <div key={example.title}>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-blue-200 dark:hover:border-blue-700"
                  onClick={() => handleExampleSelect(example)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {example.category}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <CardTitle className="text-sm font-medium">
                      {example.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {example.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      "{example.example}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-4">
        {selectedExample && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Selected example: <strong>{selectedExample.title}</strong>. 
              Feel free to edit the text below to match your specific needs.
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Example: I need a contract to protect my business idea when discussing it with potential investors. They should keep all information confidential and not use it for their own benefit..."
            className="min-h-[150px] text-base leading-relaxed resize-none pr-20"
            disabled={isAnalyzing}
          />
          
          {/* Voice Input Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVoiceInput}
            disabled={isAnalyzing}
            className={`absolute bottom-3 right-3 ${
              isRecording 
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400' 
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            }`}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Input Stats and Validation */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-500 dark:text-gray-400">
              {wordCount} words, {userInput.length} characters
            </span>
            {isRecording && (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Recording...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {validation.isValid ? (
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>{validation.message}</span>
              </div>
            ) : userInput.length > 0 ? (
              <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{validation.message}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* AI Analysis Button */}
      <div className="flex items-center justify-center">
        <Button
          onClick={handleAnalyzeInput}
          disabled={!validation.isValid || isAnalyzing}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Find Suitable Contracts
            </>
          )}
        </Button>
      </div>

      {/* Help Section */}
      <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Tips for better results:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Be specific about what you want to achieve</li>
                <li>• Mention the type of business or situation</li>
                <li>• Include any important terms (money, timeline, location)</li>
                <li>• Describe the other party (individual, company, etc.)</li>
                <li>• Mention any special requirements or concerns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results Preview */}
      {state.templateSuggestions && (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <Bot className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Analysis Complete:</strong> {state.templateSuggestions.analysis_summary}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Found Contract Templates</CardTitle>
              <CardDescription>
                Based on your description, we found {state.suggestedTemplates.length} suitable templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {state.suggestedTemplates.slice(0, 4).map((template) => (
                  <div key={template.id} className="p-3 border rounded-lg">
                    <h5 className="font-medium text-sm">{template.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {template.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {template.contract_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
