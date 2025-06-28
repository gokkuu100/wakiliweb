/**
 * React Hook for Legal AI Chat
 * Provides state management and API integration for AI chat functionality
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuthContext';
import { useToast } from './use-toast';
import { supabase } from '@/lib/supabase';

// Type definitions for Legal AI
interface ChatQueryRequest {
  query: string;
  conversation_id?: string;
  is_research?: boolean;
}

interface ChatQueryResponse {
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

interface ConversationHistory {
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

interface Conversation {
  id: string;
  title: string;
  type: string;
  message_count: number;
  last_updated: string;
  preview: string;
}

interface UsageStats {
  total_queries: number;
  total_tokens: number;
  total_cost: number;
  average_confidence: number;
  processing_time_ms?: number;
  usage_by_type: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
  period_start?: string;
  period_end?: string;
}

// Simple API client for Legal AI
const createLegalAIClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  const makeRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${backendUrl}/api/v1/legal-ai${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    sendChatQuery: (request: ChatQueryRequest): Promise<ChatQueryResponse> =>
      makeRequest<ChatQueryResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify(request),
      }),

    getConversations: (limit: number = 20): Promise<Conversation[]> =>
      makeRequest<Conversation[]>(`/conversations?limit=${limit}`),

    getConversationHistory: (conversationId: string, limit: number = 50): Promise<ConversationHistory> =>
      makeRequest<ConversationHistory>(`/conversations/${conversationId}?limit=${limit}`),

    getUsageStats: (startDate?: string, endDate?: string): Promise<UsageStats> => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const query = params.toString() ? `?${params.toString()}` : '';
      return makeRequest<UsageStats>(`/usage-stats${query}`);
    },
  };
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  citations?: string[];
  sources?: Array<Record<string, any>>;
  confidence_score?: number;
  processing_time_ms?: number;
  tokens_used?: number;
  cost?: number;
}

interface UseLegalAIChatReturn {
  // State
  messages: Message[];
  currentConversationId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  usageStats: UsageStats | null;
  
  // Actions
  sendMessage: (query: string, isResearch?: boolean) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  
  // Conversation management
  conversations: Array<{ id: string; title: string; updated_at: string }>;
  loadConversations: () => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  
  // Usage tracking
  loadUsageStats: () => Promise<void>;
}

export function useLegalAIChat(): UseLegalAIChatReturn {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  // Initialize the legal AI client
  const legalAIClient = createLegalAIClient();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; updated_at: string }>>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingUsageStats, setIsLoadingUsageStats] = useState(false);
  
  // Refs for retry functionality
  const lastQueryRef = useRef<string>('');
  const lastIsResearchRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (query: string, isResearch: boolean = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the AI chat feature.",
        variant: "destructive",
      });
      return;
    }

    if (!query.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a question to ask the AI.",
        variant: "destructive",
      });
      return;
    }

    // Store for retry functionality
    lastQueryRef.current = query;
    lastIsResearchRef.current = isResearch;

    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    // Add user message immediately
    addMessage({
      role: 'user',
      content: query,
    });

    try {
      const request: ChatQueryRequest = {
        query,
        conversation_id: currentConversationId || undefined,
        is_research: isResearch && userProfile?.user_type === 'lawyer',
      };

      // Call the new legal AI backend
      const response = await legalAIClient.sendChatQuery(request);

      // Update conversation ID if this is a new conversation
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
      }

      // Add AI response message
      addMessage({
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        sources: response.sources,
        confidence_score: response.confidence_score,
        processing_time_ms: response.processing_time_ms,
        tokens_used: response.tokens_used,
        cost: response.cost,
      });

      // Show success toast with usage info
      toast({
        title: "Response Generated",
        description: `Used ${response.tokens_used} tokens • Cost: $${response.cost.toFixed(4)} • Confidence: ${((response.confidence_score || 0) * 100).toFixed(1)}%`,
      });

      // Refresh usage stats
      await loadUsageStats();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      addMessage({
        role: 'system',
        content: `Error: ${errorMessage}`,
      });

      toast({
        title: "AI Query Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [user, currentConversationId, addMessage, toast]);

  const retryLastMessage = useCallback(async () => {
    if (lastQueryRef.current) {
      await sendMessage(lastQueryRef.current, lastIsResearchRef.current);
    }
  }, [sendMessage]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const history = await legalAIClient.getConversationHistory(conversationId);
      
      // Convert API messages to our Message format
      const conversationMessages: Message[] = history.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        citations: msg.citations,
        sources: msg.sources,
        confidence_score: msg.confidence_score,
        tokens_used: msg.tokens_used,
        cost: msg.cost,
      }));

      setMessages(conversationMessages);
      setCurrentConversationId(conversationId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      toast({
        title: "Failed to Load Conversation",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
    clearError();
  }, [clearError]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!user?.id || isLoadingConversations) return;

    setIsLoadingConversations(true);
    try {
      const conversations = await legalAIClient.getConversations(20);
      setConversations(conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        updated_at: conv.last_updated,
      })));
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user?.id]); // Only depend on user.id

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      // Note: Delete endpoint not implemented yet
      // For now, just remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If this was the current conversation, start a new one
      if (currentConversationId === conversationId) {
        startNewConversation();
      }

      toast({
        title: "Conversation Removed",
        description: "The conversation has been removed from your list.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove conversation';
      toast({
        title: "Remove Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, currentConversationId, startNewConversation, toast]);

  const loadUsageStats = useCallback(async () => {
    if (!user?.id || isLoadingUsageStats) return;

    setIsLoadingUsageStats(true);
    try {
      const stats = await legalAIClient.getUsageStats();
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    } finally {
      setIsLoadingUsageStats(false);
    }
  }, [user?.id]); // Remove isLoadingUsageStats from dependencies

  return {
    // State
    messages,
    currentConversationId,
    isLoading,
    isTyping,
    error,
    usageStats,
    
    // Actions
    sendMessage,
    loadConversation,
    startNewConversation,
    clearMessages,
    retryLastMessage,
    
    // Conversation management
    conversations,
    loadConversations,
    deleteConversation,
    
    // Usage tracking
    loadUsageStats,
  };
}
