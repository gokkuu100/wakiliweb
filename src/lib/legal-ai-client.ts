/**
 * Legal AI Client for Frontend Integration
 * Handles communication with the backend Legal AI service
 */

import { supabase } from '@/lib/supabase';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface ChatQueryRequest {
  query: string;
  conversation_id?: string;
  is_research?: boolean;
}

export interface ChatQueryResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  citations: string[];
  sources: Array<{
    content: string;
    source: string;
    cap: string;
    section: string;
    section_title: string;
    relevance_score: number;
    legal_domain: string;
  }>;
  confidence_score?: number;
  legal_domains: string[];
  tokens_used: number;
  cost: number;
  processing_time_ms: number;
  timestamp: string;
}

export interface ConversationHistory {
  conversation_id: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    citations?: string[];
    sources?: Array<Record<string, any>>;
    confidence_score?: number;
    tokens_used?: number;
    cost?: number;
  }>;
  total_messages: number;
}

export interface Conversation {
  id: string;
  title: string;
  type: string;
  message_count: number;
  last_updated: string;
  preview: string;
}

export interface UsageStats {
  total_queries: number;
  total_tokens: number;
  total_cost: number;
  average_confidence: number;
  usage_by_type: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
  period_start?: string;
  period_end?: string;
}

class LegalAIClient {
  private baseUrl = `${backendUrl}/api/v1/legal-ai`;

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a chat query to the AI
   */
  async sendChatQuery(request: ChatQueryRequest): Promise<ChatQueryResponse> {
    return this.makeRequest<ChatQueryResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get list of user conversations
   */
  async getConversations(limit: number = 20): Promise<Conversation[]> {
    return this.makeRequest<Conversation[]>(`/conversations?limit=${limit}`);
  }

  /**
   * Get conversation history with messages
   */
  async getConversationHistory(
    conversationId: string, 
    limit: number = 50
  ): Promise<ConversationHistory> {
    return this.makeRequest<ConversationHistory>(
      `/conversations/${conversationId}?limit=${limit}`
    );
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    title: string = 'New Legal Consultation',
    conversationType: string = 'chat'
  ): Promise<{ conversation_id: string }> {
    return this.makeRequest<{ conversation_id: string }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        title,
        conversation_type: conversationType,
      }),
    });
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    startDate?: string,
    endDate?: string
  ): Promise<UsageStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<UsageStats>(`/usage-stats${query}`);
  }

  /**
   * Health check for the Legal AI service
   */
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string; version: string }> {
    return this.makeRequest<{ status: string; service: string; timestamp: string; version: string }>('/health');
  }
}

// Export singleton instance
export const legalAIClient = new LegalAIClient();
