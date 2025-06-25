import { NextRequest, NextResponse } from 'next/server';
import { aiMonitoring } from '@/lib/ai/core/monitoring';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'health':
        const health = await aiMonitoring.getSystemHealth();
        return NextResponse.json(health);

      case 'errors':
        const limit = parseInt(searchParams.get('limit') || '50');
        const severity = searchParams.get('severity') || undefined;
        const errors = await aiMonitoring.getRecentErrors(limit, severity);
        return NextResponse.json({ errors });

      case 'performance':
        const days = parseInt(searchParams.get('days') || '7');
        const trends = await aiMonitoring.getPerformanceTrends(days);
        return NextResponse.json(trends);

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
