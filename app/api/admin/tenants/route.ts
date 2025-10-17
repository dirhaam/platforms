import { NextRequest, NextResponse } from 'next/server';
import { setTenant, deleteTenant } from '@/lib/database-service';
import type { EnhancedTenant } from '@/lib/subdomain-constants';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { createClient } from '@supabase/supabase-js';

// This API route requires Node.js runtime due to database access
export const runtime = 'nodejs';

function mapDbTenantToEnhanced(dbTenant: any): EnhancedTenant {
  return {
    subdomain: dbTenant.subdomain,
    emoji: dbTenant.emoji || '🏢',
    createdAt: dbTenant.createdAt ? dbTenant.createdAt.getTime() : Date.now(),
    id: dbTenant.id,
    businessName: dbTenant.businessName,
    businessCategory: dbTenant.businessCategory,
    ownerName: dbTenant.ownerName,
    email: dbTenant.email,
    phone: dbTenant.phone,
    address: dbTenant.address ?? undefined,
    businessDescription: dbTenant.businessDescription ?? undefined,
    logo: dbTenant.logo ?? undefined,
    brandColors: dbTenant.brandColors ?? undefined,
    whatsappEnabled: dbTenant.whatsappEnabled,
    homeVisitEnabled: dbTenant.homeVisitEnabled,
    analyticsEnabled: dbTenant.analyticsEnabled,
    customTemplatesEnabled: dbTenant.customTemplatesEnabled,
    multiStaffEnabled: dbTenant.multiStaffEnabled,
    subscriptionPlan: dbTenant.subscriptionPlan,
    subscriptionStatus: dbTenant.subscriptionStatus,
    subscriptionExpiresAt: dbTenant.subscriptionExpiresAt ?? undefined,
    updatedAt: dbTenant.updatedAt ?? new Date(),
    features: {
      whatsapp: dbTenant.whatsappEnabled,
      homeVisit: dbTenant.homeVisitEnabled,
      analytics: dbTenant.analyticsEnabled,
      customTemplates: dbTenant.customTemplatesEnabled,
      multiStaff: dbTenant.multiStaffEnabled,
    },
    subscription: {
      plan: dbTenant.subscriptionPlan as 'basic' | 'premium' | 'enterprise',
      status: dbTenant.subscriptionStatus as 'active' | 'suspended' | 'cancelled',
      expiresAt: dbTenant.subscriptionExpiresAt ?? undefined,
    },
  };
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
      .order('createdAt', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Convert to EnhancedTenant format
    const enhancedTenants = (dbTenants || []).map(mapDbTenantToEnhanced);
    
    return NextResponse.json({ tenants: enhancedTenants });
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
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