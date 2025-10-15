export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location/location-service';
import { ValidateAddressRequest } from '@/types/location';

export async function POST(request: NextRequest) {
  try {
    const body: ValidateAddressRequest = await request.json();
    
    if (!body.address || !body.tenantId) {
      return NextResponse.json(
        { error: 'Address and tenant ID are required' },
        { status: 400 }
      );
    }

    const validation = await LocationService.validateAddress(body);
    
    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error validating address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}