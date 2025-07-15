'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';
import { 
  Check, 
  X, 
  Plus,
  Trash2,
  AlertCircle, 
  Loader2, 
  FileText,
  Sparkles,
  Settings
} from 'lucide-react';

import { 
  Step4Data, 
  ContractSession, 
  ContractClause, 
  CustomClause,
  CustomClauseGenerationRequest
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
  const [customClauses, setCustomClauses] = useState<CustomClause[]>(data.custom_clauses || []);
  const [selectedOptionalClauses, setSelectedOptionalClauses] = useState<string[]>(data.selected_optional_clauses || []);
  
  const [newCustomClauses, setNewCustomClauses] = useState<Array<{title: string, description: string}>>([
    { title: '', description: '' }
  ]);
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionalClauseToggle = (clauseId: string) => {
    if (selectedOptionalClauses.includes(clauseId)) {
      setSelectedOptionalClauses(selectedOptionalClauses.filter(id => id !== clauseId));
    } else {
      setSelectedOptionalClauses([...selectedOptionalClauses, clauseId]);
    }
  };

  const handleOptionalClauseEdit = (clauseId: string, newContent: string) => {
    const updatedClauses = optionalClauses.map(clause => 
      clause.clause_id === clauseId 
        ? { ...clause, content: newContent }
        : clause
    );
    setOptionalClauses(updatedClauses);
  };

  const handleCustomClauseApproval = (customClauseId: string, approved: boolean) => {
    const updatedCustomClauses = customClauses.map(clause => 
      clause.id === customClauseId 
        ? { ...clause, status: (approved ? 'approved' : 'rejected') as 'approved' | 'rejected' }
        : clause
    );
    setCustomClauses(updatedCustomClauses);
  };

  const addNewCustomClause = () => {
    if (newCustomClauses.length < 4) {
      setNewCustomClauses([...newCustomClauses, { title: '', description: '' }]);
    }
  };

  const removeNewCustomClause = (index: number) => {
    if (newCustomClauses.length > 1) {
      const updated = newCustomClauses.filter((_, i) => i !== index);
      setNewCustomClauses(updated);
    }
  };

  const updateNewCustomClause = (index: number, field: 'title' | 'description', value: string) => {
    const updated = newCustomClauses.map((clause, i) => 
      i === index ? { ...clause, [field]: value } : clause
    );
    setNewCustomClauses(updated);
  };

  const handleGenerateCustomClauses = async () => {
    const validClauses = newCustomClauses.filter(clause => 
      clause.title.trim() && clause.description.trim()
    );

    if (validClauses.length === 0) {
      setError('Please provide at least one custom clause with title and description');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const requestData: CustomClauseGenerationRequest = {
        custom_clauses: validClauses
      };

      const response = await makeAuthenticatedRequest(`/api/contract-generation/sessions/${session?.id}/generate-custom-clauses`, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate custom clauses');
      }

      const result = await response.json();
      
      if (result.generated_clauses) {
        const newCustomClauses: CustomClause[] = result.generated_clauses.map((clause: any, index: number) => ({
          id: `custom_${Date.now()}_${index}`,
          title: clause.title,
          description: clause.description,
          ai_generated_content: clause.content,
          status: 'pending' as const
        }));
        
        setCustomClauses([...customClauses, ...newCustomClauses]);
        
        // Reset the new clause inputs
        setNewCustomClauses([{ title: '', description: '' }]);
      }

    } catch (error) {
      console.error('Error generating custom clauses:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate custom clauses');
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = () => {
    const stepData: Step4Data = {
      optional_clauses: optionalClauses,
      custom_clauses: customClauses,
      selected_optional_clauses: selectedOptionalClauses
    };

    onComplete(stepData);
  };

  const totalSelectedClauses = selectedOptionalClauses.length + customClauses.filter(c => c.status === 'approved').length;

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
          {optionalClauses.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No optional clauses are available for this contract template.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {optionalClauses.map((clause) => {
                const isSelected = selectedOptionalClauses.includes(clause.clause_id);
                
                return (
                  <div
                    key={clause.clause_id}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center space-x-2">
                          <span>{clause.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-green-600" />}
                        </h4>
                        <Badge variant="secondary" className="mt-1">
                          Optional
                        </Badge>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleOptionalClauseToggle(clause.clause_id)}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Selected
                            </>
                          ) : (
                            'Select'
                          )}
                        </Button>
                        
                        {isSelected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOptionalClauseToggle(clause.clause_id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Textarea
                      value={clause.content}
                      onChange={(e) => handleOptionalClauseEdit(clause.clause_id, e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                      disabled={!isSelected}
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

      {/* Custom Clauses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Custom Clauses</span>
          </CardTitle>
          <p className="text-gray-600">
            Add up to 4 custom clauses specific to your needs. Our AI will generate legally sound content.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Custom Clause Input */}
          <div className="space-y-4">
            <h4 className="font-medium">Add New Custom Clauses</h4>
            
            {newCustomClauses.map((clause, index) => (
              <div key={index} className="p-4 border border-dashed border-gray-300 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">Custom Clause {index + 1}</h5>
                  {newCustomClauses.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewCustomClause(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`title-${index}`}>Clause Title</Label>
                  <Input
                    id={`title-${index}`}
                    placeholder="e.g., Data Protection Clause"
                    value={clause.title}
                    onChange={(e) => updateNewCustomClause(index, 'title', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    placeholder="Describe what this clause should cover..."
                    value={clause.description}
                    onChange={(e) => updateNewCustomClause(index, 'description', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={addNewCustomClause}
                disabled={newCustomClauses.length >= 4}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Clause ({newCustomClauses.length}/4)</span>
              </Button>

              <Button
                onClick={handleGenerateCustomClauses}
                disabled={generating || parentLoading}
                className="flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Clauses</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Generated Custom Clauses */}
          {customClauses.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Generated Custom Clauses</h4>
              
              {customClauses.map((clause) => (
                <div
                  key={clause.id}
                  className={`border rounded-lg p-4 ${
                    clause.status === 'approved' ? 'border-green-500 bg-green-50' : 
                    clause.status === 'rejected' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium">{clause.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCustomClauseApproval(clause.id, false)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCustomClauseApproval(clause.id, true)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {clause.ai_generated_content && (
                    <Textarea
                      value={clause.ai_generated_content}
                      readOnly
                      rows={4}
                      className="font-mono text-sm bg-gray-50"
                    />
                  )}

                  <Badge 
                    variant={
                      clause.status === 'approved' ? 'default' : 
                      clause.status === 'rejected' ? 'destructive' : 'secondary'
                    }
                    className="mt-2"
                  >
                    {clause.status}
                  </Badge>
                </div>
              ))}
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
                  {totalSelectedClauses} additional clauses selected
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm font-medium text-blue-900">Optional Clauses</div>
                <div className="text-lg font-bold text-blue-600">{selectedOptionalClauses.length}</div>
              </div>
              
              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <div className="text-sm font-medium text-purple-900">Custom Clauses</div>
                <div className="text-lg font-bold text-purple-600">
                  {customClauses.filter(c => c.status === 'approved').length}
                </div>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full"
              size="lg"
            >
              Continue to Final Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
