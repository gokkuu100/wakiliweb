'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Server-side API functions for faster data fetching
 * This allows us to fetch data on the server side for better performance
 */

// Create server-side Supabase client
const getServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({
    cookies: () => cookieStore,
  });
};

// Get user profile data
export async function getUserProfile(userId: string) {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
}

// Get dashboard stats for a user
export async function getDashboardStats(userId: string, userType: string) {
  const supabase = getServerSupabaseClient();
  
  // Create a concurrent request map for faster data fetching
  const requests = {
    // Contract counts
    totalContracts: supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId),
      
    pendingSignatures: supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('status', 'pending_signature'),
      
    signedContracts: supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('status', 'signed'),
      
    draftContracts: supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('status', 'draft'),
    
    // Documents
    documents: supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', userId),
    
    // Notifications
    notifications: supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
    
    // Recent contracts
    recentContracts: supabase
      .from('contracts')
      .select(`
        *,
        contract_parties(*)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Recent notifications
    recentNotifications: supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Subscription info
    subscription: supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single(),
  };
  
  // Lawyer-specific requests
  let lawyerRequests = {};
  if (userType === 'lawyer') {
    lawyerRequests = {
      cases: supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('lawyer_id', userId),
        
      activeCases: supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('lawyer_id', userId)
        .eq('status', 'active'),
        
      clients: supabase
        .from('cases')
        .select('client_email')
        .eq('lawyer_id', userId),
    };
  }
  
  // Execute all requests concurrently for performance
  const allRequests = { ...requests, ...lawyerRequests };
  const results = await Promise.all(
    Object.entries(allRequests).map(async ([key, promise]) => {
      try {
        return { key, result: await promise };
      } catch (error) {
        console.error(`Error in ${key} request:`, error);
        return { key, result: null };
      }
    })
  );
  
  // Process results
  const statsData = results.reduce((acc, { key, result }) => {
    if (result?.error) {
      console.error(`Error in ${key}:`, result.error);
    }
    
    acc[key] = result?.data || result?.count || null;
    return acc;
  }, {} as Record<string, any>);
  
  // Process unique client count for lawyers
  if (userType === 'lawyer' && statsData.clients) {
    const uniqueClients = new Set(statsData.clients.map((c: any) => c.client_email));
    statsData.clientCount = uniqueClients.size;
  }
  
  return statsData;
}

// Get a specific contract with related data
export async function getContractDetails(contractId: string, userId: string) {
  const supabase = getServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      contract_parties(*),
      contract_versions(*)
    `)
    .eq('id', contractId)
    .eq('created_by', userId)
    .single();
  
  if (error) {
    console.error('Error fetching contract details:', error);
    return null;
  }
  
  return data;
}

// Get user notifications with pagination
export async function getUserNotifications(userId: string, page = 1, limit = 10) {
  const supabase = getServerSupabaseClient();
  const start = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1);
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], total: 0 };
  }
  
  return { notifications: data, total: count };
}
