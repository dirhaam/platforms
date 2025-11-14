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

    // Update videos - delete all and re-insert (simpler approach)
    if (videos && Array.isArray(videos)) {
      // Delete existing videos for this tenant
      await supabase
        .from('tenant_videos')
        .delete()
        .eq('tenant_id', tenant.id);
      
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
        
        await supabase
          .from('tenant_videos')
          .insert(videosToInsert);
      }
    }

    // Update social media - delete all and re-insert (simpler approach)
    if (socialMedia && Array.isArray(socialMedia)) {
      // Delete existing social media for this tenant
      await supabase
        .from('tenant_social_media')
        .delete()
        .eq('tenant_id', tenant.id);
      
      // Insert all social media
      if (socialMedia.length > 0) {
        const socialToInsert = socialMedia.map(social => ({
          tenant_id: tenant.id,
          platform: social.platform,
          url: social.url,
          display_order: social.displayOrder,
          is_active: social.isActive !== false,
        }));
        
        await supabase
          .from('tenant_social_media')
          .insert(socialToInsert);
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
