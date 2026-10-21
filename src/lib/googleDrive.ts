import crypto from 'crypto';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Generates Google OAuth 2.0 Access Token using Service Account RSA-256 JWT
 * Matches ProducerToy's core streaming engine
 */
export async function getGoogleDriveAccessToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyPem = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKeyPem) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid
  if (cachedToken && tokenExpiresAt > now + 300) {
    return cachedToken;
  }

  try {
    const cleanKey = privateKeyPem
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
      .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');

    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
    const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    const privateKeyFormatted = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
      .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
      .trim()}\n-----END PRIVATE KEY-----`;

    const signature = sign.sign(privateKeyFormatted, 'base64url');
    const jwt = `${unsignedToken}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiresAt = now + (data.expires_in || 3600);
      return cachedToken;
    } else {
      console.error('[GOOGLE_OAUTH_TOKEN_ERROR]', data);
      return null;
    }
  } catch (err) {
    console.error('[GET_GOOGLE_ACCESS_TOKEN_ERROR]', err);
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i >= 2 ? 1 : 0));
  return `${val} ${sizes[i]}`;
}

export interface DriveVerificationResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileSize?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  standardUrl?: string;
  error?: string;
}

/**
 * Extracts Google Drive ID from any URL format and queries metadata via Service Account
 */
export async function verifyGoogleDriveAsset(urlOrId: string): Promise<DriveVerificationResult> {
  if (!urlOrId || typeof urlOrId !== 'string') {
    return { success: false, error: 'Empty or invalid URL' };
  }

  // Extract standard 25+ char alphanumeric Google Drive File ID
  const driveIdMatch = urlOrId.match(/[-\w]{25,}/)?.[0];
  if (!driveIdMatch) {
    return { success: false, error: 'Could not detect a valid Google Drive File ID' };
  }

  const token = await getGoogleDriveAccessToken();
  if (!token) {
    // If service account credentials aren't ready, still return normalized Google Drive link
    return {
      success: true,
      fileId: driveIdMatch,
      standardUrl: `https://drive.google.com/file/d/${driveIdMatch}/view?usp=sharing`,
    };
  }

  try {
    const apiUrl = `https://www.googleapis.com/drive/v3/files/${driveIdMatch}?fields=id,name,size,mimeType&supportsAllDrives=true`;
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ToyCreator-ProducerToy-Bridge/1.0',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const bytes = parseInt(data.size || '0', 10);
      return {
        success: true,
        fileId: data.id,
        fileName: data.name,
        fileSizeBytes: bytes,
        fileSize: bytes > 0 ? formatFileSize(bytes) : undefined,
        mimeType: data.mimeType,
        standardUrl: `https://drive.google.com/file/d/${data.id}/view?usp=sharing`,
      };
    } else {
      // Still return normalized link even if permissions are restricted
      return {
        success: true,
        fileId: driveIdMatch,
        standardUrl: `https://drive.google.com/file/d/${driveIdMatch}/view?usp=sharing`,
      };
    }
  } catch (err: any) {
    return {
      success: true,
      fileId: driveIdMatch,
      standardUrl: `https://drive.google.com/file/d/${driveIdMatch}/view?usp=sharing`,
    };
  }
}
