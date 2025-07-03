/**
 * Recipient Step - Step 6
 * Add second party and witness information
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
import { Switch } from '@/components/ui/switch';
import { 
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Send,
  Search,
  Plus,
  Eye,
  Trash2,
  UserCheck,
  Info,
  Clock
} from 'lucide-react';

import { useContractGeneration } from '../ContractGenerationContext';
import { contractsApi, witnessApi } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface RecipientForm {
  recipient_app_id: string;
  recipient_email: string;
  recipient_name: string;
  custom_message: string;
  auto_send: boolean;
}

interface WitnessForm {
  witness_app_id: string;
  witness_email: string;
  witness_name: string;
  witness_role: string;
  physical_presence_required: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RecipientStep() {
  const { 
    state, 
    dispatch, 
    nextStep, 
    previousStep,
    updateRecipientData,
    setError,
    setSuccess,
    setLoading
  } = useContractGeneration();

  const [recipientForm, setRecipientForm] = useState<RecipientForm>({
    recipient_app_id: state.recipientData.app_id || '',
    recipient_email: state.recipientData.email || '',
    recipient_name: state.recipientData.name || '',
    custom_message: '',
    auto_send: true
  });

  const [witnessForm, setWitnessForm] = useState<WitnessForm>({
    witness_app_id: '',
    witness_email: '',
    witness_name: '',
    witness_role: 'witness',
    physical_presence_required: false
  });

  const [showWitnessForm, setShowWitnessForm] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingContract, setSendingContract] = useState(false);
  const [invitingWitness, setInvitingWitness] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const validateRecipientForm = (): boolean => {
    if (!recipientForm.recipient_email && !recipientForm.recipient_app_id) {
      setError('Please provide recipient email or select a user');
      return false;
    }

    if (recipientForm.recipient_email && !isValidEmail(recipientForm.recipient_email)) {
      setError('Please provide a valid email address');
      return false;
    }

    if (!recipientForm.recipient_name.trim()) {
      setError('Please provide recipient name');
      return false;
    }

    return true;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleRecipientInputChange = (field: keyof RecipientForm, value: string | boolean) => {
    setRecipientForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Update context
    if (field === 'recipient_app_id' || field === 'recipient_email' || field === 'recipient_name') {
      updateRecipientData({
        app_id: field === 'recipient_app_id' ? value as string : recipientForm.recipient_app_id,
        email: field === 'recipient_email' ? value as string : recipientForm.recipient_email,
        name: field === 'recipient_name' ? value as string : recipientForm.recipient_name
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      // This would call a user search API
      // const results = await usersApi.searchUsers(query);
      // setUserSearchResults(results);
      
      // Mock results for now
      const mockResults = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          app_id: 'johndoe123',
          verified: true
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          app_id: 'janesmith456',
          verified: true
        }
      ].filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.app_id.toLowerCase().includes(query.toLowerCase())
      );

      setUserSearchResults(mockResults);

    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const selectUser = (user: any) => {
    setRecipientForm(prev => ({
      ...prev,
      recipient_app_id: user.app_id,
      recipient_email: user.email,
      recipient_name: user.name
    }));

    updateRecipientData({
      app_id: user.app_id,
      email: user.email,
      name: user.name
    });

    setUserSearchResults([]);
    setSearchQuery('');
  };

  const sendContractToRecipient = async () => {
    if (!validateRecipientForm() || !state.currentContract) return;

    setSendingContract(true);
    try {
      const result = await contractsApi.sendContract(state.currentContract.id, {
        recipient_app_id: recipientForm.recipient_app_id || undefined,
        recipient_email: recipientForm.recipient_email,
        message: recipientForm.custom_message || undefined
      });

      // Update contract with recipient
      await contractsApi.updateContract(state.currentContract.id, {
        recipient_user_id: recipientForm.recipient_app_id || undefined,
        status: 'pending_second_party' as any
      });

      setSuccess('Contract sent successfully to recipient!');

    } catch (error) {
      console.error('Error sending contract:', error);
      setError('Failed to send contract to recipient');
    } finally {
      setSendingContract(false);
    }
  };

  const addWitness = async () => {
    if (!state.currentContract) return;

    if (!witnessForm.witness_email && !witnessForm.witness_app_id) {
      setError('Please provide witness email or select a user');
      return;
    }

    if (!witnessForm.witness_name.trim()) {
      setError('Please provide witness name');
      return;
    }

    setInvitingWitness(true);
    try {
      const result = await witnessApi.inviteWitness({
        contract_id: state.currentContract.id,
        witness_app_id: witnessForm.witness_app_id || undefined,
        witness_email: witnessForm.witness_email,
        witness_name: witnessForm.witness_name,
        witness_role: witnessForm.witness_role
      });

      // Add witness to state
      dispatch({
        type: 'ADD_WITNESS',
        payload: {
          id: result.witness_id,
          contract_id: state.currentContract.id,
          witness_app_id: witnessForm.witness_app_id || undefined,
          witness_email: witnessForm.witness_email,
          witness_name: witnessForm.witness_name,
          witness_role: witnessForm.witness_role,
          status: 'invited',
          witness_type: 'voluntary',
          invited_by: 'current_user',
          invited_at: new Date().toISOString(),
          physical_presence_required: witnessForm.physical_presence_required,
          physical_presence_confirmed: false,
          witness_capacity_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });

      // Reset form
      setWitnessForm({
        witness_app_id: '',
        witness_email: '',
        witness_name: '',
        witness_role: 'witness',
        physical_presence_required: false
      });
      setShowWitnessForm(false);

      setSuccess('Witness invitation sent successfully!');

    } catch (error) {
      console.error('Error inviting witness:', error);
      setError('Failed to invite witness');
    } finally {
      setInvitingWitness(false);
    }
  };

  const removeWitness = async (witnessId: string) => {
    try {
      await witnessApi.removeWitness(witnessId, 'Removed by contract creator');
      
      // Remove from state
      const updatedWitnesses = state.witnesses.filter(w => w.id !== witnessId);
      dispatch({
        type: 'SET_WITNESSES',
        payload: updatedWitnesses
      });

      setSuccess('Witness removed successfully');

    } catch (error) {
      console.error('Error removing witness:', error);
      setError('Failed to remove witness');
    }
  };

  const handleNext = async () => {
    if (!validateRecipientForm()) return;

    try {
      setLoading(true);

      // Send contract if auto-send is enabled
      if (recipientForm.auto_send) {
        await sendContractToRecipient();
      }

      // Update contract step
      if (state.currentContract) {
        await contractsApi.updateContract(state.currentContract.id, {
          current_step: 7,
          status: recipientForm.auto_send ? 'pending_second_party' as any : 'ready_for_review' as any
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
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (searchQuery.length >= 3) {
      const debounceTimer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      setUserSearchResults([]);
    }
  }, [searchQuery]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add Contract Parties
        </h2>
        <p className="text-gray-600">
          Specify the other party and any required witnesses for your contract
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
          {/* Recipient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Second Party (Recipient)
              </CardTitle>
              <CardDescription>
                The other party who will receive and sign this contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Search */}
              <div>
                <Label htmlFor="user-search">Search Existing Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="user-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or app ID..."
                    className="pl-10"
                  />
                  {searchingUsers && (
                    <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Search Results */}
                {userSearchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-sm">
                    {userSearchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">ID: {user.app_id}</p>
                          </div>
                          {user.verified && (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center text-gray-500 text-sm">— or —</div>

              {/* Manual Entry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient_name">Recipient Name *</Label>
                  <Input
                    id="recipient_name"
                    value={recipientForm.recipient_name}
                    onChange={(e) => handleRecipientInputChange('recipient_name', e.target.value)}
                    placeholder="Full name of the other party"
                  />
                </div>

                <div>
                  <Label htmlFor="recipient_email">Email Address *</Label>
                  <Input
                    id="recipient_email"
                    type="email"
                    value={recipientForm.recipient_email}
                    onChange={(e) => handleRecipientInputChange('recipient_email', e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recipient_app_id">App ID (Optional)</Label>
                <Input
                  id="recipient_app_id"
                  value={recipientForm.recipient_app_id}
                  onChange={(e) => handleRecipientInputChange('recipient_app_id', e.target.value)}
                  placeholder="If they have an account on the platform"
                />
              </div>

              <div>
                <Label htmlFor="custom_message">Custom Message (Optional)</Label>
                <Textarea
                  id="custom_message"
                  value={recipientForm.custom_message}
                  onChange={(e) => handleRecipientInputChange('custom_message', e.target.value)}
                  placeholder="Add a personal message to accompany the contract..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_send"
                  checked={recipientForm.auto_send}
                  onCheckedChange={(checked) => handleRecipientInputChange('auto_send', checked)}
                />
                <Label htmlFor="auto_send">Send contract automatically to recipient</Label>
              </div>

              {!recipientForm.auto_send && (
                <Button onClick={sendContractToRecipient} disabled={sendingContract} className="w-full">
                  {sendingContract ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending Contract...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Contract to Recipient
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Witnesses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Witnesses (Optional)
              </CardTitle>
              <CardDescription>
                Add witnesses to provide additional legal validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Witnesses */}
              {state.witnesses.length > 0 && (
                <div className="space-y-3">
                  {state.witnesses.map((witness) => (
                    <div key={witness.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{witness.witness_name}</p>
                        <p className="text-sm text-gray-600">{witness.witness_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-xs">
                            {witness.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{witness.witness_role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {witness.status === 'confirmed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {witness.status === 'invited' && (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWitness(witness.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Witness Form */}
              {showWitnessForm ? (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="witness_name">Witness Name *</Label>
                      <Input
                        id="witness_name"
                        value={witnessForm.witness_name}
                        onChange={(e) => setWitnessForm(prev => ({ ...prev, witness_name: e.target.value }))}
                        placeholder="Full name of witness"
                      />
                    </div>

                    <div>
                      <Label htmlFor="witness_email">Email Address *</Label>
                      <Input
                        id="witness_email"
                        type="email"
                        value={witnessForm.witness_email}
                        onChange={(e) => setWitnessForm(prev => ({ ...prev, witness_email: e.target.value }))}
                        placeholder="witness@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="witness_app_id">App ID (Optional)</Label>
                      <Input
                        id="witness_app_id"
                        value={witnessForm.witness_app_id}
                        onChange={(e) => setWitnessForm(prev => ({ ...prev, witness_app_id: e.target.value }))}
                        placeholder="If they have an account"
                      />
                    </div>

                    <div>
                      <Label htmlFor="witness_role">Witness Role</Label>
                      <select
                        id="witness_role"
                        value={witnessForm.witness_role}
                        onChange={(e) => setWitnessForm(prev => ({ ...prev, witness_role: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="witness">General Witness</option>
                        <option value="notary">Notary Public</option>
                        <option value="legal_counsel">Legal Counsel</option>
                        <option value="expert_witness">Expert Witness</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="physical_presence_required"
                      checked={witnessForm.physical_presence_required}
                      onCheckedChange={(checked) => setWitnessForm(prev => ({ ...prev, physical_presence_required: checked }))}
                    />
                    <Label htmlFor="physical_presence_required">Physical presence required for signing</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addWitness} disabled={invitingWitness}>
                      {invitingWitness ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Inviting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Witness
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowWitnessForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowWitnessForm(true)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Witness
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mandatory Clauses</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Optional Clauses</span>
                  <Badge className="text-xs">{state.optionalClauses.length + state.customClauses.length} selected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recipient</span>
                  {(recipientForm.recipient_email || recipientForm.recipient_app_id) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Witnesses</span>
                  <span className="text-xs text-gray-600">{state.witnesses.length} added</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Legal Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Witnesses:</strong> While not always required, witnesses provide additional legal protection.
              </p>
              <p>
                <strong>Email Verification:</strong> All parties will receive email verification before signing.
              </p>
              <p>
                <strong>Digital Signatures:</strong> Legally binding digital signatures will be collected from all parties.
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
          Back to Optional Clauses
        </Button>

        <Button 
          onClick={handleNext}
          disabled={state.loading || !recipientForm.recipient_email}
          className="flex items-center gap-2"
        >
          {state.loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Final Review
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
