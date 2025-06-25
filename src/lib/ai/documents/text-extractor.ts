import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { supabase } from '@/lib/supabase';

export interface DocumentExtractionResult {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    language?: string;
    extractedAt: string;
    fileType: string;
    fileSize: number;
  };
}

export class DocumentTextExtractor {
  
  /**
   * Extract text from various document types
   */
  async extractText(
    file: File | Buffer,
    fileType: string,
    fileName?: string
  ): Promise<DocumentExtractionResult> {
    try {
      let buffer: Buffer;
      
      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer());
      } else {
        buffer = file;
      }

      let extractedText = '';
      let pageCount: number | undefined;

      switch (fileType.toLowerCase()) {
        case 'application/pdf':
        case 'pdf':
          const pdfResult = await this.extractFromPDF(buffer);
          extractedText = pdfResult.text;
          pageCount = pdfResult.numpages;
          break;

        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'docx':
        case 'doc':
          extractedText = await this.extractFromDOCX(buffer);
          break;

        case 'text/plain':
        case 'txt':
          extractedText = buffer.toString('utf-8');
          break;

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Clean and process the text
      const cleanedText = this.cleanExtractedText(extractedText);
      const wordCount = this.countWords(cleanedText);

      return {
        text: cleanedText,
        metadata: {
          pageCount,
          wordCount,
          extractedAt: new Date().toISOString(),
          fileType,
          fileSize: buffer.length,
          language: this.detectLanguage(cleanedText),
        },
      };

    } catch (error) {
      console.error('Error extracting text from document:', error);
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractFromPDF(buffer: Buffer): Promise<{ text: string; numpages: number }> {
    try {
      const data = await pdf(buffer);
      return {
        text: data.text,
        numpages: data.numpages,
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOCX files
   */
  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages.length > 0) {
        console.warn('DOCX extraction warnings:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  /**
   * Clean extracted text by removing unnecessary whitespace and formatting
   */
  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Remove page numbers and headers/footers patterns
      .replace(/^Page \d+ of \d+/gm, '')
      .replace(/^\d+$/gm, '')
      // Remove repeated dashes or underscores
      .replace(/[-_]{3,}/g, '')
      // Fix spacing around punctuation
      .replace(/\s+([.,:;!?])/g, '$1')
      .replace(/([.,:;!?])\s+/g, '$1 ')
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Simple language detection (basic implementation)
   */
  private detectLanguage(text: string): string {
    // Simple keyword-based detection for English/Swahili
    const englishKeywords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const swahiliKeywords = ['na', 'au', 'lakini', 'katika', 'kwa', 'ya', 'wa', 'za', 'la'];
    
    const words = text.toLowerCase().split(/\s+/).slice(0, 100); // Check first 100 words
    
    let englishCount = 0;
    let swahiliCount = 0;
    
    words.forEach(word => {
      if (englishKeywords.includes(word)) englishCount++;
      if (swahiliKeywords.includes(word)) swahiliCount++;
    });
    
    if (englishCount > swahiliCount) return 'en';
    if (swahiliCount > englishCount) return 'sw';
    return 'unknown';
  }

  /**
   * Extract text from a document stored in Supabase storage
   */
  async extractFromStoredDocument(
    userId: string,
    filePath: string,
    fileType: string
  ): Promise<DocumentExtractionResult> {
    try {
      // Download file from Supabase storage
      const { data: fileData, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // Convert to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());
      
      // Extract text
      return await this.extractText(buffer, fileType);
      
    } catch (error) {
      console.error('Error extracting from stored document:', error);
      throw error;
    }
  }

  /**
   * Batch extract text from multiple documents
   */
  async batchExtractText(
    documents: Array<{
      id: string;
      filePath: string;
      fileType: string;
      title: string;
    }>
  ): Promise<Array<{
    documentId: string;
    success: boolean;
    result?: DocumentExtractionResult;
    error?: string;
  }>> {
    const results = [];

    for (const doc of documents) {
      try {
        const result = await this.extractFromStoredDocument(
          'system', // Using system user for batch operations
          doc.filePath,
          doc.fileType
        );

        results.push({
          documentId: doc.id,
          success: true,
          result,
        });

        console.log(`✓ Successfully extracted text from: ${doc.title}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          documentId: doc.id,
          success: false,
          error: errorMessage,
        });

        console.error(`✗ Failed to extract text from: ${doc.title} - ${errorMessage}`);
      }
    }

    return results;
  }

  /**
   * Get document chunks for large documents
   */
  getDocumentChunks(
    text: string,
    chunkSize: number = 1000,
    overlap: number = 200
  ): Array<{
    text: string;
    index: number;
    start: number;
    end: number;
  }> {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunkText = text.slice(start, end);

      chunks.push({
        text: chunkText,
        index: chunks.length,
        start,
        end,
      });

      // Move start position, accounting for overlap
      start = end - overlap;
      
      // Ensure we don't go backwards
      if (start <= chunks[chunks.length - 1]?.start) {
        start = end;
      }
    }

    return chunks;
  }

  /**
   * Identify potential legal sections in extracted text
   */
  identifyLegalSections(text: string): Array<{
    type: string;
    content: string;
    position: { start: number; end: number };
  }> {
    const sections: Array<{
      type: string;
      content: string;
      position: { start: number; end: number };
    }> = [];
    
    // Patterns for common legal document sections
    const patterns = [
      {
        type: 'clause',
        regex: /\b(?:clause|section|article)\s+\d+[.\s]/gi,
      },
      {
        type: 'definition',
        regex: /"[^"]+" (?:means|refers to|includes)/gi,
      },
      {
        type: 'whereas',
        regex: /\bwhereas\b[^.;]+[.;]/gi,
      },
      {
        type: 'therefore',
        regex: /\b(?:now therefore|therefore)\b[^.;]+[.;]/gi,
      },
      {
        type: 'party_reference',
        regex: /\b(?:the|said|aforementioned)?\s*(?:plaintiff|defendant|applicant|respondent|petitioner|party|parties)\b/gi,
      },
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        sections.push({
          type: pattern.type,
          content: match[0].trim(),
          position: {
            start: match.index,
            end: match.index + match[0].length,
          },
        });
      }
    });

    return sections.sort((a, b) => a.position.start - b.position.start);
  }
}

// Export singleton instance
export const documentTextExtractor = new DocumentTextExtractor();
