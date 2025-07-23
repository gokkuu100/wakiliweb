'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, CheckCircle, AlertCircle, User, Users, Loader2, Sparkles, ChevronLeft, ChevronRight, AlertTriangle, Check, X, Edit, Save, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';
import { useAuth } from '@/hooks/useAuthContext';
import { supabase } from '@/lib/supabase';

import { 
  Step3Data, 
  ContractSession, 
  ContractClause, 
  MandatoryFields,
  UserInfo
} from '../types';

interface Step3Props {
  data: Step3Data;
  session: ContractSession | null;
  onComplete: (data: Step3Data) => void;
  onSessionUpdated: (session: ContractSession) => void;
  loading?: boolean;
}

export default function Step3ContractRequirements({ 
  data, 
  session,
  onComplete, 
  onSessionUpdated,
  loading: parentLoading = false
}: Step3Props) {
  // Auth context
  const { user, userProfile } = useAuth();
  
  const [userExplanation, setUserExplanation] = useState(data.user_explanation || '');
  const [mandatoryFields, setMandatoryFields] = useState<MandatoryFields>(data.mandatory_fields);
  const [generatedClauses, setGeneratedClauses] = useState<ContractClause[]>(data.generated_clauses || []);
  const [currentClauseIndex, setCurrentClauseIndex] = useState(data.current_clause_index || 0);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [editingClause, setEditingClause] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [clausesGenerated, setClausesGenerated] = useState(false);
  const [step3Completed, setStep3Completed] = useState(false);
  const [party1AppId, setParty1AppId] = useState('');
  const [party2AppId, setParty2AppId] = useState('');
  const [searchResults, setSearchResults] = useState<{[key: string]: UserInfo | null}>({});
  
  // Alert state for mandatory clause rejection
  const [showRejectAlert, setShowRejectAlert] = useState(false);

  const wordCount = userExplanation.trim().split(/\s+/).filter(word => word.length > 0).length;
  const minWords = 200;


  // Auto-populate Party 1 details from authenticated user
  useEffect(() => {
    if (userProfile && user) {
      const updatedFields = { ...mandatoryFields };
      
      // Auto-populate Party 1 with current user's information
      updatedFields.party1 = {
        app_id: userProfile.id,
        name: userProfile.full_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone_number || '',
        address: userProfile.location || '',
        party_type: userProfile.user_type === 'lawyer' ? 'individual' : 'individual'
      };
      
      setMandatoryFields(updatedFields);
      setParty1AppId(userProfile.id);
    }
  }, [userProfile, user]);

  // Add debounced search function
  const debouncedSearch = useCallback(
    debounce((appId: string, partyType: 'party1' | 'party2') => {
      handleSearchUser(appId, partyType);
    }, 300),
    []
  );

  // Simple debounce implementation
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Add retry mechanism for failed requests
  const retryRequest = async (requestFn: () => Promise<void>, maxRetries = 3) => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await requestFn();
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (i < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  };

  // Add useEffect to clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000); // Clear error after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Add keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.ctrlKey) {
        if (!analyzing && !reanalyzing && !searchingUser && wordCount >= minWords && userExplanation.trim()) {
          handleAnalyzeContract();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [analyzing, reanalyzing, searchingUser, wordCount, userExplanation, minWords]);

  useEffect(() => {
    if (data.generated_clauses && data.generated_clauses.length > 0) {
      setClausesGenerated(true);
    }
  }, [data.generated_clauses]);

  // Add effect to load Step 3 resume data when component mounts
  useEffect(() => {
    const loadStep3ResumeData = async () => {
      if (!session?.id) return;
      
      try {
        console.log('🔄 Loading Step 3 resume data...');
        
        const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session.id}/step3/resume-data`, {
          method: 'GET'
        });
        
        const result = await response.json();
        
        if (result.success && result.resume_data) {
          const resumeData = result.resume_data;
          console.log('✅ Step 3 resume data loaded:', resumeData);
          
          // If clauses were already generated, restore the state
          if (resumeData.has_generated_clauses && resumeData.ai_generated_clauses && resumeData.ai_generated_clauses.length > 0) {
            console.log('📋 Restoring generated clauses state...');
            
            // Set the generated clauses
            setGeneratedClauses(resumeData.ai_generated_clauses);
            setClausesGenerated(true);
            
            // Set current clause index - resume from the last unapproved clause
            const currentIndex = resumeData.current_clause_index || 0;
            setCurrentClauseIndex(Math.max(0, Math.min(currentIndex, resumeData.ai_generated_clauses.length - 1)));
            
            console.log(`📍 Resuming from clause index: ${currentIndex}`);
            console.log(`📊 Progress: ${resumeData.completed_clauses}/${resumeData.total_clauses} clauses completed`);
            
            // If all clauses are completed, user can proceed to step 4
            if (resumeData.can_proceed_to_step4) {
              console.log('🎉 All clauses completed - user can proceed to Step 4');
            }
          } else {
            console.log('📝 No previously generated clauses found - starting fresh');
          }
        }
        
      } catch (error) {
        console.warn('⚠️ Could not load Step 3 resume data:', error);
        // Don't show error to user as this is just resume functionality
        // If resume fails, user can still proceed normally
      }
    };
    
    // Load resume data when component mounts or session changes
    loadStep3ResumeData();
  }, [session?.id]);

  const handleAnalyzeContract = async () => {
    if (wordCount < minWords) {
      setError(`Contract explanation must contain at least ${minWords} words. Current: ${wordCount} words.`);
      return;
    }

    if (!session) {
      setError('No active session found');
      return;
    }

    // Prevent multiple simultaneous requests
    if (analyzing) {
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      const requestData = {
        explanation: userExplanation,
        mandatory_fields: mandatoryFields,
        template_id: session.selected_template_id || '',
        user_context: {
          user_id: session.user_id,
          session_id: session.id
        }
      };

      console.log('🚀 Starting contract analysis...');
      console.log('📋 Session:', session);
      console.log('📝 User explanation length:', userExplanation.length);
      console.log('🔧 Mandatory fields:', mandatoryFields);
      console.log('Analyzing contract with data:', requestData);

      // Make the request to our frontend API route
      console.log('📡 Making request to:', `/api/contract-generation/sessions/${session.id}/generate-mandatory-clauses`);
      console.log('📡 Request data:', JSON.stringify(requestData, null, 2));
      
      console.log('⏳ Getting auth token and making POST request to frontend API...');
      
      // Get auth token
      const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
      if (authError || !authSession?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(`/api/contract-generation/sessions/${session.id}/generate-mandatory-clauses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Analysis response status:', response.status);
      console.log('📡 Analysis response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Raw error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ Analysis response error:', errorData);
        throw new Error(errorData.detail || 'Failed to analyze contract');
      }

      const result = await response.json();
      console.log('✅ Analysis result:', result);
      
      if (result.generated_clauses) {
        setGeneratedClauses(result.generated_clauses);
        setCurrentClauseIndex(0);
        setClausesGenerated(true);
        console.log('Generated clauses:', result.generated_clauses);
      }

      if (result.contract_session) {
        onSessionUpdated(result.contract_session);
      }

    } catch (error) {
      console.error('Error analyzing contract:', error);
      
      let errorMessage = 'Failed to analyze contract';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Analysis request timed out. This might be due to high server load. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSearchUser = async (appId: string, partyType: 'party1' | 'party2') => {
    if (!appId.trim()) {
      setError('Please enter an App ID to search');
      return;
    }

    // Prevent multiple simultaneous requests
    if (searchingUser) {
      console.log('Search already in progress, skipping...');
      return;
    }

    try {
      setSearchingUser(true);
      setError(null);

      console.log('Searching for user with app_id:', appId);
      console.log('Making request to:', `/api/contract-generation/search-user`);

      // Make the request with a longer timeout and better error handling
      const response = await makeAuthenticatedRequest(`/api/contract-generation/search-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          requesting_user_id: session?.user_id || ''
        })
      });

      console.log('Search response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        console.error('Search response error:', errorData);
        throw new Error(errorData.error || errorData.detail || 'User not found');
      }

      const result = await response.json();
      console.log('Search result:', result);
      
      if (result.user_info) {
        setSearchResults(prev => ({
          ...prev,
          [partyType]: result.user_info
        }));

        // Update mandatory fields
        setMandatoryFields(prev => ({
          ...prev,
          [partyType]: result.user_info
        }));
        
        console.log('User found and updated:', result.user_info);
      } else {
        throw new Error('No user information returned');
      }

    } catch (error) {
      console.error('Error searching user:', error);
      
      let errorMessage = 'Failed to search user';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Search request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setSearchResults(prev => ({
        ...prev,
        [partyType]: null
      }));
    } finally {
      setSearchingUser(false);
    }
  };

  const handleClauseApproval = async (clauseId: string, approved: boolean, modifications?: string) => {
    if (!session) return;

    // Prevent multiple simultaneous requests
    if (reanalyzing) {
      return;
    }

    try {
      setReanalyzing(true);
      setError(null);

      console.log('Approving clause:', { clauseId, approved, modifications });

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      // Make the request with timeout
      const requestPromise = makeAuthenticatedRequest(`/api/contract-generation/sessions/${session.id}/approve-clause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clause_id: clauseId,
          approved,
          user_modifications: modifications || null
        })
      });

      const response = await Promise.race([requestPromise, timeoutPromise]) as Response;

      console.log('Approval response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          detail: `HTTP ${response.status}: ${response.statusText}` 
        }));
        console.error('Approval response error:', errorData);
        throw new Error(errorData.detail || 'Failed to approve clause');
      }

      const result = await response.json();
      console.log('Approval result:', result);
      
      if (result.updated_clause) {
        setGeneratedClauses(prev => prev.map(clause => 
          clause.clause_id === clauseId ? result.updated_clause : clause
        ));
      }

      if (result.contract_session) {
        onSessionUpdated(result.contract_session);
      }

      // Handle Step 3 completion
      if (result.step3_completed) {
        console.log('🎉 Step 3 completed! All clauses approved.');
        setStep3Completed(true);
        // You can add notification or UI feedback here
      }

      // If approved, automatically move to next clause
      if (approved && result.success) {
        const nextIndex = currentClauseIndex + 1;
        if (nextIndex < generatedClauses.length) {
          console.log(`➡️ Moving to next clause: ${nextIndex}`);
          setCurrentClauseIndex(nextIndex);
        } else {
          console.log('✅ All clauses reviewed');
        }
      }

    } catch (error) {
      console.error('Error approving clause:', error);
      
      let errorMessage = 'Failed to approve clause';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Approval request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleReanalyzeClause = async (clauseId: string, modifications: string) => {
    if (!session) return;

    // Prevent multiple simultaneous requests
    if (reanalyzing) {
      return;
    }

    try {
      setReanalyzing(true);
      setError(null);

      console.log('Reanalyzing clause:', { clauseId, modifications });

      // Make the request to reanalyze
      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session.id}/reanalyze-clause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clause_id: clauseId,
          user_modifications: modifications
        })
      });

      console.log('Reanalysis response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          detail: `HTTP ${response.status}: ${response.statusText}` 
        }));
        console.error('Reanalysis response error:', errorData);
        throw new Error(errorData.detail || 'Failed to reanalyze clause');
      }

      const result = await response.json();
      console.log('Reanalysis result:', result);
      
      if (result.updated_clause) {
        setGeneratedClauses(prev => prev.map(clause => 
          clause.clause_id === clauseId ? result.updated_clause : clause
        ));
      }

      if (result.contract_session) {
        onSessionUpdated(result.contract_session);
      }

      // Clear editing state
      setEditingClause(null);
      setEditedContent('');

    } catch (error) {
      console.error('Error reanalyzing clause:', error);
      
      let errorMessage = 'Failed to reanalyze clause';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Reanalysis request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleStartEditing = (clauseId: string, currentContent: string) => {
    setEditingClause(clauseId);
    setEditedContent(currentContent);
  };

  const handleCancelEditing = () => {
    setEditingClause(null);
    setEditedContent('');
  };

  const handleNextClause = () => {
    if (currentClauseIndex < generatedClauses.length - 1) {
      setCurrentClauseIndex(currentClauseIndex + 1);
    }
  };

  const handlePrevClause = () => {
    if (currentClauseIndex > 0) {
      setCurrentClauseIndex(currentClauseIndex - 1);
    }
  };

  // Handle rejection attempt for mandatory clauses
  const handleMandatoryClauseReject = () => {
    setShowRejectAlert(true);
  };

  // Navigation functions for single clause view
  const canNavigateNext = () => {
    if (!generatedClauses.length || currentClauseIndex >= generatedClauses.length - 1) {
      return false;
    }
    
    // Check if current clause is approved
    const currentClause = generatedClauses[currentClauseIndex];
    return currentClause?.status === 'approved';
  };

  const canNavigatePrevious = () => {
    return currentClauseIndex > 0;
  };

  const navigateToNextClause = () => {
    if (canNavigateNext()) {
      setCurrentClauseIndex(prev => prev + 1);
      setEditingClause(null);
      setEditedContent('');
    }
  };

  const navigateToPreviousClause = () => {
    if (canNavigatePrevious()) {
      setCurrentClauseIndex(prev => prev - 1);
      setEditingClause(null);
      setEditedContent('');
    }
  };

  // Check if all clauses are approved for proceeding
  const canProceed = () => {
    if (!clausesGenerated || !generatedClauses.length) {
      return false;
    }
    
    // All mandatory clauses must be approved OR Step 3 is completed
    return step3Completed || generatedClauses.every(clause => clause.status === 'approved');
  };

  const handleProceed = () => {
    if (canProceed()) {
      const stepData: Step3Data = {
        user_explanation: userExplanation,
        mandatory_fields: mandatoryFields,
        generated_clauses: generatedClauses,
        current_clause_index: currentClauseIndex
      };

      onComplete(stepData);
    }
  };

  const currentClause = generatedClauses[currentClauseIndex];

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {(analyzing || reanalyzing) && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">
                {analyzing && 'Analyzing Contract Requirements'}
                {reanalyzing && 'Processing Clause Approval'}
              </p>
              <p className="text-sm text-gray-600">
                This may take a few moments...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 Progress Indicator */}
      {clausesGenerated && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-800">Clause Review Progress</h3>
              <span className="text-xs text-green-600">
                {step3Completed ? '✅ Completed' : `${generatedClauses.filter(c => c.status === 'approved').length}/${generatedClauses.length} approved`}
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${generatedClauses.length > 0 ? (generatedClauses.filter(c => c.status === 'approved').length / generatedClauses.length) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-green-700">
              {step3Completed 
                ? "All mandatory clauses have been approved. You can now proceed to optional clauses."
                : "Review and approve each mandatory clause to proceed to the next step."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contract Requirements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Contract Requirements</span>
          </CardTitle>
          <p className="text-gray-600">
            Provide detailed requirements for your contract (minimum 200 words)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-explanation">
              Detailed Contract Explanation
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="contract-explanation"
              value={userExplanation}
              onChange={(e) => setUserExplanation(e.target.value)}
              placeholder="Describe your contract requirements in detail. Include the purpose, key terms, obligations, and any specific conditions you want included..."
              className="min-h-[120px]"
              disabled={analyzing || parentLoading}
            />
            <div className="flex justify-between items-center">
              <span className={`text-sm ${wordCount < minWords ? 'text-red-500' : 'text-green-600'}`}>
                {wordCount} / {minWords} words minimum
              </span>
              {wordCount >= minWords && (
                <Badge className="bg-green-100 text-green-800">✓ Requirement met</Badge>
              )}
            </div>
          </div>

          {/* Party Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Party 1 */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center space-x-2">
                <span>Party 1 (Primary)</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-600">Auto-populated</Badge>
              </Label>
              
              {/* Show current user's information */}
              {userProfile && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">{userProfile.full_name}</span>
                  </div>
                  <p className="text-sm text-blue-700">{userProfile.email}</p>
                  <p className="text-sm text-blue-700">App ID: {userProfile.id}</p>
                  {userProfile.phone_number && (
                    <p className="text-sm text-blue-700">Phone: {userProfile.phone_number}</p>
                  )}
                  {userProfile.location && (
                    <p className="text-sm text-blue-700">Location: {userProfile.location}</p>
                  )}
                </div>
              )}
            </div>

            {/* Party 2 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Party 2 (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter App ID"
                  value={party2AppId}
                  onChange={(e) => setParty2AppId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && party2AppId.trim() && !searchingUser) {
                      handleSearchUser(party2AppId, 'party2');
                    }
                  }}
                  disabled={searchingUser || analyzing}
                />
                <Button
                  onClick={() => handleSearchUser(party2AppId, 'party2')}
                  disabled={searchingUser || analyzing || !party2AppId.trim()}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {searchingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              
              {searchResults.party2 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{searchResults.party2.name}</p>
                        <p className="text-sm text-green-600">App ID: {searchResults.party2.app_id}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {searchResults.party2.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-green-700">
                      <strong>Email:</strong> {searchResults.party2.email}
                    </p>
                    {searchResults.party2.phone && (
                      <p className="text-sm text-green-700">
                        <strong>Phone:</strong> {searchResults.party2.phone}
                      </p>
                    )}
                    {searchResults.party2.address && (
                      <p className="text-sm text-green-700">
                        <strong>Address:</strong> {searchResults.party2.address}
                      </p>
                    )}
                    <p className="text-sm text-green-700">
                      <strong>User Type:</strong> {searchResults.party2.user_type}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Jurisdiction */}
          <div className="space-y-2">
            <Label htmlFor="jurisdiction">Jurisdiction</Label>
            <Select value={mandatoryFields.contract_details.jurisdiction} onValueChange={(value) => 
              setMandatoryFields(prev => ({
                ...prev,
                contract_details: { ...prev.contract_details, jurisdiction: value }
              }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kenya">Kenya</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Mandatory Clauses Button */}
          <Button
            onClick={handleAnalyzeContract}
            disabled={
              analyzing || 
              reanalyzing || 
              searchingUser || 
              wordCount < minWords || 
              !userExplanation.trim()
            }
            className="w-full"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Contract Requirements...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Mandatory Clauses
              </>
            )}
          </Button>
          
          {/* Requirements info */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>Requirements to generate clauses:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li className={wordCount >= minWords ? "text-green-600" : "text-red-600"}>
                Contract explanation ({wordCount}/{minWords} words)
              </li>
              <li className={userExplanation.trim() ? "text-green-600" : "text-gray-600"}>
                Contract explanation provided
              </li>
              <li className="text-green-600">
                Party 1 details (auto-populated from your profile)
              </li>
              <li className="text-blue-600">
                Party 2 details (optional - can be added later)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Generated Clauses Section */}
      {clausesGenerated && generatedClauses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Mandatory Clauses Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {currentClauseIndex + 1} of {generatedClauses.length}
                </Badge>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToPreviousClause}
                    disabled={!canNavigatePrevious()}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToNextClause}
                    disabled={!canNavigateNext()}
                    title={!canNavigateNext() && currentClauseIndex < generatedClauses.length - 1 ? 
                      "Please approve the current clause before proceeding" : undefined}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentClause && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{currentClause.title}</h3>
                  <Badge 
                    className={
                      currentClause.status === 'approved' ? 'bg-green-100 text-green-800' :
                      currentClause.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {currentClause.status}
                  </Badge>
                </div>

                <div className="p-4 bg-gray-50 rounded-md">
                  {editingClause === currentClause.clause_id ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="Edit the clause content..."
                      className="min-h-[120px] font-mono text-sm"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {currentClause.ai_generated_content || currentClause.content || 'No content generated yet'}
                    </p>
                  )}
                </div>

                {/* AI Confidence Score */}
                {currentClause.confidence_score && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>AI Confidence:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${currentClause.confidence_score * 100}%` }}
                      ></div>
                    </div>
                    <span>{Math.round(currentClause.confidence_score * 100)}%</span>
                  </div>
                )}

                {/* Legal References */}
                {currentClause.legal_references && currentClause.legal_references.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Legal References:</strong> {currentClause.legal_references.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Risk Assessment */}
                {currentClause.risk_assessment && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Risk Assessment:</strong> {currentClause.risk_assessment}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Kenyan Law Reference (fallback) */}
                {currentClause.kenyan_law_reference && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Legal Reference:</strong> {currentClause.kenyan_law_reference}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action buttons based on clause status */}
                {currentClause.status === 'pending' || currentClause.status === 'ai_generated' || currentClause.status === 'regenerated' ? (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleClauseApproval(currentClause.clause_id, true)}
                      disabled={reanalyzing}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStartEditing(currentClause.clause_id, currentClause.ai_generated_content || currentClause.content || '')}
                      disabled={reanalyzing}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit & Reanalyze
                    </Button>
                    <Button
                      onClick={() => handleMandatoryClauseReject()}
                      disabled={reanalyzing}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                ) : currentClause.status === 'approved' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Clause Approved</span>
                    </div>
                    <Button
                      onClick={() => handleStartEditing(currentClause.clause_id, currentClause.ai_generated_content || currentClause.content || '')}
                      disabled={reanalyzing}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ) : editingClause === currentClause.clause_id ? (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleReanalyzeClause(currentClause.clause_id, editedContent)}
                      disabled={reanalyzing || !editedContent.trim()}
                      className="flex-1"
                    >
                      {reanalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Reanalyzing...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reanalyze
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEditing}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleStartEditing(currentClause.clause_id, currentClause.ai_generated_content || currentClause.content || '')}
                      disabled={reanalyzing}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit & Reanalyze
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                // If it was a search error, retry search
                if (error.includes('search') && party2AppId) {
                  handleSearchUser(party2AppId, 'party2');
                }
                // If it was an analysis error, retry analysis
                else if (error.includes('analyze') || error.includes('Analysis')) {
                  handleAnalyzeContract();
                }
              }}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress indicator for long-running operations */}
      {(analyzing || reanalyzing || searchingUser) && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div className="text-sm text-blue-700">
              {analyzing && 'Analyzing your contract requirements with AI...'}
              {reanalyzing && 'Processing clause approval...'}
              {searchingUser && 'Searching for user in database...'}
            </div>
          </div>
        </div>
      )}

      {/* Proceed Button */}
      {canProceed() && (
        <div className="flex justify-end">
          <Button onClick={handleProceed} size="lg">
            Continue to Optional Clauses
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Mandatory Clause Rejection Alert */}
      {showRejectAlert && (
        <Alert variant="destructive" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cannot Reject Mandatory Clause
                </h3>
                <AlertDescription className="text-gray-700 mb-4">
                  This clause is mandatory for the contract generation and cannot be rejected. 
                  Instead, you can edit and reanalyze the clause to better fit your requirements.
                </AlertDescription>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowRejectAlert(false);
                      if (currentClause) {
                        handleStartEditing(currentClause.clause_id, currentClause.ai_generated_content || currentClause.content || '');
                      }
                    }}
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit & Reanalyze
                  </Button>
                  <Button
                    onClick={() => setShowRejectAlert(false)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
