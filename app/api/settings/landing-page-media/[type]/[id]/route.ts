import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// DELETE - Remove media item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = await params;

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const tableMap: Record<string, string> = {
      'video': 'tenant_videos',
      'social': 'tenant_social_media',
      'gallery': 'tenant_photo_galleries',
      'photo': 'tenant_gallery_photos',
    };

    const tableName = tableMap[type];
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `${type} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}

// PATCH - Update single item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = await params;
    const body = await req.json();

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const tableMap: Record<string, string> = {
      'video': 'tenant_videos',
      'social': 'tenant_social_media',
      'gallery': 'tenant_photo_galleries',
      'photo': 'tenant_gallery_photos',
    };

    const tableName = tableMap[type];
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Map camelCase to snake_case
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title) updateData.title = body.title;
    if (body.youtubeUrl) updateData.youtube_url = body.youtubeUrl;
    if (body.thumbnail) updateData.thumbnail = body.thumbnail;
    if (body.description) updateData.description = body.description;
    if (body.url) updateData.url = body.url;
    if (body.platform) updateData.platform = body.platform;
    if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.caption !== undefined) updateData.caption = body.caption;
    if (body.alt) updateData.alt = body.alt;

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `${type} updated successfully`
    });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}
