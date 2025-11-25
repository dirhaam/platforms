export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

interface HomeVisitConfig {
  enabled: boolean;
  dailyQuota: number;
  timeSlots: string[];
  requireAddress: boolean;
  calculateTravelSurcharge: boolean;
}

const DEFAULT_CONFIG: HomeVisitConfig = {
  enabled: true,
  dailyQuota: 3,
  timeSlots: ['09:00', '13:00', '16:00'],
  requireAddress: true,
  calculateTravelSurcharge: true,
};

// GET /api/settings/home-visit - Get home visit settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Resolve tenant ID if subdomain
    let resolvedTenantId = tenantId;
    if (tenantId.length !== 36) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId)
        .single();
      
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      resolvedTenantId = tenant.id;
    }

    // Get tenant settings
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('home_visit_config')
      .eq('id', resolvedTenantId)
      .single();

    if (error) {
      console.error('Error fetching home visit settings:', error);
      return NextResponse.json({ config: DEFAULT_CONFIG });
    }

    const config = tenant?.home_visit_config || DEFAULT_CONFIG;

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error in GET /api/settings/home-visit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings/home-visit - Update home visit settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, config } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!config) {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Resolve tenant ID if subdomain
    let resolvedTenantId = tenantId;
    if (tenantId.length !== 36) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId)
        .single();
      
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      resolvedTenantId = tenant.id;
    }

    // Validate config
    const validatedConfig: HomeVisitConfig = {
      enabled: config.enabled ?? true,
      dailyQuota: Math.max(1, Math.min(20, config.dailyQuota || 3)),
      timeSlots: Array.isArray(config.timeSlots) && config.timeSlots.length > 0 
        ? config.timeSlots.filter((s: string) => /^\d{2}:\d{2}$/.test(s)).sort()
        : DEFAULT_CONFIG.timeSlots,
      requireAddress: config.requireAddress ?? true,
      calculateTravelSurcharge: config.calculateTravelSurcharge ?? true,
    };

    // Update tenant settings
    const { data, error } = await supabase
      .from('tenants')
      .update({
        home_visit_config: validatedConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedTenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating home visit settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      config: validatedConfig 
    });
  } catch (error) {
    console.error('Error in PUT /api/settings/home-visit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
