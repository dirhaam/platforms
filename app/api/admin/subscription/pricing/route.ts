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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const currency = request.nextUrl.searchParams.get('currency') || 'IDR';

    const { data: pricing, error } = await supabase
      .from('subscription_pricing')
      .select('*')
      .eq('currency', currency)
      .eq('status', 'active')
      .order('plan', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pricing });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { plan, currency, monthlyPrice, annualPrice, description, status } = body;

    if (!plan || !currency) {
      return NextResponse.json(
        { error: 'Plan and currency are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('subscription_pricing')
      .update({
        monthly_price: monthlyPrice,
        annual_price: annualPrice,
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('plan', plan)
      .eq('currency', currency)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pricing: data });
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}
