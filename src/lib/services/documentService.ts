// Document service for interacting with the backend API

import { 
  Document, 
  DocumentUploadRequest, 
  DocumentUploadResponse, 
  DocumentAnalysis, 
  DocumentQuestion, 
  DocumentStats,
  ChatMessage 
} from '@/types/documents';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class DocumentService {
  private async getAuthHeaders() {
    // Get the JWT token from Supabase session
    const { supabase } = await import('@/lib/supabase');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async getAuthHeadersForUpload() {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type for multipart form data
    };
  }

  async uploadDocument(file: File, options: Partial<DocumentUploadRequest> = {}): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', options.document_type || 'other');
    formData.append('enable_ai_analysis', String(options.enable_ai_analysis ?? true));
    
    if (options.description) {
      formData.append('description', options.description);
    }
    
    if (options.tags && options.tags.length > 0) {
      formData.append('tags', JSON.stringify(options.tags));
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: await this.getAuthHeadersForUpload(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  async getUserDocuments(): Promise<{ documents: Document[]; total: number; has_more: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.status}`);
    }

    return response.json();
  }

  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }

    return response.json();
  }

  async getDocumentStatus(documentId: string): Promise<{ 
    status: string; 
    ai_analysis_status?: string; 
    progress?: number; 
    questions_used?: number;
    questions_remaining?: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/status`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document status: ${response.status}`);
    }

    return response.json();
  }

  async getDocumentAnalysis(documentId: string): Promise<DocumentAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/analysis`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document analysis: ${response.status}`);
    }

    return response.json();
  }

  async askQuestion(documentId: string, question: string): Promise<{
    answer: string;
    confidence: number;
    sources: Array<{
      chunk_id: string;
      content_preview: string;
      page_number?: number;
      similarity_score: number;
    }>;
    question_id: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/ask`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Question failed' }));
      throw new Error(errorData.error || `Question failed: ${response.status}`);
    }

    return response.json();
  }

  async askDocumentQuestion(documentId: string, question: string): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/ask`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        question: question.trim()
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to ask question: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Transform the response to match our ChatMessage format
    return {
      id: data.id || crypto.randomUUID(),
      type: 'assistant',
      content: data.answer,
      timestamp: data.created_at || new Date().toISOString(),
      sources: data.source_chunks?.map((chunk: any) => ({
        chunk_id: chunk.id || '',
        content_preview: chunk.content?.substring(0, 200) + '...' || '',
        page_number: chunk.page_number,
        similarity_score: chunk.similarity_score || 0
      })) || []
    };
  }

  async getDocumentQuestions(documentId: string): Promise<{ questions: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/questions`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document questions: ${response.status}`);
    }

    return response.json();
  }

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.status}`);
    }
  }

  async reprocessDocument(documentId: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/reprocess`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to reprocess document: ${response.status}`);
    }

    return response.json();
  }

  async getUserStats(): Promise<DocumentStats> {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/stats`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user stats: ${response.status}`);
    }

    const result = await response.json();
    // The backend returns data wrapped in a 'data' field
    return result.data || result;
  }

  // Utility method to poll document status until processing is complete
  async pollDocumentStatus(
    documentId: string, 
    onUpdate: (status: any) => void,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<void> {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const status = await this.getDocumentStatus(documentId);
        onUpdate(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          return; // Processing complete
        }
        
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, intervalMs);
        }
      } catch (error) {
        console.error('Error polling document status:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, intervalMs);
        }
      }
    };
    
    poll();
  }
}

export const documentService = new DocumentService();
