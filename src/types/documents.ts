// Document types for the legal document analyzer

export interface Document {
  id: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  document_type: string;
  description?: string;
  tags: string[];
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  ai_analysis_enabled: boolean;
  ai_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: string;
  chunks_count?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DocumentUploadRequest {
  filename: string;
  content_type: string;
  size: number;
  document_type: string;
  description?: string;
  tags: string[];
  enable_ai_analysis: boolean;
  analysis_options?: Record<string, any>;
}

export interface DocumentSummary {
  executive_summary: string;
  key_points: string[];
  main_topics: string[];
  legal_entities: string[];
  important_dates: Array<{
    date: string;
    description: string;
    significance: string;
  }>;
  financial_terms: Array<{
    term: string;
    value: string;
    description: string;
  }>;
  document_structure: {
    sections: number;
    clauses: number;
    appendices: number;
  };
  word_count: number;
  page_count: number;
  confidence_score: number;
}

export interface LegalReview {
  overall_assessment: string;
  legal_issues: Array<{
    issue: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
  precedent_cases: Array<{
    case_name: string;
    year: number;
    relevance: string;
    citation: string;
  }>;
  statutory_references: Array<{
    statute: string;
    section: string;
    relevance: string;
  }>;
  enforceability_analysis: string;
  jurisdiction_specific_notes: string;
}

export interface RiskAssessment {
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_factors: Array<{
    factor: string;
    impact: string;
    probability: string;
    description: string;
  }>;
  financial_risks: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
  legal_risks: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
  operational_risks: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
  recommendations: string[];
  compliance_issues: string[];
  mitigation_strategies: Array<{
    strategy: string;
    priority: string;
    timeline: string;
  }>;
}

export interface ComplianceAnalysis {
  compliance_score: number;
  kenyan_law_alignment: string;
  regulatory_framework: string[];
  compliance_gaps: Array<{
    gap: string;
    severity: string;
    recommendation: string;
  }>;
  required_modifications: string[];
  regulatory_requirements: string[];
  government_approvals: string[];
  tax_implications: Array<{
    type: string;
    rate: string;
    applicability: string;
  }>;
  employment_law_considerations: string[];
}

export interface DocumentAnalysis {
  document_id: string;
  processing_status: string;
  executive_summary: DocumentSummary | null;
  legal_review: LegalReview | null;
  risk_assessment: RiskAssessment | null;
  compliance_analysis: ComplianceAnalysis | null;
  chunks_created: number;
  vectors_stored: number;
  questions_available: number;
  processing_time_seconds: number | null;
  ai_model_version: string;
  cost_summary: Record<string, any> | null;
  created_at: string;
  expires_at: string;
}

export interface DocumentQuestion {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  confidence: number;
  source_chunks: string[];
  created_at: string;
}

export interface DocumentStats {
  total_documents: number;
  documents_this_month: number;
  questions_asked: number;
  questions_this_month: number;
  storage_used_mb: number;
  subscription_limits: {
    max_documents_per_month: number;
    max_questions_per_document: number;
    max_storage_mb: number;
  };
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  status: string;
  ai_analysis_enabled: boolean;
  file_size: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    chunk_id: string;
    content_preview: string;
    page_number?: number;
    similarity_score: number;
  }>;
}
