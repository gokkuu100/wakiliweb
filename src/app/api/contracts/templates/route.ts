import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const pricing_tier = searchParams.get('pricing_tier');
    const is_public = searchParams.get('is_public') !== 'false';

    // Build query string
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (pricing_tier) params.append('pricing_tier', pricing_tier);
    params.append('is_public', is_public.toString());

    // Call FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/v1/contracts/templates?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const templates = await response.json();
    return NextResponse.json(templates);

  } catch (error) {
    console.error('Error fetching contract templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateData = await request.json();

    // Call FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/v1/contracts/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const template = await response.json();
    return NextResponse.json(template);

  } catch (error) {
    console.error('Error creating contract template:', error);
    return NextResponse.json(
      { error: 'Failed to create contract template' },
      { status: 500 }
    );
  }
}
