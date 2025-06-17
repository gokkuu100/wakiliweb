'use client';

import React, { useState, useEffect, createContext, useContext, useRef, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Request cache to prevent duplicate requests
type RequestCache = {
  [key: string]: {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
  }
};

// Global request cache with 2-minute TTL
const requestCache: RequestCache = {};
const CACHE_TTL = 120000; // 2 minutes in milliseconds

// Helper for making deduplicated requests
async function dedupedRequest<T>(
  cacheKey: string, 
  fetchFn: () => any,
  ttl: number = CACHE_TTL,
  userId?: string // Add userId to make cache keys user-specific
): Promise<{ data: T | null, error: any }> {
  // Build a user-specific cache key if userId is provided
  const userSpecificCacheKey = userId ? `${userId}:${cacheKey}` : cacheKey;
  const now = Date.now();
  const cachedItem = requestCache[userSpecificCacheKey];
  
  // Return cached data if it's still fresh
  if (cachedItem && now - cachedItem.timestamp < ttl) {
    console.log(`[Cache hit] Using cached data for ${userSpecificCacheKey}`);
    return { data: cachedItem.data, error: null };
  }
  
  // If there's already an in-flight request with this key, return its promise
  if (cachedItem && cachedItem.promise) {
    console.log(`[Promise reuse] Reusing in-flight request for ${userSpecificCacheKey}`);
    return cachedItem.promise;
  }
  
  console.log(`[Cache miss] Fetching new data for ${userSpecificCacheKey}`);
  
  // Create a new request promise
  const promise = Promise.resolve(fetchFn()).then(async (query) => {
    // Execute the query
    const { data, error, count } = await query;
    
    if (!error) {
      // Update cache with new data
      requestCache[userSpecificCacheKey] = {
        data: count !== undefined ? { count, data } : data,
        timestamp: Date.now(),
      };
      
      return { 
        data: count !== undefined ? { count, data } : data, 
        error: null 
      };
    }
    
    return { data: null, error };
  });
  
  // Store the promise in cache
  requestCache[userSpecificCacheKey] = {
    ...requestCache[userSpecificCacheKey],
    promise,
    timestamp: Date.now(),
  };
  
  return promise;
}

// Define types for our context and user data
type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
};

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  location?: string;
  avatar_url?: string;
  user_type: 'citizen' | 'lawyer' | 'admin';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

type DashboardStats = {
  // Contracts
  totalContracts: number;
  pendingSignatureContracts: number;
  signedContracts: number;
  draftContracts: number;
  contractsExpiringSoon: any[];
  recentContracts: any[];
  
  // Documents
  totalDocuments: number;
  analyzedDocuments: number;
  processingDocuments: number;
  
  // Notifications
  unreadNotifications: number;
  recentNotifications: any[];
  
  // Chat & AI
  totalConversations: number;
  activeAIRequests: number;
  
  // For lawyers
  totalCases: number;
  activeCases: number;
  pendingReviews: number;
  clientCount: number;
  
  // Financial
  subscriptionStatus: any;
  subscriptionExpiryDate: string | null;
  pendingInvoices: number;
  
  // Recent activity
  recentActivity: any[];
  
  // Loading state
  isLoading: boolean;
  error: string | null;
};

// Create contexts
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DashboardContext = createContext<DashboardStats | undefined>(undefined);

