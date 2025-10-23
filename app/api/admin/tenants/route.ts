import { NextRequest, NextResponse } from 'next/server';
import { setTenant, deleteTenant } from '@/lib/database-service';
import type { EnhancedTenant } from '@/lib/subdomain-constants';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { createClient } from '@supabase/supabase-js';

// This API route requires Node.js runtime due to database access
export const runtime = 'nodejs';

function mapDbTenantToEnhanced(dbTenant: any): EnhancedTenant {
  try {
    const expiresAt = dbTenant.subscription_expires_at 
      ? new Date(dbTenant.subscription_expires_at)
      : undefined;
    
    const updatedAt = dbTenant.updated_at 
      ? new Date(dbTenant.updated_at)
      : new Date();

    return {
      subdomain: String(dbTenant.subdomain || ''),
      emoji: String(dbTenant.emoji || '🏢'),
      createdAt: dbTenant.created_at ? new Date(dbTenant.created_at).getTime() : Date.now(),
      id: String(dbTenant.id || ''),
      businessName: String(dbTenant.business_name || ''),
      businessCategory: String(dbTenant.business_category || ''),
      ownerName: String(dbTenant.owner_name || ''),
      email: String(dbTenant.email || ''),
      phone: String(dbTenant.phone || ''),
      address: dbTenant.address ? String(dbTenant.address) : undefined,
      businessDescription: dbTenant.business_description ? String(dbTenant.business_description) : undefined,
      logo: dbTenant.logo ? String(dbTenant.logo) : undefined,
      brandColors: dbTenant.brand_colors && typeof dbTenant.brand_colors === 'object' 
        ? dbTenant.brand_colors 
        : undefined,
      whatsappEnabled: Boolean(dbTenant.whatsapp_enabled),
      homeVisitEnabled: Boolean(dbTenant.home_visit_enabled),
      analyticsEnabled: Boolean(dbTenant.analytics_enabled),
      customTemplatesEnabled: Boolean(dbTenant.custom_templates_enabled),
      multiStaffEnabled: Boolean(dbTenant.multi_staff_enabled),
      subscriptionPlan: String(dbTenant.subscription_plan || 'basic'),
      subscriptionStatus: String(dbTenant.subscription_status || 'active'),
      subscriptionExpiresAt: expiresAt,
      updatedAt,
      features: {
        whatsapp: Boolean(dbTenant.whatsapp_enabled),
        homeVisit: Boolean(dbTenant.home_visit_enabled),
        analytics: Boolean(dbTenant.analytics_enabled),
        customTemplates: Boolean(dbTenant.custom_templates_enabled),
        multiStaff: Boolean(dbTenant.multi_staff_enabled),
      },
      subscription: {
        plan: (dbTenant.subscription_plan || 'basic') as 'basic' | 'premium' | 'enterprise',
        status: (dbTenant.subscription_status || 'active') as 'active' | 'suspended' | 'cancelled',
        expiresAt,
      },
    };
  } catch (error) {
    console.error('Error in mapDbTenantToEnhanced:', error, 'Tenant:', dbTenant);
    throw error;
  }
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all tenants from Supabase
    const { data: dbTenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch tenants from database' },
        { status: 500 }
      );
    }

    if (!dbTenants || dbTenants.length === 0) {
      return NextResponse.json({ tenants: [] });
    }
    
    // Convert to EnhancedTenant format
    try {
      const enhancedTenants = (dbTenants || []).map(mapDbTenantToEnhanced);
      return NextResponse.json({ tenants: enhancedTenants });
    } catch (mappingError) {
      console.error('Error mapping tenants:', mappingError);
      const mappingErrorMessage = mappingError instanceof Error ? mappingError.message : 'Mapping error';
      
      // Log first tenant for debugging
      console.error('First tenant raw data:', JSON.stringify(dbTenants[0], null, 2));
      
      return NextResponse.json(
        { 
          error: mappingErrorMessage, 
          details: 'Error transforming tenant data',
          tenantCount: dbTenants.length
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage, details: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tenantId, updates } = await request.json();

    if (!tenantId || !updates) {
      return NextResponse.json(
        { error: 'Tenant ID and updates are required' },
        { status: 400 }
      );
    }

    // Get the specific tenant from Supabase
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .limit(1)
      .single();
    
    if (fetchError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const allowedFields = [
      'businessName',
      'businessCategory',
      'ownerName',
      'email',
      'phone',
      'address',
      'businessDescription',
      'logo',
      'brandColors',
      'emoji',
      'whatsappEnabled',
      'homeVisitEnabled',
      'analyticsEnabled',
      'customTemplatesEnabled',
      'multiStaffEnabled',
      'subscriptionPlan',
      'subscriptionStatus',
      'subscriptionExpiresAt',
    ] as const;

    const updatePayload: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updatePayload[field] = field === 'subscriptionExpiresAt' && updates[field]
          ? new Date(updates[field])
          : updates[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    updatePayload.updatedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenantId);

    if (updateError) {
      throw updateError;
    }

    const { data: updatedRow, error: refetchError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .limit(1)
      .single();

    if (refetchError || !updatedRow) {
      throw refetchError || new Error('Failed to load updated tenant');
    }

    const enhancedTenant = mapDbTenantToEnhanced(updatedRow);

    await setTenant(updatedRow.subdomain, enhancedTenant);

    const changedFields = Object.keys(updatePayload).filter(field => {
      if (field === 'updatedAt') return false;
      const previousValue = (tenant as any)[field];
      const nextValue = updatePayload[field];
      if (previousValue instanceof Date || nextValue instanceof Date) {
        const prevTime = previousValue ? new Date(previousValue).getTime() : null;
        const nextTime = nextValue ? new Date(nextValue).getTime() : null;
        return prevTime !== nextTime;
      }
      return JSON.stringify(previousValue) !== JSON.stringify(nextValue);
    });

    if (changedFields.length > 0) {
      await ActivityLogger.logTenantUpdated(
        tenant.id,
        enhancedTenant.businessName,
        changedFields
      );
    }

    const featureKeys = [
      'whatsappEnabled',
      'homeVisitEnabled',
      'analyticsEnabled',
      'customTemplatesEnabled',
      'multiStaffEnabled',
    ];

    for (const featureKey of featureKeys) {
      if (changedFields.includes(featureKey) && updates[featureKey] !== undefined) {
        await ActivityLogger.logFeatureToggled(
          tenant.id,
          enhancedTenant.businessName,
          featureKey.replace('Enabled', ''),
          updates[featureKey]
        );
      }
    }

    if (
      updates.subscriptionPlan &&
      updates.subscriptionPlan !== tenant.subscriptionPlan
    ) {
      await ActivityLogger.logSubscriptionChanged(
        tenant.id,
        enhancedTenant.businessName,
        tenant.subscriptionPlan ?? 'basic',
        updates.subscriptionPlan
      );
    }

    return NextResponse.json({ tenant: enhancedTenant });
  } catch (error) {
    console.error('Failed to update tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Get the specific tenant from Supabase
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .limit(1)
      .single();
    
    if (fetchError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Delete cached tenant payload from Supabase key-value store
    await deleteTenant(tenant.subdomain);

    const { error: deleteError } = await supabase
      .from('tenants')
      .delete()
      .eq('subdomain', tenant.subdomain);

    if (deleteError) {
      throw deleteError;
    }

    // Log the activity
    await ActivityLogger.logTenantDeleted(tenant.id, tenant.businessName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}