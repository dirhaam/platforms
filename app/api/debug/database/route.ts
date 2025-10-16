import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL?.trim();
    
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL is not configured',
        dbUrl: null
      });
    }

    // Parse and show safe URL info (without password)
    let parsedUrl;
    try {
      parsedUrl = new URL(dbUrl);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Invalid DATABASE_URL format',
        dbUrl: dbUrl.substring(0, 20) + '...'
      });
    }

    console.log('🔍 Database connection test:', {
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      database: parsedUrl.pathname.substring(1),
      user: parsedUrl.username,
    });

    // Test connection with timeout
    const startTime = Date.now();
    
    try {
      await import('../check-db-connection');
    } catch (error) {
      const endTime = Date.now();
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : String(error),
        connectionTime: `${endTime - startTime}ms`,
        dbInfo: {
          host: parsedUrl.hostname,
          port: parsedUrl.port || 'default',
          database: parsedUrl.pathname.substring(1),
          user: parsedUrl.username,
          hasPassword: !!parsedUrl.password,
        },
        suggestions: [
          '1. Check if Supabase allows Vercel connections',
          '2. Verify DATABASE_URL has correct hostname',
          '3. Check if there are IP restrictions on Supabase',
          '4. Consider using Supabase client for production'
        ]
      });
    }

    const endTime = Date.now();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      connectionTime: `${endTime - startTime}ms`,
      dbInfo: {
        host: parsedUrl.hostname,
        port: parsedUrl.port || 'default',
        database: parsedUrl.pathname.substring(1),
        user: parsedUrl.username,
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
