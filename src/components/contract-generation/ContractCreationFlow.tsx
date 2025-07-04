/**
 * Contract Creation Flow Component
 * Step-by-step process for creating contracts with AI assistance
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Send,
  Lightbulb,
  MessageSquare,
  Bot,
  Check,
  ChevronRight,
  Download,
  Plus,
  Eye,
  FileDown,
  Loader2
} from 'lucide-react';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Step definitions
interface WorkflowStep {
  id: number;
  name: string;
  title: string;
  description: string;
}

// Contract session interface
interface ContractSession {
  id: string;
  user_id: string;
  session_status: string;
  initial_user_prompt?: string;
  current_stage: string;
  current_stage_name: string;
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  contract_title?: string;
  contract_type?: string;
  contract_id?: string;
}

// Template suggestion interface
interface ContractTemplateSuggestion {
  template_id: string;
  template_name: string;
  contract_type: string;
  confidence_score: number;
  matching_keywords: string[];
  reasoning: string;
  description: string;
  use_cases: string[];
}

// Analysis result interface
interface AnalysisResult {
  suggested_templates: ContractTemplateSuggestion[];
  extracted_keywords: string[];
  contract_intent: string;
  analysis_summary: string;
  confidence_level: string;
  ai_analysis_timestamp: string;
}

// Clause interface
interface ContractClause {
  clause_id: string;
  clause_title: string;
  clause_description: string;
  ai_generated_content: string;
  confidence_score: number;
  variables: string[];
  is_mandatory: boolean;
  kenyan_law_reference: string;
  category: string;
  order: number;
}

// Component props
interface ContractCreationFlowProps {
  sessionId: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

// Sample prompting examples
const PROMPT_EXAMPLES = [
  "I want to protect this idea I have from being stolen by people who I talk to",
  "I need to hire a new employee for my company and want a proper employment contract",
  "I want to rent out my property and need a rental agreement",
  "I'm providing consulting services and need a service agreement",
  "I want to sell my car and need a sale agreement"
];

// Workflow steps
const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 1, name: 'initial_prompt', title: 'Describe Your Needs', description: 'Tell us what you want to create' },
  { id: 2, name: 'template_selection', title: 'AI Template Suggestion', description: 'Review AI-suggested templates' },
  { id: 3, name: 'mandatory_clauses', title: 'Essential Clauses', description: 'Review mandatory contract terms' },
  { id: 4, name: 'optional_clauses', title: 'Additional Terms', description: 'Add optional clauses' },
  { id: 5, name: 'review', title: 'Final Review', description: 'Review complete contract' },
  { id: 6, name: 'completion', title: 'Contract Ready', description: 'Download and share your contract' }
];

// Custom styles
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.4s ease-in-out forwards;
  }
  
  .animate-slideUp {
    animation: slideUp 0.5s ease-out forwards;
  }
  
  .contract-document h1 {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .contract-document h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  .contract-document p {
    margin-bottom: 0.75rem;
    line-height: 1.6;
  }
`;

export function ContractCreationFlow({ sessionId, onComplete, onCancel }: ContractCreationFlowProps) {
  // Component state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [session, setSession] = useState<ContractSession | null>(null);
  const [mandatoryClauses, setMandatoryClauses] = useState<ContractClause[]>([]);
  const [currentClause, setCurrentClause] = useState<ContractClause | null>(null);
  const [clauseModification, setClauseModification] = useState<string>('');
  const [approvedClauses, setApprovedClauses] = useState<string[]>([]);
  
  // New states for enhanced functionality
  const [optionalClauses, setOptionalClauses] = useState<ContractClause[]>([]);
  const [selectedOptionalClauses, setSelectedOptionalClauses] = useState<string[]>([]);
  const [contractPreview, setContractPreview] = useState<string>('');
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [contractSections, setContractSections] = useState<any[]>([]);
  const [finalContract, setFinalContract] = useState<any>(null);
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'sections' | 'document'>('sections');

  // Refs
  const stepSectionRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null, null, null]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect for loading existing session
  useEffect(() => {
    if (sessionId) {
      loadExistingSession(sessionId);
    }
  }, [sessionId]);

  // Effect to check viewport size
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Function to load existing session
  const loadExistingSession = async (id: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading your contract session...');

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Fetch session details
      console.log('Calling getSessionDetails API...');
      const sessionData = await ContractCreationAPI.getSessionDetails(id);
      
      console.log('Loaded session data:', sessionData);
      console.log('Session data type:', typeof sessionData);
      
      if (!sessionData) {
        throw new Error('Session not found or empty response');
      }
      
      // Check if sessionData has the required fields
      if (typeof sessionData !== 'object') {
        console.error('Invalid session data format:', typeof sessionData, sessionData);
        throw new Error('Invalid session data format received');
      }
      
      setSession(sessionData);

      // Resume from the exact step stored in the database
      const resumeStep = sessionData.current_step || 1;
      const currentStage = sessionData.current_stage || 'initial_prompt';
      
      console.log(`Resuming session at step ${resumeStep}, stage: ${currentStage}`);
      
      // Set basic session data
      setUserPrompt(sessionData.initial_user_prompt || '');
      
      // Load analysis data if available
      if (sessionData.ai_analysis_data) {
        setAnalysisResult(sessionData.ai_analysis_data);
      } else if (sessionData.session_data?.ai_analysis) {
        setAnalysisResult(sessionData.session_data.ai_analysis);
      }
      
      // Set selected template if available
      if (sessionData.selected_template_id) {
        setSelectedTemplateId(sessionData.selected_template_id);
      }
      
      // Handle different steps
      if (resumeStep >= 2 && sessionData.ai_analysis_data && !sessionData.selected_template_id) {
        // Step 2: Template selection stage - user has analysis but hasn't selected template yet
        setCurrentStep(2);
      } else if (resumeStep >= 2 && sessionData.selected_template_id) {
        // User has selected template, should proceed to mandatory clauses (step 3)
        setCurrentStep(3);
        
        // Load mandatory clauses if available in session data
        if (sessionData.clauses) {
          const mandatoryOnes = sessionData.clauses.filter((c: any) => c.clause_type === 'mandatory');
          setMandatoryClauses(mandatoryOnes);
          
          // Set approved clauses
          const approved = mandatoryOnes
            .filter((c: any) => c.user_approved)
            .map((c: any) => c.clause_id);
          setApprovedClauses(approved);
          
          // Find first unapproved clause if any
          const nextUnapproved = mandatoryOnes.find((c: any) => !c.user_approved);
          if (nextUnapproved) {
            setCurrentClause({
              clause_id: nextUnapproved.clause_id,
              clause_title: nextUnapproved.clause_title,
              clause_description: '',
              ai_generated_content: nextUnapproved.ai_generated_content,
              confidence_score: nextUnapproved.ai_confidence_score || 0,
              variables: [],
              is_mandatory: true,
              kenyan_law_reference: '',
              category: nextUnapproved.clause_type,
              order: nextUnapproved.clause_order
            });
          }
        } else {
          // No clauses in session data, need to generate them
          console.log('Session has template but no clauses, will need to generate mandatory clauses');
          // The mandatory clauses will be generated when the component renders step 3
        }
      } else if (resumeStep >= 4) {
        // Step 4 or higher: Optional clauses
        setCurrentStep(4);
        await loadOptionalClauses(id);
      } else if (resumeStep >= 5) {
        // Step 5: Review
        setCurrentStep(5);
        await loadContractPreview(id);
      } else if (resumeStep >= 6 || currentStage === 'completed') {
        // Step 6: Completed
        setCurrentStep(6);
        if (sessionData.contract_id) {
          setFinalContract({
            contract_id: sessionData.contract_id,
            contract_title: sessionData.contract_title
          });
        }
      } else {
        // Default to step 1 if no other conditions match
        setCurrentStep(1);
      }
      
      // Scroll to the resumed step after a brief delay
      setTimeout(() => {
        const stepIndex = (sessionData.current_step || 1) - 1;
        if (stepSectionRefs.current[stepIndex]) {
          stepSectionRefs.current[stepIndex].scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (error: any) {
      console.error('Error loading session:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('Authentication')) {
        setError('Authentication failed. Please log in again.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check if the backend is running.');
      } else if (error.message?.includes('404')) {
        setError('Session not found. It may have been deleted.');
      } else if (error.message?.includes('Session not found')) {
        setError('Session not found or expired.');
      } else {
        setError(error.message || 'Failed to load contract session. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to analyze user prompt
  const analyzeUserPrompt = async (prompt: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Analyzing your request with AI...');
      setError(null);

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Call API to analyze prompt
      const result = await ContractCreationAPI.analyzePrompt(prompt);
      
      setAnalysisResult(result);
      setCurrentStep(2); // Move to template selection step

      // Scroll to next step
      setTimeout(() => {
        stepSectionRefs.current[1]?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error('Error analyzing prompt:', error);
      setError(error.message || 'Failed to analyze your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create session with selected template

  // Function to generate clause content
  const generateClauseContent = async (clauseId: string, userContext = {}) => {
    try {
      if (!session?.id) return;
      
      setIsLoading(true);
      setLoadingMessage('Generating clause content with AI...');
      setError(null);

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      if (!session?.id) {
        setError('No active session found');
        return;
      }

      // Call API to generate clause content
      const result = await ContractCreationAPI.generateClause(
        session.id,
        clauseId,
        userContext
      );
      
      setCurrentClause(result);
      
    } catch (error: any) {
      console.error('Error generating clause:', error);
      setError(error.message || 'Failed to generate clause content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to approve a clause
  const approveClause = async (clauseId: string, userModifications: string | null = null) => {
    try {
      if (!session?.id) return;
      
      setIsLoading(true);
      setLoadingMessage('Saving your approval...');
      setError(null);

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      if (!session?.id) {
        setError('No active session found');
        return;
      }

      // Call API to approve clause
      const result = await ContractCreationAPI.approveClause(
        session.id,
        clauseId,
        userModifications
      );
      
      // Add to approved clauses
      setApprovedClauses(prev => [...prev, clauseId]);
      
      // Check if all mandatory clauses are complete
      if (result.mandatory_complete) {
        // Move to optional clauses step
        setCurrentStep(4);
        
        // Load optional clauses
        if (session?.id) {
          await loadOptionalClauses(session.id);
        }
        
        setTimeout(() => {
          stepSectionRefs.current[3]?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        // Find next unapproved clause
        const nextClause = mandatoryClauses.find(c => 
          !approvedClauses.includes(c.clause_id) && c.clause_id !== clauseId
        );
        
        if (nextClause) {
          await generateClauseContent(nextClause.clause_id);
        }
      }
      
      // Reset modification
      setClauseModification('');
      
    } catch (error: any) {
      console.error('Error approving clause:', error);
      setError(error.message || 'Failed to approve clause. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load optional clauses
  const loadOptionalClauses = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading optional clauses...');

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Load optional clauses
      const result = await ContractCreationAPI.generateOptionalClauses(sessionId);
      
      setOptionalClauses(result.optional_clauses || []);
      setSelectedOptionalClauses(result.selected_optional_clauses || []);
      
    } catch (error: any) {
      console.error('Error loading optional clauses:', error);
      setError(error.message || 'Failed to load optional clauses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle optional clause selection
  const toggleOptionalClause = async (clauseId: string) => {
    try {
      if (!session?.id) return;
      
      setIsLoading(true);
      
      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Call API to add or remove optional clause
      if (!session?.id) {
        setError('No active session found');
        return;
      }

      await ContractCreationAPI.addOptionalClause(session.id, clauseId);
      
      // Update state locally
      if (selectedOptionalClauses.includes(clauseId)) {
        setSelectedOptionalClauses(prev => prev.filter(id => id !== clauseId));
      } else {
        setSelectedOptionalClauses(prev => [...prev, clauseId]);
      }
      
    } catch (error: any) {
      console.error('Error updating optional clause:', error);
      setError(error.message || 'Failed to update optional clause. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load contract preview
  const loadContractPreview = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Generating contract preview...');

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Get contract preview
      const result = await ContractCreationAPI.getContractPreview(sessionId);
      
      setContractSections(result.sections || []);
      setContractPreview(result.preview_html || '');
      
    } catch (error: any) {
      console.error('Error getting contract preview:', error);
      setError(error.message || 'Failed to generate contract preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to finalize contract
  const finalizeContract = async () => {
    try {
      if (!session?.id) return;
      
      setIsLoading(true);
      setLoadingMessage('Finalizing your contract...');

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Call API to finalize contract
      if (!session?.id) {
        setError('No active session found');
        return;
      }

      const result = await ContractCreationAPI.finalizeContract(session.id, {
        finalization_timestamp: new Date().toISOString(),
        user_approved: true
      });
      
      setFinalContract(result);
      setCurrentStep(6);
      
      setTimeout(() => {
        stepSectionRefs.current[5]?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error: any) {
      console.error('Error finalizing contract:', error);
      setError(error.message || 'Failed to finalize contract. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to download contract PDF
  const downloadContractPdf = async () => {
    try {
      if (!finalContract?.contract_id) return;
      
      setIsPdfGenerating(true);
      
      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Get download info (now async)
      const downloadInfo = await ContractCreationAPI.downloadContractPDF(finalContract.contract_id);
      
      // Create a hidden anchor element
      const link = document.createElement('a');
      link.href = downloadInfo.downloadUrl;
      
      // Add authentication headers (browser will handle this correctly)
      // This is just to indicate headers would be included in the fetch
      const headers = downloadInfo.getDownloadHeaders();
      
      // Set filename
      link.download = `Contract-${finalContract.contract_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      setError(error.message || 'Failed to download contract PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Function to handle user prompt submission
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) {
      setError('Please describe what type of contract you need.');
      return;
    }
    await analyzeUserPrompt(userPrompt);
  };

  // Function to handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    // Don't immediately create session - wait for user to click "Next"
  };

  // Function to proceed with selected template and create session
  const handleProceedWithTemplate = async () => {
    if (!selectedTemplateId) {
      setError('Please select a template first');
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingMessage('Creating your contract session...');
      setError(null);

      const { ContractCreationAPI } = await import('@/lib/contract-api');
      
      // Call API to create session
      const result = await ContractCreationAPI.createSession(
        selectedTemplateId,
        userPrompt,
        analysisResult
      );
      
      setSession(result);
      setMandatoryClauses(result.mandatory_clauses || []);
      
      // Set current clause if there are mandatory clauses
      if (result.mandatory_clauses?.length > 0) {
        setCurrentClause(result.mandatory_clauses[0]);
      }
      
      setCurrentStep(3); // Move to mandatory clauses step

      // Scroll to next step
      setTimeout(() => {
        stepSectionRefs.current[2]?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error('Error creating session:', error);
      setError(error.message || 'Failed to create contract session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle clause approval
  const handleApproveClause = () => {
    if (!currentClause) return;
    
    const hasModifications = clauseModification.trim().length > 0;
    approveClause(currentClause.clause_id, hasModifications ? clauseModification : null);
  };

  // Function to handle modifications to a clause
  const handleClauseModification = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setClauseModification(e.target.value);
  };

  // Function to handle selection of a different example prompt
  const handleSelectPromptExample = (example: string) => {
    setUserPrompt(example);
  };

  // Function to proceed to contract review
  const proceedToReview = async () => {
    if (!session?.id) return;
    
    setCurrentStep(5);
    await loadContractPreview(session.id);
    
    setTimeout(() => {
      stepSectionRefs.current[4]?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">{loadingMessage || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6" ref={containerRef}>
      {/* Add custom styles */}
      <style jsx global>{styles}</style>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {session ? 'Contract Creation Session' : 'Create New Contract'}
          </h1>
          <p className="text-muted-foreground">
            {session ? 
              <>
                Session ID: <span className="font-mono">{session.id?.substring(0, 8) || 'N/A'}...</span> • 
                <span className="ml-1">{
                  session.session_status?.charAt(0).toUpperCase() + session.session_status?.slice(1) || 'Unknown'
                }</span>
              </> : 
              'AI-powered contract generation'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isMobileView && (
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {WORKFLOW_STEPS.length} - 
              <span className="ml-1 font-medium">{WORKFLOW_STEPS[currentStep-1].title}</span>
            </div>
          )}
          <Button variant="ghost" onClick={onCancel} size={isMobileView ? "sm" : "default"}>
            <X className="mr-2 h-4 w-4" />
            {isMobileView ? 'Exit' : 'Cancel'}
          </Button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8" ref={containerRef}>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">
            {isMobileView ? `${Math.round((currentStep / WORKFLOW_STEPS.length) * 100)}%` :
              `Step ${currentStep} of ${WORKFLOW_STEPS.length}`
            }
          </span>
        </div>
        <Progress value={(currentStep / WORKFLOW_STEPS.length) * 100} />
        
        {/* Mobile step indicator */}
        {isMobileView && (
          <div className="mt-2 text-sm text-center text-muted-foreground">
            {WORKFLOW_STEPS[currentStep-1].title}
          </div>
        )}
        
        {/* Desktop step indicators */}
        {!isMobileView && (
          <div className="hidden md:flex justify-between mt-3">
            {WORKFLOW_STEPS.map((step) => (
              <div 
                key={step.id}
                className={`text-xs flex flex-col items-center max-w-[100px] ${
                  currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                }`}
                style={{ width: `${100 / WORKFLOW_STEPS.length}%` }}
              >
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mb-1 ${
                    currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className="text-center truncate w-full">{step.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Initial Prompt */}
      <div 
        ref={(el) => { stepSectionRefs.current[0] = el; }} 
        className="mb-8"
        style={{ opacity: currentStep >= 1 ? 1 : 0.5 }}
      >
        <div className="flex items-center mb-4">
          <Badge variant="outline" className="mr-2">Step 1</Badge>
          <h2 className="text-xl font-semibold">{WORKFLOW_STEPS[0].title}</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tell us what you need</CardTitle>
            <CardDescription>
              Describe the contract you want to create in plain language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPrompt}>
              <Textarea 
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                placeholder="I want to protect this idea I have from being stolen by people who I talk to..."
                className="min-h-32 mb-4"
                disabled={currentStep > 1}
              />
              
              {currentStep === 1 && (
                <>
                  <div className="text-sm text-muted-foreground mb-2">Examples you can try:</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {PROMPT_EXAMPLES.map((example, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectPromptExample(example)}
                        type="button"
                      >
                        {example.length > 40 ? example.substring(0, 40) + '...' : example}
                      </Button>
                    ))}
                  </div>
                </>
              )}
              
              {currentStep === 1 && (
                <Button type="submit" disabled={!userPrompt.trim()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze with AI
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Step 2: Template Selection */}
      {currentStep >= 2 && (
        <div 
          ref={(el) => { stepSectionRefs.current[1] = el; }} 
          className="mb-8"
          style={{ opacity: currentStep >= 2 ? 1 : 0.5 }}
        >
          <div className="flex items-center mb-4">
            <Badge variant="outline" className="mr-2">Step 2</Badge>
            <h2 className="text-xl font-semibold">{WORKFLOW_STEPS[1].title}</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Template Suggestions</CardTitle>
              <CardDescription>
                Based on your description, our AI suggests these contract templates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult && (
                <>
                  <Alert className="mb-4">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    <AlertDescription>{analysisResult.analysis_summary}</AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.suggested_templates.map((template, index) => {
                      const isSelected = selectedTemplateId === template.template_id;
                      const confidenceScore = Math.round(template.confidence_score);
                      const confidenceColor = 
                        confidenceScore > 70 ? "text-green-600" : 
                        confidenceScore > 40 ? "text-amber-600" : 
                        "text-red-600";
                        
                      return (
                        <Card 
                          key={template.template_id} 
                          className={`border-2 transition-all duration-200 hover:shadow-md ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <CardHeader className="pb-2 relative">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">
                                {template.template_name}
                              </CardTitle>
                              <Badge 
                                variant={isSelected ? "default" : "outline"}
                                className={isSelected ? "" : confidenceColor}
                              >
                                {confidenceScore}% match
                              </Badge>
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-0 right-0 mt-1 mr-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="pb-3">
                            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-sm font-medium flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  Best for:
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {template.use_cases.slice(0, 3).map((useCase, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {useCase}
                                    </Badge>
                                  ))}
                                  {template.use_cases.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{template.use_cases.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {template.matching_keywords.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium flex items-center">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Matching terms:
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {template.matching_keywords.slice(0, 3).map((keyword, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                    {template.matching_keywords.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{template.matching_keywords.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded mb-2">
                              <span className="font-medium">AI recommendation:</span> {template.reasoning}
                            </div>
                          </CardContent>
                          <CardFooter>
                            {currentStep === 2 && (
                              <Button 
                                onClick={() => handleSelectTemplate(template.template_id)} 
                                className="w-full"
                                variant={isSelected ? "default" : "outline"}
                                size={isMobileView ? "sm" : "default"}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Selected
                                  </>
                                ) : (
                                  <>
                                    Choose This Template
                                  </>
                                )}
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Next Button - appears when template is selected */}
                  {selectedTemplateId && currentStep === 2 && (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        onClick={handleProceedWithTemplate}
                        disabled={isLoading}
                        size="lg"
                        className="min-w-[200px]"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {loadingMessage || 'Creating Session...'}
                          </>
                        ) : (
                          <>
                            Proceed with Selected Template
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Mandatory Clauses */}
      {currentStep >= 3 && (
        <div 
          ref={(el) => { stepSectionRefs.current[2] = el; }} 
          className="mb-8"
          style={{ opacity: currentStep >= 3 ? 1 : 0.5 }}
        >
          <div className="flex items-center mb-4">
            <Badge variant="outline" className="mr-2">Step 3</Badge>
            <h2 className="text-xl font-semibold">{WORKFLOW_STEPS[2].title}</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Essential Contract Clauses</CardTitle>
              <CardDescription>
                Review and approve each essential clause for your contract.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mandatoryClauses.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Clauses Progress</h4>
                    <span className="text-xs font-medium text-muted-foreground">
                      {approvedClauses.length} of {mandatoryClauses.length} approved
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mandatoryClauses.map((clause, index) => {
                      const isApproved = approvedClauses.includes(clause.clause_id);
                      const isCurrent = currentClause?.clause_id === clause.clause_id;
                      
                      return (
                        <Button
                          key={clause.clause_id}
                          variant={isApproved ? "default" : isCurrent ? "secondary" : "outline"}
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => generateClauseContent(clause.clause_id)}
                        >
                          {isApproved ? (
                            <Check className="mr-1 h-3 w-3" />
                          ) : (
                            <span className="w-3 h-3 flex items-center justify-center mr-1 text-xs">
                              {index + 1}
                            </span>
                          )}
                          {clause.clause_title}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <div className="w-full bg-secondary h-2 rounded-full mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(approvedClauses.length / mandatoryClauses.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {currentClause ? (
                <div className="animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
                    <div>
                      <h3 className="text-xl font-medium">{currentClause.clause_title}</h3>
                      {currentClause.clause_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentClause.clause_description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={currentClause.is_mandatory ? "default" : "outline"}>
                        {currentClause.is_mandatory ? 'Required' : 'Optional'}
                      </Badge>
                      <Badge variant="secondary" className="font-mono">
                        {currentClause.confidence_score}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 mb-6 bg-muted/30 relative">
                    <div className="absolute top-0 right-0 bg-muted rounded-bl-md px-2 py-1 text-xs flex items-center">
                      <Bot className="h-3 w-3 mr-1 text-primary" />
                      <span className="text-muted-foreground">AI Generated</span>
                    </div>
                    <div className="pt-6">
                      <p className="whitespace-pre-wrap leading-relaxed">{currentClause.ai_generated_content}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>Your Modifications (Optional)</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setClauseModification('')}
                        className="h-6 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Modify the clause text if needed, or leave empty to accept as-is"
                      className="min-h-32"
                      value={clauseModification}
                      onChange={handleClauseModification}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You can modify the clause text to better suit your needs or accept it as-is.
                    </p>
                  </div>
                  
                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentClause(null)} 
                      className="sm:w-auto"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Clauses
                    </Button>
                    <Button 
                      onClick={handleApproveClause} 
                      className="sm:w-auto"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {clauseModification ? 'Approve with Modifications' : 'Approve Clause'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-muted/20 rounded-lg max-w-md mx-auto">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Essential Contract Clauses</h3>
                  <p className="text-muted-foreground mb-4">
                    {approvedClauses.length > 0 ? 
                      `You've approved ${approvedClauses.length} of ${mandatoryClauses.length} essential clauses.` :
                      'Select a clause to review and approve it for your contract.'
                    }
                  </p>
                  {mandatoryClauses.length > 0 && approvedClauses.length === 0 && (
                    <Button 
                      onClick={() => generateClauseContent(mandatoryClauses[0].clause_id)}
                      className="mt-2"
                    >
                      Start with First Clause
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Optional Clauses */}
      {currentStep >= 4 && (
        <div 
          ref={(el) => { stepSectionRefs.current[3] = el; }} 
          className="mb-8"
          style={{ opacity: currentStep >= 4 ? 1 : 0.5 }}
        >
          <div className="flex items-center mb-4">
            <Badge variant="outline" className="mr-2">Step 4</Badge>
            <h2 className="text-xl font-semibold">{WORKFLOW_STEPS[3].title}</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Contract Clauses</CardTitle>
              <CardDescription>
                Enhance your contract with optional clauses as needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optionalClauses.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Select any additional clauses you would like to include in your contract.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Selected: {selectedOptionalClauses.length} of {optionalClauses.length}
                      </span>
                      <Badge variant="outline">
                        {Math.round((selectedOptionalClauses.length / optionalClauses.length) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {optionalClauses.map((clause) => {
                      const isSelected = selectedOptionalClauses.includes(clause.clause_id);
                      return (
                        <div 
                          key={clause.clause_id} 
                          className={`flex flex-col p-4 border rounded-md transition-colors duration-200 ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium">{clause.clause_title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {clause.clause_description}
                              </p>
                            </div>
                            <Switch 
                              checked={isSelected}
                              onCheckedChange={() => toggleOptionalClause(clause.clause_id)}
                              className="ml-2"
                            />
                          </div>
                          
                          {isSelected && (
                            <div className="text-sm bg-background border p-3 rounded mt-2">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-medium">Preview</p>
                                <Badge variant="secondary" className="text-xs">Selected</Badge>
                              </div>
                              <p className="whitespace-pre-wrap line-clamp-3">
                                {clause.ai_generated_content.substring(0, 150)}...
                              </p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs mt-1 w-full" 
                                onClick={() => {
                                  // Expand to show full content - this could open a dialog
                                  // or expand in-place with some state management
                                  alert(clause.ai_generated_content);
                                }}
                              >
                                View full text
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-3">
                    <div className="text-sm text-muted-foreground">
                      You've selected {selectedOptionalClauses.length} additional clauses
                    </div>
                    <Button onClick={proceedToReview}>
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Continue to Review
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="bg-muted/30 rounded-lg p-8 max-w-md mx-auto">
                    <p className="text-muted-foreground mb-3">
                      No optional clauses are available for this contract type.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your contract includes all the essential clauses already.
                      You can proceed to review your contract.
                    </p>
                    <Button 
                      onClick={proceedToReview}
                      className="mt-2"
                    >
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Continue to Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: Review */}
      {currentStep >= 5 && (
        <div 
          ref={(el) => { stepSectionRefs.current[4] = el; }} 
          className="mb-8"
          style={{ opacity: currentStep >= 5 ? 1 : 0.5 }}
        >
          <div className="flex items-center mb-4">
            <Badge variant="outline" className="mr-2">Step 5</Badge>
            <h2 className="text-xl font-semibold">{WORKFLOW_STEPS[4].title}</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Final Contract Review</CardTitle>
              <CardDescription>
                Review your complete contract before finalizing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contractSections.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
                    <h3 className="text-lg font-medium">Contract Preview</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant={previewMode === 'sections' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setPreviewMode('sections')}
                      >
                        Sections
                      </Button>
                      <Button 
                        variant={previewMode === 'document' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setPreviewMode('document')}
                      >
                        Document
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFullPreview(!showFullPreview)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showFullPreview ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md mb-6 overflow-hidden">
                    <div className="bg-muted p-3 border-b flex justify-between items-center">
                      <h3 className="font-medium">
                        {previewMode === 'sections' ? 'Contract Sections' : 'Complete Document'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {contractSections.length} sections
                      </span>
                    </div>
                    <ScrollArea className={`${showFullPreview ? 'h-[70vh]' : 'h-96'}`}>
                      {previewMode === 'sections' ? (
                        <div className="p-4">
                          {contractSections.map((section, index) => (
                            <div key={index} className="mb-6 pb-4 border-b last:border-b-0">
                              <h4 className="font-bold mb-2 text-primary">{section.title}</h4>
                              <p className="whitespace-pre-wrap">{section.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 max-w-3xl mx-auto bg-white shadow-sm">
                          {contractPreview ? (
                            <div 
                              className="contract-document" 
                              dangerouslySetInnerHTML={{ __html: contractPreview }}
                            ></div>
                          ) : (
                            <div>
                              <h1 className="text-2xl font-bold text-center mb-6">
                                {session?.contract_type?.replace(/_/g, ' ').toUpperCase() || 'CONTRACT AGREEMENT'}
                              </h1>
                              
                              {contractSections.map((section, index) => (
                                <div key={index} className="mb-6">
                                  <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                                  <p className="whitespace-pre-wrap text-justify">{section.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 justify-end">
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Print Preview
                    </Button>
                    <Button onClick={finalizeContract}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve and Finalize Contract
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  {contractPreview ? (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: contractPreview }}></div>
                      <Button 
                        onClick={finalizeContract}
                        className="mt-6"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve and Finalize Contract
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-4">Loading contract preview...</p>
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 6: Completion */}
      {currentStep >= 6 && (
        <div 
          ref={(el) => { stepSectionRefs.current[5] = el; }} 
          className="mb-8"
          style={{ opacity: currentStep >= 6 ? 1 : 0.5 }}
        >
          <div className="flex items-center mb-4">
            <Badge variant="outline" className="mr-2">Step 6</Badge>
            <h2 className="text-xl font-semibold">{WORKFLOW_STEPS[5].title}</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Ready!</CardTitle>
              <CardDescription>
                Your contract has been successfully created.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
              <p className="text-center text-muted-foreground mb-6 max-w-md">
                Your contract has been successfully created and is ready to use. You can download it in various formats or return to your dashboard.
              </p>
              
              <div className="w-full max-w-md bg-muted/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <span className="font-medium">Contract Details</span>
                  <Badge variant="outline">Completed</Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contract ID:</span>
                    <span className="font-mono">{finalContract?.contract_id?.substring(0, 8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Title:</span>
                    <span>{finalContract?.contract_title || session?.contract_type?.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-green-600">Ready for use</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <div className="flex-1">
                  <Button 
                    variant="outline"
                    onClick={downloadContractPdf}
                    disabled={isPdfGenerating || !finalContract?.contract_id}
                    className="w-full"
                  >
                    {isPdfGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Download PDF
                  </Button>
                </div>
                <div className="flex-1">
                  <Button onClick={onComplete} className="w-full">
                    Return to Dashboard
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-center text-muted-foreground">
                <p>Need to make changes? You can always access this contract from your dashboard.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ContractCreationFlow;
