export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location/location-service';

export async function POST(request: NextRequest) {
  try {
    const { address, tenantId } = await request.json();

    if (!address || !tenantId) {
      return NextResponse.json(
        { error: 'Address and tenantId required' },
        { status: 400 }
      );
    }

    // Use LocationService to validate/geocode address
    const validation = await LocationService.validateAddress({
      address,
      tenantId
    });

    if (!validation.isValid || !validation.address?.coordinates) {
      return NextResponse.json(
        { error: 'Could not geocode address', isValid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: true,
      coordinates: validation.address.coordinates,
      address: validation.address.fullAddress
    });
  } catch (error) {
    console.error('[Geocode API] Error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    );
  }
}
