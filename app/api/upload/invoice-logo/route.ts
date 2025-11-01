export const runtime = 'nodejs';
export const config = {
  maxDuration: 30,
};

import { NextRequest, NextResponse } from 'next/server';
import { FileUploadService } from '@/lib/storage/file-upload-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure bucket exists
    const bucketResult = await FileUploadService.ensureBucket();
    if (!bucketResult.success) {
      return NextResponse.json(
        { error: bucketResult.error || 'Failed to ensure storage bucket' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[POST /api/upload/invoice-logo] 📤 Uploading invoice logo:', {
      tenantId: tenant.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const result = await FileUploadService.uploadFile(tenant.id, file, 'logos');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload file' },
        { status: 400 }
      );
    }

    console.log('[POST /api/upload/invoice-logo] ✅ Logo uploaded:', {
      url: result.url
    });

    return NextResponse.json({
      success: true,
      url: result.url
    });
  } catch (error) {
    let errorMessage = 'Failed to upload logo';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('[POST /api/upload/invoice-logo] ❌ Error:', {
      message: errorMessage,
      error
    });

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
