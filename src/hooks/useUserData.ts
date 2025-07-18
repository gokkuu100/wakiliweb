'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuthContext';
import { getUserProfile, getDashboardStats } from '@/lib/database/citizen-dashboard';
import { getNotificationStats } from '@/lib/database/notifications';

export interface UserData {
  profile: {
    id: string;
    name: string;
    email: string;
    plan: string;
    contractsUsed: number;
    contractsRemaining: number;
  } | null;
  stats: {
    totalContracts: number;
    pendingActions: number;
    aiConversations: number;
    contractsRemaining: number;
    contractsUsed: number;
    contractsLimit: number | null;
  } | null;
  notifications: {
    total: number;
    unread: number;
    byType: Record<string, number>;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserData() {
  const { user, userProfile, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    profile: null,
    stats: null,
    notifications: null,
    isLoading: true,
    error: null,
  });
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUserData({
        profile: null,
        stats: null,
        notifications: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    const fetchUserData = async () => {
      // Don't fetch if we just fetched within the last 30 seconds
      const now = Date.now();
      if (now - lastFetchTime < 30000) {
        return;
      }

      try {
        setUserData(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch all data in parallel
        const [profile, stats, notificationStats] = await Promise.all([
          getUserProfile(user.id),
          getDashboardStats(user.id),
          getNotificationStats(user.id),
        ]);

        setUserData({
          profile,
          stats,
          notifications: notificationStats,
          isLoading: false,
          error: null,
        });
        setLastFetchTime(now);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load user data',
        }));
      }
    };

    fetchUserData();

    // Refetch data every 5 minutes to keep it fresh (reduced from 30 seconds)
    const interval = setInterval(fetchUserData, 300000);

    return () => clearInterval(interval);
  }, [user?.id, isAuthenticated]); // Remove lastFetchTime from dependencies

  const refreshUserData = async () => {
    if (!user || !isAuthenticated) return;

    try {
      setUserData(prev => ({ ...prev, isLoading: true }));

      const [profile, stats, notificationStats] = await Promise.all([
        getUserProfile(user.id),
        getDashboardStats(user.id),
        getNotificationStats(user.id),
      ]);

      setUserData({
        profile,
        stats,
        notifications: notificationStats,
        isLoading: false,
        error: null,
      });
      setLastFetchTime(Date.now()); // Update the last fetch time
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setUserData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh user data',
      }));
    }
  };

  return {
    ...userData,
    refreshUserData,
  };
}
