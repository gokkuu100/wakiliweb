
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
}> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { isAuthenticated: false, user: null, needsVerification: false };
    }

    // Check if lawyer needs verification
    const needsVerification = user.user_type === 'lawyer' && !user.is_verified;

    return {
      isAuthenticated: true,
      user,
      needsVerification
    };
  } catch (error) {
    console.error('Error checking auth:', error);
    return { isAuthenticated: false, user: null, needsVerification: false };
  }
}
