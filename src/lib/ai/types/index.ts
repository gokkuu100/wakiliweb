// Core AI Types for Legal SaaS Application

export interface AIUsageSession {
  id: string;
  user_id: string;
  session_type: 'chat' | 'contract_generation' | 'document_analysis';
  started_at: string;
  ended_at?: string;
  total_tokens_used: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  model_used: string;
  session_metadata?: Record<string, any>;
  created_at: string;
}

export interface AITokenUsage {
  id: string;
  session_id: string;
  user_id: string;
  request_type: 'completion' | 'embedding' | 'analysis';
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  cost_usd: number;
  request_data?: Record<string, any>;
  created_at: string;
}

export interface UserAILimits {
  id: string;
  user_id: string;
  subscription_id?: string;
  monthly_token_limit: number;
  monthly_tokens_used: number;
  daily_token_limit: number;
  daily_tokens_used: number;
  current_month: string;
  current_day: string;
  is_unlimited: boolean;
  created_at: string;
  updated_at: string;
}

export interface LegalKnowledgeSource {
  id: string;
  title: string;
  source_type: 'constitution' | 'act' | 'case_law' | 'regulation' | 'precedent';
  document_url?: string;
  content_text?: string;
  content_summary?: string;
  legal_area: string[];
  jurisdiction: string;
  date_published?: string;
  authority?: string;
  is_current: boolean;
  vector_embedding_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title?: string;
  conversation_type: 'general' | 'legal_advice' | 'document_analysis';
  session_id?: string;
  total_tokens_used: number;
  knowledge_sources?: Record<string, any>;
  conversation_summary?: string;
  legal_context?: Record<string, any>;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number;
  model_used: string;
  vector_sources?: Record<string, any>;
  confidence_score?: number;
  legal_citations?: Record<string, any>;
  processing_time_ms?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ContractGenerationStep {
  id: string;
  session_id: string;
  step_number: number;
  step_name: 'requirements' | 'parties' | 'terms' | 'clauses' | 'review' | 'finalize';
  step_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  ai_prompt?: string;
  ai_response?: string;
  user_input?: Record<string, any>;
  ai_suggestions?: Record<string, any>;
  tokens_used: number;
  processing_time_ms?: number;
  completed_at?: string;
  created_at: string;
}

export interface DocumentLegalAnalysis {
  id: string;
  document_id: string;
  analysis_session_id?: string;
  legal_compliance_score?: number;
  risk_assessment?: Record<string, any>;
  applicable_laws?: string[];
  legal_issues_found?: Record<string, any>;
  recommendations?: Record<string, any>;
  confidence_level?: number;
  processing_time_ms?: number;
  tokens_used: number;
  knowledge_sources_used?: Record<string, any>;
  created_at: string;
}

export interface VectorSearchSession {
  id: string;
  user_id: string;
  ai_session_id?: string;
  query_text: string;
  query_embedding_id?: string;
  search_results?: Record<string, any>;
  relevance_threshold: number;
  sources_count: number;
  processing_time_ms?: number;
  created_at: string;
}

export interface ContractAIInsight {
  id: string;
  contract_id: string;
  generation_session_id?: string;
  insight_type: 'risk_warning' | 'compliance_note' | 'improvement_suggestion';
  insight_text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  legal_basis?: string;
  is_addressed: boolean;
  knowledge_source_id?: string;
  created_at: string;
}

// AI Request/Response Types
export interface AICompletionRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  user_id: string;
  session_id?: string;
  context?: Record<string, any>;
}

export interface AICompletionResponse {
  content: string;
  tokens_used: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  processing_time_ms: number;
  cost_usd: number;
  confidence_score?: number;
  sources?: LegalKnowledgeSource[];
}

export interface VectorSearchRequest {
  query: string;
  user_id: string;
  legal_areas?: string[];
  jurisdiction?: string;
  source_types?: string[];
  relevance_threshold?: number;
  max_results?: number;
}

export interface VectorSearchResponse {
  results: {
    source: LegalKnowledgeSource;
    relevance_score: number;
    matched_content: string;
  }[];
  total_results: number;
  processing_time_ms: number;
  query_embedding_id?: string;
}

// Contract Generation Types
export interface ContractGenerationRequest {
  template_id: string;
  user_id: string;
  description?: string;
  parties?: {
    name: string;
    type: 'individual' | 'company';
    email?: string;
  }[];
  requirements?: Record<string, any>;
}

export interface ContractGenerationSession {
  id: string;
  user_id: string;
  template_id?: string;
  contract_id?: string;
  requirements?: Record<string, any>;
  session_data?: Record<string, any>;
  current_draft?: string;
  ai_conversation_history?: Record<string, any>[];
  completion_percentage: number;
  last_ai_suggestion?: Record<string, any>;
  validation_errors?: Record<string, any>;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  steps?: ContractGenerationStep[];
}

// Document Analysis Types
export interface DocumentAnalysisRequest {
  document_id: string;
  user_id: string;
  analysis_type: 'summary' | 'legal_review' | 'compliance_check' | 'risk_assessment';
  specific_questions?: string[];
}

export interface DocumentAnalysisResponse {
  summary: string;
  key_findings: string[];
  legal_issues: {
    issue: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
    legal_basis?: string;
  }[];
  compliance_score: number;
  risk_score: number;
  applicable_laws: string[];
  recommendations: string[];
  confidence_level: number;
  sources_used: LegalKnowledgeSource[];
}

// Chat Types
export interface ChatRequest {
  message: string;
  conversation_id?: string;
  user_id: string;
  context?: {
    legal_area?: string;
    previous_context?: string;
    document_context?: string;
  };
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources_used?: LegalKnowledgeSource[];
  legal_citations?: {
    citation: string;
    relevance: number;
    url?: string;
  }[];
  confidence_score: number;
  follow_up_suggestions?: string[];
  related_topics?: string[];
}

// Analytics Types
export interface UserAnalytics {
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  total_tokens_used: number;
  total_cost_usd: number;
  session_count: number;
  chat_messages: number;
  contracts_created: number;
  documents_analyzed: number;
  average_response_time_ms: number;
  top_legal_areas: string[];
  usage_by_feature: Record<string, number>;
}

export interface SystemMetrics {
  date: string;
  total_ai_requests: number;
  average_response_time_ms: number;
  error_rate: number;
  total_tokens_processed: number;
  total_cost_usd: number;
  active_users: number;
  peak_concurrent_users: number;
  vector_db_queries: number;
}

// Error Types
export interface AIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  timestamp: string;
}

// Configuration Types
export interface AIConfiguration {
  openai: {
    api_key: string;
    base_url?: string;
    default_model: string;
    max_tokens: number;
    temperature: number;
  };
  vector_db: {
    endpoint: string;
    api_key: string;
    index_name: string;
    embedding_model: string;
  };
  rate_limits: {
    requests_per_minute: number;
    tokens_per_minute: number;
    concurrent_requests: number;
  };
  costs: {
    gpt4_input_per_1k: number;
    gpt4_output_per_1k: number;
    embedding_per_1k: number;
    vector_search_per_query: number;
  };
}

export type AIFeature = 
  | 'chat'
  | 'contract_generation'
  | 'document_analysis'
  | 'legal_research'
  | 'compliance_check'
  | 'risk_assessment';

export type LegalArea = 
  | 'contract_law'
  | 'employment_law'
  | 'corporate_law'
  | 'real_estate_law'
  | 'intellectual_property'
  | 'family_law'
  | 'criminal_law'
  | 'constitutional_law'
  | 'tax_law'
  | 'immigration_law';
