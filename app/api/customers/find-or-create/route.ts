import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/booking/customer-service';
import { createCustomerSchema } from '@/lib/validation/booking-validation';

// POST /api/customers/find-or-create - Find existing customer or create new one
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
    
    const result = await CustomerService.findOrCreateCustomer(tenantId, validation.data);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    const statusCode = result.created ? 201 : 200;
    return NextResponse.json({ 
      customer: result.customer, 
      created: result.created 
    }, { status: statusCode });
  } catch (error) {
    console.error('Error finding or creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}