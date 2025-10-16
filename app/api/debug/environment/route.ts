import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT_CONFIGURED',
        NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      },
      timestamp: new Date().toISOString(),
      serverInfo: {
        runtime: typeof window === 'undefined' ? 'server' : 'client',
        platform: process.platform,
        version: process.version,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
