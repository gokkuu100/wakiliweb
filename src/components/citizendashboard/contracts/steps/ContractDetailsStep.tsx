/**
 * Contract Details Step - Step 3
 * Collects basic contract information after template selection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Save,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Bot,
  Sparkles,
  Info,
  Users
} from 'lucide-react';

import { useContractGeneration } from '../ContractGenerationContext';
import { contractsApi } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface ContractDetailsForm {
  title: string;
  description: string;
  contract_value: string;
  currency: string;
  effective_date: string;
  expiry_date: string;
  auto_renewal: boolean;
  renewal_period_months: string;
  governing_law: string;
  jurisdiction: string;
  special_requirements: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ContractDetailsStep() {
  const { 
    state, 
    dispatch, 
    nextStep, 
    previousStep,
    updateContractFormData,
    setError,
    setSuccess 
  } = useContractGeneration();

  const [formData, setFormData] = useState<ContractDetailsForm>({
    title: state.contractFormData?.title || '',
    description: state.contractFormData?.description || '',
    contract_value: state.contractFormData?.contract_value?.toString() || '',
    currency: 'KSH',
    effective_date: state.contractFormData?.start_date || '',
    expiry_date: state.contractFormData?.end_date || '',
    auto_renewal: state.contractFormData?.auto_renewal || false,
    renewal_period_months: '',
    governing_law: 'Laws of Kenya',
    jurisdiction: 'Kenya',
    special_requirements: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Contract title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title should be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Contract description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description should be at least 20 characters';
    }

    if (formData.contract_value && isNaN(Number(formData.contract_value))) {
      newErrors.contract_value = 'Please enter a valid amount';
    }

    if (!formData.effective_date) {
      newErrors.effective_date = 'Effective date is required';
    } else {
      const effectiveDate = new Date(formData.effective_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (effectiveDate < today) {
        newErrors.effective_date = 'Effective date cannot be in the past';
      }
    }

    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      const effectiveDate = new Date(formData.effective_date);
      
      if (expiryDate <= effectiveDate) {
        newErrors.expiry_date = 'Expiry date must be after effective date';
      }
    }

    if (formData.auto_renewal && !formData.renewal_period_months) {
      newErrors.renewal_period_months = 'Renewal period is required for auto-renewal contracts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof ContractDetailsForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSaveDraft = async () => {
    if (!state.selectedTemplate || !state.currentContract) return;

    setIsSaving(true);
    try {
      const contractData = {
        title: formData.title,
        description: formData.description,
        contract_value: formData.contract_value ? Number(formData.contract_value) : undefined,
        effective_date: formData.effective_date,
        expiry_date: formData.expiry_date || undefined,
        auto_renewal: formData.auto_renewal,
      };

      // Update the current contract
      await contractsApi.updateContract(state.currentContract.id, contractData);

      // Update form data in context
      updateContractFormData({
        title: formData.title,
        description: formData.description,
        contract_value: formData.contract_value ? Number(formData.contract_value) : undefined,
        start_date: formData.effective_date,
        end_date: formData.expiry_date || undefined,
        auto_renewal: formData.auto_renewal,
      });

      setSuccess('Contract details saved successfully!');

    } catch (error) {
      console.error('Error saving contract details:', error);
      setError('Failed to save contract details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await handleSaveDraft();
      
      // Update step in backend if current contract exists
      if (state.currentContract) {
        await contractsApi.updateContract(state.currentContract.id, {
          current_step: 4,
          status: 'mandatory_clauses_pending' as any
        });
      }

      nextStep();
    } catch (error) {
      console.error('Error proceeding to next step:', error);
      setError('Failed to proceed to next step. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    if (!state.selectedTemplate) return;

    setShowAISuggestions(true);
    try {
      // Set AI suggestions in the state
      dispatch({
        type: 'SET_AI_SUGGESTIONS',
        payload: [`Based on your ${state.selectedTemplate.name} template, I suggest including specific performance milestones and payment terms. Would you like me to help refine your contract details?`]
      });
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setError('Failed to generate AI suggestions.');
    }
  };

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    // Auto-save draft every 30 seconds if there are changes
    const autoSaveInterval = setInterval(() => {
      if (formData.title || formData.description) {
        handleSaveDraft();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [formData]);

  // =============================================================================
  // RENDER
  // =============================================================================

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Contract Details
        </h2>
        <p className="text-gray-600">
          Provide the essential details for your {state.selectedTemplate?.name} contract
        </p>
      </div>

      {/* Success/Error Messages */}
      {(state.success || state.error) && (
        <Alert className={`border-l-4 ${
          state.error ? 'border-red-500 bg-red-50' :
          state.success ? 'border-green-500 bg-green-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <Bot className="h-4 w-4" />
          <AlertDescription>{state.error || state.success}</AlertDescription>
        </Alert>
      )}

      {/* AI Suggestions */}
      {state.aiSuggestions.length > 0 && (
        <Alert className="border-l-4 border-blue-500 bg-blue-50">
          <Bot className="h-4 w-4" />
          <AlertDescription>{state.aiSuggestions[0]}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential contract identification and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Service Agreement with ABC Company"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Contract Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the purpose and scope of this contract..."
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Terms
              </CardTitle>
              <CardDescription>
                Contract value and payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_value">Contract Value</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => handleInputChange('contract_value', e.target.value)}
                    placeholder="0.00"
                    className={errors.contract_value ? 'border-red-500' : ''}
                  />
                  {errors.contract_value && (
                    <p className="text-red-500 text-sm mt-1">{errors.contract_value}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KSH">Kenyan Shilling (KSH)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Contract Timeline
              </CardTitle>
              <CardDescription>
                When the contract becomes effective and expires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effective_date">Effective Date *</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => handleInputChange('effective_date', e.target.value)}
                    min={today}
                    className={errors.effective_date ? 'border-red-500' : ''}
                  />
                  {errors.effective_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.effective_date}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                    min={formData.effective_date || today}
                    className={errors.expiry_date ? 'border-red-500' : ''}
                  />
                  {errors.expiry_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiry_date}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Leave blank for indefinite duration
                  </p>
                </div>
              </div>

              {/* Auto-renewal */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_renewal"
                  checked={formData.auto_renewal}
                  onCheckedChange={(checked) => handleInputChange('auto_renewal', checked)}
                />
                <Label htmlFor="auto_renewal">Enable automatic renewal</Label>
              </div>

              {formData.auto_renewal && (
                <div>
                  <Label htmlFor="renewal_period_months">Renewal Period (Months) *</Label>
                  <Input
                    id="renewal_period_months"
                    type="number"
                    value={formData.renewal_period_months}
                    onChange={(e) => handleInputChange('renewal_period_months', e.target.value)}
                    placeholder="12"
                    min="1"
                    max="60"
                    className={errors.renewal_period_months ? 'border-red-500' : ''}
                  />
                  {errors.renewal_period_months && (
                    <p className="text-red-500 text-sm mt-1">{errors.renewal_period_months}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legal Framework */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Legal Framework
              </CardTitle>
              <CardDescription>
                Governing law and jurisdiction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="governing_law">Governing Law</Label>
                  <select
                    id="governing_law"
                    value={formData.governing_law}
                    onChange={(e) => handleInputChange('governing_law', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Laws of Kenya">Laws of Kenya</option>
                    <option value="Laws of Uganda">Laws of Uganda</option>
                    <option value="Laws of Tanzania">Laws of Tanzania</option>
                    <option value="Laws of Rwanda">Laws of Rwanda</option>
                    <option value="International Commercial Law">International Commercial Law</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <select
                    id="jurisdiction"
                    value={formData.jurisdiction}
                    onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">{state.selectedTemplate?.name}</h4>
                  <p className="text-sm text-gray-600">{state.selectedTemplate?.description}</p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {state.selectedTemplate?.contract_type}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                onClick={generateAISuggestions}
                className="w-full"
                disabled={showAISuggestions}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Suggestions
              </Button>
              
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>AI will analyze your contract type and suggest optimal terms.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                  <p>All suggestions are based on Kenyan legal requirements.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contract Details</span>
                  <span>30%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Next: Mandatory Clauses Generation
                </p>
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
          Back to Template Selection
        </Button>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </Button>

          <Button 
            onClick={handleNext}
            disabled={isLoading || Object.keys(errors).length > 0}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Creating Contract...
              </>
            ) : (
              <>
                Generate Mandatory Clauses
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
