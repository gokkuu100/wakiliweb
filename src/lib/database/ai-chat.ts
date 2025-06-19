import { supabase } from '@/lib/supabase';

export interface AIConversation {
  id: string;
  title: string;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  total_messages: number;
  last_message?: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  tokens_used?: number;
  processing_time_ms?: number;
}

export interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  date: string;
  message_count: number;
}

// Get all conversations for a user
export async function getUserConversations(userId: string): Promise<AIConversation[]> {
  try {
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select(`
        id,
        title,
        conversation_type,
        created_at,
        updated_at,
        total_messages
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    return conversations || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Get conversation with messages
export async function getConversationWithMessages(
  userId: string,
  conversationId: string
): Promise<{ conversation: AIConversation; messages: AIMessage[] } | null> {
  try {
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conversation) return null;

    const { data: messages } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return {
      conversation,
      messages: messages || []
    };
  } catch (error) {
    console.error('Error fetching conversation with messages:', error);
    throw error;
  }
}

// Create new conversation
export async function createConversation(
  userId: string,
  title?: string,
  conversationType: string = 'general'
): Promise<string> {
  try {
    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: title || 'New Conversation',
        conversation_type: conversationType
      })
      .select('id')
      .single();

    if (error) throw error;
    return conversation.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Add message to conversation
export async function addMessage(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
): Promise<string> {
  try {
    // Check AI usage limit for user messages
    if (role === 'user') {
      const canUse = await supabase.rpc('check_usage_limit', {
        p_user_id: userId,
        p_usage_type: 'ai_query'
      });

      if (!canUse.data) {
        throw new Error('AI query limit reached');
      }
    }

    const { data: message, error } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        metadata: metadata || {},
        tokens_used: metadata?.tokens_used,
        processing_time_ms: metadata?.processing_time_ms,
        ai_model_version: metadata?.ai_model_version
      })
      .select('id')
      .single();

    if (error) throw error;

    // Update conversation message count and timestamp
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('title')
      .eq('id', conversationId)
      .single();

    await supabase
      .from('chat_conversations')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Track AI usage for user messages
    if (role === 'user') {
      await supabase.rpc('track_usage', {
        p_user_id: userId,
        p_usage_type: 'ai_query',
        p_resource_id: message.id
      });
    }

    return message.id;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

// Get chat history for sidebar
export async function getChatHistory(userId: string, limit: number = 10): Promise<ChatHistory[]> {
  try {
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select(`
        id,
        title,
        updated_at,
        total_messages,
        ai_messages (
          content
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    return conversations?.map(conv => ({
      id: conv.id,
      title: conv.title || 'Untitled Conversation',
      preview: conv.ai_messages?.[0]?.content?.substring(0, 100) + '...' || 'No messages yet',
      date: conv.updated_at,
      message_count: conv.total_messages || 0
    })) || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}

// Update conversation title
export async function updateConversationTitle(
  userId: string,
  conversationId: string,
  title: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating conversation title:', error);
    throw error;
  }
}

// Delete conversation
export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Search conversations
export async function searchConversations(userId: string, searchTerm: string): Promise<AIConversation[]> {
  try {
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchTerm}%`)
      .order('updated_at', { ascending: false });

    return conversations || [];
  } catch (error) {
    console.error('Error searching conversations:', error);
    throw error;
  }
}

// Get AI usage stats for user
export async function getAIUsageStats(userId: string): Promise<{
  queriesUsed: number;
  queriesLimit: number | null;
  conversationsCount: number;
}> {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans!inner (
          contract_limit
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const { count: conversationsCount } = await supabase
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      queriesUsed: 0, // We can track this later if needed
      queriesLimit: subscription?.subscription_plans?.contract_limit || 999,
      conversationsCount: conversationsCount || 0
    };
  } catch (error) {
    console.error('Error fetching AI usage stats:', error);
    throw error;
  }
}