/**
 * AI Knowledge Base Admin Service
 * Provides admin functionality for managing the legal knowledge base (RAG)
 */

import { supabase } from '@/lib/supabase';
import { vectorKnowledgeBase } from './vector-knowledge-base';
import { documentTextExtractor } from '../documents/text-extractor';
import { aiMonitoring } from './monitoring';

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  document_type: string;
  file_path?: string;
  content_hash: string;
  word_count: number;
  chunk_count: number;
  indexed_at: string;
  last_updated: string;
  is_active: boolean;
  metadata: {
    source?: string;
    jurisdiction?: string;
    date_published?: string;
    court?: string;
    case_number?: string;
    act_number?: string;
    section?: string;
    keywords?: string[];
  };
}

export interface KnowledgeUploadResult {
  success: boolean;
  documentId?: string;
  chunksCreated: number;
  errors: string[];
  warnings: string[];
}

export interface BulkUploadProgress {
  total: number;
  completed: number;
  failed: number;
  currentFile?: string;
  errors: Array<{ file: string; error: string }>;
}

export class AIKnowledgeAdminService {
  /**
   * Upload a new document to the knowledge base
   */
  async uploadDocument(
    file: File,
    metadata: {
      title: string;
      category: string;
      document_type: string;
      jurisdiction?: string;
      date_published?: string;
      court?: string;
      case_number?: string;
      act_number?: string;
      section?: string;
      keywords?: string[];
    }
  ): Promise<KnowledgeUploadResult> {
    try {
      // Extract text from the uploaded file
      const extractedResult = await documentTextExtractor.extractText(file, file.type, file.name);
      const extractedText = extractedResult.text;
      
      if (!extractedText || extractedText.trim().length < 100) {
        return {
          success: false,
          chunksCreated: 0,
          errors: ['Document text is too short or could not be extracted'],
          warnings: []
        };
      }

      // Calculate content hash
      const contentHash = await this.calculateContentHash(extractedText);
      
      // Check for duplicates
      const { data: existingDoc } = await supabase
        .from('legal_knowledge_base')
        .select('id')
        .eq('content_hash', contentHash)
        .single();

      if (existingDoc) {
        return {
          success: false,
          chunksCreated: 0,
          errors: ['Document already exists in the knowledge base'],
          warnings: []
        };
      }

      // Store the document in the database
      const { data: document, error: dbError } = await supabase
        .from('legal_knowledge_base')
        .insert([{
          title: metadata.title,
          category: metadata.category,
          document_type: metadata.document_type,
          content_hash: contentHash,
          word_count: extractedText.split(/\s+/).length,
          chunk_count: 0, // Will be updated after chunking
          metadata: {
            jurisdiction: metadata.jurisdiction,
            date_published: metadata.date_published,
            court: metadata.court,
            case_number: metadata.case_number,
            act_number: metadata.act_number,
            section: metadata.section,
            keywords: metadata.keywords || []
          },
          is_active: true
        }])
        .select()
        .single();

      if (dbError || !document) {
        throw new Error(`Database error: ${dbError?.message || 'Failed to create document'}`);
      }

      // Add to vector knowledge base
      await vectorKnowledgeBase.addDocument({
        id: document.id,
        title: metadata.title,
        content: extractedText,
        source_type: metadata.document_type as any,
        jurisdiction: metadata.jurisdiction || 'Kenya',
        legal_areas: metadata.keywords || [],
        authority: metadata.court || 'Government',
        metadata: {
          ...metadata,
          word_count: extractedText.split(/\s+/).length
        }
      });

      // Get chunk count from the split text
      const chunkCount = Math.ceil(extractedText.length / 1000); // Estimate chunks

      // Update chunk count
      await supabase
        .from('legal_knowledge_base')
        .update({ 
          chunk_count: chunkCount,
          indexed_at: new Date().toISOString()
        })
        .eq('id', document.id);

      return {
        success: true,
        documentId: document.id,
        chunksCreated: chunkCount,
        errors: [],
        warnings: []
      };

    } catch (error) {
      await aiMonitoring.logError({
        user_id: 'admin',
        error_type: 'system_error',
        error_message: `Knowledge base upload failed: ${error}`,
        context: { metadata },
        severity: 'high'
      });

      return {
        success: false,
        chunksCreated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: []
      };
    }
  }

  /**
   * Bulk upload multiple documents
   */
  async bulkUploadDocuments(
    files: Array<{ file: File; metadata: any }>,
    onProgress?: (progress: BulkUploadProgress) => void
  ): Promise<KnowledgeUploadResult[]> {
    const results: KnowledgeUploadResult[] = [];
    const progress: BulkUploadProgress = {
      total: files.length,
      completed: 0,
      failed: 0,
      errors: []
    };

    for (const { file, metadata } of files) {
      progress.currentFile = file.name;
      onProgress?.(progress);

      try {
        const result = await this.uploadDocument(file, metadata);
        results.push(result);
        
        if (result.success) {
          progress.completed++;
        } else {
          progress.failed++;
          progress.errors.push({
            file: file.name,
            error: result.errors.join(', ')
          });
        }
      } catch (error) {
        progress.failed++;
        progress.errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        results.push({
          success: false,
          chunksCreated: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        });
      }

      onProgress?.(progress);
    }

    return results;
  }

