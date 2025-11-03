export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location/location-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, tenantId } = body;

    // Validation with detailed error messages
    if (!address || typeof address !== 'string' || address.trim() === '') {
      console.log('[Geocode API] Missing address:', { address, tenantId });
      return NextResponse.json(
        { error: 'Valid address required' },
        { status: 400 }
      );
    }

    if (!tenantId || typeof tenantId !== 'string') {
      console.log('[Geocode API] Missing tenantId:', { address, tenantId });
      return NextResponse.json(
        { error: 'Valid tenantId required' },
        { status: 400 }
      );
    }

    // Use LocationService to validate/geocode address
    const validation = await LocationService.validateAddress({
      address: address.trim(),
      tenantId
    });

    if (!validation.isValid || !validation.address?.coordinates) {
      console.log('[Geocode API] Geocoding failed or address outside bounds:', {
        address,
        isValid: validation.isValid,
        error: validation.error
      });
      return NextResponse.json(
        { 
          error: validation.error || 'Could not geocode address', 
          isValid: validation.isValid 
        },
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
      { error: 'Geocoding service error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
