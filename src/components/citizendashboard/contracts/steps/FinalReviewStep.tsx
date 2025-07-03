/**
 * Final Review Step - Step 7
 * Complete contract review before sending for signatures
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText,
  CheckCircle,
  Download,
  Send,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Bot,
  Shield,
  Users,
  Calendar,
  DollarSign,
  Scale,
  Eye,
  Edit,
  Clock,
  Zap,
  Star,
  Info
} from 'lucide-react';

import { useContractGeneration } from '../ContractGenerationContext';
import { contractsApi, aiApi, contractUtils } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface ContractSummary {
  total_clauses: number;
  mandatory_clauses: number;
  optional_clauses: number;
  custom_clauses: number;
  estimated_value: string;
  effective_date: string;
  expiry_date?: string;
  auto_renewal: boolean;
  parties_count: number;
  witnesses_count: number;
}

interface AIReviewResult {
  compliance_score: number;
  risk_assessment: any;
  recommendations: string[];
  legal_warnings: string[];
  overall_rating: 'excellent' | 'good' | 'fair' | 'poor';
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function FinalReviewStep() {
  const { 
    state, 
    dispatch, 
    nextStep, 
    previousStep,
    setError,
    setSuccess,
    setLoading
  } = useContractGeneration();

  const [contractSummary, setContractSummary] = useState<ContractSummary | null>(null);
  const [aiReview, setAIReview] = useState<AIReviewResult | null>(null);
  const [showFullContract, setShowFullContract] = useState(false);
  const [requestingAIReview, setRequestingAIReview] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [finalNotes, setFinalNotes] = useState('');
  const [readyToSend, setReadyToSend] = useState(false);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    generateContractSummary();
  }, [state.currentContract, state.contractClauses]);

  useEffect(() => {
    if (contractSummary && !aiReview) {
      requestAIReview();
    }
  }, [contractSummary]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const generateContractSummary = () => {
    if (!state.currentContract) return;

    const summary: ContractSummary = {
      total_clauses: state.contractClauses.length,
      mandatory_clauses: state.mandatoryClauses.length,
      optional_clauses: state.optionalClauses.length,
      custom_clauses: state.customClauses.length,
      estimated_value: contractUtils.formatContractValue(
        state.currentContract.contract_value, 
        state.currentContract.currency
      ),
      effective_date: state.currentContract.effective_date || 'Not specified',
      expiry_date: state.currentContract.expiry_date,
      auto_renewal: state.currentContract.auto_renewal,
      parties_count: 2, // Creator + Recipient
      witnesses_count: state.witnesses.length
    };

    setContractSummary(summary);
  };

  const requestAIReview = async () => {
    if (!state.currentContract) return;

    setRequestingAIReview(true);
    try {
      const result = await aiApi.requestAIReview(state.currentContract.id);
      
      const aiReviewResult: AIReviewResult = {
        compliance_score: result.compliance_score,
        risk_assessment: result.risk_assessment,
        recommendations: result.recommendations,
        legal_warnings: result.legal_warnings,
        overall_rating: result.compliance_score >= 90 ? 'excellent' :
                       result.compliance_score >= 75 ? 'good' :
                       result.compliance_score >= 60 ? 'fair' : 'poor'
      };

      setAIReview(aiReviewResult);

      // Update AI usage
      dispatch({
        type: 'UPDATE_AI_USAGE',
        payload: {
          tokens: 200, // Estimate for comprehensive review
          cost: 0.02 // Estimate
        }
      });

    } catch (error) {
      console.error('Error requesting AI review:', error);
      setError('Failed to get AI review. You can still proceed without it.');
    } finally {
      setRequestingAIReview(false);
    }
  };

  const generateFinalPDF = async () => {
    if (!state.currentContract) return;

    setGeneratingPDF(true);
    try {
      const result = await contractsApi.generatePDF(state.currentContract.id);
      
      // Update contract with PDF info
      await contractsApi.updateContract(state.currentContract.id, {
        final_document_url: result.pdf_url,
        document_hash: result.document_hash,
        document_version: state.currentContract.document_version + 1
      });

      setSuccess('Contract PDF generated successfully!');
      
      // Open PDF in new tab
      window.open(result.pdf_url, '_blank');

    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const finalizeContract = async () => {
    if (!state.currentContract) return;

    try {
      setLoading(true);

      // Update contract with final notes and status
      await contractsApi.updateContract(state.currentContract.id, {
        current_step: 8,
        status: 'ready_for_review' as any,
        // Add final notes if needed in backend schema
      });

      // Generate final PDF if not already generated
      if (!state.currentContract.final_document_url) {
        await generateFinalPDF();
      }

      setSuccess('Contract finalized and ready for signatures!');
      nextStep();
      
    } catch (error) {
      console.error('Error finalizing contract:', error);
      setError('Failed to finalize contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendForSignatures = async () => {
    if (!state.currentContract) return;

    try {
      setLoading(true);

      // Send to recipient if not already sent
      if (state.recipientData.email) {
        await contractsApi.sendContract(state.currentContract.id, {
          recipient_email: state.recipientData.email,
          recipient_app_id: state.recipientData.app_id,
          message: finalNotes || 'Please review and sign the attached contract.'
        });
      }

      // Update contract status
      await contractsApi.updateContract(state.currentContract.id, {
        status: 'pending_signatures' as any
      });

      setSuccess('Contract sent for signatures!');
      nextStep();
      
    } catch (error) {
      console.error('Error sending for signatures:', error);
      setError('Failed to send contract for signatures. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
      case 'poor':
        return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (!state.currentContract || !contractSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading contract summary...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Final Review
        </h2>
        <p className="text-gray-600">
          Review your complete contract before sending for signatures
        </p>
      </div>

      {/* Success/Error Messages */}
      {(state.success || state.error) && (
        <Alert className={`border-l-4 ${
          state.error ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
        }`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error || state.success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Summary
              </CardTitle>
              <CardDescription>
                {state.selectedTemplate?.name} • {state.currentContract.contract_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{contractSummary.total_clauses}</div>
                  <div className="text-sm text-gray-600">Total Clauses</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{contractSummary.mandatory_clauses}</div>
                  <div className="text-sm text-gray-600">Mandatory</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{contractSummary.optional_clauses}</div>
                  <div className="text-sm text-gray-600">Optional</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{contractSummary.custom_clauses}</div>
                  <div className="text-sm text-gray-600">Custom</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Contract Value:</span>
                    <span className="font-medium">{contractSummary.estimated_value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Effective Date:</span>
                    <span className="font-medium">{contractSummary.effective_date}</span>
                  </div>
                  {contractSummary.expiry_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Expiry Date:</span>
                      <span className="font-medium">{contractSummary.expiry_date}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Parties:</span>
                    <span className="font-medium">{contractSummary.parties_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Witnesses:</span>
                    <span className="font-medium">{contractSummary.witnesses_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Auto-renewal:</span>
                    <span className="font-medium">{contractSummary.auto_renewal ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Review */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Legal Review
                {requestingAIReview && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </CardTitle>
              <CardDescription>
                Automated compliance and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiReview ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Compliance Score</span>
                      </div>
                      <div className={`text-2xl font-bold ${getComplianceColor(aiReview.compliance_score)}`}>
                        {aiReview.compliance_score}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">Overall Rating</div>
                      {getComplianceBadge(aiReview.overall_rating)}
                    </div>
                  </div>

                  {aiReview.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        AI Recommendations
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {aiReview.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiReview.legal_warnings.length > 0 && (
                    <Alert className="border-l-4 border-yellow-500 bg-yellow-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Legal Warnings:</strong>
                        <ul className="mt-2 space-y-1">
                          {aiReview.legal_warnings.map((warning, index) => (
                            <li key={index} className="text-sm">• {warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : requestingAIReview ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">AI is reviewing your contract for compliance and risks...</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button onClick={requestAIReview} variant="outline">
                    <Bot className="h-4 w-4 mr-2" />
                    Request AI Review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parties Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contract Parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">First Party (You)</h4>
                  <p className="text-sm text-gray-600">Contract Creator</p>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800">Ready to Sign</Badge>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Second Party</h4>
                  <p className="text-sm">{state.recipientData.name}</p>
                  <p className="text-sm text-gray-600">{state.recipientData.email}</p>
                  <div className="mt-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Pending Invitation</Badge>
                  </div>
                </div>
              </div>

              {state.witnesses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Witnesses</h4>
                  <div className="space-y-2">
                    {state.witnesses.map((witness) => (
                      <div key={witness.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{witness.witness_name}</p>
                          <p className="text-xs text-gray-600">{witness.witness_email}</p>
                        </div>
                        <Badge className="text-xs">
                          {witness.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Final Notes (Optional)</CardTitle>
              <CardDescription>
                Add any final comments or instructions for the other party
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                placeholder="Add any special instructions or notes about this contract..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={generateFinalPDF} 
                disabled={generatingPDF}
                variant="outline" 
                className="w-full"
              >
                {generatingPDF ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>

              <Button 
                onClick={() => setShowFullContract(!showFullContract)}
                variant="outline" 
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showFullContract ? 'Hide' : 'Preview'} Full Contract
              </Button>

              {showFullContract && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Contract Preview</h4>
                  <div className="space-y-2 text-sm">
                    {state.contractClauses.map((clause, index) => (
                      <div key={clause.id} className="border-b border-gray-200 pb-2">
                        <p className="font-medium">{clause.clause_name}</p>
                        <p className="text-gray-600 text-xs truncate">
                          {clause.current_content.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-signature Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">All mandatory clauses approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Contract details completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Recipient information added</span>
                </div>
                <div className="flex items-center gap-2">
                  {aiReview ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">AI legal review completed</span>
                </div>
                <div className="flex items-center gap-2">
                  {state.currentContract.final_document_url ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">Final PDF generated</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Important
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                Once you finalize this contract, it will be sent to the other party for review and signature.
              </p>
              <p>
                All parties will receive email notifications and can track the signing progress.
              </p>
              <p>
                The contract becomes legally binding once all required signatures are collected.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={previousStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Add Parties
        </Button>

        <div className="flex gap-3">
          <Button 
            onClick={finalizeContract}
            disabled={state.loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {state.loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Finalize Contract
              </>
            )}
          </Button>

          <Button 
            onClick={sendForSignatures}
            disabled={state.loading || !state.recipientData.email}
            className="flex items-center gap-2"
          >
            {state.loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send for Signatures
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
