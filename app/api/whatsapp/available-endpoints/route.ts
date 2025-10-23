import { NextResponse } from 'next/server';
import { envEndpointManager } from '@/lib/whatsapp/env-endpoint-manager';

/**
 * GET /api/whatsapp/available-endpoints
 * Get list of available WhatsApp endpoints (from ENV)
 * Only returns endpoint names, NOT credentials
 */
export async function GET() {
  try {
    const endpoints = envEndpointManager.getAvailableEndpoints();
    
    return NextResponse.json({ 
      endpoints,
      count: endpoints.length 
    });
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
