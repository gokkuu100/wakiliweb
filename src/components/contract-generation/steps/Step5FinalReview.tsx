'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';
import { 
  Check, 
  AlertCircle, 
  FileText,
  Download,
  Share,
  Eye,
  CheckCircle,
  Scale,
  Flag,
  Loader2,
  Save
} from 'lucide-react';

import { 
  Step5Data, 
  ContractSession, 
  ContractPreview
} from '../types';

interface Step5FinalReviewProps {
  data: Step5Data;
  session: ContractSession | null;
  onComplete: (data: Step5Data) => void;
  onSessionUpdated: (session: ContractSession) => void;
  loading: boolean;
}

export default function Step5FinalReview({ 
  data, 
  session,
  onComplete, 
  onSessionUpdated,
  loading: parentLoading 
}: Step5FinalReviewProps) {
  const [contractPreview, setContractPreview] = useState<ContractPreview>(data.contract_preview);
  const [analyzing, setAnalyzing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewGenerated, setPreviewGenerated] = useState(false);

  useEffect(() => {
    if (!previewGenerated && session) {
      generateContractPreview();
    }
  }, [session, previewGenerated]);

  const generateContractPreview = async () => {
    if (!session) return;

    try {
      setAnalyzing(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session.id}/generate-preview`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate contract preview');
      }

      const result = await response.json();
      
      if (result.contract_preview) {
        setContractPreview(result.contract_preview);
        setPreviewGenerated(true);
      }

    } catch (error) {
      console.error('Error generating contract preview:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate contract preview');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCompleteContract = async () => {
    if (!session) {
      setError('No active session found');
      return;
    }

    try {
      setCompleting(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          final_review_data: {
            contract_preview: contractPreview,
            completion_timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete contract');
      }

      const result = await response.json();
      
      // Update session
      if (result.contract_session) {
        onSessionUpdated(result.contract_session);
      }

      // Complete step
      const stepData: Step5Data = {
        contract_preview: contractPreview,
        final_contract: result.final_contract
      };

      onComplete(stepData);

    } catch (error) {
      console.error('Error completing contract:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete contract');
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadContract = async () => {
    if (!session) return;

    try {
      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session.id}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download contract');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `contract_${session.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading contract:', error);
      setError('Failed to download contract');
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Review</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Contract Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <span>Legal Compliance Analysis</span>
          </CardTitle>
          <p className="text-gray-600">
            AI analysis of your contract for legal compliance and risk assessment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {analyzing ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-gray-600">Analyzing contract for legal compliance...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legal Compliance Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-900">Legal Compliance</div>
                      <div className={`text-2xl font-bold ${getComplianceColor(contractPreview.legal_compliance_score || 0)}`}>
                        {Math.round(contractPreview.legal_compliance_score || 0)}%
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <Progress 
                    value={contractPreview.legal_compliance_score || 0} 
                    className="mt-2" 
                  />
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-900">Kenyan Law</div>
                      <div className="text-2xl font-bold text-green-600">
                        {contractPreview.kenyan_law_compliance ? 'Compliant' : 'Review Needed'}
                      </div>
                    </div>
                    <Flag className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2">
                    {contractPreview.kenyan_law_compliance ? (
                      <Badge className="bg-green-100 text-green-800">✓ Compliant</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">⚠ Review Required</Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-purple-900">Overall Rating</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {getComplianceBadge(contractPreview.legal_compliance_score || 0)}
                      </div>
                    </div>
                    <Eye className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              {contractPreview.risk_assessment && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Risk Assessment:</strong> 
                    {typeof contractPreview.risk_assessment === 'string' 
                      ? contractPreview.risk_assessment 
                      : 'Contract appears to have acceptable risk levels for the intended use case.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Contract Preview</span>
          </CardTitle>
          <p className="text-gray-600">
            Review your complete contract before finalizing
          </p>
        </CardHeader>
        <CardContent>
          {contractPreview.html_content ? (
            <div className="space-y-4">
              <div 
                className="border rounded-lg p-6 bg-white max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: contractPreview.html_content }}
              />
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Contract generated with AI assistance
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadContract}
                    disabled={completing || parentLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    disabled={completing || parentLoading}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <FileText className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-600">Contract preview will be generated automatically</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Summary */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Template Used:</span> {session.contract_type}
              </div>
              <div>
                <span className="font-medium">Session ID:</span> {session.id.slice(0, 8)}...
              </div>
              <div>
                <span className="font-medium">Current Stage:</span> {session.current_stage_name}
              </div>
              <div>
                <span className="font-medium">Progress:</span> {Math.round(parseFloat(session.completion_percentage || '0'))}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Completion Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to Complete Your Contract?</h3>
              <p className="text-gray-600 mb-4">
                Once completed, your contract will be saved and ready for signing and execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewGenerated(false)}
                disabled={completing || parentLoading || analyzing}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Regenerate Preview
              </Button>

              <Button
                onClick={handleCompleteContract}
                disabled={completing || parentLoading || analyzing || !contractPreview.html_content}
                className="w-full"
                size="lg"
              >
                {completing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Completing Contract...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Complete Contract
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                By completing this contract, you confirm that you have reviewed all terms and conditions.
                The contract will be legally binding once signed by all parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
