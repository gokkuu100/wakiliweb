import { NextRequest, NextResponse } from 'next/server';
import { makeAuthenticatedRequest } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await request.json();

    console.log('🔄 Frontend API: Reanalyze clause for session:', sessionId);
    console.log('📝 Request body:', body);

    // Validate required fields
    if (!body.clause_id) {
      return NextResponse.json(
        { error: 'Clause ID is required' },
        { status: 400 }
      );
    }

    if (!body.user_modifications || body.user_modifications.trim().length === 0) {
      return NextResponse.json(
        { error: 'User modifications are required for reanalysis' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed. Making backend request...');

    // Make request to backend
    const response = await makeAuthenticatedRequest(
      `/api/v1/contract-generation/sessions/${sessionId}/reanalyze-clause`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clause_id: body.clause_id,
          user_modifications: body.user_modifications,
          approved: false // For reanalysis, we always reject with modifications
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `Backend error: ${response.status} ${response.statusText}` 
      }));
      
      console.error('❌ Backend error:', errorData);
      
      return NextResponse.json(
        { 
          error: errorData.detail || errorData.error || 'Failed to reanalyze clause',
          details: errorData
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Backend response received successfully');

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
