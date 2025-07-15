// API route for searching users
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    console.log('Search user API route called');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    // Forward request to FastAPI backend
    const backendUrl = `${BACKEND_URL}/api/v1/contract-generation/search-user`;
    console.log('Forwarding to backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      },
      body: JSON.stringify(body)
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);

    if (!response.ok) {
      console.error('Backend error:', data);
      return NextResponse.json(
        { error: data.detail || 'Failed to search user' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in search-user API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
