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

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, subscription_plan, subscription_status, subscription_expires_at')
      .eq('id', id)
      .single();

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscriptionPlan: tenant.subscription_plan,
      subscriptionStatus: tenant.subscription_status,
      subscriptionExpiresAt: tenant.subscription_expires_at,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
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
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Validate input
    if (!body.subscriptionPlan && !body.subscriptionStatus && !body.subscriptionExpiresAt) {
      return NextResponse.json(
        { error: 'No subscription updates provided' },
        { status: 400 }
      );
    }

    // Validate subscription plan
    const validPlans = ['basic', 'premium', 'enterprise'];
    if (body.subscriptionPlan && !validPlans.includes(body.subscriptionPlan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // Validate subscription status
    const validStatuses = ['active', 'suspended', 'cancelled'];
    if (body.subscriptionStatus && !validStatuses.includes(body.subscriptionStatus)) {
      return NextResponse.json(
        { error: 'Invalid subscription status' },
        { status: 400 }
      );
    }

    // Get current subscription data for comparison
    const { data: currentTenant, error: fetchError } = await supabase
      .from('tenants')
      .select('id, business_name, subscription_plan, subscription_status, subscription_expires_at')
      .eq('id', id)
      .single();

    if (fetchError || !currentTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Build update payload
    const updateData: any = {};
    const changes: string[] = [];

    if (body.subscriptionPlan && body.subscriptionPlan !== currentTenant.subscription_plan) {
      updateData.subscription_plan = body.subscriptionPlan;
      changes.push(`plan: ${currentTenant.subscription_plan} → ${body.subscriptionPlan}`);
    }

    if (body.subscriptionStatus && body.subscriptionStatus !== currentTenant.subscription_status) {
      updateData.subscription_status = body.subscriptionStatus;
      changes.push(`status: ${currentTenant.subscription_status} → ${body.subscriptionStatus}`);
    }

    if (body.subscriptionExpiresAt !== undefined) {
      const newExpiry = body.subscriptionExpiresAt
        ? new Date(body.subscriptionExpiresAt).toISOString()
        : null;
      const oldExpiryDate = currentTenant.subscription_expires_at 
        ? new Date(currentTenant.subscription_expires_at).toISOString().split('T')[0]
        : null;
      const newExpiryDate = newExpiry ? newExpiry.split('T')[0] : null;

      if (newExpiryDate !== oldExpiryDate) {
        updateData.subscription_expires_at = newExpiry;
        changes.push(`expiry: ${oldExpiryDate || 'none'} → ${newExpiryDate || 'none'}`);
      }
    }

    // If no changes, return current data without error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        subscriptionPlan: currentTenant.subscription_plan,
        subscriptionStatus: currentTenant.subscription_status,
        subscriptionExpiresAt: currentTenant.subscription_expires_at,
        message: 'No changes detected',
      });
    }

    updateData.updated_at = new Date().toISOString();

    // Update subscription
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    // Log to subscription history
    if (changes.length > 0) {
      await supabase.from('subscription_history').insert({
        tenant_id: id,
        old_plan: currentTenant.subscription_plan,
        new_plan: updateData.subscription_plan || currentTenant.subscription_plan,
        old_status: currentTenant.subscription_status,
        new_status: updateData.subscription_status || currentTenant.subscription_status,
        old_expires_at: currentTenant.subscription_expires_at,
        new_expires_at: updateData.subscription_expires_at,
        changed_by: session.userId,
        created_at: new Date().toISOString(),
      }).catch(err => console.error('Subscription history error:', err));

      // Also log to activity logs
      await supabase.from('activity_logs').insert({
        tenant_id: id,
        action: 'subscription_changed',
        details: changes.join('; '),
        created_at: new Date().toISOString(),
      }).catch(err => console.error('Activity log error:', err));
    }

    return NextResponse.json({
      subscriptionPlan: updatedTenant.subscription_plan,
      subscriptionStatus: updatedTenant.subscription_status,
      subscriptionExpiresAt: updatedTenant.subscription_expires_at,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
