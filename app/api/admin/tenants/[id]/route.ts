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

function convertDbToApiTenant(dbTenant: any) {
  return {
    id: dbTenant.id,
    subdomain: dbTenant.subdomain,
    emoji: dbTenant.emoji || '🏢',
    businessName: dbTenant.business_name,
    businessCategory: dbTenant.business_category,
    ownerName: dbTenant.owner_name,
    email: dbTenant.email,
    phone: dbTenant.phone,
    address: dbTenant.address,
    businessDescription: dbTenant.business_description,
    logo: dbTenant.logo,
    brandColors: dbTenant.brand_colors,
    whatsappEnabled: dbTenant.whatsapp_enabled,
    homeVisitEnabled: dbTenant.home_visit_enabled,
    analyticsEnabled: dbTenant.analytics_enabled,
    customTemplatesEnabled: dbTenant.custom_templates_enabled,
    multiStaffEnabled: dbTenant.multi_staff_enabled,
    subscriptionPlan: dbTenant.subscription_plan,
    subscriptionStatus: dbTenant.subscription_status,
    subscriptionExpiresAt: dbTenant.subscription_expires_at,
    createdAt: dbTenant.created_at,
    updatedAt: dbTenant.updated_at,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    // Check if user is authenticated and is a superadmin
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(convertDbToApiTenant(tenant));
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    // Check if user is authenticated and is a superadmin
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Map camelCase to snake_case
    const updateData: any = {};
    
    if (body.businessName) updateData.business_name = body.businessName;
    if (body.businessCategory) updateData.business_category = body.businessCategory;
    if (body.ownerName) updateData.owner_name = body.ownerName;
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.businessDescription !== undefined) updateData.business_description = body.businessDescription;
    if (body.subscriptionPlan) updateData.subscription_plan = body.subscriptionPlan;
    if (body.whatsappEnabled !== undefined) updateData.whatsapp_enabled = body.whatsappEnabled;
    if (body.homeVisitEnabled !== undefined) updateData.home_visit_enabled = body.homeVisitEnabled;
    if (body.analyticsEnabled !== undefined) updateData.analytics_enabled = body.analyticsEnabled;
    if (body.customTemplatesEnabled !== undefined) updateData.custom_templates_enabled = body.customTemplatesEnabled;
    if (body.multiStaffEnabled !== undefined) updateData.multi_staff_enabled = body.multiStaffEnabled;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedTenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update tenant' },
        { status: 500 }
      );
    }

    return NextResponse.json(convertDbToApiTenant(updatedTenant));
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    // Check if user is authenticated and is a superadmin
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete tenant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
