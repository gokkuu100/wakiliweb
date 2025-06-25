-- =============================================
-- COMPREHENSIVE AI-ENHANCED LEGAL SAAS DATABASE SCHEMA
-- Extends existing schema with AI capabilities for Kenyan Legal System
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================
-- USER DOCUMENT MANAGEMENT
-- =============================================

-- User uploaded documents (enhanced)
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  analysis_results JSONB, -- Store full AI analysis results
  metadata JSONB DEFAULT '{}', -- File metadata and analysis config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document analysis results (separate table for complex queries)
CREATE TABLE document_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'summary', 'legal_review', 'risk_assessment', 'compliance_check', 'contract_analysis'
  summary TEXT NOT NULL,
  key_findings JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  relevant_laws JSONB DEFAULT '[]',
  citations JSONB DEFAULT '[]',
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  processing_time_ms INTEGER,
  model_used TEXT DEFAULT 'gpt-4-turbo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI USAGE TRACKING & ANALYTICS
-- =============================================

-- AI Usage Sessions (for tracking every AI interaction)
CREATE TABLE ai_usage_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'chat', 'contract_generation', 'document_analysis', 'legal_research'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  model_used TEXT DEFAULT 'gpt-4',
  session_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Token Usage Tracking (detailed per request)
CREATE TABLE ai_token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ai_usage_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'completion', 'embedding', 'analysis', 'chat'
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  model TEXT NOT NULL,
  cost_usd DECIMAL(10,4) NOT NULL,
  request_data JSONB DEFAULT '{}', -- Store request/response for debugging
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User AI Usage Limits (for subscription management)
CREATE TABLE user_ai_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  monthly_token_limit INTEGER DEFAULT 100000,
  monthly_tokens_used INTEGER DEFAULT 0,
  daily_token_limit INTEGER DEFAULT 5000,
  daily_tokens_used INTEGER DEFAULT 0,
  current_month DATE DEFAULT CURRENT_DATE,
  current_day DATE DEFAULT CURRENT_DATE,
  is_unlimited BOOLEAN DEFAULT FALSE,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily analytics aggregation for users
CREATE TABLE user_analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  total_tokens_used INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  documents_analyzed INTEGER DEFAULT 0,
  contracts_generated INTEGER DEFAULT 0,
  ai_cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, analytics_date)
);

-- =============================================
-- ENHANCED CHAT SYSTEM
-- =============================================

-- Chat conversations (enhanced with AI tracking)
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  conversation_type TEXT DEFAULT 'legal_consultation', -- 'legal_consultation', 'contract_help', 'compliance_query'
  total_tokens_used INTEGER DEFAULT 0,
  conversation_summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages (enhanced with AI metadata)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  sources_used JSONB DEFAULT '[]', -- Knowledge base sources used
  citations JSONB DEFAULT '[]', -- Legal citations
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEPWISE CONTRACT GENERATION
-- =============================================

-- Contract generation sessions
CREATE TABLE contract_generation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL, -- 'employment', 'service', 'lease', 'partnership', etc.
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 10,
  session_data JSONB DEFAULT '{}', -- Store step data and user inputs
  generated_contract TEXT, -- Final contract text
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  total_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual contract generation steps
CREATE TABLE contract_generation_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES contract_generation_sessions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type TEXT NOT NULL, -- 'input_collection', 'clause_generation', 'review', 'finalization'
  step_data JSONB NOT NULL,
  ai_response TEXT,
  tokens_used INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEGAL KNOWLEDGE BASE (RAG)
-- =============================================

-- Legal knowledge base documents
CREATE TABLE legal_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'constitution', 'statute', 'case_law', 'regulation', 'policy'
  document_type TEXT NOT NULL, -- 'act', 'case', 'regulation', 'constitution', 'policy_document'
  content_hash TEXT UNIQUE NOT NULL, -- For duplicate detection
  word_count INTEGER DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Court, jurisdiction, date, keywords, etc.
  is_active BOOLEAN DEFAULT TRUE,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks for vector search
