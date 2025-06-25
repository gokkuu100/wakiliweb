/**
 * Document Analysis Service for Kenyan Legal System
 * Handles user document uploads, AI analysis, summarization, and legal insights
 */

import { supabase } from '@/lib/supabase';
import { documentTextExtractor } from './text-extractor';
import { aiCore } from '../core/ai-core';
import { vectorKnowledgeBase } from '../core/vector-knowledge-base';
import { aiMonitoring } from '../core/monitoring';
import { aiConfig } from '../core/config';

export interface DocumentAnalysisRequest {
  file: File;
  userId: string;
  analysisType: 'summary' | 'legal_review' | 'risk_assessment' | 'compliance_check' | 'contract_analysis';
  focusAreas?: string[];
  jurisdiction?: string;
}

export interface DocumentAnalysisResult {
  id: string;
  summary: string;
  legalInsights: {
    keyFindings: string[];
    riskFactors: string[];
    recommendations: string[];
    relevantLaws: Array<{
      statute: string;
      section: string;
      relevance: string;
    }>;
    citations: Array<{
      source: string;
      text: string;
      relevance_score: number;
    }>;
  };
  confidence: number;
  processingTime: number;
  wordCount: number;
  metadata: {
    fileType: string;
    fileSize: number;
    extractedAt: string;
    analysisModel: string;
  };
}

export interface UserDocumentRecord {
  id: string;
  user_id: string;
  title: string;
  file_type: string;
  file_size: number;
  file_path: string;
  upload_status: 'processing' | 'completed' | 'failed';
  analysis_results?: DocumentAnalysisResult;
  created_at: string;
  updated_at: string;
}

export class DocumentAnalysisService {
  /**
   * Upload and analyze a user document
   */
  async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Extract text from the document
      const extractionResult = await documentTextExtractor.extractText(
        request.file,
        request.file.type,
        request.file.name
      );

      if (!extractionResult.text || extractionResult.text.trim().length < 100) {
        throw new Error('Document text is too short or could not be extracted');
      }

      // Store document record in database
      const documentRecord = await this.storeDocumentRecord(request, extractionResult);

      // Perform AI analysis based on type
      const analysisResult = await this.performAnalysis(
        extractionResult.text,
        request.analysisType,
        request.focusAreas || [],
        request.jurisdiction || 'Kenya',
        request.userId
      );

