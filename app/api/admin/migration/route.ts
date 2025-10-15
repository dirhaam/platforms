export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const dbConnected = await checkDatabaseConnection();
        return NextResponse.json({
          success: true,
          data: {
            databaseConnected: dbConnected,
            timestamp: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Migration utilities have been retired. Only status checks remain available.',
        }, { status: 410 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await request.json();
    return NextResponse.json({
      success: false,
      error: 'Migration utilities have been retired. No further actions are supported.',
    }, { status: 410 });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}