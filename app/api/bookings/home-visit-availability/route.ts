export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * HOME VISIT AVAILABILITY - SIMPLIFIED
 * 
 * Logic:
 * 1. Get service config (daily_home_visit_quota, home_visit_time_slots)
 * 2. Count existing home visit bookings for that date
 * 3. Return available slots (no staff availability check)
 */

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

async function resolveTenantId(tenantIdentifier: string, supabase: any): Promise<string | null> {
  const isUUID = tenantIdentifier.length === 36;
  if (isUUID) return tenantIdentifier;
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', tenantIdentifier)
    .single();
  
  return tenant?.id || null;
}

// GET /api/bookings/home-visit-availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const queryTenantId = searchParams.get('tenantId');
    const tenantIdentifier = headerTenantId ?? queryTenantId;

    if (!tenantIdentifier) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const resolvedTenantId = await resolveTenantId(tenantIdentifier, supabase);
    
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date'); // YYYY-MM-DD format

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'serviceId and date are required' },
        { status: 400 }
      );
    }

    // 1. Get service configuration
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('tenant_id', resolvedTenantId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if service supports home visit
    if (service.service_type === 'on_premise') {
      return NextResponse.json({ 
        error: 'This service does not support home visit',
        slots: [],
        isHomeVisitSupported: false
      }, { status: 400 });
    }

    // 2. Get global home visit settings from tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('home_visit_config')
      .eq('id', resolvedTenantId)
      .single();

    const globalConfig = tenant?.home_visit_config || {
      enabled: true,
      dailyQuota: 3,
      timeSlots: ['09:00', '13:00', '16:00'],
    };

    // Check if home visit is enabled globally
    if (!globalConfig.enabled) {
      return NextResponse.json({ 
        error: 'Home visit is not enabled',
        slots: [],
        isHomeVisitSupported: false
      }, { status: 400 });
    }

    // Use global settings (priority) or fallback to service settings
    const dailyQuota = globalConfig.dailyQuota || service.daily_home_visit_quota || 3;
    const timeSlots: string[] = globalConfig.timeSlots || service.home_visit_time_slots || ['09:00', '13:00', '16:00'];
    const serviceDuration = service.duration || 60;

    // 3. Check blocked dates
    const { data: blockedDate } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('tenant_id', resolvedTenantId)
      .gte('date', `${date}T00:00:00`)
      .lte('date', `${date}T23:59:59`)
      .limit(1);

    if (blockedDate && blockedDate.length > 0) {
      return NextResponse.json({
        date,
        slots: [],
        isBlocked: true,
        message: 'This date is blocked'
      });
    }

    // 4. Count existing home visit bookings for ALL services on this date (global quota)
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, scheduled_at, status')
      .eq('tenant_id', resolvedTenantId)
      .eq('is_home_visit', true)
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('Error fetching existing bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
    }

    const bookedCount = existingBookings?.length || 0;
    const remainingQuota = Math.max(0, dailyQuota - bookedCount);

    // 5. Get booked time slots
    const bookedTimes = new Set(
      (existingBookings || []).map(b => {
        const bookingDate = new Date(b.scheduled_at);
        return `${String(bookingDate.getHours()).padStart(2, '0')}:${String(bookingDate.getMinutes()).padStart(2, '0')}`;
      })
    );

    // 6. Generate available slots - SIMPLIFIED (no staff availability check)
    const [year, month, day] = date.split('-').map(Number);
    const slots = timeSlots.map((timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const slotStart = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
      
      const isBooked = bookedTimes.has(timeStr);
      const isAvailable = !isBooked && remainingQuota > 0;

      return {
        time: timeStr,
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
        isBooked
      };
    });

    // 7. Check if all slots are booked
    const availableSlots = slots.filter(s => s.available);

    return NextResponse.json({
      date,
      serviceId,
      serviceName: service.name,
      serviceDuration,
      isHomeVisitSupported: true,
      dailyQuota,
      bookedCount,
      remainingQuota,
      slots,
      availableSlots: availableSlots.length,
      message: remainingQuota === 0 
        ? 'All home visit slots are fully booked for this date' 
        : `${availableSlots.length} slot(s) available`
    });

  } catch (error) {
    console.error('Error in home-visit-availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
