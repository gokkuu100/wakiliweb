// Contract Generation System Types
export interface ContractTemplate {
  id: string;
  template_name: string;
  contract_type: string;
  description: string;
  keywords: string[];
  use_cases: string[];
  mandatory_clauses: any;
  optional_clauses: any;
  is_active: boolean;
  match_percentage?: number;
  // Additional fields from AI analysis
  confidence?: string;
  explanation?: string;
  estimated_completion_time?: string;
  complexity?: string;
}

export interface AIAnalysisResult {
  can_handle: boolean;
  suggested_templates: Array<{
    template_id: string;
    template_name: string;
    contract_type: string;
    description: string;
    relevance_score: number;
    explanation: string;
    confidence: string;
    use_cases: string[];
    estimated_completion_time: string;
    complexity: string;
  }>;
  confidence_score?: number;
  reasoning: string;
  available_templates?: boolean;
  unsupported_message?: string;
  extracted_keywords: string[];
  ai_analysis_timestamp: string;
  user_prompt: string;
}

export interface ContractSession {
  id: string;
  user_id: string;
  session_status: string;
  initial_user_prompt: string;
  ai_suggested_template_type: string;
  selected_template_id?: string;
  current_stage: string;
  current_stage_name: string;
  current_step: number;
  total_steps: number;
  completion_percentage: string; // This is stored as decimal in DB
  contract_title?: string;
  contract_type: string;
  contract_id?: string;
  session_data: any;
  ai_analysis_data: any;
  template_suggestions: any[];
  clause_progress: any;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  completed_at?: string;
  expires_at: string;
  activity_log: any[];
  user_description?: string;
  analysis_results?: any;
  current_mandatory_section: number;
  mandatory_sections_data: any;
  ai_generated_clauses: any;
  // Legacy fields for backward compatibility
  session_id?: string;
  template?: ContractTemplate;
  mandatory_clauses?: ContractClause[];
  next_stage?: string;
  progress?: {
    current_step: number;
    total_steps: number;
    completion_percentage: number;
  };
}

export interface ContractClause {
  clause_id: string;
  title: string;
  content: string;
  order: number;
  is_mandatory: boolean;
  ai_generated: boolean;
  user_editable: boolean;
  required_fields: string[];
  kenyan_law_reference: string;
  status: 'pending' | 'approved' | 'rejected' | 'editing' | 'ai_generated' | 'regenerated' | 'regeneration_failed';
  user_modifications?: string;
  // AI-generated fields
  ai_generated_content?: string;
  confidence_score?: number;
  legal_references?: string[];
  risk_assessment?: string;
  kenyan_law_compliance?: boolean;
  clause_type?: string;
  description?: string;
}

export interface UserInfo {
  app_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  id_type?: string;
  id_number?: string;
  party_type: 'individual' | 'company' | 'partnership' | 'sole_proprietorship' | 'ngo' | 'government_entity';
  user_type?: string;
  verification_status?: string;
  is_verified?: boolean;
  member_since?: string;
}

export interface MandatoryFields {
  party1: UserInfo;
  party2?: UserInfo;
  contract_details: {
    duration?: string;
    jurisdiction: string;
    effective_date?: string;
    [key: string]: string | undefined;
  };
}

export interface CustomClause {
  id: string;
  title: string;
  description: string;
  ai_generated_content?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ContractPreview {
  html_content: string;
  legal_compliance_score: number;
  risk_assessment: any;
  kenyan_law_compliance: boolean;
  final_contract_text: string;
}

// Step-specific interfaces
export interface Step1Data {
  user_prompt: string;
  ai_analysis?: AIAnalysisResult;
}

export interface Step2Data {
  selected_template?: ContractTemplate;
  available_templates: ContractTemplate[];
}

export interface Step3Data {
  user_explanation: string;
  mandatory_fields: MandatoryFields;
  generated_clauses: ContractClause[];
  current_clause_index: number;
}

export interface Step4Data {
  optional_clauses: ContractClause[];
  custom_clauses: CustomClause[];
  selected_optional_clauses: string[];
}

export interface Step5Data {
  contract_preview: ContractPreview;
  final_contract: any;
}

// API Request/Response types
export interface AnalyzePromptRequest {
  user_prompt: string;
}

export interface CreateSessionRequest {
  template_id: string;
  initial_prompt: string;
  ai_analysis_data: AIAnalysisResult;
}

export interface AnalyzeContractRequest {
  explanation: string;
  mandatory_fields: MandatoryFields;
  template_id: string;
  user_context?: any;
}

export interface UserSearchRequest {
  app_id: string;
}

export interface ClauseApprovalRequest {
  clause_id: string;
  user_modifications?: string;
  is_approved: boolean;
}

export interface CustomClauseGenerationRequest {
  custom_clauses: Array<{
    title: string;
    description: string;
  }>;
}

// Error types
export interface ContractError {
  message: string;
  code?: string;
  details?: any;
}
