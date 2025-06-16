'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  user_type: 'client' | 'lawyer' | 'admin';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

type DashboardStats = {
  totalContracts: number;
  pendingContracts: number;
  signedContracts: number;
  recentActivity: any[];
  isLoading: boolean;
  error: string | null;
};

// Create contexts
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DashboardContext = createContext<DashboardStats | undefined>(undefined);

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
        
        // Get user profile data
        if (session.user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          } else if (profile) {
            setUserProfile(profile as UserProfile);
            setIsVerified(profile.is_verified && !!session.user.email_confirmed_at);
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
          
          // Fetch user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            setUserProfile(profile as UserProfile);
            setIsVerified(profile.is_verified && !!session.user.email_confirmed_at);
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
            first_name: '',
            last_name: '',
            user_type: 'client',
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
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
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
          emailRedirectTo: `${window.location.origin}/auth/email-verified`,
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create user profile
        const newUser = {
          id: data.user.id,
          email: email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          phone_number: userData.phoneNumber || '',
          user_type: userData.userType || 'client',
          is_verified: false, // Will be updated once email is verified
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([newUser]);
          
        if (profileError) throw profileError;
        
        // If lawyer, create lawyer profile
        if (userData.userType === 'lawyer') {
          const lawyerProfile = {
            user_id: data.user.id,
            license_number: userData.licenseNumber || '',
            specialization: userData.specialization || '',
            years_experience: userData.yearsExperience || 0,
            bio: userData.bio || '',
            is_verified: false, // Admin will verify
          };
          
          const { error: lawyerError } = await supabase
            .from('lawyer_profiles')
            .insert([lawyerProfile]);
            
          if (lawyerError) throw lawyerError;
        }
        
        // Set user data
        setUser(data.user);
        setUserProfile(newUser as UserProfile);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setIsVerified(false);
      
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) throw new Error('No authenticated user');
      
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...data } as UserProfile : null);
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Dashboard stats provider
export const DashboardStatsProvider = ({ children }: { children: React.ReactNode }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    pendingContracts: 0,
    signedContracts: 0,
    recentActivity: [],
    isLoading: true,
    error: null,
  });

  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Get contract counts
        const { data: totalData, error: totalError } = await supabase
          .from('contracts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        const { data: pendingData, error: pendingError } = await supabase
          .from('contracts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'pending');

        const { data: signedData, error: signedError } = await supabase
          .from('contracts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'signed');

        // Get recent activity
        const { data: recentActivity, error: activityError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (totalError || pendingError || signedError || activityError) {
          throw new Error('Error fetching dashboard stats');
        }

        setStats({
          totalContracts: totalData?.length || 0,
          pendingContracts: pendingData?.length || 0,
          signedContracts: signedData?.length || 0,
          recentActivity: recentActivity || [],
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    };

    fetchStats();
  }, [user]);

  return <DashboardContext.Provider value={stats}>{children}</DashboardContext.Provider>;
};

// Custom hooks to use the contexts
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export const useDashboardStats = () => {
  const context = useContext(DashboardContext);
  
  if (context === undefined) {
    throw new Error('useDashboardStats must be used within a DashboardStatsProvider');
  }
  
  return context;
};

// Helper hook for user data
export const useUser = () => {
  const { user, userProfile, isLoading, isAuthenticated, isVerified } = useAuth();
  
  return {
    user,
    profile: userProfile,
    isLoading,
    isAuthenticated,
    isVerified,
  };
};
