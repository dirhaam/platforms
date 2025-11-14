import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET - Fetch landing page media
export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Fetch videos
    const { data: videos } = await supabase
      .from('tenant_videos')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('display_order', { ascending: true });

    // Fetch social media
    const { data: socialMedia } = await supabase
      .from('tenant_social_media')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('display_order', { ascending: true });

    // Fetch galleries with photos
    const { data: galleries } = await supabase
      .from('tenant_photo_galleries')
      .select(`
        *,
        photos:tenant_gallery_photos(*)
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    // Fetch media settings
    const { data: settingsRow } = await supabase
      .from('tenant_media_settings')
      .select('*')
      .eq('tenant_id', tenant.id)
      .limit(1)
      .maybeSingle();

    console.log('[Landing Page Media API] Fetched media:', {
      tenantId: tenant.id,
      videosCount: videos?.length || 0,
      socialMediaCount: socialMedia?.length || 0,
      galleriesCount: galleries?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        videos: videos || [],
        socialMedia: socialMedia || [],
        galleries: galleries || [],
        settings: settingsRow ? {
          videoSize: settingsRow.video_size || 'medium',
          autoplay: Boolean(settingsRow.video_autoplay),
        } : { videoSize: 'medium', autoplay: false },
      }
    });
  } catch (error) {
    console.error('Error fetching landing page media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// PUT - Update landing page media
export async function PUT(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { videos, socialMedia, galleries, settings } = body;

    console.log('[Landing Page Media API] PUT request:', {
      tenantId: tenant.id,
      videosCount: videos?.length || 0,
      socialMediaCount: socialMedia?.length || 0,
      videos: videos?.slice(0, 1), // Log first video as sample
      socialMedia: socialMedia?.slice(0, 1), // Log first social as sample
      settings,
    });

    const supabase = getSupabaseClient();

    // Update videos - delete all and re-insert (simpler approach)
    if (videos && Array.isArray(videos)) {
      // Delete existing videos for this tenant
      const { error: deleteError } = await supabase
        .from('tenant_videos')
        .delete()
        .eq('tenant_id', tenant.id);
      
      if (deleteError) {
        console.error('[Videos] Delete error:', deleteError);
        return NextResponse.json(
          { error: `Failed to delete videos: ${deleteError.message}` },
          { status: 500 }
        );
      }
      
      // Insert all videos
      if (videos.length > 0) {
        const videosToInsert = videos.map(video => ({
          tenant_id: tenant.id,
          title: video.title,
          youtube_url: video.youtubeUrl,
          thumbnail: video.thumbnail || null,
          description: video.description || null,
          display_order: video.displayOrder,
          is_active: video.isActive !== false,
        }));
        
        const { error: insertError } = await supabase
          .from('tenant_videos')
          .insert(videosToInsert);
        
        if (insertError) {
          console.error('[Videos] Insert error:', insertError);
          return NextResponse.json(
            { error: `Failed to insert videos: ${insertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Update social media - delete all and re-insert (simpler approach)
    if (socialMedia && Array.isArray(socialMedia)) {
      // Delete existing social media for this tenant
      const { error: deleteError } = await supabase
        .from('tenant_social_media')
        .delete()
        .eq('tenant_id', tenant.id);
      
      if (deleteError) {
        console.error('[Social Media] Delete error:', deleteError);
        return NextResponse.json(
          { error: `Failed to delete social media: ${deleteError.message}` },
          { status: 500 }
        );
      }
      
      // Insert all social media
      if (socialMedia.length > 0) {
        const socialToInsert = socialMedia.map(social => ({
          tenant_id: tenant.id,
          platform: social.platform,
          url: social.url,
          display_order: social.displayOrder,
          is_active: social.isActive !== false,
        }));
        
        const { error: insertError } = await supabase
          .from('tenant_social_media')
          .insert(socialToInsert);
        
        if (insertError) {
          console.error('[Social Media] Insert error:', insertError);
          return NextResponse.json(
            { error: `Failed to insert social media: ${insertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Upsert media settings if provided
    if (settings && (settings.videoSize || typeof settings.autoplay === 'boolean')) {
      const payload = {
        tenant_id: tenant.id,
        video_size: settings.videoSize || 'medium',
        video_autoplay: Boolean(settings.autoplay),
        updated_at: new Date().toISOString(),
      } as any;

      // Try update, if 0 rows then insert
      const { error: updateErr } = await supabase
        .from('tenant_media_settings')
        .update(payload)
        .eq('tenant_id', tenant.id);

      if (updateErr) {
        console.warn('[Media Settings] Update failed, will try insert:', updateErr.message);
      }

      const { data: existing } = await supabase
        .from('tenant_media_settings')
        .select('id')
        .eq('tenant_id', tenant.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error: insertErr } = await supabase
          .from('tenant_media_settings')
          .insert({ ...payload, created_at: new Date().toISOString() });
        if (insertErr) {
          console.error('[Media Settings] Insert error:', insertErr);
          return NextResponse.json(
            { error: `Failed to save media settings: ${insertErr.message}` },
            { status: 500 }
          );
        }
      }
    }

    console.log('[Landing Page Media API] Successfully updated media for tenant:', tenant.id);

    return NextResponse.json({
      success: true,
      message: 'Landing page media updated successfully'
    });
  } catch (error) {
    console.error('[Landing Page Media API] Error updating landing page media:', error);
    return NextResponse.json(
      { error: 'Failed to update media', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
