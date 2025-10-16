import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 Debug check:', { email, password: '***' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Search for any superadmin with similar email
    const { data: allSuperadmins, error: allError } = await supabase
      .from('super_admins')
      .select('*');
    
    if (allError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch superadmins: ' + allError.message
      });
    }
    
    // Search for exact email
    const { data: exactMatch, error: exactError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (exactError && exactError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: 'Search error: ' + exactError.message
      });
    }
    
    // Search with different patterns
    const searchPatterns = [
      email.toLowerCase(),
      'superadmin@booqing.my.id',
      'bydirhaam@booqing.my.id'
    ];
    
    const searchResults = [];
    for (const pattern of searchPatterns) {
      const { data: result } = await supabase
        .from('super_admins')
        .select('*')
        .or(`email.ilike.${pattern}`)
        .limit(5);
      
      if (result && result.length > 0) {
        searchResults.push({
          pattern,
          matches: result.length,
          data: result.map(r => ({
            id: r.id,
            email: r.email,
            name: r.name,
            isActive: r.is_active,
            hasPasswordHash: !!r.password_hash,
            passwordHashPrefix: r.password_hash ? r.password_hash.substring(0, 10) + '...' : null
          }))
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      searchEmail: email,
      totalSuperadmins: allSuperadmins?.length || 0,
      exactMatch: exactMatch ? {
        id: exactMatch.id,
        email: exactMatch.email,
        name: exactMatch.name,
        isActive: exactMatch.is_active,
        hasPasswordHash: !!exactMatch.password_hash
      } : null,
      searchResults,
      allSuperadminEmails: allSuperadmins?.map(s => s.email) || []
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SuperAdmin debug endpoint',
    usage: 'POST with email and password to debug authentication'
  });
}
