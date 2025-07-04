/**
 * Contract Creation API Client
 * Handles all API calls to the backend for contract generation
 */

import { supabase } from './supabase';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    // Get token from Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error:', error);
      throw new Error('Authentication failed: ' + error.message);
    }
    
    if (!session?.access_token) {
      console.error('No access token found in session');
      throw new Error('Authentication required: No access token');
    }

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || `HTTP ${response.status}` };
      }
      
      console.error(`API request failed:`, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: `${API_BASE_URL}${endpoint}`
      });
      
      // Throw more specific errors
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid or expired token');
      } else if (response.status === 404) {
        throw new Error('Not found: ' + (errorData.detail || 'Resource not found'));
      } else if (response.status === 403) {
        throw new Error('Access denied: ' + (errorData.detail || 'Insufficient permissions'));
      } else {
        throw new Error(errorData.detail || `API request failed with status ${response.status}`);
      }
    }

    const result = await response.json();
    console.log(`API response for ${endpoint}:`, result);
    return result;
    
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Contract Creation API Methods
export const ContractCreationAPI = {
  // Analyze user prompt
  analyzePrompt: (userPrompt: string) => {
    return apiRequest('/api/v1/contract-generation/analyze-prompt', {
      method: 'POST',
      body: JSON.stringify({ user_prompt: userPrompt })
    });
  },

  // Create session with selected template
  createSession: (templateId: string, initialPrompt: string, aiAnalysisData: any) => {
    return apiRequest('/api/v1/contract-generation/create-session', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        initial_prompt: initialPrompt,
        ai_analysis_data: aiAnalysisData
      })
    });
  },

  // Generate clause content
  generateClause: (sessionId: string, clauseId: string, userContext = {}) => {
    return apiRequest(`/api/v1/contract-generation/sessions/${sessionId}/generate-clause`, {
      method: 'POST',
      body: JSON.stringify({
        clause_id: clauseId,
        user_context: userContext
      })
    });
  },

  // Approve clause
  approveClause: (sessionId: string, clauseId: string, userModifications: string | null = null) => {
    return apiRequest(`/api/v1/contract-generation/sessions/${sessionId}/approve-clause`, {
      method: 'POST',
      body: JSON.stringify({
        clause_id: clauseId,
        user_modifications: userModifications || undefined
      })
    });
  },

  // Finalize contract
  finalizeContract: (sessionId: string, finalReviewData = {}) => {
    return apiRequest(`/api/v1/contract-generation/sessions/${sessionId}/finalize`, {
      method: 'POST',
      body: JSON.stringify({
        final_review_data: finalReviewData
      })
    });
  },

  // Get user sessions
  getUserSessions: async (limit: number = 10, statusFilter: string | null = null) => {
    try {
      let url = `/api/v1/contract-generation/sessions?limit=${limit}`;
      if (statusFilter) {
        url += `&status_filter=${statusFilter}`;
      }
      
      console.log(`Fetching sessions from: ${url}`);
      const result = await apiRequest(url);
      console.log('Sessions API result:', result);
      
      return result;
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      throw error;
    }
  },

  // Get session details
  getSessionDetails: async (sessionId: string) => {
    try {
      console.log(`Fetching session details for: ${sessionId}`);
      const result = await apiRequest(`/api/v1/contract-generation/sessions/${sessionId}`);
      console.log('Session details result:', result);
      
      return result;
    } catch (error) {
      console.error('Error in getSessionDetails:', error);
      throw error;
    }
  },

  // Get user session statistics
  getUserStats: async () => {
    try {
      console.log('Fetching user stats...');
      const result = await apiRequest('/api/v1/contract-generation/sessions/stats');
      console.log('Stats API result:', result);
      
      return result;
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw error;
    }
  },
  
  // Download contract as PDF
  downloadContractPDF: async (contractId: string) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('Authentication required');
    }

    return {
      downloadUrl: `${API_BASE_URL}/api/v1/contracts/${contractId}/download-pdf`,
      getDownloadHeaders: () => ({
        'Authorization': `Bearer ${session.access_token}`
      })
    };
  },
  
  // Get contract preview HTML
  getContractPreview: (sessionId: string) => {
    return apiRequest(`/api/v1/contract-generation/sessions/${sessionId}/preview`);
  },
  
  // Generate optional clauses
  generateOptionalClauses: (sessionId: string) => {
    return apiRequest(`/api/v1/contract-generation/sessions/${sessionId}/optional-clauses`, {
      method: 'GET'
    });
  },
  
  // Add optional clause to contract
  addOptionalClause: (sessionId: string, clauseId: string) => {
    return apiRequest(`/api/v1/contract-generation/sessions/${sessionId}/add-optional-clause`, {
      method: 'POST',
      body: JSON.stringify({
        clause_id: clauseId
      })
    });
  }
};
