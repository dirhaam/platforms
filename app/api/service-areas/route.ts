export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { ServiceAreaService } from '@/lib/location/service-area-service';
import { CreateServiceAreaRequest } from '@/types/location';

// GET /api/service-areas - Get service areas for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const serviceId = searchParams.get('serviceId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const serviceAreas = await ServiceAreaService.getServiceAreas(tenantId, {
      includeInactive,
      serviceId: serviceId || undefined
    });

    return NextResponse.json({ serviceAreas });
  } catch (error) {
    console.error('Error fetching service areas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/service-areas - Create a new service area
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body: CreateServiceAreaRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.boundaries || body.baseTravelSurcharge === undefined || 
        body.maxTravelDistance === undefined || body.estimatedTravelTime === undefined) {
      return NextResponse.json(
        { error: 'Name, boundaries, base travel surcharge, max travel distance, and estimated travel time are required' },
        { status: 400 }
      );
    }

    const result = await ServiceAreaService.createServiceArea(tenantId, body);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.serviceArea, { status: 201 });
  } catch (error) {
    console.error('Error creating service area:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}