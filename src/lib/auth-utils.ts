/**
 * Authentication utilities for getting tokens from Supabase
 */
import { supabase } from './supabase';

export interface AuthToken {
  token: string;
  error?: string;
}

/**
 * Get the current Supabase access token for API authentication
 */
export async function getAuthToken(): Promise<AuthToken> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error:', error);
      return { token: '', error: 'Authentication failed. Please log in again.' };
    }
    
    if (!session?.access_token) {
      console.error('No access token found in session');
      return { token: '', error: 'Authentication required. Please log in again.' };
    }
    
    return { token: session.access_token };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { token: '', error: 'Authentication error. Please try again.' };
  }
}

/**
 * Make an authenticated API request with automatic token handling
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { token, error } = await getAuthToken();
  
  if (error) {
    throw new Error(error);
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  // Add timeout to prevent hanging - 60 seconds for contract generation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout for contract generation

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
    
    throw new Error('Network error occurred');
  }
}
