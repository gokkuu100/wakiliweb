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
                {/*
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
                */}

                {/* Risk Assessment */}
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
