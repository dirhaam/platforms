import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch blocked dates for a tenant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ blockedDates: [] });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve tenant if subdomain
    let resolvedTenantId = tenantId;
    if (tenantId.length !== 36) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId.toLowerCase())
        .single();
      
      if (!tenant) {
        return NextResponse.json({ blockedDates: [] });
      }
      resolvedTenantId = tenant.id;
    }

    const { data, error } = await supabase
      .from('blocked_dates')
      .select('id, date, reason')
      .eq('tenant_id', resolvedTenantId)
      .order('date', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[blocked-dates] Error:', error);
      return NextResponse.json({ blockedDates: [] });
    }

    return NextResponse.json({ blockedDates: data || [] });
  } catch (error) {
    console.error('[blocked-dates] Error:', error);
    return NextResponse.json({ blockedDates: [] });
  }
}

// POST - Create a blocked date
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { tenantId, date, reason } = body;

    if (!tenantId || !date) {
      return NextResponse.json({ error: 'tenantId and date are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blocked_dates')
      .insert([{ tenant_id: tenantId, date: new Date(date).toISOString(), reason }])
      .select();

    if (error) {
      console.error('[blocked-dates POST] Error:', error);
      return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }

    return NextResponse.json({ blockedDate: data?.[0] }, { status: 201 });
  } catch (error) {
    console.error('[blocked-dates POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create blocked date' }, { status: 500 });
  }
}

// DELETE - Remove a blocked date
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase.from('blocked_dates').delete().eq('id', id);

    if (error) {
      console.error('[blocked-dates DELETE] Error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[blocked-dates DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete blocked date' }, { status: 500 });
  }
}
