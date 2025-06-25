import { supabase } from '@/lib/supabase';
import type {
  AIUsageSession,
  AITokenUsage,
  UserAILimits,
  UserAnalytics,
  SystemMetrics,
} from '../types';

export class AITrackingService {
  
  /**
   * Track detailed token usage for billing and analytics
   */
  async trackTokenUsage(usage: {
    session_id: string;
    user_id: string;
    request_type: 'completion' | 'embedding' | 'analysis';
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    model: string;
    cost_usd: number;
    request_data?: Record<string, any>;
  }): Promise<void> {
    try {
      // Insert token usage record
      await supabase
        .from('ai_token_usage')
        .insert({
          session_id: usage.session_id,
          user_id: usage.user_id,
          request_type: usage.request_type,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          model: usage.model,
          cost_usd: usage.cost_usd,
          request_data: usage.request_data,
        });

      // Update session totals
      await this.updateSessionTotals(usage.session_id, usage.total_tokens, usage.cost_usd);

    } catch (error) {
      console.error('Error tracking token usage:', error);
      // Don't throw - tracking shouldn't break the main flow
    }
  }

  /**
   * Update session totals
   */
  private async updateSessionTotals(sessionId: string, tokens: number, cost: number): Promise<void> {
    try {
      const { data: session } = await supabase
        .from('ai_usage_sessions')
        .select('total_tokens_used, cost_usd')
        .eq('id', sessionId)
        .single();

      if (session) {
        await supabase
          .from('ai_usage_sessions')
          .update({
            total_tokens_used: session.total_tokens_used + tokens,
            cost_usd: session.cost_usd + cost,
          })
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error('Error updating session totals:', error);
    }
  }

  /**
   * Check if user has exceeded their limits
   */
  async checkUserLimits(userId: string, requestedTokens: number): Promise<{
    allowed: boolean;
    limits: UserAILimits | null;
    reason?: string;
    remaining_daily?: number;
    remaining_monthly?: number;
  }> {
    try {
      const { data: limits } = await supabase
        .from('user_ai_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!limits) {
        return {
          allowed: false,
          limits: null,
          reason: 'No usage limits found for user',
        };
      }

      if (limits.is_unlimited) {
        return {
          allowed: true,
          limits,
          remaining_daily: -1,
          remaining_monthly: -1,
        };
      }

      // Check daily limits
      const today = new Date().toISOString().split('T')[0];
      let dailyUsed = limits.daily_tokens_used;
      
      if (limits.current_day !== today) {
        // Reset daily usage for new day
        dailyUsed = 0;
        await supabase
          .from('user_ai_limits')
          .update({
            daily_tokens_used: 0,
            current_day: today,
          })
          .eq('user_id', userId);
      }

      const remainingDaily = limits.daily_token_limit - dailyUsed;
      if (requestedTokens > remainingDaily) {
        return {
          allowed: false,
          limits,
          reason: 'Daily token limit exceeded',
          remaining_daily: remainingDaily,
        };
      }

      // Check monthly limits
      const currentMonth = new Date().toISOString().slice(0, 7);
      let monthlyUsed = limits.monthly_tokens_used;
      
      if (limits.current_month !== currentMonth) {
        // Reset monthly usage for new month
        monthlyUsed = 0;
        await supabase
          .from('user_ai_limits')
          .update({
            monthly_tokens_used: 0,
            current_month: currentMonth,
          })
          .eq('user_id', userId);
      }

      const remainingMonthly = limits.monthly_token_limit - monthlyUsed;
      if (requestedTokens > remainingMonthly) {
        return {
          allowed: false,
          limits,
          reason: 'Monthly token limit exceeded',
          remaining_monthly: remainingMonthly,
        };
      }

      return {
        allowed: true,
        limits,
        remaining_daily: remainingDaily,
        remaining_monthly: remainingMonthly,
      };
    } catch (error) {
      console.error('Error checking user limits:', error);
      return {
        allowed: false,
        limits: null,
        reason: 'Error checking limits',
      };
    }
  }

  /**
   * Get user's usage analytics
   */
  async getUserAnalytics(
    userId: string, 
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<UserAnalytics> {
    try {
      const startDate = this.getPeriodStartDate(period);
      
      // Get aggregated analytics
      const { data: analytics } = await supabase
        .from('user_analytics_daily')
        .select('*')
        .eq('user_id', userId)
        .gte('analytics_date', startDate)
        .order('analytics_date', { ascending: false });

      // Get session details
      const { data: sessions } = await supabase
        .from('ai_usage_sessions')
        .select('session_type, total_tokens_used, cost_usd, started_at')
        .eq('user_id', userId)
        .gte('started_at', startDate);

      // Calculate aggregated stats
      const totalTokens = analytics?.reduce((sum, day) => sum + day.total_tokens_used, 0) || 0;
      const totalCost = analytics?.reduce((sum, day) => sum + day.ai_cost_usd, 0) || 0;
      const sessionCount = analytics?.reduce((sum, day) => sum + day.session_count, 0) || 0;
      const chatMessages = analytics?.reduce((sum, day) => sum + day.chat_messages_sent, 0) || 0;
      const contractsCreated = analytics?.reduce((sum, day) => sum + day.contracts_created, 0) || 0;
      const documentsAnalyzed = analytics?.reduce((sum, day) => sum + day.documents_analyzed, 0) || 0;

      // Calculate usage by feature
      const usageByFeature: Record<string, number> = {};
      sessions?.forEach(session => {
        usageByFeature[session.session_type] = (usageByFeature[session.session_type] || 0) + session.total_tokens_used;
      });

      return {
        user_id: userId,
        period,
        total_tokens_used: totalTokens,
        total_cost_usd: totalCost,
        session_count: sessionCount,
        chat_messages: chatMessages,
        contracts_created: contractsCreated,
        documents_analyzed: documentsAnalyzed,
        average_response_time_ms: analytics?.reduce((sum, day) => sum + day.average_response_time_ms, 0) || 0,
        top_legal_areas: [], // Would need additional tracking
        usage_by_feature: usageByFeature,
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Get user's current limits and usage
   */
  async getUserLimitsAndUsage(userId: string): Promise<{
    limits: UserAILimits | null;
    current_usage: {
      daily_tokens: number;
      monthly_tokens: number;
      daily_percentage: number;
      monthly_percentage: number;
    };
    subscription_info?: any;
  }> {
    try {
      const { data: limits } = await supabase
        .from('user_ai_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!limits) {
        return {
          limits: null,
          current_usage: {
            daily_tokens: 0,
            monthly_tokens: 0,
            daily_percentage: 0,
            monthly_percentage: 0,
          },
        };
      }

      // Get subscription info
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            monthly_token_limit,
            daily_token_limit,
            ai_features
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      const dailyPercentage = limits.is_unlimited ? 0 : 
        (limits.daily_tokens_used / limits.daily_token_limit) * 100;
      
      const monthlyPercentage = limits.is_unlimited ? 0 : 
        (limits.monthly_tokens_used / limits.monthly_token_limit) * 100;

      return {
        limits,
        current_usage: {
          daily_tokens: limits.daily_tokens_used,
          monthly_tokens: limits.monthly_tokens_used,
          daily_percentage: Math.min(dailyPercentage, 100),
          monthly_percentage: Math.min(monthlyPercentage, 100),
        },
        subscription_info: subscription,
      };
    } catch (error) {
      console.error('Error getting user limits and usage:', error);
      throw error;
    }
  }

  /**
   * Get system-wide metrics (admin only)
   */
  async getSystemMetrics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<SystemMetrics[]> {
    try {
      const startDate = this.getPeriodStartDate(period);
      
      const { data: metrics } = await supabase
        .from('system_performance_metrics')
        .select('*')
        .gte('metric_date', startDate)
        .order('metric_date', { ascending: false });

      return metrics || [];
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Record system performance metrics (background job)
   */
  async recordSystemMetrics(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's aggregated data
      const { data: todaysSessions } = await supabase
        .from('ai_usage_sessions')
        .select('total_tokens_used, cost_usd, user_id')
        .gte('started_at', today);

      const { data: todaysTokenUsage } = await supabase
        .from('ai_token_usage')
        .select('total_tokens, cost_usd')
        .gte('created_at', today);

      const { data: vectorSearches } = await supabase
        .from('vector_search_sessions')
        .select('id')
        .gte('created_at', today);

      const totalRequests = todaysSessions?.length || 0;
      const totalTokens = todaysTokenUsage?.reduce((sum, usage) => sum + usage.total_tokens, 0) || 0;
      const totalCost = todaysSessions?.reduce((sum, session) => sum + session.cost_usd, 0) || 0;
      const uniqueUsers = new Set(todaysSessions?.map(s => s.user_id)).size;
      const vectorQueries = vectorSearches?.length || 0;

      // Insert or update today's metrics
      await supabase
        .from('system_performance_metrics')
        .upsert({
          metric_date: today,
          total_ai_requests: totalRequests,
          total_tokens_processed: totalTokens,
          total_cost_usd: totalCost,
          active_users: uniqueUsers,
          vector_db_queries: vectorQueries,
        }, {
          onConflict: 'metric_date',
        });

    } catch (error) {
      console.error('Error recording system metrics:', error);
    }
  }

  /**
   * Update user subscription limits based on plan
   */
  async updateUserLimitsFromSubscription(userId: string, subscriptionId: string): Promise<void> {
    try {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            monthly_token_limit,
            daily_token_limit,
            ai_features
          )
        `)
        .eq('id', subscriptionId)
        .single();

      if (subscription?.subscription_plans) {
        await supabase
          .from('user_ai_limits')
          .upsert({
            user_id: userId,
            subscription_id: subscriptionId,
            monthly_token_limit: subscription.subscription_plans.monthly_token_limit,
            daily_token_limit: subscription.subscription_plans.daily_token_limit,
            is_unlimited: subscription.subscription_plans.monthly_token_limit === -1,
          }, {
            onConflict: 'user_id',
          });
      }
    } catch (error) {
      console.error('Error updating user limits from subscription:', error);
    }
  }

  /**
   * Get top users by usage (admin only)
   */
  async getTopUsersByUsage(period: 'daily' | 'weekly' | 'monthly' = 'monthly', limit: number = 10) {
    try {
      const startDate = this.getPeriodStartDate(period);
      
      // Use raw SQL for complex GROUP BY query
      const { data: topUsers } = await supabase.rpc('get_top_users_by_usage', {
        start_date: startDate,
        user_limit: limit
      });

      return topUsers || [];
    } catch (error) {
      console.error('Error getting top users by usage:', error);
      return [];
    }
  }

  /**
   * Helper to get period start date
   */
  private getPeriodStartDate(period: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      default:
        return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Clean up old tracking data (for privacy compliance)
   */
  async cleanupOldData(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffISOString = cutoffDate.toISOString();

      // Clean up old token usage records
      await supabase
        .from('ai_token_usage')
        .delete()
        .lt('created_at', cutoffISOString);

      // Clean up old session records
      await supabase
        .from('ai_usage_sessions')
        .delete()
        .lt('started_at', cutoffISOString);

      // Clean up old vector search sessions
      await supabase
        .from('vector_search_sessions')
        .delete()
        .lt('created_at', cutoffISOString);

    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

export const aiTracking = new AITrackingService();
