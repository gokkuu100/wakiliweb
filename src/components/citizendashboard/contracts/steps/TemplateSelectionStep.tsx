/**
 * Template Selection Step - Step 2
 * Allows user to select from AI-suggested contract templates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Star, 
  Clock, 
  Users, 
  Shield, 
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  TrendingUp,
  Award
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useContractGeneration } from '../ContractGenerationContext';
import { ContractTemplate, contractTemplatesApi } from '../contractsApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface TemplateMetrics {
  difficulty: 'Simple' | 'Moderate' | 'Complex';
  estimatedTime: string;
  successRate: number;
  popularity: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getTemplateMetrics = (template: ContractTemplate): TemplateMetrics => {
  return {
    difficulty: template.usage_count > 1000 ? 'Simple' : template.usage_count > 500 ? 'Moderate' : 'Complex',
    estimatedTime: template.usage_count > 1000 ? '15-30 min' : template.usage_count > 500 ? '30-60 min' : '1-2 hours',
    successRate: template.success_rate || 85,
    popularity: template.usage_count || 0
  };
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Complex': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TemplateSelectionStep() {
  const {
    state,
    dispatch,
    setLoading,
    setError,
    setSuccess,
    nextStep,
  } = useContractGeneration();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    state.selectedTemplate?.id || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // Filter and sort templates
  const filteredTemplates = React.useMemo(() => {
    let templates = showAllTemplates ? 
      [...state.suggestedTemplates] : // TODO: Add API call to get all templates
      state.suggestedTemplates;

    // Search filter
    if (searchTerm) {
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.contract_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      templates = templates.filter(template => template.contract_type === filterType);
    }

    // Sort
    templates.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'success_rate':
          return (b.success_rate || 0) - (a.success_rate || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'relevance':
        default:
          return 0; // AI-suggested order
      }
    });

    return templates;
  }, [state.suggestedTemplates, searchTerm, filterType, sortBy, showAllTemplates]);

  const selectedTemplate = filteredTemplates.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplateId(template.id);
    dispatch({ type: 'SET_SELECTED_TEMPLATE', payload: template });
  };

  const handleProceedToNext = async () => {
    if (!selectedTemplate) {
      setError('Please select a contract template to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Here you would typically call the API to start contract creation
      // For now, we'll simulate this
      setSuccess(`Selected template: ${selectedTemplate.name}`);
      
      setTimeout(() => {
        nextStep();
      }, 1000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to proceed with selected template');
    } finally {
      setLoading(false);
    }
  };

  // Get unique contract types for filter
  const contractTypes = React.useMemo(() => {
    const types = new Set(state.suggestedTemplates.map(t => t.contract_type));
    return Array.from(types);
  }, [state.suggestedTemplates]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-4">
          <Star className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Choose Your Contract Template
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Our AI has analyzed your requirements and suggests these templates. 
          Each template is tailored for Kenyan law and includes all required clauses.
        </p>
      </div>

      {/* AI Analysis Summary */}
      {state.templateSuggestions && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Analysis:</strong> {state.templateSuggestions.analysis_summary}
            <br />
            <strong>Confidence Score:</strong> {Math.round(state.templateSuggestions.confidence_score * 100)}%
            {state.templateSuggestions.estimated_completion_time && (
              <>
                <br />
                <strong>Estimated Time:</strong> {state.templateSuggestions.estimated_completion_time}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {contractTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="success_rate">Success Rate</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTemplates.length} templates found
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllTemplates(!showAllTemplates)}
            >
              {showAllTemplates ? 'Show AI Suggestions Only' : 'Browse All Templates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template, index) => {
          const metrics = getTemplateMetrics(template);
          const isSelected = selectedTemplateId === template.id;
          const isRecommended = index === 0 && !showAllTemplates; // First suggestion is recommended
          
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'hover:border-blue-300 dark:hover:border-blue-700'
              } ${isRecommended ? 'border-green-400 shadow-md' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">
                        {template.name}
                      </CardTitle>
                      {isRecommended && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Award className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    <CardDescription className="text-sm leading-relaxed">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>

                {/* Template Metrics */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className={getDifficultyColor(metrics.difficulty)}>
                    {metrics.difficulty}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {metrics.estimatedTime}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {metrics.successRate}% success
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {metrics.popularity.toLocaleString()} used
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Template Features */}
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Key Features:
                    </h5>
                    <div className="grid grid-cols-1 gap-1">
                      {template.legal_requirements?.slice(0, 3).map((requirement, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{requirement}</span>
                        </div>
                      )) || (
                        <>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Kenyan law compliant</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>AI-powered clause generation</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Digital signature ready</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legal Context */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Legal Context</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Jurisdiction: {template.jurisdiction || 'Kenya'} • 
                      Applicable Law: {template.applicable_law || 'Laws of Kenya'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No templates found */}
      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search terms or filters, or browse all available templates.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setShowAllTemplates(true);
            }}>
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span>Selected Template</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedTemplate.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedTemplate.description}
                </p>
                
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>Version {selectedTemplate.version}</span>
                  <span>•</span>
                  <span>{getTemplateMetrics(selectedTemplate).difficulty} difficulty</span>
                  <span>•</span>
                  <span>{getTemplateMetrics(selectedTemplate).estimatedTime}</span>
                </div>
              </div>
              
              <Button
                onClick={handleProceedToNext}
                disabled={state.loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {state.loading ? (
                  'Processing...'
                ) : (
                  <>
                    Start Creating
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                Need help choosing?
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>• <strong>Simple</strong> templates are great for straightforward agreements</li>
                <li>• <strong>Moderate</strong> templates include more detailed terms and protections</li>
                <li>• <strong>Complex</strong> templates are comprehensive for high-value or risky agreements</li>
                <li>• All templates are reviewed by legal experts and comply with Kenyan law</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