      // Update document record with analysis results
      await supabase
        .from('user_documents')
        .update({
          upload_status: 'completed',
          analysis_results: analysisResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentRecord.id);

      return {
        ...analysisResult,
        id: documentRecord.id,
        processingTime: Date.now() - startTime,
        metadata: {
          ...analysisResult.metadata,
          fileType: extractionResult.metadata.fileType,
          fileSize: extractionResult.metadata.fileSize,
          extractedAt: extractionResult.metadata.extractedAt
        }
      };

    } catch (error) {
      await aiMonitoring.logError({
        user_id: request.userId,
        error_type: 'system_error',
        error_message: `Document analysis failed: ${error}`,
        context: { 
          fileName: request.file.name,
          fileType: request.file.type,
          analysisType: request.analysisType
        },
        severity: 'high'
      });

      throw error;
    }
  }

  /**
   * Perform AI analysis based on the requested type
   */
  private async performAnalysis(
    text: string,
    analysisType: string,
    focusAreas: string[],
    jurisdiction: string,
    userId: string
  ): Promise<Omit<DocumentAnalysisResult, 'id' | 'processingTime'>> {
    
    // Get relevant legal context from knowledge base
    const legalContext = await this.getLegalContext(text, focusAreas, jurisdiction);
    
    // Build analysis prompt based on type
    const prompt = this.buildAnalysisPrompt(text, analysisType, focusAreas, legalContext);
    
    // Get optimal model for this task
    const model = aiConfig.getOptimalModel('analysis', text.length);
    
    // Perform AI analysis
    const aiResponse = await aiCore.completion({
      user_id: userId,
      prompt,
      model,
      max_tokens: 3000,
      temperature: 0.2,
      context: {
        type: 'document_analysis',
        analysis_type: analysisType,
        jurisdiction
      }
    });

    // Parse the structured response
    const parsedAnalysis = this.parseAnalysisResponse(aiResponse.content);
    
    return {
      summary: parsedAnalysis.summary,
      legalInsights: {
        keyFindings: parsedAnalysis.keyFindings,
        riskFactors: parsedAnalysis.riskFactors,
        recommendations: parsedAnalysis.recommendations,
        relevantLaws: parsedAnalysis.relevantLaws,
        citations: legalContext.citations
      },
      confidence: parsedAnalysis.confidence,
      wordCount: text.split(/\s+/).length,
      metadata: {
        fileType: '',
        fileSize: 0,
        extractedAt: new Date().toISOString(),
        analysisModel: model
      }
    };
  }

  /**
   * Get relevant legal context from the knowledge base
   */
  private async getLegalContext(
    text: string,
    focusAreas: string[],
    jurisdiction: string
  ): Promise<{
    relevantSources: any[];
    citations: Array<{
      source: string;
      text: string;
      relevance_score: number;
    }>;
  }> {
    try {
      // Extract key legal terms and concepts from the document
      const keyTerms = this.extractLegalTerms(text);
      
      // Search knowledge base for relevant documents
      const searchQueries = [...keyTerms, ...focusAreas].slice(0, 5);
      const allSources: any[] = [];
      
      for (const query of searchQueries) {
        const results = await vectorKnowledgeBase.search(query, {
          topK: 3,
          jurisdiction,
          minRelevanceScore: 0.7
        });
        allSources.push(...results);
      }

      // Remove duplicates and sort by relevance
      const uniqueSources = this.deduplicateSources(allSources);
      
      // Format citations
      const citations = uniqueSources.map(source => ({
        source: `${source.document.title} - ${source.document.authority}`,
        text: source.matched_content.substring(0, 200) + '...',
        relevance_score: source.relevance_score
      }));

      return {
        relevantSources: uniqueSources,
        citations: citations.slice(0, 10) // Limit to top 10 citations
      };
    } catch (error) {
      console.error('Error getting legal context:', error);
      return { relevantSources: [], citations: [] };
    }
  }

  /**
   * Build analysis prompt based on type and context
   */
  private buildAnalysisPrompt(
    text: string,
    analysisType: string,
    focusAreas: string[],
    legalContext: any
  ): string {
    const baseContext = `You are a legal AI assistant specialized in Kenyan law. Analyze the following document and provide structured insights.

DOCUMENT TEXT:
${text.substring(0, 8000)} ${text.length > 8000 ? '...' : ''}

RELEVANT LEGAL CONTEXT:
${legalContext.citations.map((c: any) => `- ${c.source}: ${c.text}`).join('\n')}

FOCUS AREAS: ${focusAreas.join(', ') || 'General legal analysis'}
JURISDICTION: Kenya`;

    const analysisInstructions = this.getAnalysisInstructions(analysisType);

    return `${baseContext}

${analysisInstructions}

Please provide your response in the following JSON format:
{
  "summary": "A comprehensive summary of the document (2-3 paragraphs)",
  "keyFindings": ["Key legal finding 1", "Key legal finding 2", ...],
  "riskFactors": ["Risk factor 1", "Risk factor 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "relevantLaws": [
    {
      "statute": "Name of Act/Law",
      "section": "Section number or reference",
      "relevance": "How it applies to this document"
    }
  ],
  "confidence": 0.85
}`;
  }

  /**
   * Get specific analysis instructions based on type
   */
  private getAnalysisInstructions(analysisType: string): string {
    const instructions = {
      summary: `Provide a comprehensive summary focusing on:
- Main purpose and key provisions
- Legal implications and significance
- Parties involved and their obligations`,

      legal_review: `Conduct a thorough legal review focusing on:
- Legal validity and enforceability
- Compliance with Kenyan law
- Potential legal issues or gaps
- Recommendations for improvement`,

      risk_assessment: `Perform a risk assessment focusing on:
- Legal risks and exposure
- Compliance risks
- Financial or operational risks
- Mitigation strategies`,

      compliance_check: `Check compliance with Kenyan regulations focusing on:
- Regulatory requirements
- Licensing and permits needed
- Tax implications
- Employment law compliance`,

      contract_analysis: `Analyze the contract focusing on:
- Terms and conditions
- Rights and obligations of parties
- Termination clauses
- Dispute resolution mechanisms
- Enforceability under Kenyan law`
    };

    return instructions[analysisType as keyof typeof instructions] || instructions.summary;
  }

  /**
   * Parse the AI response into structured data
   */
  private parseAnalysisResponse(content: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Analysis completed',
          keyFindings: parsed.keyFindings || [],
          riskFactors: parsed.riskFactors || [],
          recommendations: parsed.recommendations || [],
          relevantLaws: parsed.relevantLaws || [],
          confidence: parsed.confidence || 0.8
        };
      }
      
      // Fallback: parse unstructured response
      return this.parseUnstructuredResponse(content);
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return {
        summary: content.substring(0, 500),
        keyFindings: [],
        riskFactors: [],
        recommendations: [],
        relevantLaws: [],
        confidence: 0.6
      };
    }
  }

  /**
   * Parse unstructured AI response
   */
  private parseUnstructuredResponse(content: string): any {
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      summary: lines.slice(0, 3).join(' '),
      keyFindings: this.extractListItems(content, ['finding', 'key point', 'important']),
      riskFactors: this.extractListItems(content, ['risk', 'concern', 'issue']),
      recommendations: this.extractListItems(content, ['recommend', 'suggest', 'should']),
      relevantLaws: [],
      confidence: 0.7
    };
  }

  /**
   * Extract list items from text based on keywords
   */
  private extractListItems(text: string, keywords: string[]): string[] {
    const items: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
        const hasKeyword = keywords.some(keyword => 
          trimmed.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasKeyword) {
          items.push(trimmed.replace(/^[-•\d.]\s*/, ''));
        }
      }
    }
    
    return items.slice(0, 5); // Limit to 5 items
  }

  /**
   * Extract legal terms from document text
   */
  private extractLegalTerms(text: string): string[] {
    const legalKeywords = [
      'contract', 'agreement', 'liability', 'obligation', 'rights', 'duties',
      'breach', 'damages', 'compensation', 'termination', 'clause', 'provision',
      'law', 'act', 'regulation', 'statute', 'constitution', 'court', 'judge',
      'plaintiff', 'defendant', 'appeal', 'jurisdiction', 'precedent'
    ];
    
    const terms = new Set<string>();
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      const cleaned = word.replace(/[^\w]/g, '');
      if (legalKeywords.includes(cleaned) && cleaned.length > 3) {
        terms.add(cleaned);
      }
    }
    
    return Array.from(terms).slice(0, 10);
  }

  /**
   * Remove duplicate sources based on document ID
   */
  private deduplicateSources(sources: any[]): any[] {
    const seen = new Set();
    return sources.filter(source => {
      const id = source.document?.id;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Store document record in database
   */
  private async storeDocumentRecord(
    request: DocumentAnalysisRequest,
    extractionResult: any
  ): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('user_documents')
      .insert([{
        user_id: request.userId,
        title: request.file.name,
        file_type: request.file.type,
        file_size: request.file.size,
        file_path: '', // Will be set when file is uploaded to storage
        upload_status: 'processing',
        metadata: {
          analysis_type: request.analysisType,
          focus_areas: request.focusAreas,
          jurisdiction: request.jurisdiction
        }
      }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to store document record: ${error?.message}`);
    }

    return { id: data.id };
  }

  /**
   * Get user's document history
   */
  async getUserDocuments(
    userId: string,
    limit: number = 50
  ): Promise<UserDocumentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch user documents: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user documents:', error);
      return [];
    }
  }

  /**
   * Get document analysis by ID
   */
  async getDocumentAnalysis(
    documentId: string,
    userId: string
  ): Promise<UserDocumentRecord | null> {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch document: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting document analysis:', error);
      return null;
    }
  }
}

// Export singleton instance
export const documentAnalysis = new DocumentAnalysisService();
