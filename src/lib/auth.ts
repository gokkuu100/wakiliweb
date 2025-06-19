
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  user_type: 'citizen' | 'lawyer' | 'admin';
  phone_number?: string;
  location?: string;
  is_verified: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  userType: 'citizen' | 'lawyer';
  phoneNumber?: string;
  location?: string;
}

export async function signUpUser(signupData: SignupData) {
  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/email-verified`
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create account');

    // Step 2: Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: signupData.email,
        full_name: signupData.fullName,
        user_type: signupData.userType,
        phone_number: signupData.phoneNumber || null,
        location: signupData.location || null,
        is_verified: false // Will be set to true after email verification
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.signOut();
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    // Step 3: If user is a lawyer, create lawyer profile
    if (signupData.userType === 'lawyer') {
      const { error: lawyerError } = await supabase
        .from('lawyer_profiles')
        .insert({
          user_id: authData.user.id,
          is_verified: false // Lawyer verification is manual
        });

      if (lawyerError) {
        console.error('Lawyer profile creation error:', lawyerError);
        // Don't fail the entire signup for this, just log it
      }
    }

    return {
      user: authData.user,
      success: true,
      message: 'Account created! Please check your email to verify your account.'
    };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to sign in');

    // Check if email is verified in Supabase auth
    if (!data.user.email_confirmed_at) {
      throw new Error('Please verify your email address before signing in. Check your email for the verification link.');
    }

    // Fetch user profile to ensure it exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile) {
      // User exists in auth but not in users table - this shouldn't happen with the new signup flow
      throw new Error('User profile not found. Please contact support.');
    }

    // For lawyers, check additional verification status
    if (profile.user_type === 'lawyer' && !profile.is_verified) {
      throw new Error('Your lawyer account is pending verification. Please wait for admin approval.');
    }

    return {
      user: data.user,
      profile,
      session: data.session
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Function to complete user setup after email verification
export async function completeUserSetup() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile) {
      throw new Error('User profile not found. Please contact support.');
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update verification status');
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Setup completion error:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) return null;

    return profile;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Redirect to login page
    window.location.href = '/auth/login';
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export function getRedirectPath(userType: string): string {
  switch (userType) {
    case 'lawyer':
      return '/lawyer';
    case 'admin':
      return '/admin';
    default:
      return '/dashboard';
  }
}

// Check if user is authenticated and verified
export async function checkAuth(): Promise<{ 
  isAuthenticated: boolean; 
  user: AuthUser | null; 
  needsVerification: boolean;
  emailVerified: boolean;
  error?: string;
}> {
  try {
    // First check if we have a session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { 
        isAuthenticated: false, 
        user: null, 
        needsVerification: false,
        emailVerified: false 
      };
    }
    
    // Check if email is verified (Supabase)
    const emailVerified = session.user?.email_confirmed_at != null;
    
    // Then get the user profile data
    const user = await getCurrentUser();
    
    if (!user) {
      // We have a session but no user profile - could be right after signup
      return { 
        isAuthenticated: true, 
        user: null, 
        needsVerification: true,
        emailVerified,
        error: 'User profile not found. You may need to complete verification.'
      };
    }

    // Check if lawyer needs additional verification (manual by admin)
    const needsVerification = user.user_type === 'lawyer' && !user.is_verified;

    return {
      isAuthenticated: true,
      user,
      needsVerification,
      emailVerified
    };
  } catch (error: any) {
    console.error('Error checking auth:', error);
    return { 
      isAuthenticated: false, 
      user: null, 
      needsVerification: false,
      emailVerified: false,
      error: error.message || 'Authentication error occurred'
    };
  }
}
