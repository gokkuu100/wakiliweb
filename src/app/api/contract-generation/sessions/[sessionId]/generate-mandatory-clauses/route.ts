import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await request.json();

    console.log('🚀 Frontend API: Generate mandatory clauses for session:', sessionId);
    console.log('📝 Request body:', body);

    // Validate required fields
    if (!body.explanation || body.explanation.trim().length === 0) {
      return NextResponse.json(
        { error: 'Contract explanation is required' },
        { status: 400 }
      );
    }

    if (!body.mandatory_fields) {
      return NextResponse.json(
        { error: 'Mandatory fields are required' },
        { status: 400 }
      );
    }

    if (!body.template_id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Validate word count (minimum 200 words)
    const wordCount = body.explanation.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    if (wordCount < 200) {
      return NextResponse.json(
        { 
          error: `Contract explanation must contain at least 200 words. Current: ${wordCount} words.` 
        },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed. Making backend request...');

    // Get auth header from the original request
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);

    // Prepare backend request
    const backendUrl = `${BACKEND_URL}/api/v1/contract-generation/sessions/${sessionId}/analyze-requirements`;
    console.log('Forwarding to backend URL:', backendUrl);

    // Make request to backend
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify({
        explanation: body.explanation,
        mandatory_fields: body.mandatory_fields,
        template_id: body.template_id,
        user_context: body.user_context || {}
      }),
    });

    console.log('Backend response status:', response.status);

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { 
          error: `Backend error: ${response.status} ${response.statusText}`,
          details: errorText
        };
      }
      
      console.error('❌ Backend error:', errorData);
      
      return NextResponse.json(
        { 
          error: errorData.detail || errorData.error || 'Failed to generate mandatory clauses',
          details: errorData
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Backend response received successfully');
    console.log('📄 Backend response data:', result);
    console.log('📄 Generated clauses count:', result.generated_clauses?.length || 0);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
