import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/booking/customer-service';
import { createCustomerSchema } from '@/lib/validation/booking-validation';

// GET /api/customers - Get customers for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    // Parse query parameters
    const search = searchParams.get('search');
    const hasBookings = searchParams.get('hasBookings') ? searchParams.get('hasBookings') === 'true' : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const sortBy = searchParams.get('sortBy') as 'name' | 'createdAt' | 'lastBookingAt' | 'totalBookings' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    
    const result = await CustomerService.getCustomers(tenantId, {
      search: search || undefined,
      hasBookings,
      limit,
      offset,
      sortBy,
      sortOrder
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      }, { status: 400 });
    }
    
    const result = await CustomerService.createCustomer(tenantId, validation.data);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ customer: result.customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}