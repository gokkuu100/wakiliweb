import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { aiConfig } from './config';
import { aiMonitoring } from './monitoring';
import type {
  AIUsageSession,
  AITokenUsage,
  AICompletionRequest,
  AICompletionResponse,
  UserAILimits,
  AIError,
  VectorSearchRequest,
  VectorSearchResponse,
} from '../types';

export class AICore {
  private openai: OpenAI;
  private vectorDbEndpoint: string;
  private vectorDbApiKey: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    
    // Vector database configuration (use your preferred service)
    this.vectorDbEndpoint = process.env.VECTOR_DB_ENDPOINT || '';
    this.vectorDbApiKey = process.env.VECTOR_DB_API_KEY || '';

    // Validate configuration on startup
    const validation = aiConfig.validateConfiguration();
    if (!validation.valid) {
      console.error('AI Configuration errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn('AI Configuration warnings:', validation.warnings);
    }
  }

  /**
   * Create a new AI usage session
   */
  async createSession(
    userId: string,
    sessionType: 'chat' | 'contract_generation' | 'document_analysis',
    metadata?: Record<string, any>
  ): Promise<AIUsageSession> {
    try {
      const { data, error } = await supabase
        .from('ai_usage_sessions')
        .insert({
          user_id: userId,
          session_type: sessionType,
          session_metadata: metadata,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating AI session:', error);
      throw this.createError('SESSION_CREATE_FAILED', 'Failed to create AI session', { userId, sessionType });
    }
  }

  /**
   * Complete an AI session
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('ai_usage_sessions')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error completing AI session:', error);
    }
  }

  /**
   * Check if user has sufficient tokens
   */
  async checkTokenLimits(userId: string, requestedTokens: number): Promise<{
    allowed: boolean;
    limits: UserAILimits;
    reason?: string;
  }> {
    try {
      const { data: limits } = await supabase
        .from('user_ai_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!limits) {
        // Create default limits for new user
        const { data: newLimits } = await supabase
          .from('user_ai_limits')
          .insert({
            user_id: userId,
            monthly_token_limit: 50000,
            daily_token_limit: 2000,
          })
          .select()
          .single();
        
        return {
          allowed: requestedTokens <= 2000,
          limits: newLimits!,
          reason: requestedTokens > 2000 ? 'Daily limit exceeded' : undefined,
        };
      }

      if (limits.is_unlimited) {
        return { allowed: true, limits };
      }

      // Check daily limits
      const today = new Date().toISOString().split('T')[0];
      if (limits.current_day !== today) {
        // Reset daily usage
        await supabase
          .from('user_ai_limits')
          .update({
            daily_tokens_used: 0,
            current_day: today,
          })
          .eq('user_id', userId);
        
        limits.daily_tokens_used = 0;
        limits.current_day = today;
      }

      if (limits.daily_tokens_used + requestedTokens > limits.daily_token_limit) {
        return {
          allowed: false,
          limits,
          reason: 'Daily token limit exceeded',
        };
      }

      // Check monthly limits
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (limits.current_month !== currentMonth) {
        // Reset monthly usage
        await supabase
          .from('user_ai_limits')
          .update({
            monthly_tokens_used: 0,
            current_month: currentMonth,
          })
          .eq('user_id', userId);
        
        limits.monthly_tokens_used = 0;
        limits.current_month = currentMonth;
      }

      if (limits.monthly_tokens_used + requestedTokens > limits.monthly_token_limit) {
        return {
          allowed: false,
          limits,
          reason: 'Monthly token limit exceeded',
        };
      }

      return { allowed: true, limits };
    } catch (error) {
      console.error('Error checking token limits:', error);
      throw this.createError('TOKEN_LIMIT_CHECK_FAILED', 'Failed to check token limits', { userId });
    }
  }

  /**
   * Make an AI completion request
   */
  async completion(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    
    try {
      // Check token limits first
      const estimatedTokens = Math.ceil(request.prompt.length / 4); // Rough estimate
      const limitCheck = await this.checkTokenLimits(request.user_id, estimatedTokens);
      
      if (!limitCheck.allowed) {
        throw this.createError('TOKEN_LIMIT_EXCEEDED', limitCheck.reason || 'Token limit exceeded', {
          userId: request.user_id,
          requestedTokens: estimatedTokens,
          limits: limitCheck.limits,
        });
      }

      // Enhance prompt with Kenyan legal context
      const enhancedPrompt = this.enhancePromptWithLegalContext(request.prompt, request.context);

      // Make OpenAI request
      const completion = await this.openai.chat.completions.create({
        model: request.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.context),
          },
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
        max_tokens: request.max_tokens || 2000,
        temperature: request.temperature || 0.3,
      });

      const response = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const processingTime = Date.now() - startTime;

      // Calculate cost
      const cost = this.calculateCost(tokensUsed, request.model || 'gpt-4');

      // Track usage
      if (request.session_id) {
        await this.trackTokenUsage({
          session_id: request.session_id,
          user_id: request.user_id,
          request_type: 'completion',
          prompt_tokens: tokensUsed.prompt_tokens,
          completion_tokens: tokensUsed.completion_tokens,
          total_tokens: tokensUsed.total_tokens,
          model: request.model || 'gpt-4',
          cost_usd: cost,
          request_data: {
            prompt_length: request.prompt.length,
            response_length: response.length,
            processing_time_ms: processingTime,
          },
        });
      }

      return {
        content: response,
        tokens_used: {
          prompt: tokensUsed.prompt_tokens,
          completion: tokensUsed.completion_tokens,
          total: tokensUsed.total_tokens,
        },
        model: request.model || 'gpt-4',
        processing_time_ms: processingTime,
        cost_usd: cost,
      };
    } catch (error) {
      console.error('AI completion error:', error);
      
      if (error instanceof Error && error.message.includes('TOKEN_LIMIT_EXCEEDED')) {
        throw error;
      }
      
      throw this.createError('COMPLETION_FAILED', 'AI completion request failed', {
        userId: request.user_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Perform vector search in legal knowledge base
   */
  async vectorSearch(request: VectorSearchRequest): Promise<VectorSearchResponse> {
    const startTime = Date.now();
    
    try {
      // Create embedding for the query
      const embedding = await this.createEmbedding(request.query);
      
      // Search vector database (implement based on your vector DB choice)
      const searchResults = await this.searchVectorDatabase({
        embedding: embedding.data[0].embedding,
        legal_areas: request.legal_areas,
        jurisdiction: request.jurisdiction,
        source_types: request.source_types,
        relevance_threshold: request.relevance_threshold || 0.7,
        max_results: request.max_results || 10,
      });

      const processingTime = Date.now() - startTime;

      // Track search session
      await supabase
        .from('vector_search_sessions')
        .insert({
          user_id: request.user_id,
          query_text: request.query,
          search_results: searchResults,
          relevance_threshold: request.relevance_threshold || 0.7,
          sources_count: searchResults.length,
          processing_time_ms: processingTime,
        });

      return {
        results: searchResults,
        total_results: searchResults.length,
        processing_time_ms: processingTime,
      };
    } catch (error) {
      console.error('Vector search error:', error);
      throw this.createError('VECTOR_SEARCH_FAILED', 'Vector search failed', {
        userId: request.user_id,
        query: request.query,
      });
    }
  }

  /**
   * Create embedding for text
   */
  private async createEmbedding(text: string) {
    return await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
  }

  /**
   * Search vector database (implement based on your vector DB choice)
   */
  private async searchVectorDatabase(params: {
    embedding: number[];
    legal_areas?: string[];
    jurisdiction?: string;
    source_types?: string[];
    relevance_threshold: number;
    max_results: number;
  }) {
    // This is a placeholder - implement based on your vector database
    // Examples: Pinecone, Weaviate, Qdrant, etc.
    
    // For now, return mock data
    const { data: sources } = await supabase
      .from('legal_knowledge_sources')
      .select('*')
      .eq('jurisdiction', params.jurisdiction || 'Kenya')
      .limit(params.max_results);

    return (sources || []).map(source => ({
      source,
      relevance_score: 0.85, // This would come from vector similarity
      matched_content: source.content_summary || source.title,
    }));
  }

  /**
   * Track token usage
   */
  private async trackTokenUsage(usage: Omit<AITokenUsage, 'id' | 'created_at'>) {
    try {
      await supabase
        .from('ai_token_usage')
        .insert(usage);
    } catch (error) {
      console.error('Error tracking token usage:', error);
    }
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(tokens: { prompt_tokens: number; completion_tokens: number }, model: string): number {
    const costs = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    };

    const modelCosts = costs[model as keyof typeof costs] || costs['gpt-4'];
    
    return (
      (tokens.prompt_tokens / 1000) * modelCosts.input +
      (tokens.completion_tokens / 1000) * modelCosts.output
    );
  }

  /**
   * Enhance prompt with Kenyan legal context
   */
  private enhancePromptWithLegalContext(prompt: string, context?: Record<string, any>): string {
    const legalContext = `
You are a legal AI assistant specialized in Kenyan law. Always consider:
- The Constitution of Kenya 2010
- Relevant Kenyan statutes and regulations
- Kenyan case law and precedents
- Local legal practices and procedures
- Cultural and business context in Kenya

When providing legal advice or analysis, cite relevant Kenyan laws where applicable.
`;

    return `${legalContext}\n\nUser Query: ${prompt}`;
  }

  /**
   * Get system prompt based on context
   */
  private getSystemPrompt(context?: Record<string, any>): string {
    const basePrompt = `You are a highly knowledgeable legal AI assistant specializing in Kenyan law. You provide accurate, helpful, and legally sound information while being mindful of ethical considerations.

IMPORTANT GUIDELINES:
1. Always specify when you're providing general information vs. specific legal advice
2. Encourage users to consult with qualified lawyers for complex matters
3. Cite relevant Kenyan laws, regulations, and cases when applicable
4. Be clear about limitations and uncertainties
5. Use clear, professional language accessible to non-lawyers

KENYAN LEGAL FRAMEWORK:
- Constitution of Kenya 2010
- Acts of Parliament
- Legal Notice and Regulations  
- Case law from Kenyan courts
- Common law principles applicable in Kenya`;

    if (context?.legal_area) {
      return `${basePrompt}\n\nSPECIALIZATION: This conversation focuses on ${context.legal_area}.`;
    }

    return basePrompt;
  }

  /**
   * Create standardized error
   */
  private createError(code: string, message: string, details?: Record<string, any>): AIError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    } as AIError;
  }

  /**
   * Get user's AI usage statistics
   */
  async getUserUsageStats(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    try {
      const { data: limits } = await supabase
        .from('user_ai_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: sessions } = await supabase
        .from('ai_usage_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', this.getPeriodStart(period))
        .order('started_at', { ascending: false });

      const { data: analytics } = await supabase
        .from('user_analytics_daily')
        .select('*')
        .eq('user_id', userId)
        .gte('analytics_date', this.getPeriodStart(period))
        .order('analytics_date', { ascending: false });

      return {
        limits,
        sessions: sessions || [],
        analytics: analytics || [],
        usage_summary: {
          total_tokens: sessions?.reduce((sum, s) => sum + s.total_tokens_used, 0) || 0,
          total_cost: sessions?.reduce((sum, s) => sum + s.cost_usd, 0) || 0,
          session_count: sessions?.length || 0,
        },
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw this.createError('USAGE_STATS_FAILED', 'Failed to get usage statistics', { userId });
    }
  }

  /**
   * Get period start date
   */
  private getPeriodStart(period: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return weekStart.toISOString();
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }
}

export const aiCore = new AICore();
