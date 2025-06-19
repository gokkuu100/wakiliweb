import { supabase } from '@/lib/supabase';

// Types for dashboard data
export interface DashboardStats {
  totalContracts: number;
  pendingActions: number;
  aiConversations: number;
  contractsRemaining: number;
  contractsUsed: number;
  contractsLimit: number | null;
}

export interface RecentContract {
  id: string;
  title: string;
  status: string;
  date: string;
  parties: string[];
}

export interface RecentChat {
  id: string;
  title: string;
  date: string;
  preview: string;
}

export interface PendingAction {
  id: string;
  type: string;
  title: string;
  date: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  contractsUsed: number;
  contractsRemaining: number;
}

// Get dashboard statistics for a user
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    // Get user subscription and usage
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

    // Get total contracts count
    const { count: totalContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    // Get current user email for pending signatures
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get pending actions count (unsigned contracts + unread notifications)
    const { count: pendingSignatures } = await supabase
      .from('contract_parties')
      .select('*', { count: 'exact', head: true })
      .eq('email', user?.email || '')
      .is('signed_at', null);

    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    // Get AI conversations count from chat_conversations
    const { count: aiConversations } = await supabase
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const contractsUsed = totalContracts || 0;
    const contractsLimit = subscription?.subscription_plans?.contract_limit;
    const contractsRemaining = contractsLimit ? Math.max(0, contractsLimit - contractsUsed) : 999;

    return {
      totalContracts: totalContracts || 0,
      pendingActions: (pendingSignatures || 0) + (unreadNotifications || 0),
      aiConversations: aiConversations || 0,
      contractsRemaining,
      contractsUsed,
      contractsLimit
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Get recent contracts for dashboard
export async function getRecentContracts(userId: string, limit: number = 3): Promise<RecentContract[]> {
  try {
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        status,
        created_at,
        contract_parties (
          name,
          email
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return contracts?.map(contract => ({
      id: contract.id,
      title: contract.title,
      status: contract.status,
      date: contract.created_at,
      parties: contract.contract_parties?.map((p: any) => p.name) || []
    })) || [];
  } catch (error) {
    console.error('Error fetching recent contracts:', error);
    throw error;
  }
}

// Get recent AI chats for dashboard
export async function getRecentChats(userId: string, limit: number = 2): Promise<RecentChat[]> {
  try {
    const { data: conversations } = await supabase
      .from('chat_conversations')
      .select(`
        id,
        title,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get the latest message for each conversation
    const chatsWithPreviews = await Promise.all(
      (conversations || []).map(async (conversation) => {
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          id: conversation.id,
          title: conversation.title || 'Untitled Chat',
          date: conversation.created_at,
          preview: messages?.[0]?.content?.substring(0, 100) + '...' || 'No messages yet'
        };
      })
    );

    return chatsWithPreviews;
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    throw error;
  }
}

// Get pending actions for dashboard
export async function getPendingActions(userId: string): Promise<PendingAction[]> {
  try {
    const user = await supabase.auth.getUser();
    const userEmail = user.data.user?.email;

    // Get pending signatures
    const { data: pendingSignatures } = await supabase
      .from('contract_parties')
      .select(`
        id,
        contract_id,
        contracts!inner (
          title
        ),
        created_at
      `)
      .eq('email', userEmail)
      .is('signed_at', null);

    // Get unread notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, title, created_at, type')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    const actions: PendingAction[] = [];

    // Add signature requests
    pendingSignatures?.forEach((sig: any) => {
      actions.push({
        id: sig.id,
        type: 'signature',
        title: `Sign contract: ${sig.contracts?.title || 'Unknown Contract'}`,
        date: sig.created_at
      });
    });

    // Add notifications
    notifications?.forEach(notif => {
      actions.push({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        date: notif.created_at
      });
    });

    return actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error fetching pending actions:', error);
    throw error;
  }
}

// Get user profile information
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email
      `)
      .eq('id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans!inner (
          name,
          contract_limit
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const { count: contractsUsed } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    const contractsLimit = subscription?.subscription_plans?.contract_limit;

    return {
      id: user?.id || '',
      name: user?.full_name || '',
      email: user?.email || '',
      plan: subscription?.subscription_plans?.name || 'No Plan',
      contractsUsed: contractsUsed || 0,
      contractsRemaining: contractsLimit ? Math.max(0, contractsLimit - (contractsUsed || 0)) : 999
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Check if user can create more contracts
export async function canCreateContract(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase.rpc('check_usage_limit', {
      p_user_id: userId,
      p_usage_type: 'contract_creation'
    });

    return data || false;
  } catch (error) {
    console.error('Error checking contract limit:', error);
    return false;
  }
}

// Track contract creation usage
export async function trackContractCreation(userId: string, contractId: string): Promise<void> {
  try {
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_usage_type: 'contract_creation',
      p_resource_id: contractId
    });
  } catch (error) {
    console.error('Error tracking contract creation:', error);
    throw error;
  }
}