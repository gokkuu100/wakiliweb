import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan_type: string;
  price_monthly: number;
  price_yearly?: number;
  contracts_limit?: number;
  ai_queries_limit?: number;
  document_analysis_limit?: number;
  features: any;
  trial_days: number;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  contracts_used: number;
  ai_queries_used: number;
  documents_analyzed_used: number;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  subscription_plans: SubscriptionPlan;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

export interface UsageStats {
  contractsUsed: number;
  contractsLimit?: number;
  aiQueriesUsed: number;
  aiQueriesLimit?: number;
  documentsAnalyzedUsed: number;
  documentsAnalyzedLimit?: number;
  isTrialing: boolean;
  trialEndsAt?: string;
  daysRemainingInTrial?: number;
}

// Get all subscription plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    return plans || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
}

// Get user's current subscription
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .in('status', ['trialing', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return subscription;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

// Get user's usage statistics
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return {
        contractsUsed: 0,
        aiQueriesUsed: 0,
        documentsAnalyzedUsed: 0,
        isTrialing: false
      };
    }

    const isTrialing = subscription.status === 'trialing';
    let daysRemainingInTrial;
    
    if (isTrialing && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      const now = new Date();
      daysRemainingInTrial = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      contractsUsed: subscription.contracts_used,
      contractsLimit: subscription.subscription_plans.contracts_limit,
      aiQueriesUsed: subscription.ai_queries_used,
      aiQueriesLimit: subscription.subscription_plans.ai_queries_limit,
      documentsAnalyzedUsed: subscription.documents_analyzed_used,
      documentsAnalyzedLimit: subscription.subscription_plans.document_analysis_limit,
      isTrialing,
      trialEndsAt: subscription.trial_end,
      daysRemainingInTrial
    };
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    throw error;
  }
}

// Create trial subscription for new user
export async function createTrialSubscription(userId: string, planType: 'individual' | 'legal_professional'): Promise<void> {
  try {
    // Get the plan
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', planType)
      .eq('is_active', true)
      .single();

    if (!plan) throw new Error('Plan not found');

    const now = new Date();
    const trialEnd = new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create subscription
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'trialing',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: trialEnd.toISOString()
      });

    if (error) throw error;

    // Update user trial info
    await supabase
      .from('users')
      .update({
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnd.toISOString()
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    throw error;
  }
}

// Check if user can perform action based on usage limits
export async function checkUsageLimit(userId: string, usageType: 'contract_creation' | 'ai_query' | 'document_analysis'): Promise<boolean> {
  try {
    const { data } = await supabase.rpc('check_usage_limit', {
      p_user_id: userId,
      p_usage_type: usageType
    });

    return data || false;
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return false;
  }
}

// Track usage for billing
export async function trackUsage(userId: string, usageType: 'contract_creation' | 'ai_query' | 'document_analysis', resourceId?: string): Promise<void> {
  try {
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_usage_type: usageType,
      p_resource_id: resourceId
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
}

// Get payment history
export async function getPaymentHistory(userId: string): Promise<Payment[]> {
  try {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return payments || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
}

// Create payment record
export async function createPayment(
  userId: string,
  paymentData: {
    amount: number;
    currency?: string;
    status: string;
    description: string;
    stripe_payment_intent_id?: string;
    stripe_invoice_id?: string;
    subscription_id?: string;
  }
): Promise<string> {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        currency: 'KES',
        ...paymentData
      })
      .select('id')
      .single();

    if (error) throw error;
    return payment.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

// Update subscription status
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string,
  stripeData?: any
): Promise<void> {
  try {
    const updateData: any = { status };
    
    if (stripeData) {
      if (stripeData.stripe_subscription_id) {
        updateData.stripe_subscription_id = stripeData.stripe_subscription_id;
      }
      if (stripeData.stripe_customer_id) {
        updateData.stripe_customer_id = stripeData.stripe_customer_id;
      }
      if (stripeData.current_period_start) {
        updateData.current_period_start = stripeData.current_period_start;
      }
      if (stripeData.current_period_end) {
        updateData.current_period_end = stripeData.current_period_end;
      }
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

// Reset usage counters for new billing period
export async function resetUsageCounters(subscriptionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        contracts_used: 0,
        ai_queries_used: 0,
        documents_analyzed_used: 0
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error resetting usage counters:', error);
    throw error;
  }
}

// Get users with expiring trials (for notifications)
export async function getUsersWithExpiringTrials(daysBeforeExpiry: number = 3): Promise<{ user_id: string; trial_ends_at: string; days_remaining: number }[]> {
  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

    const { data: users } = await supabase
      .from('users')
      .select('id, trial_ends_at')
      .not('trial_ends_at', 'is', null)
      .lte('trial_ends_at', targetDate.toISOString())
      .gte('trial_ends_at', new Date().toISOString());

    return users?.map(user => {
      const trialEnd = new Date(user.trial_ends_at);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        user_id: user.id,
        trial_ends_at: user.trial_ends_at,
        days_remaining: daysRemaining
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching users with expiring trials:', error);
    throw error;
  }
}

// Check if user's trial has expired
export async function isTrialExpired(userId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('trial_ends_at')
      .eq('id', userId)
      .single();

    if (!user?.trial_ends_at) return false;

    const trialEnd = new Date(user.trial_ends_at);
    const now = new Date();
    
    return now > trialEnd;
  } catch (error) {
    console.error('Error checking trial expiry:', error);
    return false;
  }
}