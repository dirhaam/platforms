import { NextRequest, NextResponse } from 'next/server';
import { ServiceAreaService } from '@/lib/location/service-area-service';
import { UpdateServiceAreaRequest } from '@/types/location';

// GET /api/service-areas/[id] - Get a specific service area
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const serviceArea = await ServiceAreaService.getServiceArea(tenantId, id);

    if (!serviceArea) {
      return NextResponse.json(
        { error: 'Service area not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Error fetching service area:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/service-areas/[id] - Update a service area
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body: UpdateServiceAreaRequest = await request.json();

    const result = await ServiceAreaService.updateServiceArea(tenantId, id, body);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.serviceArea);
  } catch (error) {
    console.error('Error updating service area:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/service-areas/[id] - Delete a service area
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const result = await ServiceAreaService.deleteServiceArea(tenantId, id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service area:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}