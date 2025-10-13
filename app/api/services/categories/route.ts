export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { ServiceService } from '@/lib/booking/service-service';

// GET /api/services/categories - Get service categories for a tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const categories = await ServiceService.getServiceCategories(tenantId);
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}