import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'invoice-assets';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const getPublicSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export class FileUploadService {
  /**
   * Upload file to Supabase storage bucket
   */
  static async uploadFile(
    tenantId: string,
    file: File,
    folder: string = 'logos'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      // Validate file
      if (!file) {
        return { success: false, error: 'No file provided' };
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Only JPEG, PNG, WebP, and SVG are allowed' };
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { success: false, error: 'File size must be less than 5MB' };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${tenantId}/${folder}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      console.log('[FileUploadService] 📤 Uploading file:', {
        tenantId,
        filename,
        size: file.size,
        type: file.type
      });

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, file, {
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('[FileUploadService] ❌ Upload failed:', error.message);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);

      if (!publicUrlData.publicUrl) {
        return { success: false, error: 'Failed to get public URL' };
      }

      console.log('[FileUploadService] ✅ File uploaded:', {
        filename,
        url: publicUrlData.publicUrl
      });

      return {
        success: true,
        url: publicUrlData.publicUrl
      };
    } catch (error) {
      console.error('[FileUploadService] ❌ Exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }

  /**
   * Delete file from Supabase storage
   */
  static async deleteFile(fileUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!fileUrl) {
        return { success: false, error: 'No file URL provided' };
      }

      // Extract filename from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts.slice(pathParts.indexOf(BUCKET_NAME) + 1).join('/');

      if (!filename) {
        return { success: false, error: 'Invalid file URL' };
      }

      const supabase = getSupabaseClient();

      console.log('[FileUploadService] 🗑️  Deleting file:', { filename });

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filename]);

      if (error) {
        console.error('[FileUploadService] ❌ Delete failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('[FileUploadService] ✅ File deleted:', { filename });
      return { success: true };
    } catch (error) {
      console.error('[FileUploadService] ❌ Exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }

  /**
   * Check if bucket exists, create if not
   */
  static async ensureBucket(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();

      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        return { success: false, error: listError.message };
      }

      const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

      if (bucketExists) {
        console.log('[FileUploadService] ✅ Bucket exists:', BUCKET_NAME);
        return { success: true };
      }

      console.log('[FileUploadService] 📦 Creating bucket:', BUCKET_NAME);

      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });

      if (createError) {
        console.error('[FileUploadService] ❌ Failed to create bucket:', createError.message);
        return { success: false, error: createError.message };
      }

      console.log('[FileUploadService] ✅ Bucket created:', BUCKET_NAME);
      return { success: true };
    } catch (error) {
      console.error('[FileUploadService] ❌ Exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ensure bucket'
      };
    }
  }
}
