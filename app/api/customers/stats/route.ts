export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/booking/customer-service';

// GET /api/customers/stats - Get customer statistics for a tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const stats = await CustomerService.getCustomerStats(tenantId);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}