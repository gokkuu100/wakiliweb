/**
 * Contract Creation Dashboard - Production Landing Page for AI Contract Creation
 * Backend-driven with session tracking, stats and step-wise workflow
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Shield,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  BookOpen,
  Timer,
  Target,
  Bot,
  Send,
  Lightbulb
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { ContractCreationWorkflow } from './ContractCreationWorkflow';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

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
  completion_percentage: number;
  contract_title?: string;
  contract_type?: string;
  contract_id?: string;
  created_at: string;
  last_activity_at: string;
  session_data: any;
}

interface DashboardStats {
  total_sessions: number;
  completed_contracts: number;
  active_sessions: number;
  templates_used: string[];
  success_rate: number;
  avg_completion_time_hours: number;
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContractCreationDashboard() {
  const router = useRouter();
  const { user } = useUser();
  
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [sessions, setSessions] = useState<ContractSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // DATA FETCHING & API CALLS
  // =============================================================================

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token 
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Fetch user's contract sessions from backend
      const sessionsResponse = await fetch(`${API_BASE_URL}/contract-sessions/sessions?limit=10`, {
        headers
      });
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      } else {
        console.error('Failed to fetch sessions:', sessionsResponse.status);
      }

      // Fetch dashboard statistics from backend
      const statsResponse = await fetch(`${API_BASE_URL}/contract-sessions/stats`, {
        headers
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.error('Failed to fetch stats:', statsResponse.status);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/contract-sessions/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      } else {
        console.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleResumeSession = (sessionId: string) => {
    setShowWorkflow(true);
    // The workflow component will handle loading the specific session
  };
        setStats(statsData);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleCreateContract = () => {
    setShowWorkflow(true);
  };

  const handleSessionClick = (session: ContractSession) => {
    if (session.contract_id) {
      router.push(`/citizen/contracts-generation/view/${session.contract_id}`);
    } else {
      // Resume the session
      setShowWorkflow(true);
      // TODO: Pass session ID to workflow to resume
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/contracts/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'paused': return <Timer className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContractTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'nda': return <Shield className="h-5 w-5 text-blue-600" />;
      case 'employment': return <Users className="h-5 w-5 text-green-600" />;
      case 'service_agreement': return <FileText className="h-5 w-5 text-purple-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // =============================================================================
  // RENDER MAIN COMPONENT
  // =============================================================================

  if (showWorkflow) {
    return <ContractCreationWorkflow onClose={() => setShowWorkflow(false)} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Contract Creation
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Create legally compliant contracts with AI assistance, designed for Kenyan law
          </p>
        </div>
        
        <Button 
          onClick={handleCreateContract}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Contract
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Contract creation attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed_contracts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully created contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              In progress contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.success_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Completion success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Contract Sessions
          </CardTitle>
          <CardDescription>
            Your contract creation history and current progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No contracts yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first AI-powered contract to get started
              </p>
              <Button onClick={handleCreateContract}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Contract
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getContractTypeIcon(session.contract_type)}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {session.contract_title || `${session.contract_type?.toUpperCase() || 'Contract'} Session`}
                        </h3>
                        <Badge variant="outline" className={getStatusColor(session.session_status)}>
                          {getStatusIcon(session.session_status)}
                          <span className="ml-1">{session.session_status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <span>{session.current_stage_name}</span>
                        <span>•</span>
                        <span>{session.completion_percentage}% complete</span>
                        <span>•</span>
                        <span>{formatDate(session.last_activity_at)}</span>
                      </div>
                      
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${session.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {session.contract_id && (
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/citizen/contracts-generation/view/${session.contract_id}`);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {session.session_status === 'active' && (
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setShowWorkflow(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            How It Works
          </CardTitle>
          <CardDescription>
            Simple steps to create your contract with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">1. Describe Your Needs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tell our AI what kind of contract you need in plain language
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">2. AI Creates Draft</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Our AI suggests the best template and creates customized clauses
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2">3. Review & Finalize</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Review, modify if needed, and get your legally compliant contract
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
