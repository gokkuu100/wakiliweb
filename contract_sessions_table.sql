-- =====================================================
-- CONTRACT SESSIONS TRACKING TABLES
-- Track user contract creation sessions with full audit trail
-- =====================================================

-- Contract Creation Sessions Table
-- Tracks each user's contract creation journey from start to finish
CREATE TABLE IF NOT EXISTS contract_creation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session metadata
    session_status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, abandoned, expired
    initial_user_prompt TEXT, -- The user's initial request/idea
    ai_suggested_template_type VARCHAR(100), -- What AI suggested (nda, employment, etc.)
    selected_template_id UUID, -- Reference to contract_templates table
    
    -- Session progress tracking
    current_stage VARCHAR(100) DEFAULT 'initial_prompt', -- initial_prompt, template_selection, clause_creation, review, completion
    current_stage_name VARCHAR(200), -- Human readable stage name
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 8,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Contract details
    contract_title VARCHAR(500),
    contract_type VARCHAR(100),
    contract_id UUID, -- Final contract ID when created
    
    -- Session data (JSON to store form data, AI responses, etc.)
    session_data JSONB DEFAULT '{}',
    ai_analysis_data JSONB DEFAULT '{}', -- Store AI analysis of user prompt
    template_suggestions JSONB DEFAULT '[]', -- Store AI template suggestions
    clause_progress JSONB DEFAULT '{}', -- Track which clauses are completed
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    
    -- Audit trail
    activity_log JSONB DEFAULT '[]', -- Store user actions and AI responses
    
    CONSTRAINT valid_session_status CHECK (session_status IN ('active', 'paused', 'completed', 'abandoned', 'expired')),
    CONSTRAINT valid_current_stage CHECK (current_stage IN ('initial_prompt', 'template_selection', 'clause_creation', 'party_details', 'review', 'completion'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_sessions_user_id ON contract_creation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_sessions_status ON contract_creation_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_contract_sessions_created_at ON contract_creation_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_sessions_last_activity ON contract_creation_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_contract_sessions_contract_type ON contract_creation_sessions(contract_type);

-- Session Stage Progress Table
-- Track detailed progress through each stage of contract creation
CREATE TABLE IF NOT EXISTS session_stage_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES contract_creation_sessions(id) ON DELETE CASCADE,
    
    -- Stage details
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    stage_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, skipped
    
    -- Progress data
    stage_data JSONB DEFAULT '{}',
    ai_assistance_used BOOLEAN DEFAULT false,
    ai_suggestions JSONB DEFAULT '[]',
    user_modifications TEXT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_stage_status CHECK (stage_status IN ('pending', 'in_progress', 'completed', 'skipped'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stage_progress_session_id ON session_stage_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_stage_progress_stage_order ON session_stage_progress(stage_order);
CREATE INDEX IF NOT EXISTS idx_stage_progress_status ON session_stage_progress(stage_status);

-- Session Clause Tracking Table
-- Track the creation and modification of individual clauses within a session
CREATE TABLE IF NOT EXISTS session_clause_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES contract_creation_sessions(id) ON DELETE CASCADE,
    
    -- Clause details
    clause_id VARCHAR(100) NOT NULL, -- e.g., 'nda_parties', 'nda_obligations'
    clause_title VARCHAR(200),
    clause_type VARCHAR(50), -- mandatory, optional, custom
    clause_order INTEGER,
    
    -- Clause status and content
    clause_status VARCHAR(50) DEFAULT 'pending', -- pending, ai_generated, user_approved, user_modified, rejected
    ai_generated_content TEXT,
    user_modified_content TEXT,
    final_content TEXT,
    
    -- AI interaction data
    ai_generation_prompt TEXT,
    ai_confidence_score DECIMAL(3,2),
    user_feedback TEXT,
    modification_count INTEGER DEFAULT 0,
    
    -- User interaction
    user_approved BOOLEAN DEFAULT false,
    user_modifications JSONB DEFAULT '[]', -- Track history of user changes
    time_spent_on_clause INTEGER DEFAULT 0, -- seconds
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_clause_status CHECK (clause_status IN ('pending', 'ai_generated', 'user_approved', 'user_modified', 'rejected')),
    CONSTRAINT valid_clause_type CHECK (clause_type IN ('mandatory', 'optional', 'custom'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clause_tracking_session_id ON session_clause_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_clause_tracking_clause_type ON session_clause_tracking(clause_type);
CREATE INDEX IF NOT EXISTS idx_clause_tracking_status ON session_clause_tracking(clause_status);
CREATE INDEX IF NOT EXISTS idx_clause_tracking_order ON session_clause_tracking(clause_order);

-- Session Activity Log Table
-- Detailed audit trail of all user and AI actions within a session
CREATE TABLE IF NOT EXISTS session_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES contract_creation_sessions(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(100) NOT NULL, -- user_action, ai_response, system_event
    action_name VARCHAR(200) NOT NULL, -- e.g., 'clause_approved', 'ai_suggestion_generated'
    actor_type VARCHAR(50) NOT NULL, -- user, ai, system
    
    -- Activity data
    description TEXT,
    activity_data JSONB DEFAULT '{}', -- Structured data about the activity
    previous_state JSONB,
    new_state JSONB,
    
    -- Context
    stage_name VARCHAR(100),
    clause_id VARCHAR(100),
    
    -- Timestamps and metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT valid_activity_type CHECK (activity_type IN ('user_action', 'ai_response', 'system_event')),
    CONSTRAINT valid_actor_type CHECK (actor_type IN ('user', 'ai', 'system'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_session_id ON session_activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON session_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON session_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_stage_name ON session_activity_log(stage_name);

-- =====================================================
-- FUNCTIONS FOR SESSION MANAGEMENT
-- =====================================================

-- Function to create a new contract creation session
CREATE OR REPLACE FUNCTION create_contract_session(
    p_user_id UUID,
    p_initial_prompt TEXT DEFAULT NULL,
    p_contract_type VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO contract_creation_sessions (
        user_id,
        initial_user_prompt,
        contract_type,
        session_status,
        current_stage,
        current_stage_name,
        activity_log
    ) VALUES (
        p_user_id,
        p_initial_prompt,
        p_contract_type,
        'active',
        'initial_prompt',
        'Getting Started',
        jsonb_build_array(
            jsonb_build_object(
                'timestamp', NOW(),
                'action', 'session_created',
                'description', 'New contract creation session started'
            )
        )
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update session progress
CREATE OR REPLACE FUNCTION update_session_progress(
    p_session_id UUID,
    p_stage VARCHAR DEFAULT NULL,
    p_stage_name VARCHAR DEFAULT NULL,
    p_step INTEGER DEFAULT NULL,
    p_completion_percentage DECIMAL DEFAULT NULL,
    p_session_data JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE contract_creation_sessions 
    SET 
        current_stage = COALESCE(p_stage, current_stage),
        current_stage_name = COALESCE(p_stage_name, current_stage_name),
        current_step = COALESCE(p_step, current_step),
        completion_percentage = COALESCE(p_completion_percentage, completion_percentage),
        session_data = COALESCE(p_session_data, session_data),
        updated_at = NOW(),
        last_activity_at = NOW()
    WHERE id = p_session_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to log session activity
CREATE OR REPLACE FUNCTION log_session_activity(
    p_session_id UUID,
    p_activity_type VARCHAR,
    p_action_name VARCHAR,
    p_actor_type VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_activity_data JSONB DEFAULT NULL,
    p_stage_name VARCHAR DEFAULT NULL,
    p_clause_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO session_activity_log (
        session_id,
        activity_type,
        action_name,
        actor_type,
        description,
        activity_data,
        stage_name,
        clause_id
    ) VALUES (
        p_session_id,
        p_activity_type,
        p_action_name,
        p_actor_type,
        p_description,
        p_activity_data,
        p_stage_name,
        p_clause_id
    ) RETURNING id INTO activity_id;
    
    -- Also update the session's last activity time
    UPDATE contract_creation_sessions 
    SET last_activity_at = NOW()
    WHERE id = p_session_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's recent contract sessions
CREATE OR REPLACE FUNCTION get_user_contract_sessions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    session_id UUID,
    contract_title VARCHAR,
    contract_type VARCHAR,
    session_status VARCHAR,
    current_stage_name VARCHAR,
    completion_percentage DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.contract_title,
        cs.contract_type,
        cs.session_status,
        cs.current_stage_name,
        cs.completion_percentage,
        cs.created_at,
        cs.last_activity_at
    FROM contract_creation_sessions cs
    WHERE cs.user_id = p_user_id
    ORDER BY cs.last_activity_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all session tables
CREATE TRIGGER update_contract_sessions_updated_at
    BEFORE UPDATE ON contract_creation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stage_progress_updated_at
    BEFORE UPDATE ON session_stage_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clause_tracking_updated_at
    BEFORE UPDATE ON session_clause_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA INSERTION (for testing)
-- =====================================================

-- Insert sample session stages configuration
-- This helps define the standard workflow stages
CREATE TABLE IF NOT EXISTS contract_workflow_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_type VARCHAR(100) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    stage_title VARCHAR(200) NOT NULL,
    stage_description TEXT,
    is_mandatory BOOLEAN DEFAULT true,
    estimated_time_minutes INTEGER DEFAULT 5,
    ai_assistance_available BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(contract_type, stage_order),
    UNIQUE(contract_type, stage_name)
);

-- Insert default workflow stages for NDA contracts
INSERT INTO contract_workflow_stages (contract_type, stage_name, stage_order, stage_title, stage_description, estimated_time_minutes) VALUES
('nda', 'initial_prompt', 1, 'Describe Your Needs', 'Tell us what kind of contract you need to create', 3),
('nda', 'template_selection', 2, 'AI Template Suggestion', 'Review AI-suggested contract template', 2),
('nda', 'party_details', 3, 'Party Information', 'Enter details for all parties involved', 5),
('nda', 'mandatory_clauses', 4, 'Essential Clauses', 'Review and approve mandatory contract clauses', 10),
('nda', 'optional_clauses', 5, 'Additional Terms', 'Add optional clauses and custom terms', 8),
('nda', 'review', 6, 'Final Review', 'Review the complete contract before finalizing', 5),
('nda', 'completion', 7, 'Contract Ready', 'Your contract is ready for signing', 1)
ON CONFLICT (contract_type, stage_order) DO NOTHING;

-- Create index for workflow stages
CREATE INDEX IF NOT EXISTS idx_workflow_stages_contract_type ON contract_workflow_stages(contract_type);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_order ON contract_workflow_stages(stage_order);
