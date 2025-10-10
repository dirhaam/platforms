import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getAllSubdomains, type EnhancedTenant } from '@/lib/subdomains';
import { ActivityLogger } from '@/lib/admin/activity-logger';

export async function GET() {
  try {
    const tenants = await getAllSubdomains();
    return NextResponse.json({ tenants });
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
    const { tenantId, updates } = await request.json();

    if (!tenantId || !updates) {
      return NextResponse.json(
        { error: 'Tenant ID and updates are required' },
        { status: 400 }
      );
    }

    // Get all tenants to find the one to update
    const tenants = await getAllSubdomains();
    const tenant = tenants.find(t => t.id === tenantId);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Update the tenant data
    const updatedTenant: EnhancedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date(),
      // Update computed properties based on feature flags
      features: {
        whatsapp: updates.whatsappEnabled ?? tenant.whatsappEnabled,
        homeVisit: updates.homeVisitEnabled ?? tenant.homeVisitEnabled,
        analytics: updates.analyticsEnabled ?? tenant.analyticsEnabled,
        customTemplates: updates.customTemplatesEnabled ?? tenant.customTemplatesEnabled,
        multiStaff: updates.multiStaffEnabled ?? tenant.multiStaffEnabled,
      },
      subscription: {
        plan: (updates.subscriptionPlan ?? tenant.subscriptionPlan) as 'basic' | 'premium' | 'enterprise',
        status: (updates.subscriptionStatus ?? tenant.subscriptionStatus) as 'active' | 'suspended' | 'cancelled',
        expiresAt: tenant.subscription.expiresAt,
      },
    };

    // Store updated tenant in Redis
    await redis.set(`subdomain:${tenant.subdomain}`, updatedTenant);

    // Try to update in PostgreSQL if available
    try {
      const { prisma } = await import('@/lib/database');
      await prisma.tenant.update({
        where: { subdomain: tenant.subdomain },
        data: {
          businessName: updatedTenant.businessName,
          businessCategory: updatedTenant.businessCategory,
          ownerName: updatedTenant.ownerName,
          email: updatedTenant.email,
          phone: updatedTenant.phone,
          address: updatedTenant.address,
          businessDescription: updatedTenant.businessDescription,
          emoji: updatedTenant.emoji,
          whatsappEnabled: updatedTenant.whatsappEnabled,
          homeVisitEnabled: updatedTenant.homeVisitEnabled,
          analyticsEnabled: updatedTenant.analyticsEnabled,
          customTemplatesEnabled: updatedTenant.customTemplatesEnabled,
          multiStaffEnabled: updatedTenant.multiStaffEnabled,
          subscriptionPlan: updatedTenant.subscriptionPlan,
          subscriptionStatus: updatedTenant.subscriptionStatus,
          updatedAt: updatedTenant.updatedAt,
        },
      });
    } catch (dbError) {
      console.warn('Failed to update tenant in PostgreSQL:', dbError);
    }

    // Log the activity
    const changes = Object.keys(updates).filter(key => updates[key] !== undefined);
    if (changes.length > 0) {
      await ActivityLogger.logTenantUpdated(
        tenant.id,
        updatedTenant.businessName,
        changes
      );
    }

    // Log feature toggles specifically
    const featureChanges = changes.filter(change => change.endsWith('Enabled'));
    for (const featureChange of featureChanges) {
      const feature = featureChange.replace('Enabled', '');
      await ActivityLogger.logFeatureToggled(
        tenant.id,
        updatedTenant.businessName,
        feature,
        updates[featureChange]
      );
    }

    // Log subscription changes
    if (updates.subscriptionPlan && updates.subscriptionPlan !== tenant.subscriptionPlan) {
      await ActivityLogger.logSubscriptionChanged(
        tenant.id,
        updatedTenant.businessName,
        tenant.subscriptionPlan,
        updates.subscriptionPlan
      );
    }

    return NextResponse.json({ tenant: updatedTenant });
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
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Get all tenants to find the one to delete
    const tenants = await getAllSubdomains();
    const tenant = tenants.find(t => t.id === tenantId);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Delete from Redis
    await redis.del(`subdomain:${tenant.subdomain}`);

    // Try to delete from PostgreSQL if available
    try {
      const { prisma } = await import('@/lib/database');
      await prisma.tenant.delete({
        where: { subdomain: tenant.subdomain },
      });
    } catch (dbError) {
      console.warn('Failed to delete tenant from PostgreSQL:', dbError);
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