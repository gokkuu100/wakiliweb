import { NextRequest, NextResponse } from 'next/server';
import { knowledgeAdmin } from '@/lib/citizenlib/core/knowledge-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may want to implement role-based access)
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'documents':
        const category = searchParams.get('category') || undefined;
        const documentType = searchParams.get('document_type') || undefined;
        const search = searchParams.get('search') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const documents = await knowledgeAdmin.getKnowledgeDocuments(
          { category, document_type: documentType, search },
          { limit, offset }
        );
        return NextResponse.json(documents);

      case 'stats':
        const stats = await knowledgeAdmin.getKnowledgeBaseStats();
        return NextResponse.json(stats);

      case 'test-search':
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
        }
        const testLimit = parseInt(searchParams.get('limit') || '5');
        const testResults = await knowledgeAdmin.testSearch(query, testLimit);
        return NextResponse.json(testResults);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Knowledge admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'upload': {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const metadata = JSON.parse(formData.get('metadata') as string);

        if (!file) {
          return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const result = await knowledgeAdmin.uploadDocument(file, metadata);
        return NextResponse.json(result);
      }

      case 'bulk-upload': {
        const body = await request.json();
        const { files } = body;

        // Note: This is a simplified version. In practice, you'd need to handle file uploads differently
        // You might want to use a separate endpoint for file uploads and then process them here
        const results = await knowledgeAdmin.bulkUploadDocuments(files);
        return NextResponse.json(results);
      }

      case 'reindex': {
        const result = await knowledgeAdmin.reindexKnowledgeBase();
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Knowledge admin POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const updates = await request.json();
    const result = await knowledgeAdmin.updateDocument(documentId, updates);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Knowledge admin PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const result = await knowledgeAdmin.deleteDocument(documentId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Knowledge admin DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
