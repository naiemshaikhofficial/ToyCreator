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
 * Server Action: Upload file directly to owner's Google Drive via Google Apps Script Webhook
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

  const WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    console.error('Missing GOOGLE_WEBHOOK_URL in environment configuration.');
    return {
      success: false,
      error: 'Cloud storage webhook is not configured. For large files (2GB, 5GB+), switch to External Link to paste your Google Drive or Dropbox link directly.',
    };
  }

  try {
    // Convert File buffer to Base64
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
    });

    const rawText = await response.text();
    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Non-JSON response from Google Apps Script Webhook:', rawText.substring(0, 300));
      return {
        success: false,
        error: 'Cloud storage webhook returned an unexpected response. Please try again.',
      };
    }

    if (!result.success && !result.fileId) {
      return {
        success: false,
        error: result.error || 'Failed to save file to cloud storage.',
      };
    }

    const fileId = result.fileId || result.id;
    // Standard Google Drive direct download / viewable link
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
      error: error.message || 'Network error communicating with Google Drive.',
    };
  }
}
