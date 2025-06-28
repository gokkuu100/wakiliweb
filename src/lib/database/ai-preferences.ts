/**
 * Database functions for managing user AI preferences
 */

import { supabase } from '../supabase';

export interface UserAIPreferences {
  id: string;
  user_id: string;
  response_style: 'simple' | 'balanced' | 'detailed' | 'technical';
  include_citations: boolean;
  max_sources: number;
  preferred_model: string;
  max_tokens_per_response: number;
  daily_query_limit: number;
  monthly_token_limit: number;
  enable_legal_research: boolean;
  enable_document_analysis: boolean;
  enable_case_suggestions: boolean;
  response_language: 'en' | 'sw';
  use_kenyan_context: boolean;
  include_act_references: boolean;
  store_conversation_history: boolean;
  allow_usage_analytics: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAIPreferencesUpdate {
  response_style?: 'simple' | 'balanced' | 'detailed' | 'technical';
  include_citations?: boolean;
  max_sources?: number;
  max_tokens_per_response?: number;
  daily_query_limit?: number;
  monthly_token_limit?: number;
  enable_document_analysis?: boolean;
  enable_case_suggestions?: boolean;
  response_language?: 'en' | 'sw';
  use_kenyan_context?: boolean;
  include_act_references?: boolean;
  store_conversation_history?: boolean;
  allow_usage_analytics?: boolean;
}

/**
 * Get user's AI preferences
 */
export async function getUserAIPreferences(userId: string): Promise<UserAIPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, create default ones
        return await createDefaultAIPreferences(userId);
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user AI preferences:', error);
    return null;
  }
}

/**
 * Create default AI preferences for a user
 */
export async function createDefaultAIPreferences(userId: string): Promise<UserAIPreferences | null> {
  try {
    // Get user info to determine defaults
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single();

    const isLawyer = user?.user_type === 'lawyer';

    const defaultPreferences: Partial<UserAIPreferences> = {
      user_id: userId,
      response_style: isLawyer ? 'detailed' : 'simple',
      include_citations: isLawyer,
      max_sources: 5,
      preferred_model: isLawyer ? 'gpt-4' : 'gpt-4o-mini',
      max_tokens_per_response: isLawyer ? 3000 : 2000,
      daily_query_limit: isLawyer ? 100 : 50,
      monthly_token_limit: isLawyer ? 500000 : 100000,
      enable_legal_research: isLawyer,
      enable_document_analysis: true,
      enable_case_suggestions: true,
      response_language: 'en', // Always English for both citizens and lawyers initially
      use_kenyan_context: true,
      include_act_references: true,
      store_conversation_history: true,
      allow_usage_analytics: true,
    };

    const { data, error } = await supabase
      .from('user_ai_preferences')
      .insert(defaultPreferences)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating default AI preferences:', error);
    return null;
  }
}

/**
 * Update user's AI preferences
 */
export async function updateUserAIPreferences(
  userId: string,
  updates: UserAIPreferencesUpdate
): Promise<UserAIPreferences | null> {
  try {
    // Get user type to enforce restrictions
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single();

    const isLawyer = user?.user_type === 'lawyer';

    // Enforce citizen restrictions
    if (!isLawyer) {
      // Citizens can only use simple response style
      if (updates.response_style && updates.response_style !== 'simple') {
        updates.response_style = 'simple';
      }
      // Citizens can only use English
      if (updates.response_language && updates.response_language !== 'en') {
        updates.response_language = 'en';
      }
    }

    const { data, error } = await supabase
      .from('user_ai_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user AI preferences:', error);
    return null;
  }
}

/**
 * Get model recommendations based on user type
 */
export function getModelRecommendations(userType: string) {
  const isLawyer = userType === 'lawyer';
  
  return {
    citizen: {
      recommended: 'gpt-4o-mini',
      alternatives: [],
      description: 'Optimized for clear, simple legal guidance'
    },
    lawyer: {
      recommended: 'gpt-4',
      alternatives: ['gpt-4-turbo'],
      description: 'Advanced model for complex legal research and analysis'
    }
  }[isLawyer ? 'lawyer' : 'citizen'];
}

/**
 * Validate preference values
 */
export function validatePreferences(preferences: Partial<UserAIPreferencesUpdate>): string[] {
  const errors: string[] = [];

  if (preferences.max_sources && (preferences.max_sources < 1 || preferences.max_sources > 20)) {
    errors.push('Max sources must be between 1 and 20');
  }

  if (preferences.max_tokens_per_response && 
      (preferences.max_tokens_per_response < 500 || preferences.max_tokens_per_response > 4000)) {
    errors.push('Max tokens per response must be between 500 and 4000');
  }

  if (preferences.daily_query_limit && preferences.daily_query_limit < 1) {
    errors.push('Daily query limit must be at least 1');
  }

  if (preferences.monthly_token_limit && preferences.monthly_token_limit < 1000) {
    errors.push('Monthly token limit must be at least 1000');
  }

  return errors;
}

/**
 * Get response style descriptions
 */
export function getResponseStyleDescriptions() {
  return {
    simple: {
      title: 'Simple',
      description: 'Clear, easy-to-understand responses with minimal legal jargon',
      suitable_for: 'Citizens, general public'
    },
    balanced: {
      title: 'Balanced',
      description: 'Mix of accessible language with some legal detail',
      suitable_for: 'Business owners, paralegals'
    },
    detailed: {
      title: 'Detailed',
      description: 'Comprehensive responses with legal analysis and citations',
      suitable_for: 'Lawyers, legal professionals'
    },
    technical: {
      title: 'Technical',
      description: 'In-depth legal analysis with full citations and precedents',
      suitable_for: 'Senior lawyers, judges, legal researchers'
    }
  };
}