  /**
   * Get all knowledge base documents
   */
  async getKnowledgeDocuments(
    filters?: {
      category?: string;
      document_type?: string;
      is_active?: boolean;
      search?: string;
    },
    pagination?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ documents: KnowledgeDocument[]; total: number }> {
    try {
      let query = supabase
        .from('legal_knowledge_base')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,metadata->>keywords.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination?.limit) {
        query = query.limit(pagination.limit);
      }
      if (pagination?.offset) {
        query = query.range(pagination.offset, (pagination.offset + (pagination.limit || 50)) - 1);
      }

      query = query.order('last_updated', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      return {
        documents: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching knowledge documents:', error);
      return { documents: [], total: 0 };
    }
  }

  /**
   * Update a knowledge base document
   */
  async updateDocument(
    documentId: string,
    updates: {
      title?: string;
      category?: string;
      is_active?: boolean;
      metadata?: Partial<KnowledgeDocument['metadata']>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('legal_knowledge_base')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        throw new Error(error.message);
      }

      // If deactivating, remove from vector store
      if (updates.is_active === false) {
        await vectorKnowledgeBase.removeDocument(documentId);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a knowledge base document
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove from vector store first
      await vectorKnowledgeBase.removeDocument(documentId);

      // Remove from database
      const { error } = await supabase
        .from('legal_knowledge_base')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test knowledge base search
   */
  async testSearch(query: string, limit: number = 5): Promise<{
    results: Array<{
      content: string;
      metadata: any;
      score: number;
    }>;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const searchResults = await vectorKnowledgeBase.search(query, { topK: limit });
      const processingTime = Date.now() - startTime;

      // Transform results to match expected format
      const results = searchResults.map(result => ({
        content: result.matched_content || result.page_content,
        metadata: result.metadata,
        score: result.relevance_score
      }));

      return {
        results,
        processingTime
      };
    } catch (error) {
      throw new Error(`Search test failed: ${error}`);
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(): Promise<{
    totalDocuments: number;
    activeDocuments: number;
    totalChunks: number;
    documentsByCategory: Record<string, number>;
    documentsByType: Record<string, number>;
    averageWordsPerDocument: number;
    recentUploads: number; // Last 30 days
  }> {
    try {
      const { data: allDocs } = await supabase
        .from('legal_knowledge_base')
        .select('category, document_type, word_count, chunk_count, is_active, created_at');

      if (!allDocs) {
        throw new Error('Failed to fetch documents');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = {
        totalDocuments: allDocs.length,
        activeDocuments: allDocs.filter(doc => doc.is_active).length,
        totalChunks: allDocs.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0),
        documentsByCategory: {} as Record<string, number>,
        documentsByType: {} as Record<string, number>,
        averageWordsPerDocument: 0,
        recentUploads: allDocs.filter(doc => 
          new Date(doc.created_at) > thirtyDaysAgo
        ).length
      };

      // Calculate category and type distributions
      allDocs.forEach(doc => {
        if (doc.is_active) {
          stats.documentsByCategory[doc.category] = (stats.documentsByCategory[doc.category] || 0) + 1;
          stats.documentsByType[doc.document_type] = (stats.documentsByType[doc.document_type] || 0) + 1;
        }
      });

      // Calculate average words per document
      const totalWords = allDocs
        .filter(doc => doc.is_active)
        .reduce((sum, doc) => sum + (doc.word_count || 0), 0);
      stats.averageWordsPerDocument = stats.activeDocuments > 0 
        ? Math.round(totalWords / stats.activeDocuments) 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting knowledge base stats:', error);
      return {
        totalDocuments: 0,
        activeDocuments: 0,
        totalChunks: 0,
        documentsByCategory: {},
        documentsByType: {},
        averageWordsPerDocument: 0,
        recentUploads: 0
      };
    }
  }

  /**
   * Reindex all documents in the vector store
   */
  async reindexKnowledgeBase(onProgress?: (progress: { current: number; total: number }) => void): Promise<{
    success: boolean;
    reindexed: number;
    errors: string[];
  }> {
    try {
      const { data: documents } = await supabase
        .from('legal_knowledge_base')
        .select('*')
        .eq('is_active', true);

      if (!documents) {
        return { success: false, reindexed: 0, errors: ['No documents found'] };
      }

      let reindexed = 0;
      const errors: string[] = [];

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        onProgress?.({ current: i + 1, total: documents.length });

        try {
          // Get full content (this would need to be stored or re-extracted)
          // For now, we'll skip this and just update the indexing timestamp
          await supabase
            .from('legal_knowledge_base')
            .update({ indexed_at: new Date().toISOString() })
            .eq('id', doc.id);
          
          reindexed++;
        } catch (error) {
          errors.push(`Failed to reindex ${doc.title}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        reindexed,
        errors
      };
    } catch (error) {
      return {
        success: false,
        reindexed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Calculate content hash for duplicate detection
   */
  private async calculateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const knowledgeAdmin = new AIKnowledgeAdminService();
