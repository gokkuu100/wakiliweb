CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notification Types Enum
CREATE TYPE notification_type AS ENUM ('signature_request', 'contract_signed', 'ai_response', 'document_analyzed', 'system_update', 'payment_due');

-- User Types Enum
CREATE TYPE user_type AS ENUM ('citizen', 'lawyer', 'admin');

-- Contract Status Enum
CREATE TYPE contract_status AS ENUM ('draft', 'pending_signature', 'signed', 'cancelled', 'expired');

-- Document Status Enum
CREATE TYPE document_status AS ENUM ('processing', 'analyzed', 'failed');

-- Case Status Enum
CREATE TYPE case_status AS ENUM ('active', 'review', 'completed', 'on_hold');

-- =============================================
-- CORE USER MANAGEMENT
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'citizen',
  phone_number TEXT,
  location TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer profiles (additional info for legal professionals)
CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  firm_name TEXT,
  practice_areas TEXT[],
  bar_number TEXT UNIQUE,
  years_experience INTEGER,
  education TEXT,
  certifications TEXT[],
  bio TEXT,
  hourly_rate DECIMAL(10,2),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  response_time_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTION & BILLING
-- =============================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  contract_limit INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KSH',
  description TEXT,
  status TEXT DEFAULT 'paid',
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTRACTS & DOCUMENTS
-- =============================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT, -- For text-based editing
  pdf_url TEXT, -- URL to the actual PDF document
  template_data JSONB,
  status contract_status DEFAULT 'draft',
  value_amount DECIMAL(12,2),
  value_currency TEXT DEFAULT 'KSH',
  created_by UUID NOT NULL REFERENCES users(id),
  file_size BIGINT,
  mime_type TEXT DEFAULT 'application/pdf',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE contract_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'signatory',
  signed_at TIMESTAMPTZ,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  changes_summary TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENT VAULT & ANALYSIS
-- =============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  status document_status DEFAULT 'processing',
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  summary TEXT,
  key_points TEXT[],
  risk_level TEXT,
  risk_score INTEGER,
  recommendations TEXT[],
  ai_confidence DECIMAL(5,2),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract AI Analysis
CREATE TABLE contract_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  summary TEXT,
  key_terms TEXT[],
  potential_issues TEXT[],
  risk_assessment JSONB,
  compliance_check JSONB,
  recommendations TEXT[],
  ai_confidence DECIMAL(5,2),
  analysis_type TEXT DEFAULT 'full_analysis',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case Analysis for Lawyers
CREATE TABLE case_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  analysis_summary TEXT,
  key_findings TEXT[],
  legal_precedents TEXT[],
  case_strength_score INTEGER,
  recommended_actions TEXT[],
  similar_cases JSONB,
  ai_confidence DECIMAL(5,2),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat Context for Contract Generation
CREATE TABLE contract_generation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id),
  session_data JSONB,
  current_draft TEXT,
  requirements JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI CHAT & CONVERSATIONS
