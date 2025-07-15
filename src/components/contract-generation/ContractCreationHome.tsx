/**
 * Contract Creation Home Page
 * Shows stats, history of sessions, and button to start new contract creation
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  History,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Bot,
  RefreshCw,
  Filter
} from 'lucide-react';
import  ContractCreationFlow  from './ContractCreationFlow';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuthContext';
import { supabase } from '@/lib/supabase';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Contract session interface based on actual database structure
interface ContractSession {
  id: string;
  user_id: string;
  session_status: string;
  initial_user_prompt?: string;
  ai_suggested_template_type?: string;
  selected_template_id?: string;
  current_stage: string;
  current_stage_name: string;
  current_step: number;
  total_steps: number;
  completion_percentage: string;
  contract_title?: string;
  contract_type?: string;
  contract_id?: string;
  session_data?: {
    template_name?: string;
    ai_analysis?: {
      suggested_templates?: Array<{
        template_name: string;
        template_id: string;
        confidence_score: number;
      }>;
    };
  };
  ai_analysis_data?: any;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  completed_at?: string;
  expires_at?: string;
  days_ago?: number;
}

// Stats interface
interface ContractStats {
  total_sessions: number;
  completed_contracts: number;
  active_sessions: number;
  templates_used: string[];
  success_rate: number;
  avg_completion_time_hours: number;
}

export function ContractCreationHome() {
  // Auth context
  const { user, userProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State variables
  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ContractSession[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Fetch sessions and stats on component mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchUserData();
    }
  }, [statusFilter, isAuthenticated, authLoading]);  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching user data...', { user: user?.id, userProfile: userProfile?.id });
      
      // Check if user is authenticated first
      if (!user?.id) {
        setError('User not authenticated. Please log in.');
        return;
      }

      try {
        // Fetch sessions first
        console.log('Fetching sessions...');
        let sessionsData;
        try {
          const sessionsResponse = await makeAuthenticatedRequest('/api/contract-generation/sessions', {
            method: 'GET',
          });

          if (sessionsResponse.ok) {
            sessionsData = await sessionsResponse.json();
            console.log('Sessions data:', sessionsData);
            setSessions(sessionsData.sessions || []);
          } else {
            console.error('Failed to fetch sessions');
            setSessions([]);
          }
        } catch (sessionError: any) {
          console.error('Sessions API Error:', sessionError);
          // Don't fail completely, just log the error and continue with stats
          setSessions([]);
        }
        
        // Fetch stats
        console.log('Fetching stats...');
        let statsData;
        try {
          const statsResponse = await makeAuthenticatedRequest('/api/contract-generation/analytics', {
            method: 'GET',
          });

          if (statsResponse.ok) {
            statsData = await statsResponse.json();
            console.log('Stats data:', statsData);
            setStats(statsData);
          } else {
            console.error('Failed to fetch stats');
            setStats({
              total_sessions: 0,
              completed_contracts: 0,
              active_sessions: 0,
              templates_used: [],
              success_rate: 0,
              avg_completion_time_hours: 0
            });
          }
        } catch (statsError: any) {
          console.error('Stats API Error:', statsError);
          // Set default stats on error
          setStats({
            total_sessions: 0,
            completed_contracts: 0,
            active_sessions: 0,
            templates_used: [],
            success_rate: 0,
            avg_completion_time_hours: 0
          });
        }
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        // Check if it's an authentication error
        if (apiError.message?.includes('Authentication required') || apiError.message?.includes('Authentication failed')) {
          setError('Authentication failed. Please log out and log back in.');
        } else if (apiError.message?.includes('Failed to fetch') || apiError.message?.includes('NetworkError')) {
          setError('Cannot connect to server. Please check if the backend is running.');
        } else {
          setError(apiError.message || 'Failed to load data from server');
        }
      }
      
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load more sessions
  const fetchMoreSessions = async () => {
    try {
      if (isFetchingMore) return;
      
      setIsFetchingMore(true);
      
      const response = await makeAuthenticatedRequest('/api/contract-generation/sessions', {
        method: 'GET',
      });

      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(sessionsData.sessions || []);
      } else {
        console.error('Failed to fetch more sessions');
      }
      
    } catch (err) {
      console.error('Error fetching more sessions:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Start contract creation
  const handleStartContractCreation = () => {
    setActiveSessionId(null);
    setShowCreationFlow(true);
  };

  // Resume existing session
  const handleResumeSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowCreationFlow(true);
  };

  // Return to dashboard from contract flow
  const handleReturnToDashboard = () => {
    setShowCreationFlow(false);
    fetchUserData(); // Refresh data
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? null : value);
  };

  // Add offline mode fallback
  const handleOfflineMode = () => {
    setError(null);
    setStats({
      total_sessions: 0,
      completed_contracts: 0,
      active_sessions: 0,
      templates_used: [],
      success_rate: 0,
      avg_completion_time_hours: 0
    });
    setSessions([]);
    setIsLoading(false);
  };

  // If showing the contract creation flow
  if (showCreationFlow) {
    return (
      <ContractCreationFlow 
        existingSessionId={activeSessionId || undefined} 
        onComplete={handleReturnToDashboard} 
        onCancel={handleReturnToDashboard}
      />
    );
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Checking authentication...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to access contract creation. Please log in and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading contract dashboard...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-2 mt-4">
          <Button onClick={fetchUserData}>Retry</Button>
          <Button onClick={handleOfflineMode} variant="outline">
            Continue Offline
          </Button>
        </div>
      </div>
    );
  }

  // Format templates used for display
  const formattedTemplates = stats?.templates_used?.map(template => {
    return template?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }).filter(Boolean) || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Offline mode notice */}
      {stats?.total_sessions === 0 && stats?.completed_contracts === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Working in offline mode. Some features may be limited. Ensure your backend is running for full functionality.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-centContractCreationHome.tsx:108 API Error: Error: Authentication required
    at apiRequest (contract-api.ts:15:11)
    at Object.getUserSessions (contract-api.ts:97:12)
    at fetchUserData (ContractCreationHome.tsx:98:56)er mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Contract Generation</h1>
          <p className="text-muted-foreground mt-1">
            Create legally compliant contracts with AI assistance
          </p>
        </div>
        <Button 
          onClick={handleStartContractCreation} 
          size="lg" 
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Contract
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contract Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{stats?.total_sessions || 0}</div>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.completed_contracts || 0}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.active_sessions || 0}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Template Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedTemplates.length}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formattedTemplates.map((template, index) => (
                <Badge key={index} variant="outline">
                  {template}
                </Badge>
              ))}
              {formattedTemplates.length === 0 && (
                <span className="text-xs text-muted-foreground">No templates used yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{stats?.success_rate || 0}%</div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.avg_completion_time_hours?.toFixed(1) || '0.0'}h</div>
                <p className="text-xs text-muted-foreground">Avg. Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-xl font-semibold">Your Contract Sessions</h2>
          
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter != null ? `Filter: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}` : 'All Sessions'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
                <DropdownMenuRadioItem value="all">All Sessions</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="abandoned">Abandoned</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">
                {statusFilter != null ? 
                  `No ${statusFilter} contract sessions found.` :
                  "You haven't created any contracts yet."
                }
                <br />Start by clicking the "Create Contract" button.
              </p>
              <Button onClick={handleStartContractCreation} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Contract
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => {
                // Calculate days ago from created_at
                const daysAgo = Math.floor((new Date().getTime() - new Date(session.created_at).getTime()) / (1000 * 60 * 60 * 24));
                
                // Get template name from session data
                const templateName = session.session_data?.template_name || 
                                   session.session_data?.ai_analysis?.suggested_templates?.[0]?.template_name || 
                                   'Unknown Template';
                
                return (
                  <Card key={session.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-medium truncate">
                          {session.contract_title || templateName || 'Untitled Contract'}
                        </CardTitle>
                        <Badge variant={
                          session.session_status === 'completed' ? 'default' :
                          session.session_status === 'active' ? 'outline' : 
                          'secondary'
                        }>
                          {session.session_status.charAt(0).toUpperCase() + session.session_status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription className="truncate">
                        {session.initial_user_prompt || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {daysAgo === 0 ? 'Today' : 
                           daysAgo === 1 ? 'Yesterday' : 
                           `${daysAgo} days ago`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Stage: {session.current_stage_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Type: {session.contract_type?.toUpperCase() || 'N/A'}</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${parseFloat(session.completion_percentage || '0')}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">{Math.round(parseFloat(session.completion_percentage || '0'))}% complete</span>
                        <span className="text-muted-foreground">Step {session.current_step} of {session.total_steps}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant={session.contract_id ? "outline" : "default"} 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleResumeSession(session.id)}
                      >
                        {session.contract_id ? (
                          <>
                            <ExternalLink className="h-4 w-4 mr-1" /> 
                            View Contract
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-1" /> 
                            {session.session_status === 'active' ? 'Resume Session' : 'View Details'}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
            
            {/* Load More Button */}
            {sessions.length >= 10 && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={fetchMoreSessions}
                  disabled={isFetchingMore}
                >
                  {isFetchingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Sessions
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Guidance Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">1. Describe Your Needs</CardTitle>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tell us in simple terms what type of contract you need. Our AI will analyze your description
                and suggest the most appropriate contract type.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">2. AI-Guided Creation</CardTitle>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Step by step, our AI assists you in building your contract, generating clauses that
                are legally compliant and match your specific needs.
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">3. Review & Finalize</CardTitle>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review the complete contract, make any final adjustments, and generate your final
                document ready for signing and use.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
