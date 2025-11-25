import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth/auth-middleware';

export const runtime = 'nodejs';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const limit = request.nextUrl.searchParams.get('limit') || '20';

    const { data: history, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription history' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const {
      oldPlan,
      newPlan,
      oldStatus,
      newStatus,
      oldExpiresAt,
      newExpiresAt,
      changeReason,
    } = body;

    if (!newPlan || !newStatus) {
      return NextResponse.json(
        { error: 'New plan and status are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('subscription_history')
      .insert({
        tenant_id: id,
        old_plan: oldPlan,
        new_plan: newPlan,
        old_status: oldStatus,
        new_status: newStatus,
        old_expires_at: oldExpiresAt,
        new_expires_at: newExpiresAt,
        change_reason: changeReason,
        changed_by: session.userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create history record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history: data });
  } catch (error) {
    console.error('Error creating subscription history:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription history' },
      { status: 500 }
    );
  }
}
