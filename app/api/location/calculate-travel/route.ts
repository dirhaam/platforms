export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location/location-service';
import { CalculateTravelRequest } from '@/types/location';

export async function POST(request: NextRequest) {
  try {
    const body: CalculateTravelRequest = await request.json();
    
    console.log('[API/calculate-travel] Request received:', {
      origin: body.origin,
      destination: body.destination,
      tenantId: body.tenantId,
      serviceId: body.serviceId
    });
    
    if (!body.origin || !body.destination || !body.tenantId) {
      const msg = 'Origin, destination, and tenant ID are required';
      console.error('[API/calculate-travel] Validation failed:', { origin: body.origin, destination: body.destination, tenantId: body.tenantId });
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      );
    }

    const calculation = await LocationService.calculateTravel(body);
    console.log('[API/calculate-travel] Calculation result:', {
      distance: calculation.distance,
      duration: calculation.duration,
      surcharge: calculation.surcharge,
      polylinePoints: calculation.route?.length || 0,
      isWithinServiceArea: calculation.isWithinServiceArea
    });
    
    return NextResponse.json(calculation);
  } catch (error) {
    console.error('[API/calculate-travel] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}