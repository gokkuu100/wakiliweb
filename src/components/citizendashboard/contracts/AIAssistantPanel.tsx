/**
 * AI Assistant Panel - Contextual AI Help Component
 * Provides step-specific guidance and AI assistance during contract creation
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Send, 
  Loader2, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileText,
  Scale,
  Users,
  Shield,
  Clock,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

import { useContractGeneration, WORKFLOW_STEPS } from './ContractGenerationContext';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface AIMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  stepContext?: number;
}

interface AISuggestion {
  id: string;
  type: 'tip' | 'warning' | 'legal-note' | 'recommendation';
  title: string;
  content: string;
  actionable?: boolean;
  action?: () => void;
}

// =============================================================================
// STEP-SPECIFIC AI GUIDANCE
// =============================================================================

const STEP_GUIDANCE = {
  1: { // User Input
    title: "Describe Your Contract Need",
    tips: [
      "Be specific about the type of agreement you need",
      "Include key parties involved and their roles", 
      "Mention any specific terms or requirements",
      "Consider the purpose and scope of the contract"
    ],
    legalNotes: [
      "Kenyan contract law requires clear offer and acceptance",
      "Consider capacity of parties to enter contracts",
      "Ensure the purpose is legal and not against public policy"
    ]
  },
  2: { // Template Selection
    title: "Choose the Right Template",
    tips: [
      "Review template descriptions carefully",
      "Consider complexity vs your specific needs",
      "Check if template covers your key requirements",
      "Think about future modifications you might need"
    ],
    legalNotes: [
      "Different contract types have different legal requirements",
      "Some agreements may require specific formalities",
      "Consider registration requirements for certain contracts"
    ]
  },
  3: { // Contract Details
    title: "Define Contract Basics",
    tips: [
      "Use clear, unambiguous language",
      "Define all technical terms",
      "Be specific about dates and deadlines",
      "Include clear contact information"
    ],
    legalNotes: [
      "Contract terms must be certain and complete",
      "Avoid contradictory clauses",
      "Ensure compliance with applicable regulations"
    ]
  },
  4: { // Mandatory Clauses
    title: "Essential Legal Clauses",
    tips: [
      "Review each mandatory clause carefully",
      "Understand the legal implications",
      "Customize clauses to fit your situation",
      "Don't skip required clauses"
    ],
    legalNotes: [
      "Mandatory clauses protect all parties legally",
      "Missing essential clauses may invalidate the contract",
      "Some clauses are required by Kenyan law"
    ]
  },
  5: { // Optional Clauses
    title: "Additional Protections",
    tips: [
      "Consider potential risks and disputes",
      "Add clauses for specific scenarios",
      "Think about termination conditions",
      "Include dispute resolution mechanisms"
    ],
    legalNotes: [
      "Optional clauses can provide additional security",
      "Consider force majeure clauses",
      "Include governing law and jurisdiction clauses"
    ]
  },
  6: { // Recipients
    title: "Manage Contract Parties",
    tips: [
      "Verify all party details are accurate",
      "Ensure proper authority to sign",
      "Include witness requirements if needed",
      "Set up notification preferences"
    ],
    legalNotes: [
      "All parties must have legal capacity",
      "Corporate parties need proper authorization",
      "Consider witness requirements for validity"
    ]
  },
  7: { // Final Review
    title: "Review Before Signing",
    tips: [
      "Read the entire contract carefully",
      "Check all details and amounts",
      "Verify party information",
      "Ensure all clauses are understood"
    ],
    legalNotes: [
      "Final review is your last chance to make changes",
      "Once signed, modifications require agreement from all parties",
      "Consider legal advice for complex contracts"
    ]
  },
  8: { // Signature
    title: "Execute the Contract",
    tips: [
      "Ensure all parties are ready to sign",
      "Follow the signing order if specified",
      "Download copies after completion",
      "Set up monitoring and reminders"
    ],
    legalNotes: [
      "Digital signatures are legally binding in Kenya",
      "Ensure proper authentication of signatories",
      "Keep signed copies in a safe place"
    ]
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

interface AIAssistantPanelProps {
  className?: string;
  onClose?: () => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export function AIAssistantPanel({ 
  className = '',
  onClose,
  minimized = false,
  onToggleMinimize
}: AIAssistantPanelProps) {
  const { state } = useContractGeneration();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'guidance' | 'suggestions'>('guidance');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStepGuidance = STEP_GUIDANCE[state.currentStep as keyof typeof STEP_GUIDANCE];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add system message when step changes
  useEffect(() => {
    if (currentStepGuidance) {
      const systemMessage: AIMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `Step ${state.currentStep}: ${currentStepGuidance.title}`,
        timestamp: new Date(),
        stepContext: state.currentStep
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  }, [state.currentStep, currentStepGuidance]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      stepContext: state.currentStep
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual AI API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      const aiResponse: AIMessage = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: `I understand you're asking about "${userMessage.content}". Based on the current step (${WORKFLOW_STEPS[state.currentStep - 1]?.title}), here are some suggestions that might help...`,
        timestamp: new Date(),
        stepContext: state.currentStep
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        stepContext: state.currentStep
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate contextual suggestions
  const getContextualSuggestions = (): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];

    if (currentStepGuidance) {
      // Add tips as suggestions
      currentStepGuidance.tips.forEach((tip, index) => {
        suggestions.push({
          id: `tip-${index}`,
          type: 'tip',
          title: 'Helpful Tip',
          content: tip
        });
      });

      // Add legal notes as warnings
      currentStepGuidance.legalNotes.forEach((note, index) => {
        suggestions.push({
          id: `legal-${index}`,
          type: 'legal-note',
          title: 'Legal Consideration',
          content: note
        });
      });
    }

    return suggestions;
  };

  if (minimized) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm">AI Assistant</CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`w-80 h-[calc(100vh-200px)] flex flex-col ${className}`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-md">
              <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm">AI Legal Assistant</CardTitle>
              <CardDescription className="text-xs">
                Step {state.currentStep}: {currentStepGuidance?.title}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-3">
          {[
            { id: 'guidance', label: 'Guide', icon: HelpCircle },
            { id: 'suggestions', label: 'Tips', icon: Lightbulb },
            { id: 'chat', label: 'Chat', icon: MessageSquare }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 h-8 text-xs"
            >
              <tab.icon className="h-3 w-3 mr-1" />
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
        {/* Guidance Tab */}
        {activeTab === 'guidance' && currentStepGuidance && (
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    What to do in this step
                  </h3>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  {currentStepGuidance.title}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">
                  Helpful Tips
                </h4>
                <div className="space-y-2">
                  {currentStepGuidance.tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-green-800 dark:text-green-200">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">
                  Legal Considerations
                </h4>
                <div className="space-y-2">
                  {currentStepGuidance.legalNotes.map((note, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                      <Scale className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {getContextualSuggestions().map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-2 rounded border text-xs ${
                    suggestion.type === 'tip'
                      ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200'
                      : suggestion.type === 'warning'
                      ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200'
                      : suggestion.type === 'legal-note'
                      ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-200'
                      : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200'
                  }`}
                >
                  <div className="flex items-center space-x-1 mb-1">
                    {suggestion.type === 'tip' && <Lightbulb className="h-3 w-3" />}
                    {suggestion.type === 'warning' && <AlertTriangle className="h-3 w-3" />}
                    {suggestion.type === 'legal-note' && <Scale className="h-3 w-3" />}
                    {suggestion.type === 'recommendation' && <CheckCircle className="h-3 w-3" />}
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                  <p>{suggestion.content}</p>
                  {suggestion.actionable && suggestion.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={suggestion.action}
                      className="mt-2 h-6 text-xs"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-xs ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.type === 'system'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 italic'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {message.content}
                      <div className="mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator />

            {/* Chat Input */}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about contracts..."
                className="flex-1 h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-8 w-8 p-0"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
