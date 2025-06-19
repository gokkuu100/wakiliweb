import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type?: string;
  status: string;
  upload_source: string;
  created_at: string;
  updated_at: string;
  contract_id?: string;
  case_id?: string;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  analysis_type: string;
  summary?: string;
  key_points: string[];
  risk_level?: string;
  risk_factors: string[];
  legal_citations: string[];
  recommendations: string[];
  confidence_score?: number;
  created_at: string;
}

export interface DocumentWithAnalysis extends Document {
  analyses: DocumentAnalysis[];
}

// Get all documents for a user
export async function getUserDocuments(userId: string): Promise<Document[]> {
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return documents || [];
  } catch (error) {
    console.error('Error fetching user documents:', error);
    throw error;
  }
}

// Get documents with analyses
export async function getDocumentsWithAnalyses(userId: string): Promise<DocumentWithAnalysis[]> {
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select(`
        *,
        document_analyses (
          id,
          analysis_type,
          summary,
          key_points,
          risk_level,
          risk_factors,
          legal_citations,
          recommendations,
          confidence_score,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return documents?.map(doc => ({
      ...doc,
      analyses: doc.document_analyses || []
    })) || [];
  } catch (error) {
    console.error('Error fetching documents with analyses:', error);
    throw error;
  }
}

// Get document by ID
export async function getDocument(userId: string, documentId: string): Promise<DocumentWithAnalysis | null> {
  try {
    const { data: document } = await supabase
      .from('documents')
      .select(`
        *,
        document_analyses (
          id,
          analysis_type,
          summary,
          key_points,
          risk_level,
          risk_factors,
          legal_citations,
          recommendations,
          confidence_score,
          created_at
        )
      `)
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (!document) return null;

    return {
      ...document,
      analyses: document.document_analyses || []
    };
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

// Upload document
export async function uploadDocument(
  userId: string,
  file: File,
  documentType?: string,
  contractId?: string,
  caseId?: string
): Promise<string> {
  try {
    // Check document analysis limit
    const canAnalyze = await supabase.rpc('check_usage_limit', {
      p_user_id: userId,
      p_usage_type: 'document_analysis'
    });

    if (!canAnalyze.data) {
      throw new Error('Document analysis limit reached');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        filename: fileName,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_path: uploadData.path,
        document_type: documentType,
        contract_id: contractId,
        case_id: caseId,
        status: 'uploaded'
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // Track usage
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_usage_type: 'document_analysis',
      p_resource_id: document.id
    });

    return document.id;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

// Create document analysis
export async function createDocumentAnalysis(
  userId: string,
  documentId: string,
  analysisData: {
    analysis_type: string;
    summary?: string;
    key_points?: string[];
    risk_level?: string;
    risk_factors?: string[];
    legal_citations?: string[];
    recommendations?: string[];
    confidence_score?: number;
    processing_time_ms?: number;
    ai_model_version?: string;
    tokens_used?: number;
    raw_analysis?: any;
  }
): Promise<string> {
  try {
    const { data: analysis, error } = await supabase
      .from('document_analyses')
      .insert({
        document_id: documentId,
        user_id: userId,
        ...analysisData
      })
      .select('id')
      .single();

    if (error) throw error;

    // Update document status
    await supabase
      .from('documents')
      .update({ 
        status: 'analyzed',
        ai_processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    return analysis.id;
  } catch (error) {
    console.error('Error creating document analysis:', error);
    throw error;
  }
}

// Get document analyses
export async function getDocumentAnalyses(userId: string, documentId: string): Promise<DocumentAnalysis[]> {
  try {
    const { data: analyses } = await supabase
      .from('document_analyses')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return analyses || [];
  } catch (error) {
    console.error('Error fetching document analyses:', error);
    throw error;
  }
}

// Search documents
export async function searchDocuments(userId: string, searchTerm: string): Promise<Document[]> {
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .or(`original_filename.ilike.%${searchTerm}%,document_type.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    return documents || [];
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

// Delete document
export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  try {
    // Get document info first
    const { data: document } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (document) {
      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      // Delete from database (analyses will be deleted via cascade)
      await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Get document usage stats
export async function getDocumentUsageStats(userId: string): Promise<{
  documentsUploaded: number;
  documentsAnalyzed: number;
  analysesUsed: number;
  analysesLimit: number | null;
}> {
  try {
    const { count: documentsUploaded } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: documentsAnalyzed } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'analyzed');

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        documents_analyzed_used,
        subscription_plans (
          document_analysis_limit
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return {
      documentsUploaded: documentsUploaded || 0,
      documentsAnalyzed: documentsAnalyzed || 0,
      analysesUsed: subscription?.documents_analyzed_used || 0,
      analysesLimit: subscription?.subscription_plans?.document_analysis_limit
    };
  } catch (error) {
    console.error('Error fetching document usage stats:', error);
    throw error;
  }
}

// Update document processing status
export async function updateDocumentStatus(
  documentId: string,
  status: string,
  error?: string
): Promise<void> {
  try {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'processing') {
      updateData.ai_processing_started_at = new Date().toISOString();
    } else if (status === 'failed') {
      updateData.ai_processing_error = error;
    }

    await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}