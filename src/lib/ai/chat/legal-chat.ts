import { supabase } from '@/lib/supabase';
import { aiCore } from '../core/ai-core';
import { aiTracking } from '../tracking/usage-tracking';
import type {
  ChatConversation,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  VectorSearchRequest,
  LegalKnowledgeSource,
} from '../types';

export class LegalChatService {
  
  /**
   * Send a chat message and get AI response
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Check user limits first
      const estimatedTokens = Math.ceil(request.message.length / 4);
      const limitCheck = await aiTracking.checkUserLimits(request.user_id, estimatedTokens);
      
      if (!limitCheck.allowed) {
        throw new Error(limitCheck.reason || 'Usage limit exceeded');
      }

      // Get or create conversation
      let conversation: ChatConversation;
      if (request.conversation_id) {
        const { data } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', request.conversation_id)
          .eq('user_id', request.user_id)
          .single();
        
        if (!data) {
          throw new Error('Conversation not found');
        }
        conversation = data;
      } else {
        conversation = await this.createConversation(request.user_id, request.context?.legal_area);
      }

      // Create AI session
      const session = await aiCore.createSession(
        request.user_id,
        'chat',
        {
          conversation_id: conversation.id,
          legal_area: request.context?.legal_area,
        }
      );

      // Save user message
      const userMessage = await this.saveMessage(conversation.id, 'user', request.message);

      // Search legal knowledge base for relevant context
      const knowledgeContext = await this.searchLegalKnowledge(request);

      // Build enhanced prompt with legal context
      const enhancedPrompt = this.buildLegalPrompt(request, knowledgeContext.results);

      // Get AI response
      const aiResponse = await aiCore.completion({
        prompt: enhancedPrompt,
        user_id: request.user_id,
        session_id: session.id,
        context: {
          legal_area: request.context?.legal_area,
          conversation_history: await this.getRecentMessages(conversation.id, 5),
          knowledge_sources: knowledgeContext.results,
        },
      });

      // Extract legal citations from response
      const legalCitations = this.extractLegalCitations(aiResponse.content, knowledgeContext.results);

      // Save AI message
      const assistantMessage = await this.saveMessage(
        conversation.id,
        'assistant',
        aiResponse.content,
        {
          tokens_used: aiResponse.tokens_used.total,
          model_used: aiResponse.model,
          vector_sources: knowledgeContext.results.map(r => ({
            source_id: r.source.id,
            relevance: r.relevance_score,
          })),
          confidence_score: aiResponse.confidence_score || 0.85,
          legal_citations: legalCitations,
          processing_time_ms: aiResponse.processing_time_ms,
        }
      );

      // Update conversation metadata
      await this.updateConversation(conversation.id, {
        total_tokens_used: conversation.total_tokens_used + aiResponse.tokens_used.total,
        knowledge_sources: knowledgeContext.results.map(r => r.source.id),
        legal_context: this.extractLegalContext(aiResponse.content, request.context?.legal_area),
      });

      // Complete AI session
      await aiCore.completeSession(session.id);

      // Generate follow-up suggestions
      const followUpSuggestions = this.generateFollowUpSuggestions(
        request.message,
        aiResponse.content,
        request.context?.legal_area
      );

      return {
        message: aiResponse.content,
        conversation_id: conversation.id,
        sources_used: knowledgeContext.results.map(r => r.source),
        legal_citations: legalCitations,
        confidence_score: aiResponse.confidence_score || 0.85,
        follow_up_suggestions: followUpSuggestions,
        related_topics: this.extractRelatedTopics(aiResponse.content),
      };

    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  }

  /**
   * Get chat conversation with messages
   */
  async getConversation(conversationId: string, userId: string): Promise<ChatConversation | null> {
    try {
      const { data } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          chat_messages (
            id,
            role,
            content,
            tokens_used,
            model_used,
            vector_sources,
            confidence_score,
            legal_citations,
            processing_time_ms,
            created_at
          )
        `)
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      return data;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }

  /**
   * Get user's chat history
   */
  async getChatHistory(userId: string, limit: number = 20): Promise<ChatConversation[]> {
    try {
      const { data } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          user_id,
          title,
          conversation_type,
          total_tokens_used,
          conversation_summary,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Search legal knowledge base for relevant information
   */
  private async searchLegalKnowledge(request: ChatRequest) {
    const searchRequest: VectorSearchRequest = {
      query: request.message,
      user_id: request.user_id,
      legal_areas: request.context?.legal_area ? [request.context.legal_area] : undefined,
      jurisdiction: 'Kenya',
      relevance_threshold: 0.7,
      max_results: 5,
    };

    return await aiCore.vectorSearch(searchRequest);
  }

  /**
   * Create a new conversation
   */
  private async createConversation(
    userId: string,
    legalArea?: string
  ): Promise<ChatConversation> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        conversation_type: legalArea ? 'legal_advice' : 'general',
        legal_context: legalArea ? { primary_area: legalArea } : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Save a chat message
   */
  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      tokens_used?: number;
      model_used?: string;
      vector_sources?: any;
      confidence_score?: number;
      legal_citations?: any;
      processing_time_ms?: number;
    }
  ): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        tokens_used: metadata?.tokens_used || 0,
        model_used: metadata?.model_used || 'gpt-4',
        vector_sources: metadata?.vector_sources,
        confidence_score: metadata?.confidence_score,
        legal_citations: metadata?.legal_citations,
        processing_time_ms: metadata?.processing_time_ms,
        metadata: metadata ? { ...metadata } : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update conversation metadata
   */
  private async updateConversation(
    conversationId: string,
    updates: {
      total_tokens_used?: number;
      knowledge_sources?: string[];
      legal_context?: any;
    }
  ): Promise<void> {
    await supabase
      .from('chat_conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
  }

  /**
   * Get recent messages for context
   */
  private async getRecentMessages(conversationId: string, limit: number): Promise<ChatMessage[]> {
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        id,
        conversation_id,
        role,
        content,
        tokens_used,
        model_used,
        created_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).reverse(); // Return in chronological order
  }

  /**
   * Build enhanced prompt with legal context
   */
  private buildLegalPrompt(
    request: ChatRequest,
    knowledgeSources: { source: LegalKnowledgeSource; relevance_score: number; matched_content: string }[]
  ): string {
    let prompt = request.message;

    if (knowledgeSources.length > 0) {
      const contextSources = knowledgeSources
        .filter(source => source.relevance_score > 0.7)
        .map(source => {
          return `Source: ${source.source.title} (${source.source.source_type})
Content: ${source.matched_content}
Authority: ${source.source.authority}
Relevance: ${source.relevance_score.toFixed(2)}`;
        })
        .join('\n\n');

      prompt = `RELEVANT LEGAL CONTEXT FROM KENYAN LAW:
${contextSources}

USER QUESTION: ${request.message}

Please provide a comprehensive answer based on the above Kenyan legal sources and your knowledge. Always cite the specific laws, cases, or regulations when applicable.`;
    }

    if (request.context?.previous_context) {
      prompt = `PREVIOUS CONVERSATION CONTEXT:
${request.context.previous_context}

${prompt}`;
    }

    return prompt;
  }

  /**
   * Extract legal citations from AI response
   */
  private extractLegalCitations(
    content: string,
    sources: { source: LegalKnowledgeSource; relevance_score: number }[]
  ) {
    const citations: { citation: string; relevance: number; url?: string }[] = [];

    // Extract explicit citations from the content
    const citationPatterns = [
      /(?:Section|Article|Clause)\s+\d+(?:\([a-z]\))?/gi,
      /\b(?:High Court|Supreme Court|Court of Appeal)\b/gi,
      /\b(?:Constitution of Kenya|Employment Act|Companies Act)\b/gi,
    ];

    citationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!citations.find(c => c.citation === match)) {
            citations.push({
              citation: match,
              relevance: 0.9,
            });
          }
        });
      }
    });

    // Add citations from knowledge sources used
    sources.forEach(source => {
      if (source.relevance_score > 0.8) {
        citations.push({
          citation: source.source.title,
          relevance: source.relevance_score,
          url: source.source.document_url,
        });
      }
    });

    return citations;
  }

  /**
   * Extract legal context from conversation
   */
  private extractLegalContext(content: string, primaryArea?: string) {
    const legalAreas = [
      'contract law', 'employment law', 'corporate law', 'real estate law',
      'intellectual property', 'family law', 'criminal law', 'constitutional law',
      'tax law', 'immigration law'
    ];

    const mentionedAreas = legalAreas.filter(area => 
      content.toLowerCase().includes(area.toLowerCase())
    );

    return {
      primary_area: primaryArea,
      mentioned_areas: mentionedAreas,
      complexity_level: this.assessComplexity(content),
      requires_lawyer: this.shouldRecommendLawyer(content),
    };
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(
    userMessage: string,
    aiResponse: string,
    legalArea?: string
  ): string[] {
    const suggestions: string[] = [];

    if (aiResponse.includes('contract')) {
      suggestions.push('How do I draft a contract for this situation?');
      suggestions.push('What are the key clauses I should include?');
    }

    if (aiResponse.includes('dispute') || aiResponse.includes('court')) {
      suggestions.push('What are my options for resolving this dispute?');
      suggestions.push('When should I consider going to court?');
    }

    if (aiResponse.includes('employment')) {
      suggestions.push('What are my rights as an employee in Kenya?');
      suggestions.push('How do I file a complaint with the labor office?');
    }

    if (legalArea === 'real_estate_law') {
      suggestions.push('What documents do I need for property transfer?');
      suggestions.push('How do I verify property ownership in Kenya?');
    }

    // Generic suggestions
    suggestions.push('Can you explain this in simpler terms?');
    suggestions.push('What are the potential risks I should consider?');
    suggestions.push('Do I need to consult with a lawyer about this?');

    return suggestions.slice(0, 4); // Return max 4 suggestions
  }

  /**
   * Extract related topics from response
   */
  private extractRelatedTopics(content: string): string[] {
    const topics: string[] = [];
    
    const topicKeywords = {
      'Contract Formation': ['contract', 'agreement', 'offer', 'acceptance'],
      'Employment Rights': ['employment', 'worker', 'salary', 'dismissal'],
      'Property Law': ['property', 'land', 'ownership', 'transfer'],
      'Corporate Compliance': ['company', 'directors', 'shareholders', 'compliance'],
      'Dispute Resolution': ['dispute', 'mediation', 'arbitration', 'court'],
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics.slice(0, 3);
  }

  /**
   * Assess content complexity
   */
  private assessComplexity(content: string): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = [
      'litigation', 'precedent', 'appellate', 'constitutional',
      'judicial review', 'statutory interpretation', 'criminal procedure'
    ];

    const complexCount = complexityIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;

    if (complexCount >= 3) return 'complex';
    if (complexCount >= 1) return 'medium';
    return 'simple';
  }

  /**
   * Determine if user should consult a lawyer
   */
  private shouldRecommendLawyer(content: string): boolean {
    const lawyerRequiredKeywords = [
      'lawsuit', 'litigation', 'criminal charges', 'arrest',
      'bankruptcy', 'divorce', 'custody', 'will', 'estate',
      'serious injury', 'malpractice', 'discrimination'
    ];

    return lawyerRequiredKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Generate conversation summary (for long conversations)
   */
  async generateConversationSummary(conversationId: string): Promise<string> {
    try {
      const messages = await this.getRecentMessages(conversationId, 20);
      
      if (messages.length < 5) return ''; // Don't summarize short conversations

      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      // This would use AI to generate a summary
      const summary = `Legal consultation covering topics discussed in ${messages.length} messages.`;
      
      // Update conversation with summary
      await supabase
        .from('chat_conversations')
        .update({ conversation_summary: summary })
        .eq('id', conversationId);

      return summary;
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return '';
    }
  }
}

export const legalChat = new LegalChatService();
