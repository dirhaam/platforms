export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { ServiceService } from '@/lib/booking/service-service';

// GET /api/services/[id]/stats - Get statistics for a specific service
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    // Verify service exists and belongs to tenant
    const service = await ServiceService.getService(tenantId, id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    const stats = await ServiceService.getServiceStats(tenantId, id);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}