// Notification context type
export interface NotificationsContextType {
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

// Create notification context
export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Auth provider component (to be used in layout)
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check and set initial auth state
  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        
        // Get session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsLoading(false);
          return;
        }
        
        setUser(session.user);
        setIsAuthenticated(!!session.user);
        
        // Get user profile data with deduplication
        if (session.user) {
          const { data: profile, error: profileError } = await dedupedRequest(
            'user_profile',
            () => supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single(),
            CACHE_TTL,
            session.user.id
          );
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          } else if (profile && typeof profile === 'object' && 'is_verified' in profile) {
            setUserProfile(profile as UserProfile);
            setIsVerified(Boolean(profile.is_verified) && Boolean(session.user.email_confirmed_at));
          }
        }
      } catch (error: any) {
        console.error('Auth check error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial check
    checkUser();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Fetch user profile with deduplication
          const { data: profile } = await dedupedRequest(
            'user_profile',
            () => supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single(),
            CACHE_TTL,
            session.user.id
          );
            
          if (profile && typeof profile === 'object' && 'is_verified' in profile) {
            setUserProfile(profile as UserProfile);
            setIsVerified(Boolean(profile.is_verified) && Boolean(session.user.email_confirmed_at));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setIsAuthenticated(false);
          setIsVerified(false);
        }
      }
    );
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          router.push('/auth/verification-pending');
          throw new Error('Please verify your email before logging in');
        }
        
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        // If no profile, create one
        if (!profile) {
          const newProfile = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            user_type: 'citizen',
            is_verified: !!data.user.email_confirmed_at,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('users')
            .insert([newProfile]);
            
          if (insertError) throw insertError;
          
          setUserProfile(newProfile as UserProfile);
        } else {
          setUserProfile(profile as UserProfile);
          setIsVerified(profile.is_verified && !!data.user.email_confirmed_at);
        }
        
        setUser(data.user);
        setIsAuthenticated(true);
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type || 'citizen',
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create user profile
        const newProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          user_type: userData.user_type || 'citizen',
          is_verified: false, // Start unverified
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([newProfile]);
          
        if (profileError) throw profileError;
        
        // Redirect to verification pending page
        router.push('/auth/verification-pending');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset function
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Refresh profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      setUserProfile(updatedProfile as UserProfile);
      
    } catch (error: any) {
      console.error('Update profile error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        isAuthenticated,
        isVerified,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Dashboard stats hook implementation
export const useDashboardStats = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<Omit<DashboardStats, 'isLoading' | 'error'>>({
    totalContracts: 0,
    pendingSignatureContracts: 0,
    signedContracts: 0,
    draftContracts: 0,
    contractsExpiringSoon: [],
    recentContracts: [],
    
    totalDocuments: 0,
    analyzedDocuments: 0,
    processingDocuments: 0,
    
    unreadNotifications: 0,
    recentNotifications: [],
    
    totalConversations: 0,
    activeAIRequests: 0,
    
    totalCases: 0,
    activeCases: 0,
    pendingReviews: 0,
    clientCount: 0,
    
    subscriptionStatus: null,
    subscriptionExpiryDate: null,
    pendingInvoices: 0,
    
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize the fetch function to avoid recreating it on every render
  const fetchStats = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use deduped requests for all data fetching operations
      // Fetch contracts stats with deduplication
      const { data: contracts, error: contractsError } = await dedupedRequest(
        'dashboard_contracts',
        () => supabase
          .from('contracts')
          .select('id, status, expires_at')
          .eq('created_by', user.id),
        CACHE_TTL,
        user.id
      );
        
      if (contractsError) throw contractsError;
      
      // Recent contracts with deduplication
      const { data: recentContracts, error: recentError } = await dedupedRequest(
        'dashboard_recent_contracts',
        () => supabase
          .from('contracts')
          .select(`
            id,
            title,
            type,
            status,
            pdf_url,
            created_at,
            contract_parties (
              name,
              email,
              signed_at
            )
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        CACHE_TTL,
        user.id
      );
        
      if (recentError) throw recentError;
      
      // Notifications with deduplication
      const { data: notificationCount, error: notifError } = await dedupedRequest(
        'dashboard_notification_count',
        () => supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_read', false),
        CACHE_TTL,
        user.id
      );
        
      if (notifError) throw notifError;
      
      // Get recent notifications with deduplication
      const { data: recentNotifs, error: recentNotifsError } = await dedupedRequest(
        'dashboard_recent_notifications',
        () => supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        CACHE_TTL,
        user.id
      );
        
      if (recentNotifsError) throw recentNotifsError;
      
      // Documents with deduplication
      const { data: documents, error: docsError } = await dedupedRequest(
        'dashboard_documents',
        () => supabase
          .from('documents')
          .select('id, status')
          .eq('uploaded_by', user.id),
        CACHE_TTL,
        user.id
      );
        
      if (docsError) throw docsError;
      
      // Lawyer specific stats if user is a lawyer
      let lawyerStats = {
        totalCases: 0,
        activeCases: 0,
        pendingReviews: 0,
        clientCount: 0
      };
      
      if (userProfile?.user_type === 'lawyer') {
        // Cases with deduplication
        const { data: cases, error: casesError } = await dedupedRequest(
          'lawyer_cases',
          () => supabase
            .from('cases')
            .select('id, status')
            .eq('lawyer_id', user.id),
          CACHE_TTL,
          user.id
        );
          
        if (casesError) throw casesError;
        
        // For client count, we need to get unique client names from cases with deduplication
        const { data: uniqueClients, error: clientError } = await dedupedRequest(
          'lawyer_unique_clients',
          () => supabase
            .from('cases')
            .select('client_name')
            .eq('lawyer_id', user.id)
            .is('client_name', 'not.null'),
          CACHE_TTL,
          user.id
        );
        
        const casesArray = Array.isArray(cases) ? cases : [];
        const uniqueClientsArray = Array.isArray(uniqueClients) ? uniqueClients : [];
        
        // Get unique client names
        const uniqueClientNames = uniqueClientsArray.length > 0
          ? [...new Set(uniqueClientsArray.map((c: any) => c.client_name))]
          : [];
          
        if (clientError) throw clientError;
        
        lawyerStats = {
          totalCases: casesArray.length || 0,
          activeCases: casesArray.filter((c: any) => c.status === 'active').length || 0,
          pendingReviews: casesArray.filter((c: any) => c.status === 'pending_review').length || 0,
          clientCount: uniqueClientNames.length,
        };
      }
      
      // Process the data from deduped requests
      const contractsArray = Array.isArray(contracts) ? contracts : [];
      const recentContractsArray = Array.isArray(recentContracts) ? recentContracts : [];
      const documentsArray = Array.isArray(documents) ? documents : [];
      const recentNotifsArray = Array.isArray(recentNotifs) ? recentNotifs : [];
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        totalContracts: contractsArray.length || 0,
        pendingSignatureContracts: contractsArray.filter((c: any) => c.status === 'pending_signature').length || 0,
        signedContracts: contractsArray.filter((c: any) => c.status === 'signed').length || 0,
        draftContracts: contractsArray.filter((c: any) => c.status === 'draft').length || 0,
        contractsExpiringSoon: contractsArray.filter((c: any) => {
          if (!c.expires_at) return false;
          const expiryDate = new Date(c.expires_at);
          const now = new Date();
          const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7 && daysDiff > 0;
        }) || [],
        recentContracts: recentContractsArray,
        
        totalDocuments: documentsArray.length || 0,
        analyzedDocuments: documentsArray.filter((d: any) => d.status === 'analyzed').length || 0,
        processingDocuments: documentsArray.filter((d: any) => d.status === 'processing').length || 0,
        
        unreadNotifications: notificationCount && typeof notificationCount === 'object' && 'count' in notificationCount ? Number(notificationCount.count) : 0,
        recentNotifications: recentNotifsArray,
        
        ...lawyerStats
      }));
      
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile]);
  
  // Use effect to trigger the fetch and set up listeners
  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Set up real-time listeners
      const contractsSubscription = supabase
        .channel('contracts-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'contracts', filter: `created_by=eq.${user.id}` }, 
          () => fetchStats())
        .subscribe();
        
      const notificationsSubscription = supabase
        .channel('notifications-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
          () => fetchStats())
        .subscribe();
        
      // Clean up
      return () => {
        contractsSubscription.unsubscribe();
        notificationsSubscription.unsubscribe();
      };
    }
  }, [user, fetchStats]);
  
  return { ...stats, isLoading, error };
};

// Notifications Provider Component
export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
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

  // Function to invalidate notification-related caches
  const invalidateNotificationCaches = (userId: string) => {
    // Clear notification-related cache entries
    const keysToInvalidate = [
      `${userId}:all_notifications`,
      `${userId}:dashboard_notification_count`,
      `${userId}:dashboard_recent_notifications`
    ];
    
    keysToInvalidate.forEach(key => {
      if (requestCache[key]) {
        console.log(`[Cache invalidation] Invalidating ${key}`);
        delete requestCache[key];
      }
    });
  };

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
      
      // Invalidate notification caches
      invalidateNotificationCaches(user.id);
      
      // Refresh the UI
      router.refresh();
      
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      // Invalidate notification caches
      invalidateNotificationCaches(user.id);
      
      // Refresh the UI
      router.refresh();
      
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
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
      
      // Invalidate notification caches
      invalidateNotificationCaches(user.id);
      
      // Refresh the UI
      router.refresh();
      
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Fetch notifications based on category
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get all notifications for the user with deduplication
        const { data, error } = await dedupedRequest(
          'all_notifications',
          () => supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          CACHE_TTL,
          user.id
        );
          
        if (error) throw error;
        
        const notificationsArray = Array.isArray(data) ? data : [];
        
        // Categorize notifications based on notification_type enum values
        const signatures = notificationsArray.filter((n: any) => n.type === 'signature_request' || n.type === 'contract_signed') || [];
        const aiReplies = notificationsArray.filter((n: any) => n.type === 'ai_response' || n.type === 'document_analyzed') || [];
        const system = notificationsArray.filter((n: any) => 
          n.type === 'system_update' || 
          n.type === 'payment_due' || 
          !n.type
        ) || [];
        
        setNotifications({
          signatures,
          aiReplies,
          system
        });
        
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Setup real-time subscription
    if (user) {
      const subscription = supabase
        .channel('notifications-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
          () => fetchNotifications())
        .subscribe();
        
      // Clean up
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  return (
    <NotificationsContext.Provider
      value={{
        markAsRead,
        markAllAsRead,
        deleteNotification,
        isProcessing,
        notifications,
        loading,
        error
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

// DashboardStatsProvider component
export const DashboardStatsProvider = ({ children }: { children: React.ReactNode }) => {
  const stats = useDashboardStats();
  
  return (
    <DashboardContext.Provider value={stats}>
      {children}
    </DashboardContext.Provider>
  );
};

// Helper function to manually invalidate cache for a specific key or pattern
export function invalidateCache(keyOrPattern: string | RegExp, userId?: string): void {
  console.log(`[Cache invalidation] Request to invalidate: ${keyOrPattern}`);
  
  // If userId is provided, make the key specific to that user
  const userSpecificPattern = userId 
    ? keyOrPattern instanceof RegExp 
      ? new RegExp(`${userId}:${keyOrPattern.source}`)
      : `${userId}:${keyOrPattern}`
    : keyOrPattern;
  
  // Find matching keys and remove them from the cache
  Object.keys(requestCache).forEach(key => {
    const matches = userSpecificPattern instanceof RegExp
      ? userSpecificPattern.test(key)
      : key === userSpecificPattern;
    
    if (matches) {
      console.log(`[Cache invalidation] Invalidating cache key: ${key}`);
      delete requestCache[key];
    }
  });
}

// Export the useAuth hook with proper typing
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Notifications hook
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
