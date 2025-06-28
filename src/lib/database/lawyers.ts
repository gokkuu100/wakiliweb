import { supabase } from '@/lib/supabase';

export interface LawyerProfile {
  id: string;
  user_id: string;
  firm_name?: string;
  practice_areas: string[];
  bar_number?: string;
  years_experience?: number;
  education?: string;
  bio?: string;
  hourly_rate?: number;
  is_verified: boolean;
  website_url?: string;
  linkedin_url?: string;
  user: {
    full_name: string;
    email: string;
    phone_number?: string;
    location?: string;
    avatar_url?: string;
  };
}

export interface LawyerCase {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  case_type: string;
  status: string;
  priority: string;
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  billing_rate?: number;
  total_hours: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CaseActivity {
  id: string;
  case_id: string;
  activity_type: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  billable_hours?: number;
  activity_date: string;
  created_at: string;
}

export interface LegalResearch {
  id: string;
  query: string;
  research_type: string;
  jurisdiction: string;
  results: any[];
  citations: string[];
  summary?: string;
  confidence_score?: number;
  created_at: string;
}

// Get verified lawyers for directory
export async function getVerifiedLawyers(): Promise<LawyerProfile[]> {
  try {
    const { data: lawyers } = await supabase
      .from('lawyer_profiles')
      .select(`
        *,
        users (
          full_name,
          email,
          phone_number,
          location,
          avatar_url
        )
      `)
      .eq('is_verified', true)
      .order('years_experience', { ascending: false });

    return lawyers?.map(lawyer => ({
      ...lawyer,
      user: lawyer.users
    })) || [];
  } catch (error) {
    console.error('Error fetching verified lawyers:', error);
    throw error;
  }
}

// Search lawyers by practice area or location
export async function searchLawyers(
  searchTerm?: string,
  practiceArea?: string,
  location?: string
): Promise<LawyerProfile[]> {
  try {
    let query = supabase
      .from('lawyer_profiles')
      .select(`
        *,
        users (
          full_name,
          email,
          phone_number,
          location,
          avatar_url
        )
      `)
      .eq('is_verified', true);

    if (searchTerm) {
      query = query.or(`firm_name.ilike.%${searchTerm}%,users.full_name.ilike.%${searchTerm}%`);
    }

    if (practiceArea) {
      query = query.contains('practice_areas', [practiceArea]);
    }

    if (location) {
      query = query.ilike('users.location', `%${location}%`);
    }

    const { data: lawyers } = await query.order('years_experience', { ascending: false });

    return lawyers?.map(lawyer => ({
      ...lawyer,
      user: lawyer.users
    })) || [];
  } catch (error) {
    console.error('Error searching lawyers:', error);
    throw error;
  }
}

// Get lawyer profile by user ID
export async function getLawyerProfile(userId: string): Promise<LawyerProfile | null> {
  try {
    const { data: lawyer } = await supabase
      .from('lawyer_profiles')
      .select(`
        *,
        users (
          full_name,
          email,
          phone_number,
          location,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .single();

    if (!lawyer) return null;

    return {
      ...lawyer,
      user: lawyer.users
    };
  } catch (error) {
    console.error('Error fetching lawyer profile:', error);
    throw error;
  }
}

// Create or update lawyer profile
export async function upsertLawyerProfile(
  userId: string,
  profileData: Partial<LawyerProfile>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('lawyer_profiles')
      .upsert({
        user_id: userId,
        ...profileData
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error upserting lawyer profile:', error);
    throw error;
  }
}

// Get lawyer cases
export async function getLawyerCases(lawyerId: string): Promise<LawyerCase[]> {
  try {
    const { data: cases } = await supabase
      .from('lawyer_cases')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .order('created_at', { ascending: false });

    return cases || [];
  } catch (error) {
    console.error('Error fetching lawyer cases:', error);
    throw error;
  }
}

// Get cases by status
export async function getCasesByStatus(lawyerId: string, status: string): Promise<LawyerCase[]> {
  try {
    const { data: cases } = await supabase
      .from('lawyer_cases')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    return cases || [];
  } catch (error) {
    console.error('Error fetching cases by status:', error);
    throw error;
  }
}

// Create new case
export async function createCase(
  lawyerId: string,
  caseData: {
    case_number: string;
    title: string;
    description?: string;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    case_type: string;
    priority?: string;
    billing_rate?: number;
    expected_end_date?: string;
  }
): Promise<string> {
  try {
    const { data: case_, error } = await supabase
      .from('lawyer_cases')
      .insert({
        lawyer_id: lawyerId,
        ...caseData
      })
      .select('id')
      .single();

    if (error) throw error;
    return case_.id;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
}

// Get case activities
export async function getCaseActivities(caseId: string): Promise<CaseActivity[]> {
  try {
    const { data: activities } = await supabase
      .from('case_activities')
      .select('*')
      .eq('case_id', caseId)
      .order('activity_date', { ascending: false });

    return activities || [];
  } catch (error) {
    console.error('Error fetching case activities:', error);
    throw error;
  }
}

// Add case activity
export async function addCaseActivity(
  caseId: string,
  userId: string,
  activityData: {
    activity_type: string;
    title: string;
    description?: string;
    duration_minutes?: number;
    billable_hours?: number;
    activity_date: string;
  }
): Promise<string> {
  try {
    const { data: activity, error } = await supabase
      .from('case_activities')
      .insert({
        case_id: caseId,
        created_by: userId,
        ...activityData
      })
      .select('id')
      .single();

    if (error) throw error;

    // Update case total hours if billable
    if (activityData.billable_hours) {
      // First get the current total hours
      const { data: currentCase } = await supabase
        .from('lawyer_cases')
        .select('total_hours')
        .eq('id', caseId)
        .single();

      const newTotalHours = (currentCase?.total_hours || 0) + activityData.billable_hours;

      await supabase
        .from('lawyer_cases')
        .update({
          total_hours: newTotalHours
        })
        .eq('id', caseId);
    }

    return activity.id;
  } catch (error) {
    console.error('Error adding case activity:', error);
    throw error;
  }
}

// Get legal research history
export async function getLegalResearchHistory(userId: string): Promise<LegalResearch[]> {
  try {
    const { data: research } = await supabase
      .from('legal_research')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return research || [];
  } catch (error) {
    console.error('Error fetching legal research history:', error);
    throw error;
  }
}

// Create legal research entry
export async function createLegalResearch(
  userId: string,
  researchData: {
    query: string;
    research_type: string;
    jurisdiction?: string;
    results: any[];
    citations?: string[];
    summary?: string;
    confidence_score?: number;
    processing_time_ms?: number;
    case_id?: string;
  }
): Promise<string> {
  try {
    const { data: research, error } = await supabase
      .from('legal_research')
      .insert({
        user_id: userId,
        jurisdiction: 'kenya',
        ...researchData
      })
      .select('id')
      .single();

    if (error) throw error;
    return research.id;
  } catch (error) {
    console.error('Error creating legal research:', error);
    throw error;
  }
}

// Get lawyer dashboard stats
export async function getLawyerDashboardStats(lawyerId: string): Promise<{
  activeCases: number;
  documentsAnalyzed: number;
  researchQueries: number;
  totalHours: number;
  totalRevenue: number;
}> {
  try {
    const { count: activeCases } = await supabase
      .from('lawyer_cases')
      .select('*', { count: 'exact', head: true })
      .eq('lawyer_id', lawyerId)
      .eq('status', 'active');

    const { count: documentsAnalyzed } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', lawyerId)
      .eq('status', 'analyzed');

    const { count: researchQueries } = await supabase
      .from('legal_research')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', lawyerId);

    const { data: caseStats } = await supabase
      .from('lawyer_cases')
      .select('total_hours, total_amount')
      .eq('lawyer_id', lawyerId);

    const totalHours = caseStats?.reduce((sum, case_) => sum + (case_.total_hours || 0), 0) || 0;
    const totalRevenue = caseStats?.reduce((sum, case_) => sum + (case_.total_amount || 0), 0) || 0;

    return {
      activeCases: activeCases || 0,
      documentsAnalyzed: documentsAnalyzed || 0,
      researchQueries: researchQueries || 0,
      totalHours,
      totalRevenue
    };
  } catch (error) {
    console.error('Error fetching lawyer dashboard stats:', error);
    throw error;
  }
}

// Search cases
export async function searchCases(lawyerId: string, searchTerm: string): Promise<LawyerCase[]> {
  try {
    const { data: cases } = await supabase
      .from('lawyer_cases')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .or(`title.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    return cases || [];
  } catch (error) {
    console.error('Error searching cases:', error);
    throw error;
  }
}

// Update case
export async function updateCase(
  caseId: string,
  lawyerId: string,
  updateData: Partial<LawyerCase>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('lawyer_cases')
      .update(updateData)
      .eq('id', caseId)
      .eq('lawyer_id', lawyerId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
}