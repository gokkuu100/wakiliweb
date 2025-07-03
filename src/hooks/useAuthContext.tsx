'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getEmailRedirectUrl } from '@/lib/email-config';

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  user_type: 'citizen' | 'lawyer' | 'admin';
  phone_number?: string;
  location?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

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
  resendVerificationEmail: () => Promise<void>;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsVerified: (verified: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setIsVerified(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      setUserProfile(profile);
      if (profile) {
        setIsVerified(profile.is_verified);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      setIsVerified(false);
    }
  };

  // Sign in function - based on your working code
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
          setUser(null);
          setUserProfile(null);
          setIsVerified(false);
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
        
        // If no profile exists, this shouldn't happen with the new flow, but handle it
        if (!profile) {
          throw new Error('User profile not found. Please contact support or try signing up again.');
        }
        
        // If user profile exists but is not verified, update it since email is verified
        if (!profile.is_verified && data.user.email_confirmed_at) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ is_verified: true, updated_at: new Date().toISOString() })
            .eq('id', data.user.id);
            
          if (updateError) {
            console.error('Error updating verification status:', updateError);
          } else {
            // Update local profile state
            profile.is_verified = true;
          }
        }
        
        // Check if lawyer needs additional verification (manual by admin)
        if (profile.user_type === 'lawyer' && !profile.is_verified) {
          throw new Error('Your lawyer account is pending verification. Please wait for admin approval.');
        }
        
        setUserProfile(profile as UserProfile);
        setIsVerified(profile.is_verified && !!data.user.email_confirmed_at);
        setUser(data.user);
        
        // Redirect based on user type
        if (profile?.user_type === 'lawyer') {
          router.push('/lawyer');
        } else if (profile?.user_type === 'admin') {
          router.push('/admin');
        } else {
          router.push('/citizen');
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function - based on your working code
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Pass user data to create the profile first, so we can include the user ID in the verification link
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type || 'citizen',
            phone_number: userData.phone_number,
            location: userData.location,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create user profile immediately using the helper function
        await createUserProfileDuringSignup(data.user.id, data.user.email!, userData);
        
        // Redirect to verification pending page
        router.push('/auth/verification-pending');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to create user profile during signup and send verification email with user ID
  const createUserProfileDuringSignup = async (userId: string, email: string, userData: any) => {
    try {
      // Create user profile using the regular client - the new RLS policies should allow this
      const newProfile = {
        id: userId,
        email: email,
        full_name: userData.full_name,
        phone_number: userData.phone_number || null,
        location: userData.location || null,
        user_type: userData.user_type || 'citizen',
        is_verified: false, // Start unverified until email confirmation
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { error: profileError } = await supabase
        .from('users')
        .insert([newProfile]);
        
      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }
      
      // If user is a lawyer, create lawyer profile
      if (userData.user_type === 'lawyer') {
        const { error: lawyerError } = await supabase
          .from('lawyer_profiles')
          .insert({
            user_id: userId,
            is_verified: false, // Lawyer verification is manual
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (lawyerError) {
          console.error('Lawyer profile creation error:', lawyerError);
          // Don't fail the entire signup for this, just log it
        }
      }
      
      // Send verification email with the user ID included in the redirect URL
      const { error: emailError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getEmailRedirectUrl(userId),
        }
      });
      
      if (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail the entire signup, but log the error
      }
      
      return newProfile;
    } catch (error) {
      console.error('Error creating user profile during signup:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      setIsVerified(false);
      setError(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error('No user session found');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
        options: {
          emailRedirectTo: getEmailRedirectUrl(session.user.id)
        }
      });

      if (error) throw error;
      
    } catch (error: any) {
      console.error('Resend verification error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isLoading, 
      isAuthenticated, 
      isVerified, 
      error,
      signIn,
      signUp,
      signOut,
      resendVerificationEmail,
      setError,
      setUser,
      setUserProfile,
      setIsVerified
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
