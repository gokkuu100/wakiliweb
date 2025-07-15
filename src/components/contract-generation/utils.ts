// Utility functions for contract generation
import { ContractClause, MandatoryFields, ContractSession } from './types';

export const validateStep1Data = (userPrompt: string): { isValid: boolean; error?: string } => {
  if (!userPrompt || userPrompt.trim().length < 10) {
    return { isValid: false, error: 'Please provide a more detailed description (at least 10 characters)' };
  }
  return { isValid: true };
};

export const validateStep3Data = (
  explanation: string, 
  mandatoryFields: MandatoryFields
): { isValid: boolean; error?: string } => {
  const wordCount = explanation.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  if (wordCount < 200) {
    return { 
      isValid: false, 
      error: `Contract explanation must contain at least 200 words. Current: ${wordCount} words.` 
    };
  }

  if (!mandatoryFields.party1.app_id || !mandatoryFields.party1.app_id.trim()) {
    return { isValid: false, error: 'First party App ID is required' };
  }

  return { isValid: true };
};

export const calculateStepProgress = (currentStep: number, totalSteps: number = 5): number => {
  return Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
};

export const formatContractType = (contractType: string): string => {
  return contractType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getStepName = (stepNumber: number): string => {
  const stepNames = {
    1: 'Initial Prompt',
    2: 'Template Selection', 
    3: 'Clause Creation',
    4: 'Custom Clauses',
    5: 'Final Review'
  };
  return stepNames[stepNumber as keyof typeof stepNames] || 'Unknown Step';
};

export const getStepDescription = (stepNumber: number): string => {
  const stepDescriptions = {
    1: 'Describe your contract needs',
    2: 'Choose a contract template',
    3: 'Generate and review mandatory clauses',
    4: 'Add optional and custom clauses',
    5: 'Review and complete contract'
  };
  return stepDescriptions[stepNumber as keyof typeof stepDescriptions] || 'Unknown Step';
};

export const isStepComplete = (stepNumber: number, session: ContractSession | null): boolean => {
  if (!session) return false;
  
  const sessionData = session.session_data || {};
  
  switch (stepNumber) {
    case 1:
      return !!sessionData.initial_prompt && !!sessionData.ai_analysis;
    case 2:
      return !!sessionData.selected_template;
    case 3:
      return !!sessionData.contract_analysis && !!sessionData.contract_analysis.ai_generated_clauses;
    case 4:
      return session.current_step >= 4;
    case 5:
      return session.current_step >= 5;
    default:
      return false;
  }
};

export const getClauseStatusColor = (status: string): string => {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'rejected':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'editing':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'pending':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getComplianceScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getComplianceScoreText = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  return 'Needs Review';
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Unknown date';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// API helper functions
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const handleApiError = (error: any): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Contract generation specific utilities
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateCustomClause = (clause: { title: string; description: string }): boolean => {
  return clause.title.trim().length > 0 && clause.description.trim().length > 0;
};

export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const sanitizeHTML = (html: string): string => {
  // Basic HTML sanitization - in production, use a proper sanitization library
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export const generateContractFileName = (sessionId: string, contractType: string): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const shortSessionId = sessionId.slice(0, 8);
  return `${contractType}_contract_${shortSessionId}_${timestamp}.pdf`;
};
