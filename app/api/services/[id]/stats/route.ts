import { NextRequest, NextResponse } from 'next/server';
import { ServiceService } from '@/lib/booking/service-service';

// GET /api/services/[id]/stats - Get statistics for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    // Verify service exists and belongs to tenant
    const service = await ServiceService.getService(tenantId, params.id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    const stats = await ServiceService.getServiceStats(tenantId, params.id);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}