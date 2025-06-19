import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

// Get all notifications for a user
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Get unread notifications
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    return notifications || [];
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
}

// Get notifications by type
export async function getNotificationsByType(userId: string, type: string): Promise<Notification[]> {
  try {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    return notifications || [];
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    throw error;
  }
}

// Get notification statistics
export async function getNotificationStats(userId: string): Promise<NotificationStats> {
  try {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('type, is_read')
      .eq('user_id', userId);

    const total = notifications?.length || 0;
    const unread = notifications?.filter(n => !n.is_read).length || 0;
    
    const byType: Record<string, number> = {};
    notifications?.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return { total, unread, byType };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
}

// Create notification
export async function createNotification(
  userId: string,
  notificationData: {
    type: string;
    title: string;
    message: string;
    data?: any;
    action_url?: string;
    expires_at?: string;
    priority?: string;
  }
): Promise<string> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        priority: 'medium',
        ...notificationData
      })
      .select('id')
      .single();

    if (error) throw error;
    return notification.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Delete all read notifications
export async function deleteReadNotifications(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    throw error;
  }
}

// Create signature request notification
export async function createSignatureRequestNotification(
  userId: string,
  contractTitle: string,
  contractId: string,
  senderName: string
): Promise<void> {
  try {
    await createNotification(userId, {
      type: 'signature_request',
      title: 'Contract signature required',
      message: `${senderName} has sent you "${contractTitle}" for signature`,
      data: { contract_id: contractId, sender_name: senderName },
      action_url: `/dashboard/contracts/${contractId}`,
      priority: 'high'
    });
  } catch (error) {
    console.error('Error creating signature request notification:', error);
    throw error;
  }
}

// Create contract signed notification
export async function createContractSignedNotification(
  userId: string,
  contractTitle: string,
  contractId: string,
  signerName: string
): Promise<void> {
  try {
    await createNotification(userId, {
      type: 'contract_signed',
      title: 'Contract has been signed',
      message: `${signerName} has signed "${contractTitle}"`,
      data: { contract_id: contractId, signer_name: signerName },
      action_url: `/dashboard/contracts/${contractId}`,
      priority: 'medium'
    });
  } catch (error) {
    console.error('Error creating contract signed notification:', error);
    throw error;
  }
}

// Create AI response notification
export async function createAIResponseNotification(
  userId: string,
  conversationTitle: string,
  conversationId: string
): Promise<void> {
  try {
    await createNotification(userId, {
      type: 'ai_response',
      title: 'AI response ready',
      message: `Your legal question in "${conversationTitle}" has been answered`,
      data: { conversation_id: conversationId },
      action_url: `/dashboard/chat/${conversationId}`,
      priority: 'low'
    });
  } catch (error) {
    console.error('Error creating AI response notification:', error);
    throw error;
  }
}

// Create document analyzed notification
export async function createDocumentAnalyzedNotification(
  userId: string,
  documentName: string,
  documentId: string
): Promise<void> {
  try {
    await createNotification(userId, {
      type: 'document_analyzed',
      title: 'Document analysis complete',
      message: `Analysis for "${documentName}" is ready`,
      data: { document_id: documentId },
      action_url: `/dashboard/vault/${documentId}`,
      priority: 'medium'
    });
  } catch (error) {
    console.error('Error creating document analyzed notification:', error);
    throw error;
  }
}

// Create usage limit notification
export async function createUsageLimitNotification(
  userId: string,
  usageType: string,
  limit: number
): Promise<void> {
  try {
    const typeNames = {
      'contract_creation': 'contract creation',
      'ai_query': 'AI query',
      'document_analysis': 'document analysis'
    };

    await createNotification(userId, {
      type: 'usage_limit_reached',
      title: 'Usage limit reached',
      message: `You've reached your ${typeNames[usageType as keyof typeof typeNames]} limit of ${limit}. Upgrade your plan to continue.`,
      data: { usage_type: usageType, limit },
      action_url: '/dashboard/account/billing',
      priority: 'high'
    });
  } catch (error) {
    console.error('Error creating usage limit notification:', error);
    throw error;
  }
}

// Create trial ending notification
export async function createTrialEndingNotification(
  userId: string,
  daysRemaining: number
): Promise<void> {
  try {
    await createNotification(userId, {
      type: 'trial_ending',
      title: 'Trial ending soon',
      message: `Your free trial ends in ${daysRemaining} days. Upgrade to continue using all features.`,
      data: { days_remaining: daysRemaining },
      action_url: '/dashboard/account/billing',
      priority: 'high',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expires in 7 days
    });
  } catch (error) {
    console.error('Error creating trial ending notification:', error);
    throw error;
  }
}