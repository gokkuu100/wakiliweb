'use client';

import React, { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';

// Define a minimal auth context type for useNotifications
export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  user_type: 'citizen' | 'lawyer' | 'admin';
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  [key: string]: any;
};

// Create a minimal auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export a minimal useAuth hook for useNotifications
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
