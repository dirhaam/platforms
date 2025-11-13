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

    return NextResponse.json({
      success: true,
      data: {
        videos: videos || [],
        socialMedia: socialMedia || [],
        galleries: galleries || [],
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
    const { videos, socialMedia, galleries } = body;

    const supabase = getSupabaseClient();

    // Update videos
    if (videos && Array.isArray(videos)) {
      for (const video of videos) {
        if (video.id && video.id.length > 5) {
          // Update existing
          await supabase
            .from('tenant_videos')
            .update({
              title: video.title,
              youtube_url: video.youtubeUrl,
              thumbnail: video.thumbnail,
              description: video.description,
              display_order: video.displayOrder,
              is_active: video.isActive,
              updated_at: new Date().toISOString(),
            })
            .eq('id', video.id)
            .eq('tenant_id', tenant.id);
        } else if (!video.id || video.id.length <= 5) {
          // Insert new
          await supabase
            .from('tenant_videos')
            .insert({
              tenant_id: tenant.id,
              title: video.title,
              youtube_url: video.youtubeUrl,
              thumbnail: video.thumbnail,
              description: video.description,
              display_order: video.displayOrder,
              is_active: video.isActive,
            });
        }
      }
    }

    // Update social media
    if (socialMedia && Array.isArray(socialMedia)) {
      for (const social of socialMedia) {
        if (social.id && social.id.length > 5) {
          // Update existing
          await supabase
            .from('tenant_social_media')
            .update({
              platform: social.platform,
              url: social.url,
              display_order: social.displayOrder,
              is_active: social.isActive,
              updated_at: new Date().toISOString(),
            })
            .eq('id', social.id)
            .eq('tenant_id', tenant.id);
        } else if (!social.id || social.id.length <= 5) {
          // Insert new
          await supabase
            .from('tenant_social_media')
            .insert({
              tenant_id: tenant.id,
              platform: social.platform,
              url: social.url,
              display_order: social.displayOrder,
              is_active: social.isActive,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Landing page media updated successfully'
    });
  } catch (error) {
    console.error('Error updating landing page media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}
