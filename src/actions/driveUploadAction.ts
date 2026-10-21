'use server';

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  error?: string;
}

/**
 * Server Action: Upload file directly to dedicated cloud storage via automated webhook pipeline
 */
export async function uploadAssetToDriveAction(formData: FormData): Promise<DriveUploadResult> {
  const file = formData.get('file') as File;
  const assetCategory = (formData.get('assetCategory') as string) || 'asset';

  if (!file) {
    return { success: false, error: 'No file was provided for upload.' };
  }

  // Calculate human-readable file size with GB support
  const sizeInBytes = file.size;
  let formattedSize = '';
  if (sizeInBytes >= 1024 * 1024 * 1024) {
    formattedSize = `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else if (sizeInBytes >= 1024 * 1024) {
    formattedSize = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    formattedSize = `${Math.round(sizeInBytes / 1024)} KB`;
  }

  const WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    console.error('Missing cloud storage webhook URL in environment configuration.');
    return {
      success: false,
      error: 'Cloud storage endpoint is not configured. Please switch to the "External Link" tab to link your cloud asset directly.',
    };
  }

  // Browser in-memory upload limit protection (prevent memory crash on files >50MB)
  if (file.size > 50 * 1024 * 1024) {
    return {
      success: false,
      error: `File size is ${formattedSize}. Direct browser upload supports files up to 50MB. For larger installers and sample libraries (50MB–10GB), please switch to the "External Link" tab to paste your direct cloud link.`,
    };
  }

  try {
    // Convert File buffer to Base64 (safe for files <= 50MB)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // File name formatting
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cloudFileName = `PT_${assetCategory}_${Date.now()}_${sanitizedOriginalName}`;

    const payload = new URLSearchParams();
    payload.append('fileName', cloudFileName);
    payload.append('mimeType', file.type || 'application/octet-stream');
    payload.append('data', base64Data);

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      payload.append('folderId', folderId);
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: payload,
      redirect: 'follow',
    });

    const rawText = await response.text();
    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('Non-JSON response from cloud storage webhook:', rawText.substring(0, 300));
      if (response.status === 404 || rawText.includes('Page not found') || rawText.includes('does not exist')) {
        return {
          success: false,
          error: 'Cloud storage upload endpoint returned 404 Not Found. If using an automated cloud webhook, ensure deployment access is set to "Anyone", or use the "External Link" tab to link your file directly.',
        };
      }
      return {
        success: false,
        error: 'Cloud storage service returned an unexpected response. Please switch to the "External Link" tab to link your asset directly.',
      };
    }

    if (!result.success && !result.fileId) {
      return {
        success: false,
        error: result.error || 'Failed to save asset to cloud storage. Please try again or use the "External Link" tab.',
      };
    }

    const fileId = result.fileId || result.id;
    // Standard direct streaming download link
    const fileUrl = result.downloadUrl || result.webViewLink || `https://drive.google.com/uc?id=${fileId}&export=download`;

    return {
      success: true,
      fileId,
      fileUrl,
      fileName: file.name,
      fileSize: formattedSize,
    };
  } catch (error: any) {
    console.error('uploadAssetToDriveAction exception:', error);
    return {
      success: false,
      error: 'A network error occurred while uploading to cloud storage. Please try again or use the "External Link" tab.',
    };
  }
}

/**
 * Server Action: Verifies cloud storage link, extracts File ID, and auto-detects name & size
 * Matches ProducerToy download engine format
 */
export async function verifyDriveLinkAction(url: string) {
  const { verifyGoogleDriveAsset } = await import('@/lib/googleDrive');
  return await verifyGoogleDriveAsset(url);
}
