// API route for analyzing contract and generating clauses
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  console.log('🔍 GET request to analyze-requirements API route');
  const { sessionId } = await params;
  console.log('📋 Session ID:', sessionId);
  
  return NextResponse.json({ 
    message: 'API route is working', 
    sessionId,
    method: 'GET',
    timestamp: new Date().toISOString()
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  console.log('🚀 ANALYZE-REQUIREMENTS API ROUTE CALLED!');
  
  try {
    const { sessionId } = await params;
    const body = await request.json();
    
    console.log('🚀 Frontend API route called - analyze-requirements');
    console.log('📋 Session ID:', sessionId);
    console.log('📝 Request body keys:', Object.keys(body));
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    console.log('🔐 Auth header present:', !!authHeader);
    console.log('🌐 Backend URL:', BACKEND_URL);
    
    const backendUrl = `${BACKEND_URL}/api/v1/contract-generation/sessions/${sessionId}/analyze-requirements`;
    console.log('📡 Full backend URL:', backendUrl);
    
    // Forward request to FastAPI backend
    console.log('📡 Forwarding request to backend...');
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      },
      body: JSON.stringify(body)
    });

    console.log('📡 Backend response status:', response.status);
    console.log('📡 Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    console.log('📄 Backend response data keys:', Object.keys(data));
    console.log('📄 Backend response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ Backend error:', data);
      return NextResponse.json(
        { error: data.detail || 'Failed to analyze contract' },
        { status: response.status }
      );
    }

    console.log('✅ Successfully forwarded request to backend');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in analyze-requirements API route:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + String(error) },
      { status: 500 }
    );
  }
}
