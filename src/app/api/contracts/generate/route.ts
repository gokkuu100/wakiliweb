import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    const { action, ...data } = requestData;

    switch (action) {
      case 'generate':
        return await handleContractGeneration(session, data);
      
      case 'get_templates':
        return await handleGetTemplates(session, data);
      
      case 'start_generation':
        return await handleStartGeneration(session, data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in contract API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleContractGeneration(session: any, data: any) {
  try {
    // Call FastAPI backend for contract generation
    const response = await fetch(`${BACKEND_URL}/api/v1/contracts/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: data.templateId,
        title: data.title,
        description: data.description,
        parties: data.parties || [],
        jurisdiction: data.jurisdiction || 'Kenya',
        language: data.language || 'en',
        complexity: data.complexity || 'standard'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}

async function handleGetTemplates(session: any, data: any) {
  try {
    const params = new URLSearchParams();
    if (data.category) params.append('category', data.category);
    if (data.pricing_tier) params.append('pricing_tier', data.pricing_tier);

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
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

async function handleStartGeneration(session: any, data: any) {
  try {
    // Create a generation session for step-by-step contract creation
    const sessionData = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      template_id: data.templateId,
      completion_percentage: 0,
      status: 'started',
      created_at: new Date().toISOString()
    };

    // Store session in database or cache (for now, return mock data)
    return NextResponse.json({
      success: true,
      session: sessionData,
      next_step: {
        step_number: 1,
        step_title: 'Basic Information',
        step_description: 'Provide basic contract details',
        required_input: ['title', 'parties'],
        ai_assistance: 'I can help you structure this contract properly.'
      }
    });

  } catch (error) {
    console.error('Error starting generation:', error);
    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    );
  }
}
