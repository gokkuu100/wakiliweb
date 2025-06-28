import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env.local file.'
  );
}

// Singleton pattern to ensure only one instance exists
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'legalsmart-web'
      }
    }
  });

  if (typeof window !== 'undefined') {
    console.log('✅ Supabase client created successfully');
  }

  return supabaseInstance;
}

// Create a single shared instance to prevent multiple GoTrueClient instances
export const supabase = createSupabaseClient();

// For server-side usage (if needed)
export const createServerSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
