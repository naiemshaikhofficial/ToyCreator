'use server';

import { getAdminClient } from '@/lib/supabase/admin';

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  error?: string;
}

/**
 * Server Action: Upload file directly to cloud storage (Supabase Storage product-assets bucket)
 */
export async function uploadAssetToDriveAction(formData: FormData): Promise<DriveUploadResult> {
  const file = formData.get('file') as File;
  const assetCategory = (formData.get('assetCategory') as string) || 'asset';

  if (!file) {
    return { success: false, error: 'No file was provided for upload.' };
  }

  // Calculate human-readable file size with GB support for audio software & libraries
  const sizeInBytes = file.size;
  let formattedSize = '';
  if (sizeInBytes >= 1024 * 1024 * 1024) {
    formattedSize = `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else if (sizeInBytes >= 1024 * 1024) {
    formattedSize = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    formattedSize = `${Math.round(sizeInBytes / 1024)} KB`;
  }

  try {
    const admin = getAdminClient();
    const bucketName = 'product-assets';

    // File name formatting
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${assetCategory}/${Date.now()}_${sanitizedOriginalName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload directly to Supabase Storage
    const { data, error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('[STORAGE_UPLOAD_ERROR]', uploadError);
      if (
        uploadError.message?.includes('exceeded') ||
        uploadError.message?.includes('EntityTooLarge') ||
        uploadError.message?.includes('413')
      ) {
        return {
          success: false,
          error: `File is ${formattedSize}. For multi-gigabyte files (2GB - 5GB+), please switch to 'External Link' to paste your Google Drive, Dropbox, or AWS S3 link directly.`,
        };
      }
      return {
        success: false,
        error: `Cloud upload error: ${uploadError.message}`,
      };
    }

    // Get public CDN URL
    const { data: publicUrlData } = admin.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return {
      success: true,
      fileId: data.id || data.path,
      fileUrl: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: formattedSize,
    };
  } catch (error: any) {
    console.error('uploadAssetToDriveAction exception:', error);
    return {
      success: false,
      error: error.message || 'Error uploading file to cloud storage.',
    };
  }
}
