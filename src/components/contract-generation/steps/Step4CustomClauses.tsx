'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';
import { 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Settings
} from 'lucide-react';

import { 
  Step4Data, 
  ContractSession, 
  ContractClause
} from '../types';

interface Step4CustomClausesProps {
  data: Step4Data;
  session: ContractSession | null;
  onComplete: (data: Step4Data) => void;
  onSessionUpdated: (session: ContractSession) => void;
  loading: boolean;
}

export default function Step4CustomClauses({ 
  data, 
  session,
  onComplete, 
  onSessionUpdated,
  loading: parentLoading 
}: Step4CustomClausesProps) {
  const [optionalClauses, setOptionalClauses] = useState<ContractClause[]>(data.optional_clauses || []);
  
  const [generating, setGenerating] = useState(false);
  const [generatingOptional, setGeneratingOptional] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProcessed, setAllProcessed] = useState(false);

  // Load existing data when session changes (for resumption)
  useEffect(() => {
    if (!session) return;

    // Load existing optional clauses
    if (session?.session_data?.optional_clauses) {
      const existingOptional = Array.isArray(session.session_data.optional_clauses) 
        ? session.session_data.optional_clauses 
        : Object.values(session.session_data.optional_clauses || {});
      setOptionalClauses(existingOptional);
      
      // Check if all clauses have been processed
      const processed = existingOptional.every((clause: ContractClause) => 
        clause.status === 'approved' || clause.status === 'rejected'
      );
      setAllProcessed(processed);
    } else if (!generatingOptional && optionalClauses.length === 0) {
      // Generate new optional clauses if none exist
      handleGenerateOptionalClauses();
    }
  }, [session?.session_data]);

  const handleGenerateOptionalClauses = async () => {
    if (!session?.selected_template_id) {
      setError('No template selected');
      return;
    }

    try {
      setGeneratingOptional(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session.id}/generate-optional-clauses`, {
        method: 'POST',
        body: JSON.stringify({
          template_id: session.selected_template_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate optional clauses');
      }

      const result = await response.json();
      
      if (result.optional_clauses) {
        setOptionalClauses(result.optional_clauses);
      }

    } catch (error) {
      console.error('Error generating optional clauses:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate optional clauses');
    } finally {
      setGeneratingOptional(false);
    }
  };

  const handleOptionalClauseApproval = async (clauseId: string, approved: boolean, modifications?: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session?.id}/approve-optional-clause`, {
        method: 'POST',
        body: JSON.stringify({
          clause_id: clauseId,
          is_approved: approved,
          user_modifications: modifications
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve optional clause');
      }

      const result = await response.json();

      // Update local state
      const updatedClauses = optionalClauses.map((clause: ContractClause) => 
        clause.clause_id === clauseId 
          ? { 
              ...clause, 
              status: (approved ? 'approved' : 'rejected') as 'approved' | 'rejected',
              user_modifications: modifications,
              content: modifications || clause.content
            }
          : clause
      );
      setOptionalClauses(updatedClauses);

      // Check if all clauses are now processed
      const processed = updatedClauses.every((clause: ContractClause) => 
        clause.status === 'approved' || clause.status === 'rejected'
      );
      setAllProcessed(processed);

      // If all are processed, notify parent
      if (processed) {
        onComplete({
          optional_clauses: updatedClauses,
          custom_clauses: [],
          selected_optional_clauses: updatedClauses.filter((c: ContractClause) => c.status === 'approved').map((c: ContractClause) => c.clause_id)
        });
      }

    } catch (error) {
      console.error('Error approving optional clause:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve optional clause');
    }
  };

  const handleOptionalClauseEdit = (clauseId: string, newContent: string) => {
    const updatedClauses = optionalClauses.map((clause: ContractClause) => 
      clause.clause_id === clauseId 
        ? { ...clause, content: newContent }
        : clause
    );
    setOptionalClauses(updatedClauses);
  };

  const handleNext = () => {
    const approvedOptionalClauses = optionalClauses.filter((c: ContractClause) => c.status === 'approved');
    
    const stepData: Step4Data = {
      optional_clauses: optionalClauses,
      custom_clauses: [],
      selected_optional_clauses: approvedOptionalClauses.map((c: ContractClause) => c.clause_id)
    };

    onComplete(stepData);
  };

  return (
    <div className="space-y-6">
      {/* Optional Clauses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Optional Clauses</span>
          </CardTitle>
          <p className="text-gray-600">
            These clauses are commonly used but not mandatory. Select the ones you want to include.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatingOptional ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Generating optional clauses...</span>
            </div>
          ) : optionalClauses.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No optional clauses are available for this contract template.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {optionalClauses.map((clause: ContractClause) => {
                const isApproved = clause.status === 'approved';
                const isRejected = clause.status === 'rejected';
                
                return (
                  <div
                    key={clause.clause_id}
                    className={`border rounded-lg p-4 transition-all ${
                      isApproved ? 'border-green-500 bg-green-50' : 
                      isRejected ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center space-x-2">
                          <span>{clause.title}</span>
                          {isApproved && <Check className="w-4 h-4 text-green-600" />}
                          {isRejected && <X className="w-4 h-4 text-red-600" />}
                        </h4>
                        <Badge 
                          variant={
                            isApproved ? 'default' : 
                            isRejected ? 'destructive' : 'secondary'
                          } 
                          className="mt-1"
                        >
                          {clause.status || 'pending'}
                        </Badge>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOptionalClauseApproval(clause.clause_id, false)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={isRejected}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOptionalClauseApproval(clause.clause_id, true, clause.content)}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          disabled={isApproved}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={clause.content}
                      onChange={(e) => handleOptionalClauseEdit(clause.clause_id, e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                      disabled={isRejected}
                    />

                    {clause.kenyan_law_reference && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Legal Reference:</strong> {clause.kenyan_law_reference}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary and Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Clause Selection Summary</h4>
                <p className="text-sm text-gray-600">
                  {optionalClauses.filter((c: ContractClause) => c.status === 'approved').length} optional clauses approved
                </p>
              </div>
              
              <Badge variant="secondary">
                Step 4 of 5
              </Badge>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm font-medium text-blue-900">Optional Clauses Approved</div>
              <div className="text-lg font-bold text-blue-600">
                {optionalClauses.filter((c: ContractClause) => c.status === 'approved').length}
              </div>
            </div>

            {allProcessed ? (
              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
              >
                Continue to Final Review
              </Button>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review all optional clauses before proceeding to the next step.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