CREATE TABLE knowledge_base_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES legal_knowledge_base(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI MONITORING & ERROR TRACKING
-- =============================================

-- AI Error Logs (for debugging and monitoring)
CREATE TABLE ai_error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES ai_usage_sessions(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL, -- 'rate_limit', 'token_limit', 'api_error', 'validation_error', 'system_error'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Performance Metrics (for monitoring response times and success rates)
CREATE TABLE ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type TEXT NOT NULL, -- 'chat', 'contract_generation', 'document_analysis', etc.
  duration_ms INTEGER NOT NULL,
  tokens_used INTEGER,
  model_used TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTION PLAN ENHANCEMENTS
-- =============================================

-- Add AI-specific columns to existing subscription_plans table
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS monthly_token_limit INTEGER DEFAULT 50000;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS daily_token_limit INTEGER DEFAULT 2000;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS ai_features JSONB DEFAULT '{}';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS knowledge_base_access BOOLEAN DEFAULT TRUE;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User documents indexes
CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_upload_status ON user_documents(upload_status);
CREATE INDEX idx_user_documents_created_at ON user_documents(created_at DESC);

-- Document analysis indexes
CREATE INDEX idx_document_analysis_document_id ON document_analysis(document_id);
CREATE INDEX idx_document_analysis_user_id ON document_analysis(user_id);
CREATE INDEX idx_document_analysis_type ON document_analysis(analysis_type);

-- AI usage tracking indexes
CREATE INDEX idx_ai_usage_sessions_user_id ON ai_usage_sessions(user_id);
CREATE INDEX idx_ai_usage_sessions_type ON ai_usage_sessions(session_type);
CREATE INDEX idx_ai_usage_sessions_created_at ON ai_usage_sessions(created_at DESC);
CREATE INDEX idx_ai_token_usage_user_id ON ai_token_usage(user_id);
CREATE INDEX idx_ai_token_usage_session_id ON ai_token_usage(session_id);
CREATE INDEX idx_ai_token_usage_created_at ON ai_token_usage(created_at DESC);

-- User limits and analytics indexes
CREATE INDEX idx_user_ai_limits_user_id ON user_ai_limits(user_id);
CREATE INDEX idx_user_analytics_daily_user_date ON user_analytics_daily(user_id, analytics_date DESC);

-- Chat system indexes
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Contract generation indexes
CREATE INDEX idx_contract_sessions_user_id ON contract_generation_sessions(user_id);
CREATE INDEX idx_contract_sessions_status ON contract_generation_sessions(status);
CREATE INDEX idx_contract_steps_session_id ON contract_generation_steps(session_id);
CREATE INDEX idx_contract_steps_step_number ON contract_generation_steps(step_number);

-- Knowledge base indexes
CREATE INDEX idx_legal_kb_category ON legal_knowledge_base(category);
CREATE INDEX idx_legal_kb_document_type ON legal_knowledge_base(document_type);
CREATE INDEX idx_legal_kb_is_active ON legal_knowledge_base(is_active);
CREATE INDEX idx_kb_chunks_document_id ON knowledge_base_chunks(document_id);
CREATE INDEX idx_kb_chunks_embedding ON knowledge_base_chunks USING ivfflat (embedding vector_cosine_ops);

-- Monitoring indexes
CREATE INDEX idx_ai_error_logs_created_at ON ai_error_logs(created_at DESC);
CREATE INDEX idx_ai_error_logs_severity ON ai_error_logs(severity);
CREATE INDEX idx_ai_error_logs_user_id ON ai_error_logs(user_id);
CREATE INDEX idx_ai_performance_metrics_created_at ON ai_performance_metrics(created_at DESC);
CREATE INDEX idx_ai_performance_metrics_operation_type ON ai_performance_metrics(operation_type);
CREATE INDEX idx_ai_performance_metrics_success ON ai_performance_metrics(success);

-- =============================================
-- SQL FUNCTIONS FOR COMPLEX QUERIES
-- =============================================

-- Function to get top users by usage (supports GROUP BY)
CREATE OR REPLACE FUNCTION get_top_users_by_usage(
  start_date TIMESTAMPTZ,
  user_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  total_tokens BIGINT,
  total_cost NUMERIC,
  sessions BIGINT,
  full_name TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uad.user_id,
    SUM(uad.total_tokens_used)::BIGINT as total_tokens,
    SUM(uad.ai_cost_usd)::NUMERIC as total_cost,
    SUM(uad.session_count)::BIGINT as sessions,
    u.full_name,
    u.email
  FROM user_analytics_daily uad
  JOIN users u ON u.id = uad.user_id
  WHERE uad.analytics_date >= start_date
  GROUP BY uad.user_id, u.full_name, u.email
  ORDER BY total_tokens DESC
  LIMIT user_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get system-wide analytics
CREATE OR REPLACE FUNCTION get_system_analytics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  total_sessions BIGINT,
  avg_tokens_per_user NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT uad.user_id)::BIGINT as total_users,
    COUNT(DISTINCT CASE WHEN uad.analytics_date >= (end_date - INTERVAL '7 days') THEN uad.user_id END)::BIGINT as active_users,
    SUM(uad.total_tokens_used)::BIGINT as total_tokens,
    SUM(uad.ai_cost_usd)::NUMERIC as total_cost,
    SUM(uad.session_count)::BIGINT as total_sessions,
    CASE 
      WHEN COUNT(DISTINCT uad.user_id) > 0 
      THEN (SUM(uad.total_tokens_used) / COUNT(DISTINCT uad.user_id))::NUMERIC 
      ELSE 0
    END as avg_tokens_per_user
  FROM user_analytics_daily uad
  WHERE uad.analytics_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily token limits
CREATE OR REPLACE FUNCTION reset_daily_token_limits()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE user_ai_limits 
  SET 
    daily_tokens_used = 0,
    current_day = CURRENT_DATE,
    updated_at = NOW()
  WHERE current_day < CURRENT_DATE;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly token limits
CREATE OR REPLACE FUNCTION reset_monthly_token_limits()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE user_ai_limits 
  SET 
    monthly_tokens_used = 0,
    current_month = CURRENT_DATE,
    updated_at = NOW()
  WHERE DATE_TRUNC('month', current_month) < DATE_TRUNC('month', CURRENT_DATE);
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update user_documents.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_limits_updated_at
  BEFORE UPDATE ON user_ai_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_sessions_updated_at
  BEFORE UPDATE ON contract_generation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Update subscription plans with AI limits
UPDATE subscription_plans SET 
  monthly_token_limit = CASE 
    WHEN name ILIKE '%basic%' THEN 25000
    WHEN name ILIKE '%pro%' THEN 100000
    WHEN name ILIKE '%enterprise%' THEN 500000
    ELSE 50000
  END,
  daily_token_limit = CASE 
    WHEN name ILIKE '%basic%' THEN 1000
    WHEN name ILIKE '%pro%' THEN 5000
    WHEN name ILIKE '%enterprise%' THEN 20000
    ELSE 2000
  END,
  ai_features = CASE 
    WHEN name ILIKE '%basic%' THEN '{"chat": true, "basic_contracts": true, "document_summary": true}'::jsonb
    WHEN name ILIKE '%pro%' THEN '{"chat": true, "advanced_contracts": true, "document_analysis": true, "legal_research": true}'::jsonb
    WHEN name ILIKE '%enterprise%' THEN '{"chat": true, "custom_contracts": true, "advanced_analysis": true, "legal_research": true, "priority_support": true}'::jsonb
    ELSE '{"chat": true, "basic_contracts": true}'::jsonb
  END
WHERE EXISTS (SELECT 1 FROM subscription_plans LIMIT 1);

-- =============================================
-- SECURITY POLICIES (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_generation_steps ENABLE ROW LEVEL SECURITY;

-- User documents policies
CREATE POLICY "Users can view own documents" ON user_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON user_documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Document analysis policies
CREATE POLICY "Users can view own document analysis" ON document_analysis
  FOR SELECT USING (auth.uid() = user_id);

-- AI usage policies  
CREATE POLICY "Users can view own AI usage" ON ai_usage_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage" ON ai_usage_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Users can manage own conversations" ON chat_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

-- Contract generation policies
CREATE POLICY "Users can manage own contract sessions" ON contract_generation_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Knowledge base is public (read-only)
ALTER TABLE legal_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge base is readable by all authenticated users" ON legal_knowledge_base
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Knowledge base chunks are readable by all authenticated users" ON knowledge_base_chunks
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    document_id IN (SELECT id FROM legal_knowledge_base WHERE is_active = true)
  );
