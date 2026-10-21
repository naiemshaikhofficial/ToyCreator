/**
 * Toy Creator — Team Invitation Email Service via Resend
 * Sends dark charcoal branded invitation emails to studio colleagues.
 * Sender: info@producertoy.com
 */

const LOGO_URL = 'https://creators.producertoy.com/logo.png';
const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://creators.producertoy.com';

const ROLE_METADATA: Record<
  'admin' | 'developer' | 'support' | 'finance',
  { title: string; summary: string; permissions: string[] }
> = {
  developer: {
    title: 'Developer / Sound Designer',
    summary: 'Audio product catalog access (DSP specs, installer packages, sample archives, presets). No access to banking or earnings.',
    permissions: [
      'Manage audio product deliverables (Windows .exe, macOS .pkg, Universal ZIP)',
      'Configure DSP specs, system requirements, supported DAWs & machine seats',
      'Upload soundware presets, demo audio loops, and square artwork',
      'Isolated from banking credentials and platform payout statements',
    ],
  },
  admin: {
    title: 'Brand Admin',
    summary: 'Catalog management, release publishing, serial pool uploads, and team member management. Cannot alter bank payouts or transfer ownership.',
    permissions: [
      'Publish and update audio software in the ProducerToy catalog',
      'Batch ingest and manage cryptographic serial key pools',
      'Invite colleagues and allocate team seats',
      'Restricted from altering bank payout accounts or transfer of ownership',
    ],
  },
  support: {
    title: 'Support Agent',
    summary: 'Access to customer orders, serial key audits, license lookup, and developer support tickets. Cannot edit binaries or payouts.',
    permissions: [
      'Lookup customer orders, invoices, and purchase records',
      'Audit hardware machine seats and device activations',
      'Respond to developer support inquiries and technical tickets',
      'Restricted from modifying release binaries or financial ledger',
    ],
  },
  finance: {
    title: 'Finance / Operations',
    summary: 'View-only access to sales analytics, transaction logs, monthly payout receipts, and statements.',
    permissions: [
      'View sales analytics, revenue velocity, and promo conversion metrics',
      'Inspect 70/30 ledger itemization and payout receipts',
      'Export accounting summaries and monthly statements',
      'View-only access; cannot modify live catalog or installers',
    ],
  },
};

interface SendBrandTeamInviteParams {
  to: string;
  brandName: string;
  role: 'admin' | 'developer' | 'support' | 'finance';
  inviterEmail?: string;
}

export async function sendBrandTeamInviteEmail({
  to,
  brandName,
  role,
  inviterEmail,
}: SendBrandTeamInviteParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const cleanEmail = to.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Invalid recipient email.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[TEAM_INVITE_EMAIL] RESEND_API_KEY is not configured in .env.local.');
    return { success: false, error: 'Email service configuration missing.' };
  }

  const fromEmail = process.env.EMAIL_FROM || 'ProducerToy Creator Portal <info@producertoy.com>';
  const roleInfo = ROLE_METADATA[role] || ROLE_METADATA.developer;
  const loginUrl = `${PORTAL_URL}/login?email=${encodeURIComponent(cleanEmail)}`;

  const permissionsListHtml = roleInfo.permissions
    .map(
      (p) =>
        `<tr>
          <td style="padding: 4px 0; vertical-align: top; width: 18px; color: #a0a0a0; font-size: 13px;">✓</td>
          <td style="padding: 4px 0; color: #d4d4d8; font-size: 12px; line-height: 1.5;">${p}</td>
        </tr>`
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to Join ${brandName} on Toy Creator</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 32px 14px;">
        <!-- Container -->
        <table border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; background-color: #161616; border: 1px solid #262626; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          
          <!-- Header with Emblem -->
          <tr>
            <td align="center" style="padding: 36px 24px 24px 24px; background-color: #121212; border-bottom: 1px solid #242424;">
              <a href="${PORTAL_URL}" style="text-decoration: none; display: inline-block;">
                <img src="${LOGO_URL}" alt="Toy Creator Emblem" width="60" height="60" style="display: block; margin: 0 auto; border: none; border-radius: 12px;" />
              </a>
              <div style="margin-top: 14px; font-size: 15px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; text-transform: uppercase;">
                TOY CREATOR
              </div>
              <div style="font-size: 10px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">
                by ProducerToy
              </div>
              <div style="margin-top: 14px; display: inline-block; padding: 4px 12px; background-color: #202020; border: 1px solid #2e2e2e; border-radius: 6px;">
                <span style="font-size: 10px; font-weight: 700; color: #d4d4d8; text-transform: uppercase; letter-spacing: 0.08em;">
                  Brand Team Seat Allocation
                </span>
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 28px; background-color: #161616;">
              <h1 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                You've been invited to join <span style="color: #ffffff; text-decoration: underline;">${brandName}</span>
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #a0a0a0;">
                ${inviterEmail ? `<strong>${inviterEmail}</strong> has invited you` : 'You have been invited'} to collaborate as an authorized team member for <strong>${brandName}</strong> on the Toy Creator publisher portal.
              </p>

              <!-- Seat & Role Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121212; border: 1px solid #242424; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 18px; border-bottom: 1px solid #202020;">
                    <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em;">Assigned Publisher Role</div>
                    <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 4px;">
                      ${roleInfo.title}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #202020;">
                    <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Scope & Access</div>
                    <div style="font-size: 12px; color: #a0a0a0; line-height: 1.5;">
                      ${roleInfo.summary}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Authorized Capabilities</div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      ${permissionsListHtml}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #34363d; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
                          <a href="${loginUrl}" 
                             style="display: inline-block; padding: 14px 32px; font-size: 12px; font-weight: 800; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em;">
                            Accept Invitation &amp; Access Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Instant Activation Note -->
              <div style="padding: 14px 16px; background-color: #141414; border: 1px solid #222222; border-radius: 8px; font-size: 11px; line-height: 1.6; color: #888888;">
                <strong style="color: #ffffff;">How login works:</strong> Sign in or create your account using <span style="color: #ffffff; font-family: monospace;">${cleanEmail}</span>. Your seat for <strong>${brandName}</strong> will automatically link upon authentication.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 20px; background-color: #101010; border-top: 1px solid #202020;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.06em;">
                Toy Creator — Audio Software Distribution Platform
              </p>
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #555555;">
                Operated by ProducerToy • Direct inquiries: <a href="mailto:info@producertoy.com" style="color: #888888; text-decoration: underline;">info@producertoy.com</a>
              </p>
              <p style="margin: 0; font-size: 9px; color: #444444; text-transform: uppercase; letter-spacing: 0.05em;">
                &copy; ${new Date().getFullYear()} PRODUCERTOY. ALL RIGHTS RESERVED.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: `Invitation to join ${brandName} on Toy Creator (${roleInfo.title})`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[RESEND_INVITE_ERROR]', res.status, errText);
      return { success: false, error: `Email delivery failed (${res.status}): ${errText}` };
    }

    const resJson = await res.json();
    return { success: true, messageId: resJson.id };
  } catch (err: any) {
    console.error('[RESEND_INVITE_EXCEPTION]', err);
    return { success: false, error: err?.message || 'Email dispatch exception' };
  }
}
