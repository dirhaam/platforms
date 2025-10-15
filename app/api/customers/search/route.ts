export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/booking/customer-service';

// GET /api/customers/search - Search customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }
    
    const customers = await CustomerService.searchCustomers(tenantId, query, limit);
    
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}