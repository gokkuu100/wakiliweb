/**
 * Contract Sidebar - Contract Summary and Progress Component
 * Shows contract details, progress, and quick actions during creation
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  MapPin,
  Building,
  Phone,
  Mail,
  Edit,
  CheckCircle,
  Circle,
  AlertCircle,
  Download,
  Share,
  Save,
  Eye,
  MessageSquare,
  Shield,
  Scale,
  Sparkles,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

import { useContractGeneration, WORKFLOW_STEPS } from './ContractGenerationContext';
import type { Contract, ContractClause, ContractWitness } from './contractsApi';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface ContractSidebarProps {
  className?: string;
  onClose?: () => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
  badge?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ContractSidebar({ 
  className = '',
  onClose,
  minimized = false,
  onToggleMinimize
}: ContractSidebarProps) {
  const { state } = useContractGeneration();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['progress', 'details', 'parties'])
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Calculate completion stats
  const getCompletionStats = () => {
    const totalSteps = state.totalSteps;
    const currentStep = state.currentStep;
    const completedSteps = Math.max(0, currentStep - 1);
    
    return {
      completed: completedSteps,
      current: 1,
      remaining: Math.max(0, totalSteps - currentStep),
      percentage: Math.round((completedSteps / totalSteps) * 100)
    };
  };

  const stats = getCompletionStats();

  // Get step status
  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    if (stepIndex < state.currentStep) return 'completed';
    if (stepIndex === state.currentStep) return 'current';
    return 'pending';
  };

  // Sidebar sections configuration
  const getSidebarSections = (): SidebarSection[] => {
    const sections: SidebarSection[] = [
      {
        id: 'progress',
        title: 'Creation Progress',
        icon: Clock,
        badge: `${stats.completed}/${state.totalSteps}`,
        defaultExpanded: true,
        content: (
          <div className="space-y-3">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                <span className="font-medium">{stats.percentage}%</span>
              </div>
              <Progress value={stats.percentage} className="h-2" />
            </div>

            {/* Step List */}
            <div className="space-y-1">
              {WORKFLOW_STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const status = getStepStatus(stepNumber);
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-2 p-2 rounded text-xs ${
                      status === 'current'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                        : status === 'completed'
                        ? 'bg-green-50 dark:bg-green-950/30'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : status === 'current' ? (
                      <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-400" />
                    )}
                    <span
                      className={`flex-1 ${
                        status === 'current'
                          ? 'font-medium text-blue-900 dark:text-blue-100'
                          : status === 'completed'
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                    {status === 'current' && (
                      <Badge variant="secondary" className="text-xs py-0 px-1">
                        Current
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Estimate */}
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>
                  Est. {Math.max(1, state.totalSteps - state.currentStep + 1)} steps remaining
                </span>
              </div>
            </div>
          </div>
        )
      }
    ];

    // Contract Details Section
    if (state.currentContract) {
      sections.push({
        id: 'details',
        title: 'Contract Details',
        icon: FileText,
        defaultExpanded: true,
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {state.currentContract.title || 'Untitled Contract'}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                #{state.currentContract.contract_number}
              </div>

              <Badge variant="outline" className="text-xs">
                {state.currentContract.contract_type?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Key Details */}
            <div className="space-y-2 text-xs">
              {state.currentContract.contract_value && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Value:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-KE', {
                      style: 'currency',
                      currency: 'KES'
                    }).format(state.currentContract.contract_value)}
                  </span>
                </div>
              )}

              {state.currentContract.effective_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Effective:</span>
                  <span className="font-medium">
                    {new Date(state.currentContract.effective_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {state.currentContract.expiry_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                  <span className="font-medium">
                    {new Date(state.currentContract.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="font-medium">
                  {new Date(state.currentContract.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Description */}
            {state.currentContract.description && (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {state.currentContract.description}
                </p>
              </div>
            )}
          </div>
        )
      });
    }

    // Parties Section (using witnesses as proxy for parties)
    if (state.witnesses && state.witnesses.length > 0) {
      sections.push({
        id: 'witnesses',
        title: 'Contract Witnesses',
        icon: Users,
        badge: state.witnesses.length.toString(),
        defaultExpanded: true,
        content: (
          <div className="space-y-2">
            {state.witnesses.map((witness: ContractWitness, index: number) => (
              <div
                key={witness.id || index}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded border"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    variant={witness.physical_presence_required ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {witness.physical_presence_required ? 'Required' : 'Optional'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </Button>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {witness.witness_name}
                  </div>
                  
                  {witness.witness_email && (
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                      <Mail className="h-2.5 w-2.5" />
                      <span>{witness.witness_email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                    <Shield className="h-2.5 w-2.5" />
                    <span>Status: {witness.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      });
    }

    // Clauses Section
    if (state.contractClauses && state.contractClauses.length > 0) {
      const mandatoryClauses = state.contractClauses.filter((c: ContractClause) => c.is_mandatory);
      const optionalClauses = state.contractClauses.filter((c: ContractClause) => !c.is_mandatory);

      sections.push({
        id: 'clauses',
        title: 'Contract Clauses',
        icon: Scale,
        badge: state.contractClauses.length.toString(),
        content: (
          <div className="space-y-3">
            {mandatoryClauses.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                  <Shield className="h-3 w-3 mr-1 text-red-500" />
                  Mandatory ({mandatoryClauses.length})
                </h4>
                <div className="space-y-1">
                  {mandatoryClauses.map((clause: ContractClause) => (
                    <div
                      key={clause.id}
                      className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800"
                    >
                      <div className="text-xs font-medium text-red-900 dark:text-red-100">
                        {clause.clause_name}
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {clause.clause_type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optionalClauses.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                  Optional ({optionalClauses.length})
                </h4>
                <div className="space-y-1">
                  {optionalClauses.slice(0, 3).map((clause: ContractClause) => (
                    <div
                      key={clause.id}
                      className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800"
                    >
                      <div className="text-xs font-medium text-blue-900 dark:text-blue-100">
                        {clause.clause_name}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {clause.clause_type}
                      </div>
                    </div>
                  ))}
                  {optionalClauses.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{optionalClauses.length - 3} more clauses
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      });
    }

    // Quick Actions Section
    sections.push({
      id: 'actions',
      title: 'Quick Actions',
      icon: MessageSquare,
      content: (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8"
            disabled={!state.currentContract}
          >
            <Save className="h-3 w-3 mr-2" />
            Save Progress
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8"
            disabled={!state.currentContract}
          >
            <Eye className="h-3 w-3 mr-2" />
            Preview Contract
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8"
            disabled={!state.currentContract}
          >
            <Download className="h-3 w-3 mr-2" />
            Export PDF
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8"
            disabled={!state.currentContract}
          >
            <Share className="h-3 w-3 mr-2" />
            Share Contract
          </Button>
        </div>
      )
    });

    return sections;
  };

  if (minimized) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Contract Info</CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const sections = getSidebarSections();

  return (
    <Card className={`w-80 h-[calc(100vh-200px)] flex flex-col ${className}`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-sm">Contract Overview</CardTitle>
              <CardDescription className="text-xs">
                {state.currentContract?.title || 'Contract in Progress'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-3 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id}>
                <div
                  className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                  onClick={() => section.collapsible !== false && toggleSection(section.id)}
                >
                  <div className="flex items-center space-x-2">
                    <section.icon className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h3>
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs py-0 px-1">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                  {section.collapsible !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                    >
                      {expandedSections.has(section.id) ? (
                        <Minimize2 className="h-3 w-3" />
                      ) : (
                        <Maximize2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>

                {(expandedSections.has(section.id) || section.collapsible === false) && (
                  <div className="mt-2 pl-6">
                    {section.content}
                  </div>
                )}

                <Separator className="my-3" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
