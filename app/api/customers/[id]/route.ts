export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/booking/customer-service';
import { updateCustomerSchema } from '@/lib/validation/booking-validation';

// GET /api/customers/[id] - Get a specific customer
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    let tenantId = request.headers.get('x-tenant-id');
    
    // Fallback: also check query params
    if (!tenantId) {
      tenantId = searchParams.get('tenantId');
    }
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // If tenantId is subdomain (not UUID), lookup the actual tenant ID
    const isUUID = tenantId.length === 36;
    
    if (!isUUID) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId)
        .single();
      
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenantId = tenant.id;
    }
    
    const { id } = await context.params;
    const customer = await CustomerService.getCustomer(tenantId, id);
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    let tenantId = request.headers.get('x-tenant-id');
    
    // Fallback: also check query params
    if (!tenantId) {
      tenantId = searchParams.get('tenantId');
    }
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // If tenantId is subdomain (not UUID), lookup the actual tenant ID
    // UUIDs are always 36 chars long (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const isUUID = tenantId.length === 36;
    
    if (!isUUID) {
      // It's a subdomain, lookup the UUID
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId)
        .single();
      
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenantId = tenant.id;
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = updateCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }
    
    const { id } = await context.params;
    const result = await CustomerService.updateCustomer(tenantId, id, validation.data);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ customer: result.customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    let tenantId = request.headers.get('x-tenant-id');
    
    // Fallback: also check query params
    if (!tenantId) {
      tenantId = searchParams.get('tenantId');
    }
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // If tenantId is subdomain (not UUID), lookup the actual tenant ID
    const isUUID = tenantId.length === 36;
    
    if (!isUUID) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId)
        .single();
      
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenantId = tenant.id;
    }
    
    const { id } = await context.params;
    const result = await CustomerService.deleteCustomer(tenantId, id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}