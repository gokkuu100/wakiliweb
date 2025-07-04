/**
 * User Dashboard API Client
 * Handles all API calls to the backend for user dashboard data
 */

import { supabase } from './supabase';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Get token from Supabase session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('Authentication required');
  }

  const headers = {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API request failed with status ${response.status}`);
  }

  return response.json();
}

// User Dashboard API Methods
export const UserDashboardAPI = {
  // Get user profile
  getUserProfile: () => {
    return apiRequest('/api/v1/user/profile');
  },

  // Get dashboard statistics
  getDashboardStats: () => {
    return apiRequest('/api/v1/user/dashboard-stats');
  },

  // Get notification statistics
  getNotificationStats: () => {
    return apiRequest('/api/v1/user/notifications/stats');
  }
};
