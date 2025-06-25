import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { supabase } from '@/lib/supabase';
import { documentTextExtractor } from '../documents/text-extractor';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  source_type: 'constitution' | 'act' | 'case_law' | 'regulation' | 'precedent';
  jurisdiction: string;
  date_enacted?: string;
  legal_areas: string[];
  authority: string;
  metadata: Record<string, any>;
}

export interface SearchResult {
  document: KnowledgeDocument;
  relevance_score: number;
  matched_content: string;
  page_content: string;
  metadata: Record<string, any>;
}

export class VectorKnowledgeBase {
  private embeddings: OpenAIEmbeddings;
  private pinecone: Pinecone | null = null;
  private vectorStore: PineconeStore | null = null;
  private textSplitter: RecursiveCharacterTextSplitter;
  private initialized: boolean = false;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536'),
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if we're using Pinecone or fallback to simple storage
      if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
        this.pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY!,
        });

        const indexName = process.env.PINECONE_INDEX_NAME;
        const pineconeIndex = this.pinecone.Index(indexName);
        
        this.vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
          pineconeIndex,
          namespace: 'kenyan-law',
        });
      } else {
        console.warn('Pinecone not configured, using fallback search method');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      // Don't throw error, allow fallback to work
      this.initialized = true;
    }
  }

  /**
   * Search with fallback to simple text search if vector search is unavailable
   */
  async search(
    query: string,
    options: {
      topK?: number;
      legalAreas?: string[];
      sourceTypes?: string[];
      jurisdiction?: string;
      minRelevanceScore?: number;
    } = {}
  ): Promise<SearchResult[]> {
    await this.initialize();

    try {
      if (this.vectorStore) {
        return await this.vectorSearch(query, options);
      } else {
        return await this.fallbackSearch(query, options);
      }
    } catch (error) {
      console.error('Vector search failed, falling back to simple search:', error);
      return await this.fallbackSearch(query, options);
    }
  }

  /**
   * Vector-based search using embeddings
   */
  private async vectorSearch(
    query: string,
    options: {
      topK?: number;
      legalAreas?: string[];
      sourceTypes?: string[];
      jurisdiction?: string;
      minRelevanceScore?: number;
    }
  ): Promise<SearchResult[]> {
    const {
      topK = 10,
      legalAreas = [],
      sourceTypes = [],
      jurisdiction,
      minRelevanceScore = 0.7,
    } = options;

    // Build filter for metadata
    const filter: Record<string, any> = {};
    
    if (legalAreas.length > 0) {
      filter.legal_areas = { $in: legalAreas };
    }
    
    if (sourceTypes.length > 0) {
      filter.source_type = { $in: sourceTypes };
    }
    
    if (jurisdiction) {
      filter.jurisdiction = jurisdiction;
    }

    // Perform similarity search
    const results = await this.vectorStore!.similaritySearchWithScore(
      query,
      topK,
      Object.keys(filter).length > 0 ? filter : undefined
    );

    // Filter by relevance score and format results
    const searchResults: SearchResult[] = [];
    
    for (const [doc, score] of results) {
      if (score >= minRelevanceScore) {
        // Get the source document
        const sourceDocument = await this.getSourceDocument(doc.metadata.source_id);
        
        if (sourceDocument) {
          searchResults.push({
            document: sourceDocument,
            relevance_score: score,
            matched_content: doc.pageContent,
            page_content: doc.pageContent,
            metadata: doc.metadata,
          });
        }
      }
    }

    return searchResults;
  }

  /**
   * Fallback search using simple text matching
   */
  private async fallbackSearch(
    query: string,
    options: {
      topK?: number;
      legalAreas?: string[];
      sourceTypes?: string[];
      jurisdiction?: string;
    }
  ): Promise<SearchResult[]> {
    const { topK = 10, legalAreas = [], sourceTypes = [], jurisdiction } = options;

    try {
      let dbQuery = supabase
        .from('legal_knowledge_sources')
        .select('*');

      // Apply filters
      if (legalAreas.length > 0) {
        dbQuery = dbQuery.overlaps('legal_areas', legalAreas);
      }

      if (sourceTypes.length > 0) {
        dbQuery = dbQuery.in('source_type', sourceTypes);
      }

      if (jurisdiction) {
        dbQuery = dbQuery.eq('jurisdiction', jurisdiction);
      }

      // Simple text search in title and content preview
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      if (searchTerms.length > 0) {
        const searchPattern = searchTerms.join('|');
        dbQuery = dbQuery.or(`title.ilike.%${searchPattern}%,content_preview.ilike.%${searchPattern}%`);
      }

      dbQuery = dbQuery.limit(topK);

      const { data: documents } = await dbQuery;

      if (!documents) return [];

      // Convert to SearchResult format
      return documents.map(doc => ({
        document: {
          id: doc.id,
          title: doc.title,
          content: doc.content_preview || '',
          source_type: doc.source_type,
          jurisdiction: doc.jurisdiction,
          date_enacted: doc.date_enacted,
          legal_areas: doc.legal_areas || [],
          authority: doc.authority || '',
          metadata: doc.metadata || {},
        },
        relevance_score: this.calculateSimpleRelevance(query, doc.title + ' ' + doc.content_preview),
        matched_content: doc.content_preview || '',
        page_content: doc.content_preview || '',
        metadata: doc.metadata || {},
      })).sort((a, b) => b.relevance_score - a.relevance_score);

    } catch (error) {
      console.error('Fallback search failed:', error);
      return [];
    }
  }

  /**
   * Calculate simple text relevance score
   */
  private calculateSimpleRelevance(query: string, text: string): number {
    const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    const textLower = text.toLowerCase();
    
    let score = 0;
    let totalTerms = queryTerms.length;
    
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        score += 1;
      }
    }
    
    return totalTerms > 0 ? score / totalTerms : 0;
  }

  /**
   * Add a legal document to the knowledge base
   */
  async addDocument(document: KnowledgeDocument): Promise<void> {
    if (!this.vectorStore) {
      await this.initialize();
    }

    try {
      // Split document into chunks
      const chunks = await this.textSplitter.splitText(document.content);
      
      // Create Document objects for each chunk
      const docs = chunks.map((chunk, index) => new Document({
        pageContent: chunk,
        metadata: {
          source_id: document.id,
          title: document.title,
          source_type: document.source_type,
          jurisdiction: document.jurisdiction,
          legal_areas: document.legal_areas,
          authority: document.authority,
          date_enacted: document.date_enacted,
          chunk_index: index,
          total_chunks: chunks.length,
          ...document.metadata,
        },
      }));

      // Add to vector store
      await this.vectorStore!.addDocuments(docs);

      // Save document metadata to Supabase
      await this.saveDocumentMetadata(document);
      
      console.log(`Added document "${document.title}" with ${chunks.length} chunks to knowledge base`);
    } catch (error) {
      console.error('Failed to add document to knowledge base:', error);
      throw error;
    }
  }

  /**
   * Add a document from uploaded file
   */
  async addDocumentFromFile(
    file: File,
    metadata: {
      title: string;
      source_type: 'constitution' | 'act' | 'case_law' | 'regulation' | 'precedent';
      jurisdiction: string;
      legal_areas: string[];
      authority: string;
      date_enacted?: string;
    }
  ): Promise<void> {
    try {
      // Extract text from file
      const extractionResult = await documentTextExtractor.extractText(
        file,
        file.type,
        file.name
      );

      // Create knowledge document
      const knowledgeDoc: KnowledgeDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: metadata.title,
        content: extractionResult.text,
        source_type: metadata.source_type,
        jurisdiction: metadata.jurisdiction,
        legal_areas: metadata.legal_areas,
        authority: metadata.authority,
        date_enacted: metadata.date_enacted,
        metadata: {
          ...extractionResult.metadata,
          uploaded_from_file: true,
          original_filename: file.name,
        },
      };

      // Add to knowledge base
      await this.addDocument(knowledgeDoc);

    } catch (error) {
      console.error('Failed to add document from file:', error);
      throw error;
    }
  }

  /**
   * Get enhanced context for a query using multiple search strategies
   */
  async getEnhancedContext(
    query: string,
    legalArea?: string,
    jurisdiction: string = 'Kenya'
  ): Promise<{
    primary_sources: SearchResult[];
    related_cases: SearchResult[];
    applicable_statutes: SearchResult[];
    context_summary: string;
  }> {
    try {
      // Primary search for direct relevance
      const primarySources = await this.search(query, {
        topK: 5,
        legalAreas: legalArea ? [legalArea] : undefined,
        jurisdiction,
        minRelevanceScore: 0.8,
      });

      // Search for related case law
      const relatedCases = await this.search(query, {
        topK: 3,
        sourceTypes: ['case_law', 'precedent'],
        jurisdiction,
        minRelevanceScore: 0.7,
      });

      // Search for applicable statutes
      const applicableStatutes = await this.search(query, {
        topK: 3,
        sourceTypes: ['constitution', 'act', 'regulation'],
        jurisdiction,
        minRelevanceScore: 0.7,
      });

      // Generate context summary
      const allSources = [...primarySources, ...relatedCases, ...applicableStatutes];
      const contextSummary = this.generateContextSummary(allSources, query);

      return {
        primary_sources: primarySources,
        related_cases: relatedCases,
        applicable_statutes: applicableStatutes,
        context_summary: contextSummary,
      };
    } catch (error) {
      console.error('Failed to get enhanced context:', error);
      throw error;
    }
  }

  /**
   * Bulk upload documents from various sources
   */
  async bulkUpload(documents: KnowledgeDocument[]): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ document: string; error: string }>;
  }> {
    let successful = 0;
    let failed = 0;
    const errors: Array<{ document: string; error: string }> = [];

    for (const document of documents) {
      try {
        await this.addDocument(document);
        successful++;
        console.log(`✓ Successfully processed: ${document.title}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ document: document.title, error: errorMessage });
        console.error(`✗ Failed to process: ${document.title} - ${errorMessage}`);
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Update document in knowledge base
   */
  async updateDocument(documentId: string, updates: Partial<KnowledgeDocument>): Promise<void> {
    try {
      // Get existing document
      const existingDoc = await this.getSourceDocument(documentId);
      if (!existingDoc) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Create updated document
      const updatedDoc: KnowledgeDocument = { ...existingDoc, ...updates };

      // Remove old vectors (this is a simple approach - in production you might want more sophisticated updating)
      await this.removeDocument(documentId);
      
      // Add updated document
      await this.addDocument(updatedDoc);
      
      console.log(`Updated document: ${updatedDoc.title}`);
    } catch (error) {
      console.error('Failed to update document:', error);
      throw error;
    }
  }

  /**
   * Remove document from knowledge base
   */
  async removeDocument(documentId: string): Promise<void> {
    try {
      if (!this.vectorStore) {
        await this.initialize();
      }

      // Delete from vector store using metadata filter
      await this.vectorStore!.delete({
        filter: { source_id: documentId }
      });

      // Remove from Supabase
      await supabase
        .from('legal_knowledge_sources')
        .delete()
        .eq('id', documentId);

      console.log(`Removed document: ${documentId}`);
    } catch (error) {
      console.error('Failed to remove document:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the knowledge base
   */
  async getKnowledgeBaseStats(): Promise<{
    total_documents: number;
    documents_by_type: Record<string, number>;
    documents_by_area: Record<string, number>;
    last_updated: string;
  }> {
    try {
      const { data: documents } = await supabase
        .from('legal_knowledge_sources')
        .select('source_type, legal_areas, updated_at')
        .order('updated_at', { ascending: false });

      const stats = {
        total_documents: documents?.length || 0,
        documents_by_type: {} as Record<string, number>,
        documents_by_area: {} as Record<string, number>,
        last_updated: documents?.[0]?.updated_at || '',
      };

      // Calculate statistics
      documents?.forEach(doc => {
        // Count by type
        stats.documents_by_type[doc.source_type] = 
          (stats.documents_by_type[doc.source_type] || 0) + 1;

        // Count by legal area
        doc.legal_areas?.forEach((area: string) => {
          stats.documents_by_area[area] = 
            (stats.documents_by_area[area] || 0) + 1;
        });
      });

      return stats;
    } catch (error) {
      console.error('Failed to get knowledge base stats:', error);
      throw error;
    }
  }

  // Private helper methods
  private async saveDocumentMetadata(document: KnowledgeDocument): Promise<void> {
    await supabase
      .from('legal_knowledge_sources')
      .upsert({
        id: document.id,
        title: document.title,
        source_type: document.source_type,
        jurisdiction: document.jurisdiction,
        date_enacted: document.date_enacted,
        legal_areas: document.legal_areas,
        authority: document.authority,
        content_preview: document.content.substring(0, 500),
        content_length: document.content.length,
        metadata: document.metadata,
        indexed_at: new Date().toISOString(),
      });
  }

  private async getSourceDocument(sourceId: string): Promise<KnowledgeDocument | null> {
    const { data } = await supabase
      .from('legal_knowledge_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      content: data.content || data.content_preview,
      source_type: data.source_type,
      jurisdiction: data.jurisdiction,
      date_enacted: data.date_enacted,
      legal_areas: data.legal_areas || [],
      authority: data.authority,
      metadata: data.metadata || {},
    };
  }

  private generateContextSummary(sources: SearchResult[], query: string): string {
    if (sources.length === 0) {
      return 'No relevant legal sources found for this query.';
    }

    const sourceTypes = [...new Set(sources.map(s => s.document.source_type))];
    const legalAreas = [...new Set(sources.flatMap(s => s.document.legal_areas))];
    
    return `Found ${sources.length} relevant sources including ${sourceTypes.join(', ')} covering ${legalAreas.join(', ')}. Average relevance: ${(sources.reduce((acc, s) => acc + s.relevance_score, 0) / sources.length).toFixed(2)}.`;
  }
}

// Export singleton instance
export const vectorKnowledgeBase = new VectorKnowledgeBase();
