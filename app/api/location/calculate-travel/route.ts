export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location/location-service';
import { CalculateTravelRequest } from '@/types/location';

export async function POST(request: NextRequest) {
  try {
    const body: CalculateTravelRequest = await request.json();
    
    if (!body.origin || !body.destination || !body.tenantId) {
      return NextResponse.json(
        { error: 'Origin, destination, and tenant ID are required' },
        { status: 400 }
      );
    }

    const calculation = await LocationService.calculateTravel(body);
    
    return NextResponse.json(calculation);
  } catch (error) {
    console.error('Error calculating travel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}