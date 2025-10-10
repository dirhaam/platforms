import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location/location-service';
import { OptimizeRouteRequest } from '@/types/location';

export async function POST(request: NextRequest) {
  try {
    const body: OptimizeRouteRequest = await request.json();
    
    if (!body.startLocation || !body.bookings || !body.tenantId) {
      return NextResponse.json(
        { error: 'Start location, bookings, and tenant ID are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.bookings) || body.bookings.length === 0) {
      return NextResponse.json(
        { error: 'At least one booking is required for route optimization' },
        { status: 400 }
      );
    }

    const optimization = await LocationService.optimizeRoute(body);
    
    return NextResponse.json(optimization);
  } catch (error) {
    console.error('Error optimizing route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}