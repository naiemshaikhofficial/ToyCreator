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
 * Server Action: Upload file directly to owner's 5TB Google Drive storage via Apps Script Webhook
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
    console.error('Missing GOOGLE_WEBHOOK_URL in environment configuration.');
    return {
      success: false,
      error: 'Google Drive Webhook URL is missing in .env.local. Please configure GOOGLE_WEBHOOK_URL to upload to your 5TB Google Drive.',
    };
  }

  // Google Apps Script and Node V8 string limit protection (base64 of >50MB crashes Node V8 memory with ERR_STRING_TOO_LONG)
  if (file.size > 50 * 1024 * 1024) {
    return {
      success: false,
      error: `File is ${formattedSize}. Direct browser upload 50MB tak support karta hai. Bade VST installers (400MB–5GB+) ko direct apne 5TB Google Drive (drive.google.com) me daal kar 'External Link' tab me link paste karein. ProducerToy direct high-speed download provide karega.`,
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
      console.error('Non-JSON response from Google Drive Webhook:', rawText.substring(0, 300));
      if (response.status === 404 || rawText.includes('Page not found') || rawText.includes('does not exist')) {
        return {
          success: false,
          error: 'Google Drive Webhook URL 404 return kar raha hai. Google Apps Script me "Deploy > New Deployment > Anyone" karke new URL daalein.',
        };
      }
      return {
        success: false,
        error: 'Google Drive Webhook ne unexpected response diya. Please check script deployment.',
      };
    }

    if (!result.success && !result.fileId) {
      return {
        success: false,
        error: result.error || 'Google Drive me file save karne me error aaya.',
      };
    }

    const fileId = result.fileId || result.id;
    // Standard Google Drive direct download link
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
      error: error.message || 'Google Drive se connect karne me network error aaya.',
    };
  }
}

/**
 * Server Action: Verifies Google Drive link, extracts File ID, and auto-detects name & size
 * Matches ProducerToy download engine format
 */
export async function verifyDriveLinkAction(url: string) {
  const { verifyGoogleDriveAsset } = await import('@/lib/googleDrive');
  return await verifyGoogleDriveAsset(url);
}
