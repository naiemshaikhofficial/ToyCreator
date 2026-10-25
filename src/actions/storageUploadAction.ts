'use server';

import { requireAuthenticatedUser } from '@/lib/auth/serverAuth';
import { getAdminClient } from '@/lib/supabase/admin';

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  size?: string;
  fileName?: string;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i >= 2 ? 1 : 0));
  return `${val} ${sizes[i]}`;
}

/**
 * Upload an image asset directly to Supabase Storage (product-assets bucket)
 * Files are stored with public read access and optimal HTTP cache headers.
 */
export async function uploadImageToSupabaseAction(formData: FormData): Promise<StorageUploadResult> {
  try {
    await requireAuthenticatedUser();
  } catch {
    return {
      success: false,
      error: 'Unauthorized: Please log in to upload brand assets.',
    };
  }

  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'brand-logos';

  if (!file) {
    return { success: false, error: 'No image file was provided.' };
  }

  // Allowed image mime types
  const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file format. Please upload a WebP, PNG, JPEG, or SVG image.',
    };
  }

  // Size limit for logos and covers: 10MB
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      error: 'Image size exceeds maximum limit of 10MB.',
    };
  }

  try {
    const admin = getAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filename
    const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
    const baseName = file.name
      .substring(0, file.name.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

    const safeFolder = folder === 'covers' ? 'covers' : 'brand-logos';
    const filePath = `${safeFolder}/${baseName}_${Date.now()}.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from('product-assets')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/webp',
        cacheControl: '31536000, public, immutable',
        upsert: true,
      });

    if (uploadErr) {
      console.error('[SUPABASE_STORAGE] Upload error:', uploadErr);
      return { success: false, error: uploadErr.message || 'Failed to upload image to storage.' };
    }

    const { data: publicData } = admin.storage
      .from('product-assets')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicData.publicUrl,
      size: formatBytes(file.size),
      fileName: file.name,
    };
  } catch (err: any) {
    console.error('[SUPABASE_STORAGE] Exception:', err);
    return { success: false, error: err.message || 'Failed to process image upload.' };
  }
}
