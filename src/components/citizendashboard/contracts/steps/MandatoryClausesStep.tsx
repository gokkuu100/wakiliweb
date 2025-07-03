/**
 * Mandatory Clauses Step - Step 4
 * AI generates and user reviews mandatory contract clauses
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle,
  Clock,
  Edit3,
  Save,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Bot,
  Sparkles,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileText,
  Shield,
  Zap,
  Info
} from 'lucide-react';

import { useContractGeneration } from '../ContractGenerationContext';
import { clausesApi, contractsApi, ContractClause } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface ClauseEditForm {
  content: string;
  user_input: string;
  modification_reason: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function MandatoryClausesStep() {
  const { 
    state, 
    dispatch, 
    nextStep, 
    previousStep,
    setError,
    setSuccess,
    setLoading
  } = useContractGeneration();

  const [editingClause, setEditingClause] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ClauseEditForm>({
    content: '',
    user_input: '',
    modification_reason: ''
  });
  const [generatingClauses, setGeneratingClauses] = useState(false);
  const [clauseStatuses, setClauseStatuses] = useState<{[key: string]: string}>({});

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (state.currentContract && state.mandatoryClauses.length === 0) {
      generateMandatoryClauses();
    }
  }, [state.currentContract]);

  useEffect(() => {
    // Update clause statuses
    const statuses: {[key: string]: string} = {};
    state.mandatoryClauses.forEach(clause => {
      if (clause.approved_by_first_party) {
        statuses[clause.id] = 'approved';
      } else if (clause.user_modified) {
        statuses[clause.id] = 'modified';
      } else if (clause.ai_generated) {
        statuses[clause.id] = 'generated';
      } else {
        statuses[clause.id] = 'pending';
      }
    });
    setClauseStatuses(statuses);
  }, [state.mandatoryClauses]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const generateMandatoryClauses = async () => {
    if (!state.currentContract || !state.selectedTemplate) return;

    setGeneratingClauses(true);
    setLoading(true);

    try {
      // Get mandatory clauses from template
      const mandatoryClauseKeys = state.selectedTemplate.mandatory_clauses || {};
      
      const generatedClauses: ContractClause[] = [];

      // Generate each mandatory clause
      for (const [clauseKey, clauseInfo] of Object.entries(mandatoryClauseKeys)) {
        try {
          const result = await clausesApi.generateClause({
            contract_id: state.currentContract.id,
            clause_key: clauseKey,
            user_input: state.userInput,
            additional_requirements: state.contractFormData.description
          });

          generatedClauses.push(result.clause);

          // Update AI usage
          dispatch({
            type: 'UPDATE_AI_USAGE',
            payload: {
              tokens: result.ai_explanation ? 100 : 50, // Estimate
              cost: result.ai_explanation ? 0.01 : 0.005 // Estimate
            }
          });

        } catch (error) {
          console.error(`Error generating clause ${clauseKey}:`, error);
          setError(`Failed to generate ${clauseKey} clause`);
        }
      }

      // Update state with generated clauses
      dispatch({
        type: 'SET_CONTRACT_CLAUSES',
        payload: generatedClauses
      });

      setSuccess('Mandatory clauses generated successfully!');

    } catch (error) {
      console.error('Error generating mandatory clauses:', error);
      setError('Failed to generate mandatory clauses. Please try again.');
    } finally {
      setGeneratingClauses(false);
      setLoading(false);
    }
  };

  const startEditingClause = (clause: ContractClause) => {
    setEditingClause(clause.id);
    setEditForm({
      content: clause.current_content,
      user_input: clause.user_input || '',
      modification_reason: ''
    });
  };

  const cancelEditing = () => {
    setEditingClause(null);
    setEditForm({
      content: '',
      user_input: '',
      modification_reason: ''
    });
  };

  const saveClauseEdit = async () => {
    if (!editingClause) return;

    try {
      const updatedClause = await clausesApi.updateClause(editingClause, {
        content: editForm.content,
        user_input: editForm.user_input,
        status: 'user_modified'
      });

      dispatch({
        type: 'UPDATE_CLAUSE',
        payload: updatedClause
      });

      setEditingClause(null);
      setSuccess('Clause updated successfully!');

    } catch (error) {
      console.error('Error updating clause:', error);
      setError('Failed to update clause. Please try again.');
    }
  };

  const approveClause = async (clauseId: string) => {
    try {
      await clausesApi.approveClause(clauseId);
      
      // Update clause in state
      const updatedClauses = state.contractClauses.map(clause =>
        clause.id === clauseId 
          ? { ...clause, approved_by_first_party: true, status: 'approved' }
          : clause
      );

      dispatch({
        type: 'SET_CONTRACT_CLAUSES',
        payload: updatedClauses
      });

      setSuccess('Clause approved!');

    } catch (error) {
      console.error('Error approving clause:', error);
      setError('Failed to approve clause. Please try again.');
    }
  };

  const requestClauseModification = async (clauseId: string, reason: string) => {
    try {
      await clausesApi.requestClauseModification({
        clause_id: clauseId,
        modification_reason: reason,
        suggested_changes: editForm.modification_reason,
        user_requirements: editForm.user_input
      });

      setSuccess('Modification requested. AI will update the clause.');
      
      // Refresh clauses after a short delay
      setTimeout(() => {
        generateMandatoryClauses();
      }, 2000);

    } catch (error) {
      console.error('Error requesting clause modification:', error);
      setError('Failed to request modification. Please try again.');
    }
  };

  const handleNext = async () => {
    const approvedMandatory = state.mandatoryClauses.filter(c => c.approved_by_first_party);
    
    if (approvedMandatory.length === 0) {
      setError('Please approve at least one mandatory clause to continue.');
      return;
    }

    try {
      setLoading(true);

      // Update contract step
      if (state.currentContract) {
        await contractsApi.updateContract(state.currentContract.id, {
          current_step: 5,
          status: 'optional_clauses_pending' as any,
          mandatory_clauses_completed: approvedMandatory.length === state.mandatoryClauses.length,
          mandatory_completion_percentage: Math.round((approvedMandatory.length / state.mandatoryClauses.length) * 100)
        });
      }

      nextStep();
      
    } catch (error) {
      console.error('Error proceeding to next step:', error);
      setError('Failed to proceed to next step. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getClauseStatusBadge = (clause: ContractClause) => {
    const status = clauseStatuses[clause.id];
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'modified':
        return <Badge className="bg-blue-100 text-blue-800">Modified</Badge>;
      case 'generated':
        return <Badge className="bg-gray-100 text-gray-800">Generated</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const calculateProgress = () => {
    const approvedCount = state.mandatoryClauses.filter(c => c.approved_by_first_party).length;
    const totalCount = state.mandatoryClauses.length;
    
    if (totalCount === 0) return 0;
    return Math.round((approvedCount / totalCount) * 100);
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const progress = calculateProgress();
  const allApproved = state.mandatoryClauses.every(c => c.approved_by_first_party);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Mandatory Clauses
        </h2>
        <p className="text-gray-600">
          Review and approve the essential clauses for your {state.selectedTemplate?.name} contract
        </p>
      </div>

      {/* Progress and Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Mandatory Clauses Progress</span>
            </div>
            <span className="text-sm text-gray-600">
              {state.mandatoryClauses.filter(c => c.approved_by_first_party).length} of {state.mandatoryClauses.length} approved
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-500">
            {progress}% complete • {allApproved ? 'All clauses approved!' : 'Review remaining clauses'}
          </p>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {(state.success || state.error) && (
        <Alert className={`border-l-4 ${
          state.error ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
        }`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error || state.success}</AlertDescription>
        </Alert>
      )}

      {/* Generation Status */}
      {generatingClauses && (
        <Alert className="border-l-4 border-blue-500 bg-blue-50">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            AI is generating mandatory clauses based on your contract requirements...
          </AlertDescription>
        </Alert>
      )}

      {/* Clauses List */}
      <div className="space-y-4">
        {state.mandatoryClauses.map((clause, index) => (
          <Card key={clause.id} className={`transition-all duration-200 ${
            clause.approved_by_first_party ? 'ring-2 ring-green-200' : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">{clause.clause_name}</CardTitle>
                  </div>
                  {getClauseStatusBadge(clause)}
                </div>
                
                <div className="flex items-center gap-2">
                  {clause.approved_by_first_party ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
              
              <CardDescription className="flex items-center gap-2">
                <span>Clause {index + 1} of {state.mandatoryClauses.length}</span>
                {clause.ai_generated && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      <span className="text-xs">AI Generated</span>
                    </div>
                  </>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {editingClause === clause.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Clause Content</label>
                    <Textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Modification Notes</label>
                    <Textarea
                      value={editForm.modification_reason}
                      onChange={(e) => setEditForm(prev => ({ ...prev, modification_reason: e.target.value }))}
                      placeholder="Explain what changes you'd like to make..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveClauseEdit} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={cancelEditing} size="sm">
                      Cancel
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => requestClauseModification(clause.id, editForm.modification_reason)}
                      size="sm"
                      disabled={!editForm.modification_reason}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Request AI Modification
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {clause.current_content}
                    </p>
                  </div>

                  {clause.user_input && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Your Input</span>
                      </div>
                      <p className="text-sm text-blue-700">{clause.user_input}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEditingClause(clause)}
                        disabled={clause.approved_by_first_party}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditForm(prev => ({ ...prev, modification_reason: '' }));
                          // You could open a modal here for modification request
                        }}
                        disabled={clause.approved_by_first_party}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Request AI Changes
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {!clause.approved_by_first_party && (
                        <Button 
                          onClick={() => approveClause(clause.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {state.mandatoryClauses.length === 0 && !generatingClauses && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Generate Mandatory Clauses
            </h3>
            <p className="text-gray-600 mb-4">
              Click below to have AI generate the essential clauses for your contract
            </p>
            <Button onClick={generateMandatoryClauses} disabled={!state.currentContract}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Clauses
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About Mandatory Clauses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            Mandatory clauses are essential legal provisions required for your contract type 
            under Kenyan law. These clauses protect both parties and ensure legal compliance.
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>All mandatory clauses must be approved to proceed</li>
            <li>You can edit clauses to match your specific needs</li>
            <li>AI can suggest modifications based on your requirements</li>
            <li>Approved clauses cannot be edited without regeneration</li>
          </ul>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={previousStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contract Details
        </Button>

        <Button 
          onClick={handleNext}
          disabled={state.loading || state.mandatoryClauses.filter(c => c.approved_by_first_party).length === 0}
          className="flex items-center gap-2"
        >
          {state.loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving Progress...
            </>
          ) : (
            <>
              Add Optional Clauses
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
