/**
 * Signature Step - Step 8
 * Digital signature collection and contract execution
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  PenTool,
  CheckCircle,
  Clock,
  Download,
  Send,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Shield,
  Users,
  FileText,
  Mail,
  Calendar,
  Star,
  Share2,
  Copy,
  ExternalLink,
  PartyPopper,
  Eye,
  Award,
  Fingerprint
} from 'lucide-react';

import { useContractGeneration } from '../ContractGenerationContext';
import { contractsApi, contractUtils, ContractStatus } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface SignatureData {
  signer_type: 'first_party' | 'second_party' | 'witness';
  signature_method: string;
  capacity: string;
  signature_statement: string;
}

interface ContractProgress {
  first_party_signed: boolean;
  second_party_signed: boolean;
  witnesses_signed: number;
  total_witnesses: number;
  completion_percentage: number;
  next_action: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SignatureStep() {
  const { 
    state, 
    dispatch, 
    previousStep,
    setError,
    setSuccess,
    setLoading
  } = useContractGeneration();

  const [signatureData, setSignatureData] = useState<SignatureData>({
    signer_type: 'first_party',
    signature_method: 'digital',
    capacity: 'individual',
    signature_statement: 'I agree to the terms and conditions outlined in this contract and sign it willingly.'
  });

  const [contractProgress, setContractProgress] = useState<ContractProgress>({
    first_party_signed: false,
    second_party_signed: false,
    witnesses_signed: 0,
    total_witnesses: 0,
    completion_percentage: 0,
    next_action: 'sign_first_party'
  });

  const [signing, setSigning] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sharingContract, setSharingContract] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [contractURL, setContractURL] = useState('');

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    updateContractProgress();
    generateContractURL();
  }, [state.currentContract, state.witnesses]);

  useEffect(() => {
    // Check if contract is fully signed
    if (contractProgress.completion_percentage === 100) {
      setShowSuccessAnimation(true);
      setSuccess('🎉 Contract fully executed! All parties have signed.');
    }
  }, [contractProgress.completion_percentage]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const updateContractProgress = () => {
    if (!state.currentContract) return;

    const firstPartySigned = state.currentContract.status === ContractStatus.PARTIALLY_SIGNED || 
                            state.currentContract.status === ContractStatus.FULLY_SIGNED;
    
    const secondPartySigned = state.currentContract.status === ContractStatus.FULLY_SIGNED;
    
    const witnessesSigned = state.witnesses.filter(w => w.status === 'confirmed').length;
    const totalWitnesses = state.witnesses.length;

    let completionPercentage = 0;
    let nextAction = 'sign_first_party';

    if (firstPartySigned) {
      completionPercentage += 50;
      nextAction = 'awaiting_second_party';
    }
    
    if (secondPartySigned) {
      completionPercentage += 40;
      nextAction = totalWitnesses > 0 ? 'awaiting_witnesses' : 'completed';
    }
    
    if (totalWitnesses > 0) {
      completionPercentage += (witnessesSigned / totalWitnesses) * 10;
      if (witnessesSigned === totalWitnesses && secondPartySigned) {
        nextAction = 'completed';
      }
    } else if (secondPartySigned) {
      completionPercentage = 100;
      nextAction = 'completed';
    }

    setContractProgress({
      first_party_signed: firstPartySigned,
      second_party_signed: secondPartySigned,
      witnesses_signed: witnessesSigned,
      total_witnesses: totalWitnesses,
      completion_percentage: Math.round(completionPercentage),
      next_action: nextAction
    });
  };

  const generateContractURL = () => {
    if (state.currentContract) {
      const baseURL = window.location.origin;
      const url = `${baseURL}/contracts/${state.currentContract.id}/sign`;
      setContractURL(url);
    }
  };

  const signContract = async () => {
    if (!state.currentContract) return;

    setSigning(true);
    try {
      const result = await contractsApi.signContract(state.currentContract.id, {
        contract_id: state.currentContract.id,
        signer_type: signatureData.signer_type,
        signature_method: signatureData.signature_method,
        capacity: signatureData.capacity
      });

      // Update contract in state
      dispatch({
        type: 'SET_CURRENT_CONTRACT',
        payload: {
          ...state.currentContract,
          status: result.contract_status
        }
      });

      setSuccess('Contract signed successfully!');
      updateContractProgress();

    } catch (error) {
      console.error('Error signing contract:', error);
      setError('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const downloadFinalPDF = async () => {
    if (!state.currentContract || !state.currentContract.final_document_url) return;

    setDownloadingPDF(true);
    try {
      const response = await fetch(state.currentContract.final_document_url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state.currentContract.contract_number}_signed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('Contract PDF downloaded successfully!');

    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download contract PDF.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const shareContractURL = async () => {
    setSharingContract(true);
    try {
      await navigator.clipboard.writeText(contractURL);
      setSuccess('Contract URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying URL:', error);
      setError('Failed to copy URL. Please copy manually.');
    } finally {
      setSharingContract(false);
    }
  };

  const resendToParty = async () => {
    if (!state.currentContract || !state.recipientData.email) return;

    try {
      setLoading(true);
      
      await contractsApi.sendContract(state.currentContract.id, {
        recipient_email: state.recipientData.email,
        recipient_app_id: state.recipientData.app_id,
        message: 'Reminder: Please review and sign the contract when ready.'
      });

      setSuccess('Reminder sent to the other party!');

    } catch (error) {
      console.error('Error resending contract:', error);
      setError('Failed to send reminder.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getStatusIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <Clock className="h-5 w-5 text-yellow-600" />
    );
  };

  const getNextActionMessage = () => {
    switch (contractProgress.next_action) {
      case 'sign_first_party':
        return 'You need to sign the contract first';
      case 'awaiting_second_party':
        return 'Waiting for the other party to sign';
      case 'awaiting_witnesses':
        return 'Waiting for witness confirmations';
      case 'completed':
        return 'Contract is fully executed!';
      default:
        return 'Processing...';
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (!state.currentContract) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading contract...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {contractProgress.completion_percentage === 100 ? (
            <>
              <PartyPopper className="inline h-6 w-6 mr-2 text-yellow-500" />
              Contract Executed!
            </>
          ) : (
            'Sign & Execute Contract'
          )}
        </h2>
        <p className="text-gray-600">
          {contractProgress.completion_percentage === 100 
            ? 'Your contract has been fully signed and is now legally binding'
            : 'Collect digital signatures from all parties to execute the contract'
          }
        </p>
      </div>

      {/* Success Animation */}
      {showSuccessAnimation && contractProgress.completion_percentage === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <Award className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Contract Successfully Executed!
            </h3>
            <p className="text-green-700 mb-4">
              All parties have signed. Your contract is now legally binding and active.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={downloadFinalPDF} disabled={downloadingPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download Signed Contract
              </Button>
              <Button variant="outline" onClick={() => setShowSuccessAnimation(false)}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success/Error Messages */}
      {(state.success || state.error) && !showSuccessAnimation && (
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
          {/* Signature Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Signature Progress
              </CardTitle>
              <CardDescription>
                Track the signing status of all parties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{contractProgress.completion_percentage}% Complete</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${contractProgress.completion_percentage}%` }}
                ></div>
              </div>

              <p className="text-sm text-gray-600 text-center mt-2">
                {getNextActionMessage()}
              </p>

              {/* Individual Party Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">First Party (You)</h4>
                    {getStatusIcon(contractProgress.first_party_signed)}
                  </div>
                  <p className="text-sm text-gray-600">Contract Creator</p>
                  {contractProgress.first_party_signed ? (
                    <Badge className="bg-green-100 text-green-800 mt-2">Signed</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 mt-2">Pending</Badge>
                  )}
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Second Party</h4>
                    {getStatusIcon(contractProgress.second_party_signed)}
                  </div>
                  <p className="text-sm text-gray-600">{state.recipientData.name}</p>
                  {contractProgress.second_party_signed ? (
                    <Badge className="bg-green-100 text-green-800 mt-2">Signed</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 mt-2">
                      {contractProgress.first_party_signed ? 'Invited' : 'Waiting'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Witnesses Status */}
              {state.witnesses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Witnesses ({contractProgress.witnesses_signed}/{contractProgress.total_witnesses} confirmed)
                  </h4>
                  <div className="space-y-2">
                    {state.witnesses.map((witness) => (
                      <div key={witness.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{witness.witness_name}</p>
                          <p className="text-xs text-gray-600">{witness.witness_role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(witness.status === 'confirmed')}
                          <Badge className={`text-xs ${
                            witness.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            witness.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {witness.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Form */}
          {!contractProgress.first_party_signed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Your Digital Signature
                </CardTitle>
                <CardDescription>
                  Sign the contract to begin the execution process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="signature_method">Signature Method</Label>
                    <select
                      id="signature_method"
                      value={signatureData.signature_method}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, signature_method: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="digital">Digital Signature</option>
                      <option value="electronic">Electronic Signature</option>
                      <option value="biometric">Biometric Signature</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="capacity">Signing Capacity</Label>
                    <select
                      id="capacity"
                      value={signatureData.capacity}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, capacity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="individual">Individual</option>
                      <option value="company_representative">Company Representative</option>
                      <option value="authorized_agent">Authorized Agent</option>
                      <option value="legal_guardian">Legal Guardian</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="signature_statement">Signature Statement</Label>
                  <Textarea
                    id="signature_statement"
                    value={signatureData.signature_statement}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, signature_statement: e.target.value }))}
                    rows={3}
                    placeholder="I hereby agree to the terms and conditions..."
                  />
                </div>

                <Alert className="border-l-4 border-blue-500 bg-blue-50">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    By signing this contract, you agree to be legally bound by all terms and conditions outlined within.
                    Your digital signature has the same legal validity as a handwritten signature.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={signContract} 
                  disabled={signing}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {signing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Signing Contract...
                    </>
                  ) : (
                    <>
                      <PenTool className="h-4 w-4 mr-2" />
                      Sign Contract
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Contract Sharing */}
          {contractProgress.first_party_signed && !contractProgress.second_party_signed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share with Other Party
                </CardTitle>
                <CardDescription>
                  Send the contract link to the other party for signing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contract-url">Contract Signing URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="contract-url"
                      value={contractURL}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      onClick={shareContractURL} 
                      disabled={sharingContract}
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={resendToParty} disabled={state.loading} variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                  
                  <Button 
                    onClick={() => window.open(contractURL, '_blank')}
                    variant="outline"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Signing Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Contract Number</p>
                <p className="font-medium">{state.currentContract.contract_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Template</p>
                <p className="font-medium">{state.selectedTemplate?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Value</p>
                <p className="font-medium">
                  {contractUtils.formatContractValue(
                    state.currentContract.contract_value,
                    state.currentContract.currency
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className="mt-1">
                  {contractUtils.getStatusInfo(state.currentContract.status).label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={downloadFinalPDF} 
                disabled={downloadingPDF || !state.currentContract.final_document_url}
                variant="outline" 
                className="w-full"
              >
                {downloadingPDF ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>

              <Button 
                onClick={() => state.currentContract && window.open(`/contracts/${state.currentContract.id}`, '_blank')}
                variant="outline" 
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Contract
              </Button>

              {contractProgress.completion_percentage === 100 && (
                <Button 
                  onClick={() => window.location.href = '/citizen/contracts'}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Go to My Contracts
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Signing Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 ${contractProgress.first_party_signed ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${contractProgress.first_party_signed ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">First party signed</span>
                </div>
                
                <div className={`flex items-center gap-3 ${contractProgress.second_party_signed ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${contractProgress.second_party_signed ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Second party signed</span>
                </div>
                
                {state.witnesses.length > 0 && (
                  <div className={`flex items-center gap-3 ${contractProgress.witnesses_signed === contractProgress.total_witnesses ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full ${contractProgress.witnesses_signed === contractProgress.total_witnesses ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">All witnesses confirmed</span>
                  </div>
                )}
                
                <div className={`flex items-center gap-3 ${contractProgress.completion_percentage === 100 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${contractProgress.completion_percentage === 100 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Contract executed</span>
                </div>
              </div>
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
          Back to Final Review
        </Button>

        {contractProgress.completion_percentage === 100 && (
          <Button 
            onClick={() => window.location.href = '/citizen/contracts'}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View All Contracts
          </Button>
        )}
      </div>
    </div>
  );
}
