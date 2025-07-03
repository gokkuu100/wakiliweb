import { NextRequest, NextResponse } from 'next/server';
import { documentAnalysis } from '@/lib/citizenlib/documents/document-analysis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const analysisType = formData.get('analysisType') as string;
    const focusAreas = formData.get('focusAreas') ? 
      JSON.parse(formData.get('focusAreas') as string) : [];
    const jurisdiction = formData.get('jurisdiction') as string || 'Kenya';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!analysisType) {
      return NextResponse.json({ error: 'Analysis type required' }, { status: 400 });
    }

    const validAnalysisTypes = ['summary', 'legal_review', 'risk_assessment', 'compliance_check', 'contract_analysis'];
    if (!validAnalysisTypes.includes(analysisType)) {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' }, { status: 400 });
    }

    const result = await documentAnalysis.analyzeDocument({
      file,
      userId: session.user.id,
      analysisType: analysisType as 'summary' | 'legal_review' | 'risk_assessment' | 'compliance_check' | 'contract_analysis',
      focusAreas,
      jurisdiction
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Document analysis failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (documentId) {
      // Get specific document analysis
      const document = await documentAnalysis.getDocumentAnalysis(documentId, session.user.id);
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json(document);
    } else {
      // Get user's document history
      const documents = await documentAnalysis.getUserDocuments(session.user.id, limit);
      return NextResponse.json({ documents });
    }

  } catch (error) {
    console.error('Document retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}
