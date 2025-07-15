// API route for downloading contract PDF
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Forward request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/v1/contract-generation/sessions/${sessionId}/pdf`, {
      method: 'GET',
      headers: {
        ...(authHeader && { 'Authorization': authHeader })
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to download contract' },
        { status: response.status }
      );
    }

    // Get the PDF blob and forward it
    const pdfBuffer = await response.arrayBuffer();
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=contract_${sessionId.slice(0, 8)}.pdf`
      }
    });
  } catch (error) {
    console.error('Error in download API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
