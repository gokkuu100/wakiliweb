-- Create user_ai_preferences table for AI chat customization
-- This table stores user preferences for AI responses, models, and behavior

CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Response preferences
    response_style VARCHAR(20) DEFAULT 'balanced' CHECK (response_style IN ('simple', 'balanced', 'detailed', 'technical')),
    include_citations BOOLEAN DEFAULT true,
    max_sources INTEGER DEFAULT 5 CHECK (max_sources BETWEEN 1 AND 20),
    
    -- Model preferences (controlled by user type)
    preferred_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    max_tokens_per_response INTEGER DEFAULT 2000 CHECK (max_tokens_per_response BETWEEN 500 AND 4000),
    
    -- Usage limits
    daily_query_limit INTEGER DEFAULT 50 CHECK (daily_query_limit > 0),
    monthly_token_limit INTEGER DEFAULT 100000 CHECK (monthly_token_limit > 0),
    
    -- Feature toggles
    enable_legal_research BOOLEAN DEFAULT false, -- Only for lawyers
    enable_document_analysis BOOLEAN DEFAULT true,
    enable_case_suggestions BOOLEAN DEFAULT true,
    
    -- Language and formatting
    response_language VARCHAR(10) DEFAULT 'en' CHECK (response_language IN ('en', 'sw')), -- English, Swahili
    use_kenyan_context BOOLEAN DEFAULT true,
    include_act_references BOOLEAN DEFAULT true,
    
    -- Privacy and data
    store_conversation_history BOOLEAN DEFAULT true,
    allow_usage_analytics BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_response_style ON user_ai_preferences(response_style);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_ai_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_ai_preferences_updated_at
    BEFORE UPDATE ON user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_ai_preferences_updated_at();

-- Insert default preferences for existing users
INSERT INTO user_ai_preferences (
    user_id, 
    response_style, 
    include_citations, 
    preferred_model,
    daily_query_limit,
    enable_legal_research,
    max_tokens_per_response,
    response_language
)
SELECT 
    u.id,
    CASE 
        WHEN u.user_type = 'lawyer' THEN 'detailed'
        WHEN u.user_type = 'citizen' THEN 'simple'
        ELSE 'balanced'
    END as response_style,
    CASE 
        WHEN u.user_type = 'lawyer' THEN true
        ELSE false
    END as include_citations,
    CASE 
        WHEN u.user_type = 'lawyer' THEN 'gpt-4'
        ELSE 'gpt-4o-mini'
    END as preferred_model,
    CASE 
        WHEN u.user_type = 'lawyer' THEN 100
        ELSE 50
    END as daily_query_limit,
    CASE 
        WHEN u.user_type = 'lawyer' THEN true
        ELSE false
    END as enable_legal_research,
    CASE 
        WHEN u.user_type = 'lawyer' THEN 3000
        ELSE 2000
    END as max_tokens_per_response,
    'en' as response_language  -- Always English for all users initially
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_ai_preferences uap WHERE uap.user_id = u.id
);

-- Add RLS (Row Level Security)
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI preferences" ON user_ai_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI preferences" ON user_ai_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI preferences" ON user_ai_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI preferences" ON user_ai_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_ai_preferences TO authenticated;

-- Add helpful comments
COMMENT ON TABLE user_ai_preferences IS 'Stores user preferences for AI chat responses and behavior';
COMMENT ON COLUMN user_ai_preferences.response_style IS 'How detailed the AI responses should be';
COMMENT ON COLUMN user_ai_preferences.preferred_model IS 'AI model to use - controlled by user type';
COMMENT ON COLUMN user_ai_preferences.enable_legal_research IS 'Whether user can access advanced legal research features';
COMMENT ON COLUMN user_ai_preferences.use_kenyan_context IS 'Whether to prioritize Kenyan legal context in responses';

-- Function to enforce citizen restrictions
CREATE OR REPLACE FUNCTION enforce_citizen_restrictions()
RETURNS TRIGGER AS $$
BEGIN
    -- Get user type
    DECLARE
        user_user_type TEXT;
    BEGIN
        SELECT user_type INTO user_user_type 
        FROM users 
        WHERE id = NEW.user_id;
        
        -- Enforce restrictions for citizens
        IF user_user_type = 'citizen' THEN
            -- Citizens must use simple response style
            IF NEW.response_style != 'simple' THEN
                NEW.response_style := 'simple';
            END IF;
            
            -- Citizens must use English only
            IF NEW.response_language != 'en' THEN
                NEW.response_language := 'en';
            END IF;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce citizen restrictions
DROP TRIGGER IF EXISTS enforce_citizen_restrictions_trigger ON user_ai_preferences;
CREATE TRIGGER enforce_citizen_restrictions_trigger
    BEFORE INSERT OR UPDATE ON user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION enforce_citizen_restrictions();
