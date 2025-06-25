import { NextRequest, NextResponse } from 'next/server';
import { ContractAIService } from '@/lib/ai/contracts/contract-generation';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const contractService = new ContractAIService();

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sessionId, data } = body;

    switch (action) {
      case 'start':
        const { description, templateId, parties } = data;
        const startResponse = await contractService.startContractGeneration({
          user_id: session.user.id,
          template_id: templateId,
          description,
          parties,
        });
        return NextResponse.json(startResponse);

      case 'process_step':
        const { stepNumber, userInput } = data;
        const stepResponse = await contractService.processGenerationStep(
          sessionId,
          stepNumber,
          userInput
        );
        return NextResponse.json(stepResponse);

      case 'finalize':
        const finalResponse = await contractService.generateFinalContract(sessionId);
        return NextResponse.json(finalResponse);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Contract generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific contract generation session
      const contractSession = await contractService.getGenerationSession(
        sessionId,
        session.user.id
      );
      return NextResponse.json(contractSession);
    } else {
      // Get contract templates
      const templates = await contractService.getAIContractTemplates();
      return NextResponse.json(templates);
    }
  } catch (error) {
    console.error('Contract generation history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
