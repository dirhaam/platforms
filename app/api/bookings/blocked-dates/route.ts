export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BlockedDateRequest {
  tenantId: string;
  date: string; // ISO string
  reason?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string; // ISO string
}

// GET - Fetch blocked dates for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const year = searchParams.get('year');   // Format: YYYY

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('blocked_dates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: true });

    // Filter by month if provided
    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ blockedDates: data || [] });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked dates' },
      { status: 500 }
    );
  }
}

// POST - Create a blocked date
export async function POST(request: NextRequest) {
  try {
    const body: BlockedDateRequest = await request.json();
    const { tenantId, date, reason, isRecurring, recurringPattern, recurringEndDate } = body;

    if (!tenantId || !date) {
      return NextResponse.json(
        { error: 'tenantId and date are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('blocked_dates')
      .insert([
        {
          tenant_id: tenantId,
          date: new Date(date).toISOString(),
          reason,
          is_recurring: isRecurring || false,
          recurring_pattern: recurringPattern,
          recurring_end_date: recurringEndDate ? new Date(recurringEndDate).toISOString() : null,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { blockedDate: data?.[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating blocked date:', error);
    return NextResponse.json(
      { error: 'Failed to create blocked date' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a blocked date
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    return NextResponse.json(
      { error: 'Failed to delete blocked date' },
      { status: 500 }
    );
  }
}
