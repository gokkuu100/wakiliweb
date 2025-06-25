import { NextRequest, NextResponse } from 'next/server';
import { LegalChatService } from '@/lib/ai/chat/legal-chat';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const legalChatService = new LegalChatService();

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId, legalArea } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const chatRequest = {
      user_id: session.user.id,
      message,
      conversation_id: conversationId,
      context: legalArea ? { legal_area: legalArea } : undefined,
    };

    const response = await legalChatService.sendMessage(chatRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get specific conversation with messages
      const conversation = await legalChatService.getConversation(
        conversationId,
        session.user.id
      );
      return NextResponse.json(conversation);
    } else {
      // Get chat history
      const history = await legalChatService.getChatHistory(session.user.id, limit);
      return NextResponse.json(history);
    }
  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
