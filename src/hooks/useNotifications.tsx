'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface NotificationsContextType {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  isProcessing: boolean;
  notifications: {
    signatures: any[];
    aiReplies: any[];
    system: any[];
  };
  loading: boolean;
  error: string | null;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{
    signatures: any[];
    aiReplies: any[];
    system: any[];
  }>({
    signatures: [],
    aiReplies: [],
    system: []
  });
  const router = useRouter();

  // Mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Refresh the UI - this will trigger any listeners in DashboardStats
      router.refresh();
      
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      
      // Use the optimized RPC function
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      // Refresh the UI
      router.refresh();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
      
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Refresh the UI
      router.refresh();
      
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async (userId: string, category?: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Build query to get notifications
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Add filter by notification type if specified
      if (category && category !== 'all') {
        const typeMap: Record<string, string[]> = {
          'signatures': ['signature_request', 'contract_signed'],
          'ai': ['ai_response', 'document_analyzed'],
          'system': ['system_update', 'payment_due'],
        };
        
        const types = typeMap[category];
        if (types && types.length) {
          query = query.in('type', types);
        }
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Group notifications by type
      const grouped = {
        signatures: (data || []).filter(n => 
          n.type === 'signature_request' || n.type === 'contract_signed'
        ),
        aiReplies: (data || []).filter(n => 
          n.type === 'ai_response' || n.type === 'document_analyzed'
        ),
        system: (data || []).filter(n => 
          n.type === 'system_update' || n.type === 'payment_due'
        )
      };
      
      setNotifications(grouped);
      setError(null);
      
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch notifications when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);
  
  const value = {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isProcessing,
    notifications,
    loading,
    error
  };

  return React.createElement(NotificationsContext.Provider, { value }, children);
}

// Custom hook to use notifications context
export const useNotifications = (userId?: string, category: string = 'all') => {
  const context = useContext(NotificationsContext);
  const [localNotifs, setLocalNotifs] = useState<{
    signatures: any[];
    aiReplies: any[];
    system: any[];
  }>({
    signatures: [],
    aiReplies: [],
    system: []
  });
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // If context exists (we're inside a provider), use that
  if (context !== undefined) {
    return context;
  }
  
  // If not inside a provider but userId is provided, fetch directly
  useEffect(() => {
    if (!userId) {
      setLocalLoading(false);
      return;
    }
    
    const fetchNotifications = async () => {
      try {
        setLocalLoading(true);
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Group notifications by type
        const grouped = {
          signatures: (data || []).filter(n => 
            n.type === 'signature_request' || n.type === 'contract_signed'
          ),
          aiReplies: (data || []).filter(n => 
            n.type === 'ai_response' || n.type === 'document_analyzed'
          ),
          system: (data || []).filter(n => 
            n.type === 'system_update' || n.type === 'payment_due'
          )
        };
        
        setLocalNotifs(grouped);
        
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        setLocalError(err.message);
      } finally {
        setLocalLoading(false);
      }
    };
    
    fetchNotifications();
  }, [userId, category]);
  
  // Return local state if not in provider
  return {
    notifications: localNotifs,
    loading: localLoading,
    error: localError,
    markAsRead: async () => console.warn('Cannot mark as read: not in NotificationsProvider'),
    markAllAsRead: async () => console.warn('Cannot mark all as read: not in NotificationsProvider'),
    deleteNotification: async () => console.warn('Cannot delete: not in NotificationsProvider'),
    isProcessing: false
  };
};
