/**
 * AI Monitoring and Error Handling Service
 * Provides comprehensive monitoring, logging, and error handling for AI operations
 */

import { supabase } from '@/lib/supabase';

interface AIErrorLog {
  id?: string;
  user_id: string;
  session_id?: string;
  error_type: 'rate_limit' | 'token_limit' | 'api_error' | 'validation_error' | 'system_error';
  error_message: string;
  error_stack?: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
}

interface AIPerformanceMetric {
  id?: string;
  operation_type: string;
  duration_ms: number;
  tokens_used?: number;
  model_used?: string;
  success: boolean;
  user_id?: string;
  created_at?: string;
}

export class AIMonitoringService {
  /**
   * Log AI errors for debugging and monitoring
   */
  async logError(error: Omit<AIErrorLog, 'id' | 'created_at'>): Promise<void> {
    try {
      await supabase
        .from('ai_error_logs')
        .insert([{
          ...error,
          created_at: new Date().toISOString()
        }]);

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('AI Error:', error);
      }

      // Send critical errors to monitoring service (e.g., Sentry)
      if (error.severity === 'critical') {
        // TODO: Integrate with monitoring service
        console.error('CRITICAL AI ERROR:', error);
      }
    } catch (logError) {
      console.error('Failed to log AI error:', logError);
    }
  }

  /**
   * Log performance metrics
   */
  async logPerformance(metric: Omit<AIPerformanceMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      await supabase
        .from('ai_performance_metrics')
        .insert([{
          ...metric,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  /**
   * Performance monitoring wrapper for AI operations
   */
  async measurePerformance<T>(
    operationType: string,
    operation: () => Promise<T>,
    context?: { userId?: string; tokensUsed?: number; modelUsed?: string }
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let result: T;

    try {
      result = await operation();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      await this.logPerformance({
        operation_type: operationType,
        duration_ms: duration,
        tokens_used: context?.tokensUsed,
        model_used: context?.modelUsed,
        user_id: context?.userId,
        success
      });
    }
  }

  /**
   * Check system health
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      avgResponseTime: number;
      errorRate: number;
      activeUsers: number;
      totalTokensToday: number;
    };
    issues: string[];
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get performance metrics for the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const [performanceData, errorData, usageData] = await Promise.all([
        supabase
          .from('ai_performance_metrics')
          .select('duration_ms, success')
          .gte('created_at', oneHourAgo),
        
        supabase
          .from('ai_error_logs')
          .select('severity')
          .gte('created_at', oneHourAgo),
        
        supabase
          .from('user_analytics_daily')
          .select('total_tokens_used, user_id')
          .eq('analytics_date', today)
      ]);

      const performance = performanceData.data || [];
      const errors = errorData.data || [];
      const usage = usageData.data || [];

      // Calculate metrics
      const avgResponseTime = performance.length > 0 
        ? performance.reduce((sum, p) => sum + p.duration_ms, 0) / performance.length 
        : 0;

      const errorRate = performance.length > 0 
        ? (performance.filter(p => !p.success).length / performance.length) * 100 
        : 0;

      const activeUsers = new Set(usage.map(u => u.user_id)).size;
      const totalTokensToday = usage.reduce((sum, u) => sum + (u.total_tokens_used || 0), 0);

      // Determine status and issues
      const issues: string[] = [];
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (avgResponseTime > 5000) {
        issues.push('High average response time');
        status = 'degraded';
      }

      if (errorRate > 10) {
        issues.push('High error rate');
        status = errorRate > 25 ? 'unhealthy' : 'degraded';
      }

      const criticalErrors = errors.filter(e => e.severity === 'critical').length;
      if (criticalErrors > 0) {
        issues.push(`${criticalErrors} critical errors in the last hour`);
        status = 'unhealthy';
      }

      return {
        status,
        metrics: {
          avgResponseTime,
          errorRate,
          activeUsers,
          totalTokensToday
        },
        issues
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        status: 'unhealthy',
        metrics: {
          avgResponseTime: 0,
          errorRate: 100,
          activeUsers: 0,
          totalTokensToday: 0
        },
        issues: ['Unable to retrieve system metrics']
      };
    }
  }

  /**
   * Get recent errors for debugging
   */
  async getRecentErrors(limit: number = 50, severity?: string): Promise<AIErrorLog[]> {
    try {
      let query = supabase
        .from('ai_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent errors:', error);
      return [];
    }
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(days: number = 7): Promise<{
    daily: Array<{
      date: string;
      avgResponseTime: number;
      successRate: number;
      totalOperations: number;
    }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await supabase
        .from('ai_performance_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const metrics = data || [];
      
      // Group by day
      const dailyMetrics: Record<string, any[]> = {};
      metrics.forEach(metric => {
        const date = metric.created_at.split('T')[0];
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = [];
        }
        dailyMetrics[date].push(metric);
      });

      // Calculate daily aggregates
      const daily = Object.entries(dailyMetrics).map(([date, dayMetrics]) => ({
        date,
        avgResponseTime: dayMetrics.reduce((sum, m) => sum + m.duration_ms, 0) / dayMetrics.length,
        successRate: (dayMetrics.filter(m => m.success).length / dayMetrics.length) * 100,
        totalOperations: dayMetrics.length
      })).sort((a, b) => a.date.localeCompare(b.date));

      return { daily };
    } catch (error) {
      console.error('Error getting performance trends:', error);
      return { daily: [] };
    }
  }
}

// Export singleton instance
export const aiMonitoring = new AIMonitoringService();
