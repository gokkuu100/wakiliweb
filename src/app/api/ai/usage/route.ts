import { NextRequest, NextResponse } from 'next/server';
import { aiTracking } from '@/lib/ai/tracking/usage-tracking';
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
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'overview':
        const overview = await aiTracking.getUserLimitsAndUsage(session.user.id);
        return NextResponse.json(overview);

      case 'analytics':
        const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'monthly';
        const analytics = await aiTracking.getUserAnalytics(session.user.id, period);
        return NextResponse.json(analytics);

      case 'system':
        const systemPeriod = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'daily';
        const systemMetrics = await aiTracking.getSystemMetrics(systemPeriod);
        return NextResponse.json(systemMetrics);

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
