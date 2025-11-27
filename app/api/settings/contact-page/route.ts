import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET - Fetch contact page data (links + settings)
export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Fetch contact links
    const { data: links, error: linksError } = await supabase
      .from('contact_links')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('display_order', { ascending: true });

    if (linksError) {
      console.error('[Contact Page API] Error fetching links:', linksError);
    }

    // Fetch contact page settings
    const { data: settings, error: settingsError } = await supabase
      .from('contact_page_settings')
      .select('*')
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    if (settingsError) {
      console.error('[Contact Page API] Error fetching settings:', settingsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        links: links || [],
        settings: settings ? {
          pageTitle: settings.page_title,
          pageDescription: settings.page_description,
          profileImage: settings.profile_image,
          // Profile layout
          profileLayout: settings.profile_layout || 'classic',
          titleStyle: settings.title_style || 'text',
          titleSize: settings.title_size || 'large',
          titleColor: settings.title_color || '#ffffff',
          // Theme
          theme: settings.theme || 'custom',
          // Background
          backgroundType: settings.background_type || 'solid',
          backgroundValue: settings.background_value || '#000000',
          backgroundColor: settings.background_color || '#000000',
          // Text
          fontFamily: settings.font_family || 'default',
          pageTextColor: settings.page_text_color || '#ffffff',
          // Button
          buttonStyle: settings.button_style || 'solid',
          buttonCorners: settings.button_corners || 'rounded',
          buttonShadow: settings.button_shadow ?? 'subtle',
          buttonColor: settings.button_color || '#ffffff',
          buttonTextColor: settings.button_text_color || '#000000',
          // Legacy
          showSocialIcons: settings.show_social_icons ?? true,
          showLogo: settings.show_logo ?? true,
          customCss: settings.custom_css,
        } : null,
      }
    });
  } catch (error) {
    console.error('[Contact Page API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact page data' },
      { status: 500 }
    );
  }
}

// PUT - Update contact page data (links + settings)
export async function PUT(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { links, settings } = body;

    console.log('[Contact Page API] PUT request:', {
      tenantId: tenant.id,
      linksCount: links?.length || 0,
      hasSettings: !!settings,
    });

    const supabase = getSupabaseClient();

    // Update links - delete all and re-insert
    if (links && Array.isArray(links)) {
      const { error: deleteError } = await supabase
        .from('contact_links')
        .delete()
        .eq('tenant_id', tenant.id);

      if (deleteError) {
        console.error('[Contact Page API] Delete links error:', deleteError);
        return NextResponse.json(
          { error: `Failed to delete links: ${deleteError.message}` },
          { status: 500 }
        );
      }

      if (links.length > 0) {
        const linksToInsert = links.map((link: any) => ({
          tenant_id: tenant.id,
          title: link.title,
          url: link.url,
          icon: link.icon || null,
          icon_type: link.iconType || 'emoji',
          background_color: link.backgroundColor || null,
          text_color: link.textColor || null,
          display_order: link.displayOrder || 0,
          is_active: link.isActive !== false,
          click_count: link.clickCount || 0,
        }));

        const { error: insertError } = await supabase
          .from('contact_links')
          .insert(linksToInsert);

        if (insertError) {
          console.error('[Contact Page API] Insert links error:', insertError);
          return NextResponse.json(
            { error: `Failed to insert links: ${insertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Update settings
    if (settings) {
      const settingsPayload = {
        tenant_id: tenant.id,
        page_title: settings.pageTitle || null,
        page_description: settings.pageDescription || null,
        profile_image: settings.profileImage || null,
        // Profile layout
        profile_layout: settings.profileLayout || 'classic',
        title_style: settings.titleStyle || 'text',
        title_size: settings.titleSize || 'large',
        title_color: settings.titleColor || '#ffffff',
        // Theme
        theme: settings.theme || 'custom',
        // Background
        background_type: settings.backgroundType || 'solid',
        background_value: settings.backgroundValue || '#000000',
        background_color: settings.backgroundColor || '#000000',
        // Text
        font_family: settings.fontFamily || 'default',
        page_text_color: settings.pageTextColor || '#ffffff',
        // Button
        button_style: settings.buttonStyle || 'solid',
        button_corners: settings.buttonCorners || 'rounded',
        button_shadow: settings.buttonShadow || 'subtle',
        button_color: settings.buttonColor || '#ffffff',
        button_text_color: settings.buttonTextColor || '#000000',
        // Legacy
        show_social_icons: settings.showSocialIcons !== false,
        show_logo: settings.showLogo !== false,
        custom_css: settings.customCss || null,
        updated_at: new Date().toISOString(),
      };

      // Check if settings exist
      const { data: existing } = await supabase
        .from('contact_page_settings')
        .select('id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('contact_page_settings')
          .update(settingsPayload)
          .eq('tenant_id', tenant.id);

        if (updateError) {
          console.error('[Contact Page API] Update settings error:', updateError);
          return NextResponse.json(
            { error: `Failed to update settings: ${updateError.message}` },
            { status: 500 }
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from('contact_page_settings')
          .insert({ ...settingsPayload, created_at: new Date().toISOString() });

        if (insertError) {
          console.error('[Contact Page API] Insert settings error:', insertError);
          return NextResponse.json(
            { error: `Failed to insert settings: ${insertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contact page data updated successfully'
    });
  } catch (error) {
    console.error('[Contact Page API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact page data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
