import { NextRequest, NextResponse } from 'next/server';
import { ServiceService } from '@/lib/booking/service-service';
import { createServiceSchema } from '@/lib/validation/booking-validation';

// GET /api/services - Get services for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Parse query parameters
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const homeVisitAvailable = searchParams.get('homeVisitAvailable') ? searchParams.get('homeVisitAvailable') === 'true' : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const services = await ServiceService.getServices(tenantId, {
      category: category || undefined,
      isActive,
      homeVisitAvailable,
      limit,
      offset
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Validate request body
    const validation = createServiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 });
    }

    const result = await ServiceService.createService(tenantId, validation.data);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ service: result.service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}