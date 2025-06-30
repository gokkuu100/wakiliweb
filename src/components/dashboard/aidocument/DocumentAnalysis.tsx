'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  FileText,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Document, DocumentAnalysis as DocumentAnalysisType } from '@/types/documents';
import { documentService } from '@/lib/services/documentService';

interface DocumentAnalysisProps {
  document: Document;
  onStartChat: () => void;
  onBack: () => void;
}

export default function DocumentAnalysis({ document, onStartChat, onBack }: DocumentAnalysisProps) {
  const [analysis, setAnalysis] = useState<DocumentAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document.status === 'completed' && document.ai_analysis_status === 'completed') {
      loadAnalysis();
    }
  }, [document]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const analysisData = await documentService.getDocumentAnalysis(document.id);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{document.original_filename}</span>
          </CardTitle>
          <CardDescription>
            Document information and processing status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-muted-foreground">File Size</label>
              <p>{formatFileSize(document.file_size)}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Document Type</label>
              <p className="capitalize">{document.document_type.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Upload Date</label>
              <p>{formatDate(document.created_at)}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Status</label>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getStatusColor(document.status)}>
                  {document.status}
                </Badge>
                {document.ai_analysis_enabled && (
                  <Badge variant="outline" className={getStatusColor(document.ai_analysis_status || 'pending')}>
                    AI: {document.ai_analysis_status || 'pending'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {document.description && (
            <div>
              <label className="font-medium text-muted-foreground">Description</label>
              <p className="text-sm mt-1">{document.description}</p>
            </div>
          )}

          {document.chunks_count && (
            <div>
              <label className="font-medium text-muted-foreground">Processing Info</label>
              <p className="text-sm mt-1">
                Document has been split into {document.chunks_count} chunks for analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {document.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing Document</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Document is being analyzed with AI. This may take a few minutes.</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <p className="text-xs text-muted-foreground">
                The document is being processed in the background. You can leave this page and come back later.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Status */}
      {document.status === 'failed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Processing Failed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                There was an error processing this document. This could be due to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Unsupported file format or corrupted file</li>
                <li>• Document contains no readable text</li>
                <li>• Temporary server issue</li>
              </ul>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Processing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {document.status === 'completed' && (
        <>
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading analysis results...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <AlertTriangle className="h-6 w-6 mx-auto text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                  <Button variant="outline" onClick={loadAnalysis}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : analysis ? (
            <>
              {/* Executive Summary */}
              {analysis.executive_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>Executive Summary</span>
                    </CardTitle>
                    <CardDescription>
                      AI-generated comprehensive summary of your document
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm leading-relaxed">{analysis.executive_summary.executive_summary}</p>
                    </div>

                    {analysis.executive_summary.key_points && analysis.executive_summary.key_points.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Points</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          {analysis.executive_summary.key_points.map((point, index) => (
                            <li key={index} className="list-disc">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.executive_summary.main_topics && analysis.executive_summary.main_topics.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Main Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.executive_summary.main_topics.map((topic, index) => (
                            <Badge key={index} variant="secondary">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.executive_summary.legal_entities && analysis.executive_summary.legal_entities.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Legal Entities</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.executive_summary.legal_entities.map((entity, index) => (
                            <Badge key={index} variant="outline" className="text-blue-600">{entity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.executive_summary.important_dates && analysis.executive_summary.important_dates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Important Dates</h4>
                        <div className="space-y-2">
                          {analysis.executive_summary.important_dates.map((date, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium text-sm">{date.date}</span>
                                <p className="text-xs text-muted-foreground">{date.description}</p>
                              </div>
                              <Badge 
                                variant={date.significance === 'high' ? 'destructive' : date.significance === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {date.significance}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.executive_summary.financial_terms && analysis.executive_summary.financial_terms.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Financial Terms</h4>
                        <div className="space-y-2">
                          {analysis.executive_summary.financial_terms.map((term, index) => (
                            <div key={index} className="p-2 bg-green-50 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{term.term}</span>
                                <span className="text-sm font-mono">{term.value}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{term.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Confidence: {Math.round((analysis.executive_summary.confidence_score || 0) * 100)}%</span>
                        <span>Words: {analysis.executive_summary.word_count || 0}</span>
                        <span>Pages: {analysis.executive_summary.page_count || 0}</span>
                      </div>
                    </div>

                    {analysis.executive_summary.document_structure && (
                      <div className="pt-2 border-t">
                        <h4 className="font-medium text-sm mb-2">Document Structure</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium">{analysis.executive_summary.document_structure.sections || 0}</div>
                            <div className="text-muted-foreground">Sections</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium">{analysis.executive_summary.document_structure.clauses || 0}</div>
                            <div className="text-muted-foreground">Clauses</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium">{analysis.executive_summary.document_structure.appendices || 0}</div>
                            <div className="text-muted-foreground">Appendices</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Legal Review */}
              {analysis.legal_review && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Legal Review</span>
                    </CardTitle>
                    <CardDescription>
                      Professional legal assessment and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Overall Assessment</h4>
                      <p className="text-sm leading-relaxed">{analysis.legal_review.overall_assessment}</p>
                    </div>

                    {analysis.legal_review.legal_issues && analysis.legal_review.legal_issues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Legal Issues Identified</h4>
                        <div className="space-y-2">
                          {analysis.legal_review.legal_issues.map((issue, index) => (
                            <div key={index} className="p-3 border border-yellow-200 bg-yellow-50 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{issue.issue}</span>
                                <Badge 
                                  variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.legal_review.recommendations && analysis.legal_review.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          {analysis.legal_review.recommendations.map((rec, index) => (
                            <li key={index} className="list-disc">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.legal_review.statutory_references && analysis.legal_review.statutory_references.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Statutory References</h4>
                        <div className="space-y-2">
                          {analysis.legal_review.statutory_references.map((ref, index) => (
                            <div key={index} className="p-2 bg-blue-50 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{ref.statute}</span>
                                <Badge variant="outline" className="text-xs">{ref.section}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{ref.relevance}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.legal_review.precedent_cases && analysis.legal_review.precedent_cases.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Precedent Cases</h4>
                        <div className="space-y-2">
                          {analysis.legal_review.precedent_cases.map((caseRef, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{caseRef.case_name}</span>
                                <Badge variant="outline" className="text-xs">{caseRef.year}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{caseRef.relevance}</p>
                              <p className="text-xs text-blue-600 font-mono">{caseRef.citation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-sm mb-2">Enforceability Analysis</h4>
                      <p className="text-sm leading-relaxed">{analysis.legal_review.enforceability_analysis}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Kenya-Specific Notes</h4>
                      <p className="text-sm leading-relaxed">{analysis.legal_review.jurisdiction_specific_notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risk Assessment */}
              {analysis.risk_assessment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Risk Assessment</span>
                    </CardTitle>
                    <CardDescription>
                      Comprehensive risk analysis and mitigation strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Overall Risk Level</h4>
                        <Badge 
                          variant={
                            analysis.risk_assessment.overall_risk_level === 'high' || analysis.risk_assessment.overall_risk_level === 'critical' 
                              ? 'destructive' 
                              : analysis.risk_assessment.overall_risk_level === 'medium' 
                                ? 'default' 
                                : 'secondary'
                          }
                          className="text-sm"
                        >
                          {analysis.risk_assessment.overall_risk_level.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <h4 className="font-medium text-sm mb-1">Risk Score</h4>
                        <div className="flex items-center space-x-2">
                          <Progress value={analysis.risk_assessment.risk_score * 100} className="w-20" />
                          <span className="text-sm font-mono">
                            {Math.round(analysis.risk_assessment.risk_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {analysis.risk_assessment.risk_factors && analysis.risk_assessment.risk_factors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Risk Factors</h4>
                        <div className="space-y-2">
                          {analysis.risk_assessment.risk_factors.map((factor, index) => (
                            <div key={index} className="p-3 border border-red-200 bg-red-50 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{factor.factor}</span>
                                <div className="flex space-x-1">
                                  <Badge variant="outline" className="text-xs">Impact: {factor.impact}</Badge>
                                  <Badge variant="outline" className="text-xs">Prob: {factor.probability}</Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{factor.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.risk_assessment.recommendations && analysis.risk_assessment.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Risk Mitigation Recommendations</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          {analysis.risk_assessment.recommendations.map((rec, index) => (
                            <li key={index} className="list-disc">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.risk_assessment.mitigation_strategies && analysis.risk_assessment.mitigation_strategies.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Mitigation Strategies</h4>
                        <div className="space-y-2">
                          {analysis.risk_assessment.mitigation_strategies.map((strategy, index) => (
                            <div key={index} className="p-2 bg-green-50 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{strategy.strategy}</span>
                                <div className="flex space-x-1">
                                  <Badge variant="outline" className="text-xs">
                                    {strategy.priority} priority
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {strategy.timeline}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial Risks */}
                    {analysis.risk_assessment.financial_risks && analysis.risk_assessment.financial_risks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Financial Risks</h4>
                        <div className="space-y-2">
                          {analysis.risk_assessment.financial_risks.map((risk, index) => (
                            <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                              <div className="font-medium text-sm text-red-800">{risk.risk}</div>
                              <div className="text-xs text-red-600 mt-1">Impact: {risk.impact}</div>
                              <div className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legal Risks */}
                    {analysis.risk_assessment.legal_risks && analysis.risk_assessment.legal_risks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Legal Risks</h4>
                        <div className="space-y-2">
                          {analysis.risk_assessment.legal_risks.map((risk, index) => (
                            <div key={index} className="p-2 bg-orange-50 rounded border border-orange-200">
                              <div className="font-medium text-sm text-orange-800">{risk.risk}</div>
                              <div className="text-xs text-orange-600 mt-1">Impact: {risk.impact}</div>
                              <div className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operational Risks */}
                    {analysis.risk_assessment.operational_risks && analysis.risk_assessment.operational_risks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Operational Risks</h4>
                        <div className="space-y-2">
                          {analysis.risk_assessment.operational_risks.map((risk, index) => (
                            <div key={index} className="p-2 bg-yellow-50 rounded border border-yellow-200">
                              <div className="font-medium text-sm text-yellow-800">{risk.risk}</div>
                              <div className="text-xs text-yellow-600 mt-1">Impact: {risk.impact}</div>
                              <div className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance Issues */}
                    {analysis.risk_assessment.compliance_issues && analysis.risk_assessment.compliance_issues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Compliance Issues</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          {analysis.risk_assessment.compliance_issues.map((issue, index) => (
                            <li key={index} className="list-disc text-purple-700">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Compliance Analysis */}
              {analysis.compliance_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Compliance Analysis</span>
                    </CardTitle>
                    <CardDescription>
                      Analysis of compliance with Kenyan law and regulations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Compliance Score</h4>
                        <div className="flex items-center space-x-2">
                          <Progress value={analysis.compliance_analysis.compliance_score * 100} className="w-32" />
                          <span className="text-sm font-mono">
                            {Math.round(analysis.compliance_analysis.compliance_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Kenyan Law Alignment</h4>
                      <p className="text-sm leading-relaxed">{analysis.compliance_analysis.kenyan_law_alignment}</p>
                    </div>

                    {analysis.compliance_analysis.regulatory_framework && analysis.compliance_analysis.regulatory_framework.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Applicable Regulatory Framework</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.compliance_analysis.regulatory_framework.map((framework, index) => (
                            <Badge key={index} variant="outline" className="text-blue-600">{framework}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.compliance_analysis.compliance_gaps && analysis.compliance_analysis.compliance_gaps.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Compliance Gaps</h4>
                        <div className="space-y-2">
                          {analysis.compliance_analysis.compliance_gaps.map((gap, index) => (
                            <div key={index} className="p-3 border border-orange-200 bg-orange-50 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{gap.gap}</span>
                                <Badge 
                                  variant={gap.severity === 'high' ? 'destructive' : gap.severity === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {gap.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{gap.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.compliance_analysis.required_modifications && analysis.compliance_analysis.required_modifications.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Required Modifications</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          {analysis.compliance_analysis.required_modifications.map((mod, index) => (
                            <li key={index} className="list-disc">{mod}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.compliance_analysis.tax_implications && analysis.compliance_analysis.tax_implications.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Tax Implications</h4>
                        <div className="space-y-2">
                          {analysis.compliance_analysis.tax_implications.map((tax, index) => (
                            <div key={index} className="p-2 bg-purple-50 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{tax.type}</span>
                                <Badge variant="outline" className="text-xs">{tax.rate}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{tax.applicability}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Compliance Details */}
                    {analysis.compliance_analysis.regulatory_requirements && analysis.compliance_analysis.regulatory_requirements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Regulatory Requirements</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          {analysis.compliance_analysis.regulatory_requirements.map((req, index) => (
                            <li key={index} className="list-disc text-blue-700">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.compliance_analysis.government_approvals && analysis.compliance_analysis.government_approvals.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Required Government Approvals</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.compliance_analysis.government_approvals.map((approval, index) => (
                            <Badge key={index} variant="outline" className="text-green-600">{approval}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.compliance_analysis.employment_law_considerations && analysis.compliance_analysis.employment_law_considerations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Employment Law Considerations</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          {analysis.compliance_analysis.employment_law_considerations.map((consideration, index) => (
                            <li key={index} className="list-disc text-indigo-700">{consideration}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Processing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Processing Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">AI Model</label>
                      <p>{analysis.ai_model_version}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Processing Time</label>
                      <p>{analysis.processing_time_seconds ? `${analysis.processing_time_seconds.toFixed(2)}s` : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Chunks Created</label>
                      <p>{analysis.chunks_created}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Vectors Stored</label>
                      <p>{analysis.vectors_stored}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant="outline" className="text-xs">
                      Analyzed on {formatDate(analysis.created_at)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Questions Available: {analysis.questions_available}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Summary (if available) */}
              {analysis.cost_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Processing Cost Summary</span>
                    </CardTitle>
                    <CardDescription>
                      Breakdown of AI processing costs for this analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(analysis.cost_summary).map(([key, value]) => (
                        <div key={key}>
                          <label className="font-medium text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <p className="font-mono text-xs">
                            {typeof value === 'number' ? value.toFixed(4) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Q&A Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Ask Questions</span>
                  </CardTitle>
                  <CardDescription>
                    Start a Q&A session to ask specific questions about this document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You can ask up to 5 questions about this document. The AI will provide 
                      answers based on the document content with source citations.
                    </p>
                    <Button onClick={onStartChat} className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Q&A Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Analysis Complete</h3>
                    <p className="text-sm text-muted-foreground">
                      Document has been processed but detailed analysis is not available
                    </p>
                  </div>
                  <Button onClick={onStartChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Q&A Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
