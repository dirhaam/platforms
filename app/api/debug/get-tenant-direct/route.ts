import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const subdomain = request.nextUrl.searchParams.get('subdomain') || 'demo';

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`[get-tenant-direct] Subdomain: ${subdomain}`);
    console.log(`[get-tenant-direct] Supabase URL: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
    console.log(`[get-tenant-direct] Supabase Key: ${supabaseKey ? 'SET' : 'NOT SET'}`);

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envVars: {
          url: supabaseUrl ? 'SET' : 'MISSING',
          key: supabaseKey ? 'SET' : 'MISSING',
        },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[get-tenant-direct] Querying tenants table for subdomain: ${subdomain.toLowerCase()}`);

    const { data, error, status } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain.toLowerCase())
      .limit(1)
      .single();

    console.log(`[get-tenant-direct] Query result - Status: ${status}, Error: ${error ? 'yes' : 'no'}, Data: ${data ? 'yes' : 'no'}`);

    return NextResponse.json({
      success: !error,
      subdomain,
      queryStatus: status,
      error: error ? {
        code: error.code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      } : null,
      data: data || null,
    });
  } catch (error) {
    console.error('[get-tenant-direct] Catch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