-- =============================================

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversations for Legal RAG System
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  conversation_type TEXT DEFAULT 'legal_chat',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Messages for Legal RAG System
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata JSONB,
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Analytics
CREATE TABLE ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL, -- 'chat', 'document_analysis', 'contract_generation', etc.
  action_type TEXT NOT NULL, -- 'query', 'generation', 'analysis', etc.
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Knowledge Base (for RAG)
CREATE TABLE legal_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT, -- 'case_law', 'statute', 'regulation', 'precedent'
  jurisdiction TEXT, -- 'Kenya', 'East Africa', 'International', etc.
  category TEXT, -- 'contract_law', 'family_law', 'corporate_law', etc.
  source_url TEXT,
  date_published DATE,
  relevance_score DECIMAL(5,2) DEFAULT 0.0,
  vector_id TEXT, -- Pinecone vector ID
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LAWYER-SPECIFIC FEATURES
-- =============================================

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  case_pdf_url TEXT, -- Main case document PDF
  status case_status DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  lawyer_id UUID NOT NULL REFERENCES users(id),
  file_size BIGINT,
  mime_type TEXT DEFAULT 'application/pdf',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_research (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  query TEXT NOT NULL,
  results JSONB,
  sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT,
  template_used TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS & SYSTEM
-- =============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- USER CREATION TRIGGER
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'citizen')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lawyer_profiles_updated_at BEFORE UPDATE ON lawyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_drafts_updated_at BEFORE UPDATE ON document_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_knowledge_base_updated_at BEFORE UPDATE ON legal_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_usage_analytics_user_id ON ai_usage_analytics(user_id);
CREATE INDEX idx_ai_usage_analytics_feature_type ON ai_usage_analytics(feature_type);
CREATE INDEX idx_ai_usage_analytics_created_at ON ai_usage_analytics(created_at);
CREATE INDEX idx_legal_knowledge_base_document_type ON legal_knowledge_base(document_type);
CREATE INDEX idx_legal_knowledge_base_category ON legal_knowledge_base(category);
CREATE INDEX idx_legal_knowledge_base_vector_id ON legal_knowledge_base(vector_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_cases_lawyer_id ON cases(lawyer_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_contract_analysis_contract_id ON contract_analysis(contract_id);
CREATE INDEX idx_case_analysis_case_id ON case_analysis(case_id);
CREATE INDEX idx_contract_generation_sessions_user_id ON contract_generation_sessions(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Contracts: users can see contracts they created or are party to
CREATE POLICY "Users can view their contracts" ON contracts FOR SELECT USING (
  created_by = auth.uid() OR 
  id IN (SELECT contract_id FROM contract_parties WHERE user_id = auth.uid())
);

-- Documents: users can only see their own documents
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (uploaded_by = auth.uid());
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Chat conversations: users can only see their own
CREATE POLICY "Users can view own chats" ON chat_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own chats" ON chat_conversations FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notifications: users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());

-- Contract analysis: users can view analysis for their contracts
CREATE POLICY "Users can view contract analysis" ON contract_analysis FOR SELECT USING (
  contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid())
);

-- Case analysis: lawyers can view analysis for their cases
CREATE POLICY "Lawyers can view case analysis" ON case_analysis FOR SELECT USING (
  case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
);

-- Contract generation sessions: users can manage their own sessions
CREATE POLICY "Users can manage own generation sessions" ON contract_generation_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Legal research
CREATE POLICY "Users can manage own research" ON legal_research
  FOR ALL USING (auth.uid() = user_id);

-- Document drafts
CREATE POLICY "Users can manage own drafts" ON document_drafts
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Billing history
CREATE POLICY "Users can view own billing" ON billing_history
  FOR SELECT USING (auth.uid() = user_id);

-- Contract parties can view contracts they're part of
CREATE POLICY "Contract parties can view contracts" ON contract_parties
  FOR SELECT USING (
    user_id = auth.uid() OR 
    contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid())
  );

-- Document summaries: users can view summaries of their documents
CREATE POLICY "Users can view document summaries" ON document_summaries FOR SELECT USING (
  document_id IN (SELECT id FROM documents WHERE uploaded_by = auth.uid())
);

-- Cases: lawyers can manage their own cases
CREATE POLICY "Lawyers can manage own cases" ON cases
  FOR ALL USING (auth.uid() = lawyer_id);

-- Case documents: lawyers can manage documents for their cases
CREATE POLICY "Lawyers can manage case documents" ON case_documents FOR SELECT USING (
  case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
);

-- Lawyer profiles: users can create their own lawyer profile
CREATE POLICY "Users can create own lawyer profile" ON lawyer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own lawyer profile" ON lawyer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own lawyer profile" ON lawyer_profiles FOR UPDATE USING (auth.uid() = user_id);

-- AI Conversations: users can manage their own AI conversations
CREATE POLICY "Users can manage own ai conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- AI Messages: users can manage messages in their own conversations
CREATE POLICY "Users can manage ai messages" ON ai_messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert ai messages" ON ai_messages FOR INSERT WITH CHECK (
  conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
);

-- AI Usage Analytics: users can view their own usage analytics
CREATE POLICY "Users can view own ai usage" ON ai_usage_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai usage" ON ai_usage_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Legal Knowledge Base: all authenticated users can read
CREATE POLICY "Authenticated users can read legal knowledge" ON legal_knowledge_base
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage legal knowledge base (add this policy if needed)
-- CREATE POLICY "Admins can manage legal knowledge" ON legal_knowledge_base
--   FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE user_type = 'admin'));