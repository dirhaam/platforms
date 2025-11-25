import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// PATCH - Update tenant status (suspend/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status || !['active', 'suspended', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, suspended, or cancelled' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current tenant
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('id, business_name, subscription_status')
      .eq('id', id)
      .single();

    if (fetchError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const oldStatus = tenant.subscription_status;

    // Update tenant status
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update({ 
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tenant status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tenant status' },
        { status: 500 }
      );
    }

    // Log to subscription history
    try {
      await supabase.from('subscription_history').insert({
        tenant_id: id,
        old_status: oldStatus,
        new_status: status,
        changed_by: session.userId,
        notes: reason || `Status changed from ${oldStatus} to ${status}`,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log subscription history:', err);
    }

    // Log to activity logs
    try {
      await supabase.from('activity_logs').insert({
        tenant_id: id,
        action: status === 'suspended' ? 'tenant_suspended' : 
                status === 'active' ? 'tenant_activated' : 'tenant_cancelled',
        details: reason || `Tenant ${status} by superadmin`,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: updatedTenant.id,
        businessName: updatedTenant.business_name,
        subscriptionStatus: updatedTenant.subscription_status,
      },
      message: status === 'suspended' 
        ? `Tenant "${tenant.business_name}" has been suspended`
        : status === 'active'
        ? `Tenant "${tenant.business_name}" has been activated`
        : `Tenant "${tenant.business_name}" has been cancelled`,
    });
  } catch (error) {
    console.error('Error updating tenant status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
