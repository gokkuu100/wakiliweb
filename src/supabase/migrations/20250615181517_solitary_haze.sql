/*
  # LegalAI Application Database Schema
  
  This is a comprehensive PostgreSQL schema for the LegalAI application
  supporting both individual users and legal professionals.
  
  ## Key Features:
  - User management with role-based access (citizen/lawyer)
  - Contract lifecycle management
  - Document storage and AI analysis
  - Legal research and chat history
  - Billing and subscription management
  - Audit trails and notifications
  
  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Proper foreign key constraints
  - Audit trails for sensitive operations
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Types Enum
CREATE TYPE user_type AS ENUM ('citizen', 'lawyer');

-- Contract Status Enum
CREATE TYPE contract_status AS ENUM ('draft', 'pending_signature', 'signed', 'cancelled', 'expired');

-- Document Status Enum
CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'analyzed', 'failed');

-- Subscription Plans Enum
CREATE TYPE subscription_plan AS ENUM ('individual', 'legal_professional');

-- Subscription Status Enum
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');

-- Priority Levels Enum
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Risk Levels Enum
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- Notification Types Enum
CREATE TYPE notification_type AS ENUM ('signature_request', 'contract_signed', 'ai_response', 'document_analyzed', 'system_update', 'payment_due');

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTION & BILLING
-- =============================================

-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan_type subscription_plan NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  contracts_limit INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  contracts_used INTEGER DEFAULT 0,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTRACT MANAGEMENT
-- =============================================

-- Contract templates
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  template_content JSONB NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{}',
  template_id UUID REFERENCES contract_templates(id),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value_amount DECIMAL(15,2),
  value_currency TEXT DEFAULT 'KES',
  start_date DATE,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract parties (signatories)
CREATE TABLE contract_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'creator', 'signatory', 'witness'
  signing_order INTEGER DEFAULT 1,
  signed_at TIMESTAMPTZ,
  signature_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract versions (for tracking changes)
CREATE TABLE contract_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  changes_summary TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENT MANAGEMENT
-- =============================================

-- Documents (for file storage and AI analysis)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  case_id UUID REFERENCES lawyer_cases(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT,
  status document_status DEFAULT 'uploaded',
  upload_source TEXT DEFAULT 'manual', -- 'manual', 'contract_generation', 'email'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI document analysis results
CREATE TABLE document_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'summary', 'risk_assessment', 'compliance_check'
  summary TEXT,
  key_points TEXT[],
  risk_level risk_level,
  risk_factors TEXT[],
  legal_citations TEXT[],
  recommendations TEXT[],
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  processing_time_ms INTEGER,
  ai_model_version TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LAWYER-SPECIFIC FEATURES
-- =============================================

-- Lawyer cases/matters
CREATE TABLE lawyer_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  case_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  priority priority_level DEFAULT 'medium',
  start_date DATE DEFAULT CURRENT_DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  billing_rate DECIMAL(10,2),
  total_hours DECIMAL(8,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lawyer_id, case_number)
);

-- Case activities/timeline
CREATE TABLE case_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES lawyer_cases(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'meeting', 'document_review', 'court_appearance', 'research'
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  billable_hours DECIMAL(4,2),
  activity_date TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal research queries and results
CREATE TABLE legal_research (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES lawyer_cases(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  research_type TEXT NOT NULL, -- 'case_law', 'statutes', 'general'
  results JSONB NOT NULL DEFAULT '[]',
  citations TEXT[],
  summary TEXT,
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI CHAT & INTERACTIONS
-- =============================================

-- AI chat conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  conversation_type TEXT DEFAULT 'general', -- 'general', 'contract_help', 'legal_research'
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual messages in conversations
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS & COMMUNICATIONS
-- =============================================

-- User notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT,
  status TEXT NOT NULL, -- 'sent', 'failed', 'bounced'
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT & LOGGING
-- =============================================

-- Audit trail for sensitive operations
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System usage analytics
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Contract indexes
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);
CREATE INDEX idx_contracts_type ON contracts(contract_type);

-- Document indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_contract_id ON documents(contract_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- AI conversation indexes
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);

-- Lawyer-specific indexes
CREATE INDEX idx_lawyer_cases_lawyer_id ON lawyer_cases(lawyer_id);
CREATE INDEX idx_lawyer_cases_status ON lawyer_cases(status);
CREATE INDEX idx_case_activities_case_id ON case_activities(case_id);
CREATE INDEX idx_legal_research_user_id ON legal_research(user_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Lawyer profiles
CREATE POLICY "Lawyers can manage own profile" ON lawyer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Contracts - users can see contracts they created or are party to
CREATE POLICY "Users can view own contracts" ON contracts
  FOR SELECT USING (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT user_id FROM contract_parties 
      WHERE contract_id = contracts.id
    )
  );

CREATE POLICY "Users can create contracts" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own contracts" ON contracts
  FOR UPDATE USING (auth.uid() = created_by);

-- Contract parties
CREATE POLICY "Contract parties visibility" ON contract_parties
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT created_by FROM contracts 
      WHERE id = contract_parties.contract_id
    )
  );

-- Documents - users can only see their own documents
CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- Document analyses
CREATE POLICY "Users can view own document analyses" ON document_analyses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM documents 
      WHERE id = document_analyses.document_id
    )
  );

-- Lawyer cases - only the lawyer can see their cases
CREATE POLICY "Lawyers can manage own cases" ON lawyer_cases
  FOR ALL USING (auth.uid() = lawyer_id);

-- Case activities
CREATE POLICY "Case activities visibility" ON case_activities
  FOR ALL USING (
    auth.uid() IN (
      SELECT lawyer_id FROM lawyer_cases 
      WHERE id = case_activities.case_id
    )
  );

-- Legal research
CREATE POLICY "Users can manage own research" ON legal_research
  FOR ALL USING (auth.uid() = user_id);

-- AI conversations
CREATE POLICY "Users can manage own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- AI messages
CREATE POLICY "Users can view own messages" ON ai_messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM ai_conversations 
      WHERE id = ai_messages.conversation_id
    )
  );

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_profiles_updated_at BEFORE UPDATE ON lawyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_cases_updated_at BEFORE UPDATE ON lawyer_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_contract_parties AFTER INSERT OR UPDATE OR DELETE ON contract_parties
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, plan_type, price_monthly, price_yearly, contracts_limit, features) VALUES
('Individual Plan', 'individual', 2500.00, 25000.00, 5, '{"ai_chat": true, "document_summaries": true, "digital_signatures": true, "lawyer_referrals": true}'),
('Legal Professional', 'legal_professional', 8500.00, 85000.00, null, '{"unlimited_research": true, "document_analysis": true, "case_management": true, "client_collaboration": true, "priority_support": true}');

-- Insert common contract templates
INSERT INTO contract_templates (name, category, description, template_content, fields) VALUES
('Non-Disclosure Agreement', 'Business', 'Standard NDA for protecting confidential information', '{}', '[]'),
('Service Agreement', 'Business', 'Professional services contract template', '{}', '[]'),
('Employment Contract', 'Employment', 'Standard employment agreement for Kenya', '{}', '[]'),
('Rental Agreement', 'Property', 'Residential property lease agreement', '{}', '[]');

-- Create indexes for full-text search
CREATE INDEX idx_contracts_search ON contracts USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_documents_search ON documents USING gin(to_tsvector('english', original_filename));
CREATE INDEX idx_lawyer_cases_search ON lawyer_cases USING gin(to_tsvector('english', title || ' ' || description || ' ' || client_name));