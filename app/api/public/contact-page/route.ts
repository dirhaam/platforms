import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET - Fetch public contact page data by subdomain
export async function GET(req: NextRequest) {
  try {
    const subdomain = req.nextUrl.searchParams.get('subdomain');
    
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get tenant by subdomain
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, subdomain, business_name, business_category, logo, emoji, phone, email, address, brand_colors')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Fetch active contact links
    const { data: links } = await supabase
      .from('contact_links')
      .select('id, title, url, icon, icon_type, background_color, text_color, display_order')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Fetch contact page settings
    const { data: settings } = await supabase
      .from('contact_page_settings')
      .select('*')
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    // Fetch social media links
    const { data: socialMedia } = await supabase
      .from('tenant_social_media')
      .select('id, platform, url, display_order')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          subdomain: tenant.subdomain,
          businessName: tenant.business_name,
          businessCategory: tenant.business_category,
          logo: tenant.logo,
          emoji: tenant.emoji,
          phone: tenant.phone,
          email: tenant.email,
          address: tenant.address,
          brandColors: tenant.brand_colors,
        },
        links: links || [],
        settings: settings ? {
          pageTitle: settings.page_title,
          pageDescription: settings.page_description,
          profileImage: settings.profile_image,
          backgroundType: settings.background_type,
          backgroundValue: settings.background_value,
          buttonStyle: settings.button_style,
          buttonShadow: settings.button_shadow,
          fontFamily: settings.font_family,
          showSocialIcons: settings.show_social_icons,
          showLogo: settings.show_logo,
        } : null,
        socialMedia: socialMedia || [],
      }
    });
  } catch (error) {
    console.error('[Public Contact Page API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact page data' },
      { status: 500 }
    );
  }
}

// POST - Track link click
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linkId } = body;

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Increment click count
    const { error } = await supabase.rpc('increment_link_click', { link_id: linkId });

    if (error) {
      // Fallback: manual increment
      const { data: link } = await supabase
        .from('contact_links')
        .select('click_count')
        .eq('id', linkId)
        .single();

      if (link) {
        await supabase
          .from('contact_links')
          .update({ click_count: (link.click_count || 0) + 1 })
          .eq('id', linkId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Public Contact Page API] Click tracking error:', error);
    return NextResponse.json({ success: true }); // Don't fail on click tracking
  }
}
