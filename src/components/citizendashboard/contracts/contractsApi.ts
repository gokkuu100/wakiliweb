/**
 * Contract API Functions - Production Level
 * Complete API integration for AI Contract Generation System
 */

import { supabase } from "@/lib/supabase";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ContractTemplate {
  id: string;
  template_key: string;
  contract_type: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  jurisdiction: string;
  applicable_law: string;
  legal_requirements: string[];
  mandatory_clauses: any;
  optional_clauses: any;
  template_structure: any;
  ai_prompts: any;
  risk_factors: any;
  compliance_checklist: any;
  usage_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  template_id?: string;
  contract_type: string;
  interaction_type: string;
  creator_user_id: string;
  recipient_user_id?: string;
  title: string;
  description?: string;
  user_initial_request?: string;
  status: ContractStatus;
  current_step: number;
  total_steps: number;
  governing_law: string;
  jurisdiction: string;
  effective_date?: string;
  expiry_date?: string;
  auto_renewal: boolean;
  renewal_period_months?: number;
  contract_value?: number;
  currency: string;
  mandatory_clauses_completed: boolean;
  mandatory_completion_percentage: number;
  optional_clauses_selected: number;
  ai_tokens_used: number;
  ai_cost_usd: number;
  ai_generation_count: number;
  ai_modification_count: number;
  compliance_score?: number;
  risk_assessment?: any;
  final_document_url?: string;
  document_hash?: string;
  document_version: number;
  modification_count: number;
  max_modifications: number;
  last_modified_by?: string;
  last_modified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractClause {
  id: string;
  contract_id: string;
  template_clause_id?: string;
  clause_key: string;
  clause_name: string;
  clause_type: string;
  original_content?: string;
  current_content: string;
  user_input?: string;
  status: string;
  is_active: boolean;
  is_mandatory: boolean;
  version_number: number;
  parent_clause_id?: string;
  ai_generated: boolean;
  user_modified: boolean;
  modification_count: number;
  ai_tokens_used: number;
  approved_by_first_party: boolean;
  approved_by_second_party: boolean;
  approved_at?: string;
  sort_order: number;
  created_by?: string;
  modified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractWitness {
  id: string;
  contract_id: string;
  witness_user_id?: string;
  witness_name?: string;
  witness_email?: string;
  witness_phone?: string;
  witness_id_number?: string;
  witness_app_id?: string;
  witness_role: string;
  status: string;
  witness_type: string;
  invited_by: string;
  invited_at: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  confirmed_at?: string;
  confirmation_ip?: string;
  confirmation_device_info?: any;
  witness_statement?: string;
  physical_presence_required: boolean;
  physical_presence_confirmed: boolean;
  witness_capacity_verified: boolean;
  digital_signature?: string;
  signature_timestamp?: string;
  witness_verification_data?: any;
  legal_compliance_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractNotification {
  id: string;
  contract_id: string;
  recipient_id?: string;
  recipient_email?: string;
  recipient_app_id?: string;
  type: string;
  title: string;
  message: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  responded_at?: string;
  email_sent: boolean;
  push_sent: boolean;
  sms_sent: boolean;
  in_app_sent: boolean;
  clicked: boolean;
  action_taken?: string;
  metadata?: any;
  created_at: string;
}

export enum ContractStatus {
  DRAFT = 'draft',
  TEMPLATE_SELECTED = 'template_selected',
  MANDATORY_CLAUSES_PENDING = 'mandatory_clauses_pending',
  OPTIONAL_CLAUSES_PENDING = 'optional_clauses_pending',
  AI_REVIEW_PENDING = 'ai_review_pending',
  READY_FOR_REVIEW = 'ready_for_review',
  PENDING_FIRST_PARTY_APPROVAL = 'pending_first_party_approval',
  PENDING_SECOND_PARTY = 'pending_second_party',
  IN_NEGOTIATION = 'in_negotiation',
  MODIFICATION_REQUESTED = 'modification_requested',
  AI_MODIFICATION_PENDING = 'ai_modification_pending',
  PENDING_WITNESS_CONFIRMATION = 'pending_witness_confirmation',
  PENDING_SIGNATURES = 'pending_signatures',
  PARTIALLY_SIGNED = 'partially_signed',
  FULLY_SIGNED = 'fully_signed',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export interface ContractSuggestionRequest {
  user_input: string;
  contract_purpose?: string;
  expected_value?: number;
  duration_months?: number;
  parties_count?: number;
  complexity_preference?: 'simple' | 'moderate' | 'complex';
  urgency_level?: 'low' | 'medium' | 'high';
}

export interface ContractSuggestionResponse {
  suggested_templates: ContractTemplate[];
  analysis_summary: string;
  confidence_score: number;
  additional_recommendations: string[];
  estimated_completion_time: string;
  ai_tokens_used: number;
}

export interface ContractCreate {
  title?: string;
  description?: string;
  user_initial_request: string;
  contract_value?: number;
  start_date?: string;
  end_date?: string;
  auto_renewal?: boolean;
  metadata?: any;
}

export interface ClauseGenerationRequest {
  contract_id: string;
  clause_key: string;
  user_input?: string;
  additional_requirements?: string;
}

export interface ClauseModificationRequest {
  clause_id: string;
  modification_reason: string;
  suggested_changes: string;
  user_requirements?: string;
}

export interface WitnessInvitationRequest {
  contract_id: string;
  witness_app_id?: string;
  witness_email?: string;
  witness_name?: string;
  witness_role?: string;
}

export interface SignatureRequest {
  contract_id: string;
  signer_type: 'first_party' | 'second_party' | 'witness';
  signature_method?: string;
  capacity?: string;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = 'v2';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No authentication token found');
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/${API_VERSION}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// =============================================================================
// CONTRACT TEMPLATE OPERATIONS
// =============================================================================

export const contractTemplatesApi = {
  /**
   * Get all available contract templates
   */
  getTemplates: async (params?: {
    contract_type?: string;
    is_active?: boolean;
    keywords?: string[];
  }): Promise<ContractTemplate[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.contract_type) queryParams.append('contract_type', params.contract_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.keywords) params.keywords.forEach(keyword => queryParams.append('keywords', keyword));
    
    const endpoint = `/contracts/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest<ContractTemplate[]>(endpoint);
  },

  /**
   * Suggest contract templates based on user input (AI-powered)
   */
  suggestTemplates: async (request: ContractSuggestionRequest): Promise<ContractSuggestionResponse> => {
    return apiRequest<ContractSuggestionResponse>('/contracts/suggest-templates', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get template by ID
   */
  getTemplateById: async (templateId: string): Promise<ContractTemplate> => {
    return apiRequest<ContractTemplate>(`/contracts/templates/${templateId}`);
  },
};

// =============================================================================
// CONTRACT OPERATIONS
// =============================================================================

export const contractsApi = {
  /**
   * Create a new contract with selected template
   */
  createContract: async (contractData: ContractCreate, templateId: string): Promise<Contract> => {
    return apiRequest<Contract>(`/contracts/create?template_id=${templateId}`, {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  },

  /**
   * Get contract by ID
   */
  getContract: async (contractId: string): Promise<Contract> => {
    return apiRequest<Contract>(`/contracts/${contractId}`);
  },

  /**
   * Get all contracts for current user
   */
  getUserContracts: async (params?: {
    status?: ContractStatus;
    limit?: number;
    offset?: number;
  }): Promise<Contract[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const endpoint = `/contracts/my-contracts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest<Contract[]>(endpoint);
  },

  /**
   * Update contract
   */
  updateContract: async (contractId: string, updates: Partial<Contract>): Promise<Contract> => {
    return apiRequest<Contract>(`/contracts/${contractId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Get contract status and next actions
   */
  getContractStatus: async (contractId: string): Promise<{
    contract: Contract;
    next_actions: string[];
    completion_percentage: number;
    pending_tasks: string[];
  }> => {
    return apiRequest(`/contracts/${contractId}/status`);
  },

  /**
   * Send contract to second party
   */
  sendContract: async (contractId: string, recipientData: {
    recipient_app_id?: string;
    recipient_email?: string;
    message?: string;
  }): Promise<{ success: boolean; notification_id: string }> => {
    return apiRequest(`/contracts/${contractId}/send`, {
      method: 'POST',
      body: JSON.stringify(recipientData),
    });
  },

  /**
   * Request contract modification
   */
  requestModification: async (contractId: string, modificationRequest: {
    requested_changes: string;
    reason: string;
    sections_to_modify?: string[];
  }): Promise<{ success: boolean; modification_id: string }> => {
    return apiRequest(`/contracts/${contractId}/request-modification`, {
      method: 'POST',
      body: JSON.stringify(modificationRequest),
    });
  },

  /**
   * Sign contract
   */
  signContract: async (contractId: string, signatureRequest: SignatureRequest): Promise<{
    success: boolean;
    signature_id: string;
    contract_status: ContractStatus;
  }> => {
    return apiRequest(`/contracts/${contractId}/sign`, {
      method: 'POST',
      body: JSON.stringify(signatureRequest),
    });
  },

  /**
   * Generate final PDF
   */
  generatePDF: async (contractId: string): Promise<{
    pdf_url: string;
    document_hash: string;
    expires_at: string;
  }> => {
    return apiRequest(`/contracts/${contractId}/generate-pdf`, {
      method: 'POST',
    });
  },

  /**
   * Cancel contract
   */
  cancelContract: async (contractId: string, reason: string): Promise<{ success: boolean }> => {
    return apiRequest(`/contracts/${contractId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// =============================================================================
// CONTRACT CLAUSE OPERATIONS
// =============================================================================

export const clausesApi = {
  /**
   * Get clauses for a contract
   */
  getContractClauses: async (contractId: string): Promise<ContractClause[]> => {
    return apiRequest<ContractClause[]>(`/contracts/${contractId}/clauses`);
  },

  /**
   * Generate clause content using AI
   */
  generateClause: async (request: ClauseGenerationRequest): Promise<{
    clause: ContractClause;
    ai_explanation: string;
    risk_assessment: any;
    suggestions: string[];
  }> => {
    return apiRequest(`/contracts/${request.contract_id}/clauses/generate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Update clause content
   */
  updateClause: async (clauseId: string, updates: {
    content?: string;
    user_input?: string;
    status?: string;
  }): Promise<ContractClause> => {
    return apiRequest<ContractClause>(`/contracts/clauses/${clauseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Approve clause
   */
  approveClause: async (clauseId: string): Promise<{ success: boolean }> => {
    return apiRequest(`/contracts/clauses/${clauseId}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Request clause modification
   */
  requestClauseModification: async (request: ClauseModificationRequest): Promise<{
    modification_id: string;
    estimated_completion: string;
  }> => {
    return apiRequest(`/contracts/clauses/${request.clause_id}/request-modification`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Add custom clause
   */
  addCustomClause: async (contractId: string, clauseData: {
    clause_name: string;
    user_requirements: string;
    clause_type: 'optional' | 'custom';
    sort_order?: number;
  }): Promise<ContractClause> => {
    return apiRequest(`/contracts/${contractId}/clauses/custom`, {
      method: 'POST',
      body: JSON.stringify(clauseData),
    });
  },
};

// =============================================================================
// WITNESS MANAGEMENT
// =============================================================================

export const witnessApi = {
  /**
   * Get witnesses for a contract
   */
  getContractWitnesses: async (contractId: string): Promise<ContractWitness[]> => {
    return apiRequest<ContractWitness[]>(`/contracts/${contractId}/witnesses`);
  },

  /**
   * Invite witness
   */
  inviteWitness: async (request: WitnessInvitationRequest): Promise<{
    witness_id: string;
    invitation_sent: boolean;
    invitation_token?: string;
  }> => {
    return apiRequest(`/contracts/${request.contract_id}/witnesses/invite`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Confirm witness participation
   */
  confirmWitness: async (witnessId: string, confirmationData: {
    witness_statement: string;
    physical_presence_confirmed: boolean;
  }): Promise<{ success: boolean }> => {
    return apiRequest(`/contracts/witnesses/${witnessId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(confirmationData),
    });
  },

  /**
   * Remove witness
   */
  removeWitness: async (witnessId: string, reason: string): Promise<{ success: boolean }> => {
    return apiRequest(`/contracts/witnesses/${witnessId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  },
};

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export const notificationsApi = {
  /**
   * Get contract notifications for user
   */
  getContractNotifications: async (params?: {
    contract_id?: string;
    type?: string;
    unread_only?: boolean;
    limit?: number;
  }): Promise<ContractNotification[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.contract_id) queryParams.append('contract_id', params.contract_id);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.unread_only) queryParams.append('unread_only', params.unread_only.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `/contracts/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest<ContractNotification[]>(endpoint);
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (notificationId: string): Promise<{ success: boolean }> => {
    return apiRequest(`/contracts/notifications/${notificationId}/mark-read`, {
      method: 'POST',
    });
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiRequest('/contracts/notifications/unread-count');
  },
};

// =============================================================================
// AI OPERATIONS
// =============================================================================

export const aiApi = {
  /**
   * Get AI usage statistics for contract
   */
  getAIUsage: async (contractId: string): Promise<{
    total_tokens_used: number;
    total_cost_usd: number;
    operations_count: number;
    efficiency_score: number;
    cost_breakdown: any[];
  }> => {
    return apiRequest(`/contracts/${contractId}/ai-usage`);
  },

  /**
   * Request AI review of complete contract
   */
  requestAIReview: async (contractId: string): Promise<{
    review_id: string;
    compliance_score: number;
    risk_assessment: any;
    recommendations: string[];
    legal_warnings: string[];
  }> => {
    return apiRequest(`/contracts/${contractId}/ai-review`, {
      method: 'POST',
    });
  },

  /**
   * Get AI assistance for specific section
   */
  getAIAssistance: async (contractId: string, assistanceRequest: {
    section: string;
    user_question: string;
    context?: string;
  }): Promise<{
    ai_response: string;
    suggestions: string[];
    confidence_score: number;
    tokens_used: number;
  }> => {
    return apiRequest(`/contracts/${contractId}/ai-assistance`, {
      method: 'POST',
      body: JSON.stringify(assistanceRequest),
    });
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const contractUtils = {
  /**
   * Get contract status display information
   */
  getStatusInfo: (status: ContractStatus) => {
    const statusMap = {
      [ContractStatus.DRAFT]: {
        label: 'Draft',
        color: 'gray',
        description: 'Contract is being created'
      },
      [ContractStatus.TEMPLATE_SELECTED]: {
        label: 'Template Selected',
        color: 'blue',
        description: 'Template has been selected'
      },
      [ContractStatus.MANDATORY_CLAUSES_PENDING]: {
        label: 'Creating Clauses',
        color: 'yellow',
        description: 'AI is generating mandatory clauses'
      },
      [ContractStatus.OPTIONAL_CLAUSES_PENDING]: {
        label: 'Optional Clauses',
        color: 'yellow',
        description: 'Adding optional clauses'
      },
      [ContractStatus.AI_REVIEW_PENDING]: {
        label: 'AI Review',
        color: 'purple',
        description: 'AI is reviewing the contract'
      },
      [ContractStatus.READY_FOR_REVIEW]: {
        label: 'Ready for Review',
        color: 'blue',
        description: 'Contract is ready for your review'
      },
      [ContractStatus.PENDING_FIRST_PARTY_APPROVAL]: {
        label: 'Pending Your Approval',
        color: 'orange',
        description: 'Waiting for your approval'
      },
      [ContractStatus.PENDING_SECOND_PARTY]: {
        label: 'Awaiting Recipient',
        color: 'orange',
        description: 'Waiting for second party response'
      },
      [ContractStatus.IN_NEGOTIATION]: {
        label: 'In Negotiation',
        color: 'yellow',
        description: 'Contract is being negotiated'
      },
      [ContractStatus.MODIFICATION_REQUESTED]: {
        label: 'Modification Requested',
        color: 'yellow',
        description: 'Changes have been requested'
      },
      [ContractStatus.AI_MODIFICATION_PENDING]: {
        label: 'AI Modifying',
        color: 'purple',
        description: 'AI is applying modifications'
      },
      [ContractStatus.PENDING_WITNESS_CONFIRMATION]: {
        label: 'Pending Witness',
        color: 'orange',
        description: 'Waiting for witness confirmation'
      },
      [ContractStatus.PENDING_SIGNATURES]: {
        label: 'Pending Signatures',
        color: 'orange',
        description: 'Waiting for signatures'
      },
      [ContractStatus.PARTIALLY_SIGNED]: {
        label: 'Partially Signed',
        color: 'yellow',
        description: 'Some parties have signed'
      },
      [ContractStatus.FULLY_SIGNED]: {
        label: 'Fully Signed',
        color: 'green',
        description: 'Contract is fully executed'
      },
      [ContractStatus.ACTIVE]: {
        label: 'Active',
        color: 'green',
        description: 'Contract is active'
      },
      [ContractStatus.EXPIRED]: {
        label: 'Expired',
        color: 'red',
        description: 'Contract has expired'
      },
      [ContractStatus.TERMINATED]: {
        label: 'Terminated',
        color: 'red',
        description: 'Contract has been terminated'
      },
      [ContractStatus.CANCELLED]: {
        label: 'Cancelled',
        color: 'red',
        description: 'Contract was cancelled'
      },
      [ContractStatus.DISPUTED]: {
        label: 'Disputed',
        color: 'red',
        description: 'Contract is under dispute'
      },
    };

    return statusMap[status] || {
      label: status,
      color: 'gray',
      description: 'Unknown status'
    };
  },

  /**
   * Calculate contract completion percentage
   */
  calculateCompletionPercentage: (contract: Contract): number => {
    let completionScore = 0;
    const totalSteps = 10; // Adjust based on your workflow

    // Basic contract info (10%)
    if (contract.title && contract.description) completionScore += 1;

    // Template selection (10%)
    if (contract.template_id) completionScore += 1;

    // Mandatory clauses (30%)
    completionScore += (contract.mandatory_completion_percentage / 100) * 3;

    // Optional clauses (10%)
    if (contract.optional_clauses_selected > 0) completionScore += 1;

    // AI review (10%)
    if (contract.compliance_score) completionScore += 1;

    // Second party added (10%)
    if (contract.recipient_user_id) completionScore += 1;

    // Signatures (20%)
    if (contract.status === ContractStatus.FULLY_SIGNED) completionScore += 2;
    else if (contract.status === ContractStatus.PARTIALLY_SIGNED) completionScore += 1;

    return Math.round((completionScore / totalSteps) * 100);
  },

  /**
   * Format contract value for display
   */
  formatContractValue: (value?: number, currency: string = 'KSH'): string => {
    if (!value) return 'Not specified';
    
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency === 'KSH' ? 'KES' : currency,
    }).format(value);
  },

  /**
   * Get time remaining for contract expiry
   */
  getTimeRemaining: (expiryDate?: string): string => {
    if (!expiryDate) return 'No expiry date';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Expired';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day remaining';
    if (diffDays < 30) return `${diffDays} days remaining`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months remaining`;
    
    return `${Math.floor(diffDays / 365)} years remaining`;
  },
};
