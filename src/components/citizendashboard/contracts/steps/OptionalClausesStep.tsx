/**
 * Optional Clauses Step - Step 5
 * User selects and customizes optional contract clauses
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus,
  CheckCircle,
  Edit3,
  Save,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Bot,
  Sparkles,
  Trash2,
  Eye,
  MessageSquare,
  FileText,
  PlusCircle,
  Info,
  Search,
  Filter
} from 'lucide-react';

import { useContractGeneration } from '../ContractGenerationContext';
import { clausesApi, contractsApi, ContractClause } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface OptionalClauseTemplate {
  key: string;
  name: string;
  description: string;
  category: string;
  risk_level: 'low' | 'medium' | 'high';
  recommended: boolean;
}

interface CustomClauseForm {
  clause_name: string;
  user_requirements: string;
  clause_type: 'optional' | 'custom';
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function OptionalClausesStep() {
  const { 
    state, 
    dispatch, 
    nextStep, 
    previousStep,
    setError,
    setSuccess,
    setLoading
  } = useContractGeneration();

  const [availableOptionalClauses, setAvailableOptionalClauses] = useState<OptionalClauseTemplate[]>([]);
  const [selectedOptionalClauses, setSelectedOptionalClauses] = useState<Set<string>>(new Set());
  const [generatingClauses, setGeneratingClauses] = useState<Set<string>>(new Set());
  const [editingClause, setEditingClause] = useState<string | null>(null);
  const [showCustomClauseForm, setShowCustomClauseForm] = useState(false);
  const [customClauseForm, setCustomClauseForm] = useState<CustomClauseForm>({
    clause_name: '',
    user_requirements: '',
    clause_type: 'custom'
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (state.selectedTemplate) {
      loadAvailableOptionalClauses();
    }
  }, [state.selectedTemplate]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadAvailableOptionalClauses = () => {
    if (!state.selectedTemplate?.optional_clauses) return;

    const clauses: OptionalClauseTemplate[] = Object.entries(state.selectedTemplate.optional_clauses).map(([key, info]: [string, any]) => ({
      key,
      name: info.name || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: info.description || 'Optional clause for enhanced contract protection',
      category: info.category || 'general',
      risk_level: info.risk_level || 'medium',
      recommended: info.recommended || false
    }));

    setAvailableOptionalClauses(clauses);
  };

  const toggleOptionalClause = async (clauseKey: string) => {
    if (!state.currentContract) return;

    const isSelected = selectedOptionalClauses.has(clauseKey);
    
    if (isSelected) {
      // Remove clause
      const newSelected = new Set(selectedOptionalClauses);
      newSelected.delete(clauseKey);
      setSelectedOptionalClauses(newSelected);
      
      // Remove from state clauses if it exists
      const updatedClauses = state.contractClauses.filter(c => c.clause_key !== clauseKey);
      dispatch({
        type: 'SET_CONTRACT_CLAUSES',
        payload: updatedClauses
      });
      
    } else {
      // Add clause
      const newSelected = new Set(selectedOptionalClauses);
      newSelected.add(clauseKey);
      setSelectedOptionalClauses(newSelected);
      
      // Generate the clause
      await generateOptionalClause(clauseKey);
    }
  };

  const generateOptionalClause = async (clauseKey: string) => {
    if (!state.currentContract) return;

    setGeneratingClauses(prev => new Set([...prev, clauseKey]));

    try {
      const result = await clausesApi.generateClause({
        contract_id: state.currentContract.id,
        clause_key: clauseKey,
        user_input: state.userInput,
        additional_requirements: state.contractFormData.description
      });

      // Add to state
      const updatedClauses = [...state.contractClauses, result.clause];
      dispatch({
        type: 'SET_CONTRACT_CLAUSES',
        payload: updatedClauses
      });

      // Update AI usage
      dispatch({
        type: 'UPDATE_AI_USAGE',
        payload: {
          tokens: 75, // Estimate
          cost: 0.008 // Estimate
        }
      });

      setSuccess(`${result.clause.clause_name} clause generated successfully!`);

    } catch (error) {
      console.error(`Error generating optional clause ${clauseKey}:`, error);
      setError(`Failed to generate ${clauseKey} clause`);
      
      // Remove from selected
      const newSelected = new Set(selectedOptionalClauses);
      newSelected.delete(clauseKey);
      setSelectedOptionalClauses(newSelected);
      
    } finally {
      setGeneratingClauses(prev => {
        const newSet = new Set(prev);
        newSet.delete(clauseKey);
        return newSet;
      });
    }
  };

  const addCustomClause = async () => {
    if (!state.currentContract || !customClauseForm.clause_name || !customClauseForm.user_requirements) {
      setError('Please provide both clause name and requirements');
      return;
    }

    try {
      const customClause = await clausesApi.addCustomClause(state.currentContract.id, {
        clause_name: customClauseForm.clause_name,
        user_requirements: customClauseForm.user_requirements,
        clause_type: customClauseForm.clause_type
      });

      // Add to state
      const updatedClauses = [...state.contractClauses, customClause];
      dispatch({
        type: 'SET_CONTRACT_CLAUSES',
        payload: updatedClauses
      });

      // Reset form
      setCustomClauseForm({
        clause_name: '',
        user_requirements: '',
        clause_type: 'custom'
      });
      setShowCustomClauseForm(false);

      setSuccess('Custom clause added successfully!');

    } catch (error) {
      console.error('Error adding custom clause:', error);
      setError('Failed to add custom clause. Please try again.');
    }
  };

  const approveOptionalClause = async (clauseId: string) => {
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

      setSuccess('Optional clause approved!');

    } catch (error) {
      console.error('Error approving clause:', error);
      setError('Failed to approve clause. Please try again.');
    }
  };

  const removeOptionalClause = async (clauseId: string, clauseKey: string) => {
    try {
      // Remove from backend (if needed)
      // await clausesApi.removeClause(clauseId);
      
      // Remove from state
      const updatedClauses = state.contractClauses.filter(c => c.id !== clauseId);
      dispatch({
        type: 'SET_CONTRACT_CLAUSES',
        payload: updatedClauses
      });

      // Remove from selected
      const newSelected = new Set(selectedOptionalClauses);
      newSelected.delete(clauseKey);
      setSelectedOptionalClauses(newSelected);

      setSuccess('Optional clause removed');

    } catch (error) {
      console.error('Error removing clause:', error);
      setError('Failed to remove clause. Please try again.');
    }
  };

  const handleNext = async () => {
    try {
      setLoading(true);

      // Update contract step
      if (state.currentContract) {
        await contractsApi.updateContract(state.currentContract.id, {
          current_step: 6,
          status: 'pending_second_party' as any,
          optional_clauses_selected: state.optionalClauses.length + state.customClauses.length
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

  const filteredOptionalClauses = availableOptionalClauses.filter(clause => {
    const matchesSearch = clause.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         clause.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || clause.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getClauseByKey = (clauseKey: string) => {
    return state.contractClauses.find(c => c.clause_key === clauseKey);
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const categories = [...new Set(availableOptionalClauses.map(c => c.category))];

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Optional Clauses
        </h2>
        <p className="text-gray-600">
          Enhance your contract with additional protective clauses
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Optional Enhancements</span>
            </div>
            <span className="text-sm text-gray-600">
              {selectedOptionalClauses.size} clauses selected
            </span>
          </div>
          
          <p className="text-sm text-gray-600">
            Optional clauses provide additional protection and clarity but are not required for contract validity.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Optional Clauses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Available Optional Clauses</CardTitle>
              <CardDescription>
                Select additional clauses to strengthen your contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Clauses</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search by name or description..."
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optional Clauses List */}
          <div className="space-y-4">
            {filteredOptionalClauses.map((clause) => {
              const isSelected = selectedOptionalClauses.has(clause.key);
              const isGenerating = generatingClauses.has(clause.key);
              const generatedClause = getClauseByKey(clause.key);

              return (
                <Card key={clause.key} className={`transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-blue-200' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOptionalClause(clause.key)}
                          disabled={isGenerating}
                          className="mt-1"
                        />
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{clause.name}</CardTitle>
                            {clause.recommended && (
                              <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>
                            )}
                            {getRiskBadge(clause.risk_level)}
                          </div>
                          <CardDescription>{clause.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {(isSelected && generatedClause) && (
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {generatedClause.current_content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingClause(generatedClause.id)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeOptionalClause(generatedClause.id, clause.key)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>

                        {!generatedClause.approved_by_first_party && (
                          <Button 
                            onClick={() => approveOptionalClause(generatedClause.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}

                  {isGenerating && (
                    <CardContent>
                      <Alert className="border-l-4 border-blue-500 bg-blue-50">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                          Generating {clause.name} clause...
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Custom Clause Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Custom Clause
              </CardTitle>
              <CardDescription>
                Create a custom clause tailored to your specific needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showCustomClauseForm ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clause_name">Clause Name</Label>
                    <Input
                      id="clause_name"
                      value={customClauseForm.clause_name}
                      onChange={(e) => setCustomClauseForm(prev => ({ ...prev, clause_name: e.target.value }))}
                      placeholder="e.g., Force Majeure, Confidentiality, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="user_requirements">Requirements & Description</Label>
                    <Textarea
                      id="user_requirements"
                      value={customClauseForm.user_requirements}
                      onChange={(e) => setCustomClauseForm(prev => ({ ...prev, user_requirements: e.target.value }))}
                      placeholder="Describe what this clause should cover and any specific requirements..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addCustomClause}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Custom Clause
                    </Button>
                    <Button variant="outline" onClick={() => setShowCustomClauseForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowCustomClauseForm(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Clause
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Selected Clauses */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selected Clauses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {state.optionalClauses.map((clause) => (
                  <div key={clause.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{clause.clause_name}</p>
                      <p className="text-xs text-gray-600">
                        {clause.approved_by_first_party ? 'Approved' : 'Pending Approval'}
                      </p>
                    </div>
                    {clause.approved_by_first_party && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}

                {state.customClauses.map((clause) => (
                  <div key={clause.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{clause.clause_name}</p>
                      <p className="text-xs text-blue-600">Custom Clause</p>
                    </div>
                    {clause.approved_by_first_party && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}

                {(state.optionalClauses.length === 0 && state.customClauses.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No optional clauses selected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Clause Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="space-y-2">
                <p><strong>Recommended:</strong> Clauses suggested for your contract type</p>
                <p><strong>Risk Level:</strong> Impact assessment of clause inclusion</p>
                <p><strong>Custom:</strong> Tailored clauses for specific needs</p>
              </div>
              <p className="text-xs">
                All optional clauses are designed to provide additional protection while maintaining contract clarity.
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
          Back to Mandatory Clauses
        </Button>

        <Button 
          onClick={handleNext}
          disabled={state.loading}
          className="flex items-center gap-2"
        >
          {state.loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving Progress...
            </>
          ) : (
            <>
              Add Recipient
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
