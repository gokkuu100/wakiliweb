/**
 * Contract Generation Context - State Management
 * Manages the complete contract creation workflow state
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  Contract, 
  ContractTemplate, 
  ContractClause, 
  ContractWitness,
  ContractStatus,
  ContractSuggestionRequest,
  ContractSuggestionResponse,
  ContractCreate
} from './contractsApi';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ContractGenerationState {
  // Current workflow step
  currentStep: number;
  totalSteps: number;
  
  // User input and template selection
  userInput: string;
  suggestedTemplates: ContractTemplate[];
  selectedTemplate: ContractTemplate | null;
  templateSuggestions: ContractSuggestionResponse | null;
  
  // Contract creation
  currentContract: Contract | null;
  contractClauses: ContractClause[];
  
  // Clause management
  mandatoryClauses: ContractClause[];
  optionalClauses: ContractClause[];
  customClauses: ContractClause[];
  currentClause: ContractClause | null;
  clauseBeingEdited: string | null;
  
  // Witness management
  witnesses: ContractWitness[];
  
  // AI assistance
  aiAssistanceActive: boolean;
  aiSuggestions: string[];
  aiTokensUsed: number;
  aiCostUsd: number;
  
  // UI state
  loading: boolean;
  error: string | null;
  success: string | null;
  showAIHelp: boolean;
  completionPercentage: number;
  
  // Form data
  contractFormData: Partial<ContractCreate>;
  recipientData: {
    app_id?: string;
    email?: string;
    name?: string;
  };
}

export type ContractGenerationAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_USER_INPUT'; payload: string }
  | { type: 'SET_SUGGESTED_TEMPLATES'; payload: ContractTemplate[] }
  | { type: 'SET_TEMPLATE_SUGGESTIONS'; payload: ContractSuggestionResponse }
  | { type: 'SET_SELECTED_TEMPLATE'; payload: ContractTemplate }
  | { type: 'SET_CURRENT_CONTRACT'; payload: Contract }
  | { type: 'SET_CONTRACT_CLAUSES'; payload: ContractClause[] }
  | { type: 'UPDATE_CLAUSE'; payload: ContractClause }
  | { type: 'SET_CURRENT_CLAUSE'; payload: ContractClause | null }
  | { type: 'SET_CLAUSE_BEING_EDITED'; payload: string | null }
  | { type: 'SET_WITNESSES'; payload: ContractWitness[] }
  | { type: 'ADD_WITNESS'; payload: ContractWitness }
  | { type: 'SET_AI_ASSISTANCE_ACTIVE'; payload: boolean }
  | { type: 'SET_AI_SUGGESTIONS'; payload: string[] }
  | { type: 'UPDATE_AI_USAGE'; payload: { tokens: number; cost: number } }
  | { type: 'SET_SHOW_AI_HELP'; payload: boolean }
  | { type: 'SET_COMPLETION_PERCENTAGE'; payload: number }
  | { type: 'SET_CONTRACT_FORM_DATA'; payload: Partial<ContractCreate> }
  | { type: 'SET_RECIPIENT_DATA'; payload: { app_id?: string; email?: string; name?: string } }
  | { type: 'RESET_STATE' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' };

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ContractGenerationState = {
  currentStep: 1,
  totalSteps: 8,
  userInput: '',
  suggestedTemplates: [],
  selectedTemplate: null,
  templateSuggestions: null,
  currentContract: null,
  contractClauses: [],
  mandatoryClauses: [],
  optionalClauses: [],
  customClauses: [],
  currentClause: null,
  clauseBeingEdited: null,
  witnesses: [],
  aiAssistanceActive: false,
  aiSuggestions: [],
  aiTokensUsed: 0,
  aiCostUsd: 0,
  loading: false,
  error: null,
  success: null,
  showAIHelp: false,
  completionPercentage: 0,
  contractFormData: {},
  recipientData: {},
};

// =============================================================================
// REDUCER
// =============================================================================

function contractGenerationReducer(
  state: ContractGenerationState,
  action: ContractGenerationAction
): ContractGenerationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SUCCESS':
      return { ...state, success: action.payload, error: null };
    
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SET_USER_INPUT':
      return { ...state, userInput: action.payload };
    
    case 'SET_SUGGESTED_TEMPLATES':
      return { ...state, suggestedTemplates: action.payload };
    
    case 'SET_TEMPLATE_SUGGESTIONS':
      return { ...state, templateSuggestions: action.payload };
    
    case 'SET_SELECTED_TEMPLATE':
      return { ...state, selectedTemplate: action.payload };
    
    case 'SET_CURRENT_CONTRACT':
      return { ...state, currentContract: action.payload };
    
    case 'SET_CONTRACT_CLAUSES':
      const clauses = action.payload;
      return {
        ...state,
        contractClauses: clauses,
        mandatoryClauses: clauses.filter(c => c.is_mandatory),
        optionalClauses: clauses.filter(c => !c.is_mandatory && c.clause_type !== 'custom'),
        customClauses: clauses.filter(c => c.clause_type === 'custom'),
      };
    
    case 'UPDATE_CLAUSE':
      const updatedClauses = state.contractClauses.map(clause =>
        clause.id === action.payload.id ? action.payload : clause
      );
      return {
        ...state,
        contractClauses: updatedClauses,
        mandatoryClauses: updatedClauses.filter(c => c.is_mandatory),
        optionalClauses: updatedClauses.filter(c => !c.is_mandatory && c.clause_type !== 'custom'),
        customClauses: updatedClauses.filter(c => c.clause_type === 'custom'),
      };
    
    case 'SET_CURRENT_CLAUSE':
      return { ...state, currentClause: action.payload };
    
    case 'SET_CLAUSE_BEING_EDITED':
      return { ...state, clauseBeingEdited: action.payload };
    
    case 'SET_WITNESSES':
      return { ...state, witnesses: action.payload };
    
    case 'ADD_WITNESS':
      return { ...state, witnesses: [...state.witnesses, action.payload] };
    
    case 'SET_AI_ASSISTANCE_ACTIVE':
      return { ...state, aiAssistanceActive: action.payload };
    
    case 'SET_AI_SUGGESTIONS':
      return { ...state, aiSuggestions: action.payload };
    
    case 'UPDATE_AI_USAGE':
      return {
        ...state,
        aiTokensUsed: state.aiTokensUsed + action.payload.tokens,
        aiCostUsd: state.aiCostUsd + action.payload.cost,
      };
    
    case 'SET_SHOW_AI_HELP':
      return { ...state, showAIHelp: action.payload };
    
    case 'SET_COMPLETION_PERCENTAGE':
      return { ...state, completionPercentage: action.payload };
    
    case 'SET_CONTRACT_FORM_DATA':
      return { 
        ...state, 
        contractFormData: { ...state.contractFormData, ...action.payload } 
      };
    
    case 'SET_RECIPIENT_DATA':
      return { 
        ...state, 
        recipientData: { ...state.recipientData, ...action.payload } 
      };
    
    case 'NEXT_STEP':
      return { 
        ...state, 
        currentStep: Math.min(state.currentStep + 1, state.totalSteps) 
      };
    
    case 'PREVIOUS_STEP':
      return { 
        ...state, 
        currentStep: Math.max(state.currentStep - 1, 1) 
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface ContractGenerationContextType {
  state: ContractGenerationState;
  dispatch: React.Dispatch<ContractGenerationAction>;
  
  // Helper functions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetState: () => void;
  updateContractFormData: (data: Partial<ContractCreate>) => void;
  updateRecipientData: (data: { app_id?: string; email?: string; name?: string }) => void;
  calculateCompletionPercentage: () => void;
  
  // Workflow helpers
  isStepCompleted: (step: number) => boolean;
  isStepAccessible: (step: number) => boolean;
  getStepStatus: (step: number) => 'completed' | 'current' | 'upcoming' | 'locked';
}

const ContractGenerationContext = createContext<ContractGenerationContextType | undefined>(undefined);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export function ContractGenerationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(contractGenerationReducer, initialState);

  // Helper functions
  const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading });
  const setError = (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error });
  const setSuccess = (success: string | null) => dispatch({ type: 'SET_SUCCESS', payload: success });
  const goToStep = (step: number) => dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  const nextStep = () => dispatch({ type: 'NEXT_STEP' });
  const previousStep = () => dispatch({ type: 'PREVIOUS_STEP' });
  const resetState = () => dispatch({ type: 'RESET_STATE' });
  
  const updateContractFormData = (data: Partial<ContractCreate>) => {
    dispatch({ type: 'SET_CONTRACT_FORM_DATA', payload: data });
  };
  
  const updateRecipientData = (data: { app_id?: string; email?: string; name?: string }) => {
    dispatch({ type: 'SET_RECIPIENT_DATA', payload: data });
  };

  const calculateCompletionPercentage = () => {
    let percentage = 0;
    const stepWeights = [10, 15, 25, 25, 10, 10, 5]; // Weights for each step
    
    // Step 1: User input (10%)
    if (state.userInput.length > 20) percentage += stepWeights[0];
    
    // Step 2: Template selection (15%)
    if (state.selectedTemplate) percentage += stepWeights[1];
    
    // Step 3: Contract creation (25%)
    if (state.currentContract) {
      percentage += stepWeights[2] * (state.currentContract.mandatory_completion_percentage / 100);
    }
    
    // Step 4: Clause completion (25%)
    if (state.mandatoryClauses.length > 0) {
      const approvedMandatory = state.mandatoryClauses.filter(c => c.approved_by_first_party).length;
      percentage += stepWeights[3] * (approvedMandatory / state.mandatoryClauses.length);
    }
    
    // Step 5: Optional clauses (10%)
    if (state.optionalClauses.some(c => c.approved_by_first_party)) percentage += stepWeights[4];
    
    // Step 6: Recipient (10%)
    if (state.recipientData.app_id || state.recipientData.email) percentage += stepWeights[5];
    
    // Step 7: Final review (5%)
    if (state.currentContract?.status === ContractStatus.READY_FOR_REVIEW) percentage += stepWeights[6];
    
    dispatch({ type: 'SET_COMPLETION_PERCENTAGE', payload: Math.round(percentage) });
  };

  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 1: return state.userInput.length > 20 && state.selectedTemplate !== null;
      case 2: return state.selectedTemplate !== null;
      case 3: return state.currentContract !== null;
      case 4: return state.mandatoryClauses.every(c => c.approved_by_first_party);
      case 5: return true; // Optional step
      case 6: return Boolean(state.recipientData.app_id || state.recipientData.email);
      case 7: return state.currentContract?.status === ContractStatus.READY_FOR_REVIEW;
      case 8: return state.currentContract?.status === ContractStatus.FULLY_SIGNED;
      default: return false;
    }
  };

  const isStepAccessible = (step: number): boolean => {
    if (step === 1) return true;
    if (step === 2) return state.userInput.length > 20;
    if (step === 3) return state.selectedTemplate !== null;
    if (step === 4) return state.currentContract !== null;
    if (step === 5) return isStepCompleted(4);
    if (step === 6) return isStepCompleted(4); // Can skip optional clauses
    if (step === 7) return isStepCompleted(6);
    if (step === 8) return isStepCompleted(7);
    return false;
  };

  const getStepStatus = (step: number): 'completed' | 'current' | 'upcoming' | 'locked' => {
    if (isStepCompleted(step)) return 'completed';
    if (step === state.currentStep) return 'current';
    if (isStepAccessible(step)) return 'upcoming';
    return 'locked';
  };

  // Update completion percentage when relevant state changes
  useEffect(() => {
    calculateCompletionPercentage();
  }, [
    state.userInput,
    state.selectedTemplate,
    state.currentContract,
    state.mandatoryClauses,
    state.optionalClauses,
    state.recipientData,
  ]);

  const contextValue: ContractGenerationContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    setSuccess,
    goToStep,
    nextStep,
    previousStep,
    resetState,
    updateContractFormData,
    updateRecipientData,
    calculateCompletionPercentage,
    isStepCompleted,
    isStepAccessible,
    getStepStatus,
  };

  return (
    <ContractGenerationContext.Provider value={contextValue}>
      {children}
    </ContractGenerationContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useContractGeneration() {
  const context = useContext(ContractGenerationContext);
  if (context === undefined) {
    throw new Error('useContractGeneration must be used within a ContractGenerationProvider');
  }
  return context;
}

// =============================================================================
// WORKFLOW STEP DEFINITIONS
// =============================================================================

export const WORKFLOW_STEPS = [
  {
    id: 1,
    title: 'Describe Your Need',
    description: 'Tell us what kind of contract you need',
    icon: '💬',
    component: 'UserInputStep',
  },
  {
    id: 2,
    title: 'Choose Template',
    description: 'Select from AI-suggested contract templates',
    icon: '📋',
    component: 'TemplateSelectionStep',
  },
  {
    id: 3,
    title: 'Contract Details',
    description: 'Provide basic contract information',
    icon: '📝',
    component: 'ContractDetailsStep',
  },
  {
    id: 4,
    title: 'Mandatory Clauses',
    description: 'Review and approve required clauses',
    icon: '⚖️',
    component: 'MandatoryClausesStep',
  },
  {
    id: 5,
    title: 'Optional Clauses',
    description: 'Add additional clauses as needed',
    icon: '➕',
    component: 'OptionalClausesStep',
  },
  {
    id: 6,
    title: 'Add Recipient',
    description: 'Specify the other party',
    icon: '👥',
    component: 'RecipientStep',
  },
  {
    id: 7,
    title: 'Final Review',
    description: 'Review the complete contract',
    icon: '🔍',
    component: 'FinalReviewStep',
  },
  {
    id: 8,
    title: 'Sign & Execute',
    description: 'Sign and execute the contract',
    icon: '✍️',
    component: 'SignatureStep',
  },
];

export const getStepByComponent = (componentName: string) => {
  return WORKFLOW_STEPS.find(step => step.component === componentName);
};

export const getStepById = (id: number) => {
  return WORKFLOW_STEPS.find(step => step.id === id);
};
