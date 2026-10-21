/**
 * Toy Creator — Team Invitation Email Service via Resend
 * Sends dark charcoal branded invitation emails to studio colleagues.
 * Sender: info@producertoy.com
 */

const CREATORS_LOGO_URL = 'https://imagizer.imageshack.com/img924/664/F2MeF5.png';
const PRODUCERTOY_BOTTOM_LOGO_URL = 'https://imagizer.imageshack.com/img922/171/nu2UgR.png';
const CREATORS_PORTAL_URL = 'https://creators.producertoy.com';
const MAIN_SITE_URL = 'https://producertoy.com';
const SUPPORT_EMAIL = 'support@producertoy.com';

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
  brandLogoUrl?: string | null;
  role: 'admin' | 'developer' | 'support' | 'finance';
  inviterEmail?: string;
  inviteToken?: string;
  isNewAccount?: boolean;
}

export async function sendBrandTeamInviteEmail({
  to,
  brandName,
  brandLogoUrl,
  role,
  inviterEmail,
  inviteToken,
  isNewAccount,
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
  const actionUrl = inviteToken
    ? `${CREATORS_PORTAL_URL}/invite?token=${encodeURIComponent(inviteToken)}`
    : `${CREATORS_PORTAL_URL}/login?email=${encodeURIComponent(cleanEmail)}`;

  const ctaButtonText = isNewAccount
    ? 'Accept Invitation &amp; Create Account'
    : 'Accept Invitation &amp; Access Dashboard';

  const activationNoteHtml = isNewAccount
    ? `<strong style="color: #ffffff;">How account creation works:</strong> Set your password and activate your seat for <strong>${brandName}</strong>. This secure token is cryptographically bound to <span style="color: #ffffff; font-family: monospace;">${cleanEmail}</span>.`
    : `<strong style="color: #ffffff;">How login works:</strong> Sign in with your existing account using <span style="color: #ffffff; font-family: monospace;">${cleanEmail}</span>. Your seat for <strong>${brandName}</strong> will automatically link upon authentication.`;

  const permissionsListHtml = roleInfo.permissions
    .map(
      (p) =>
        `<tr>
          <td style="padding: 5px 0; vertical-align: top; width: 20px; color: #10b981; font-size: 13px; font-weight: bold;">✓</td>
          <td style="padding: 5px 0; color: #d4d4d8; font-size: 12px; line-height: 1.55;">${p}</td>
        </tr>`
    )
    .join('');

  // Fallback initial letter for brand logo if not uploaded
  const brandInitial = (brandName || 'B').trim().charAt(0).toUpperCase();

  const brandLogoHtml = brandLogoUrl
    ? `<img src="${brandLogoUrl}" alt="${brandName} Logo" width="56" height="56" style="width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid #333338; display: block;" />`
    : `<div style="width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, #27272a 0%, #18181b 100%); border: 1px solid #3f3f46; text-align: center; line-height: 56px; font-size: 24px; font-weight: 800; color: #ffffff; text-transform: uppercase;">${brandInitial}</div>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to Join ${brandName} on Toy Creator</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 36px 14px 44px 14px;">
        <!-- Container -->
        <table border="0" cellpadding="0" cellspacing="0" style="max-width: 590px; width: 100%; background-color: #141416; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.7);">
          
          <!-- Header with Main Toy Creator Logo (Redirects to creators.producertoy.com) -->
          <tr>
            <td align="center" style="padding: 36px 24px 26px 24px; background: linear-gradient(180deg, #18181b 0%, #121214 100%); border-bottom: 1px solid #27272a;">
              <a href="${CREATORS_PORTAL_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                <img src="${CREATORS_LOGO_URL}" alt="Toy Creator Logo" width="68" height="60" style="display: block; margin: 0 auto; border: none; border-radius: 14px; max-width: 68px; height: auto;" />
              </a>
              <div style="margin-top: 14px; font-size: 16px; font-weight: 800; letter-spacing: 0.04em; color: #ffffff; text-transform: uppercase;">
                TOY CREATOR
              </div>
              <div style="font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">
                by ProducerToy
              </div>
              <div style="margin-top: 14px; display: inline-block; padding: 5px 14px; background-color: #1f1f23; border: 1px solid #2e2e34; border-radius: 9999px;">
                <span style="font-size: 10px; font-weight: 700; color: #d4d4d8; text-transform: uppercase; letter-spacing: 0.08em;">
                  Brand Team Seat Allocation
                </span>
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 28px; background-color: #141416;">
              
              <!-- Brand Identity Spotlight Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 12px; margin-bottom: 24px; padding: 18px 20px;">
                <tr>
                  <td style="width: 56px; vertical-align: middle; padding-right: 16px;">
                    ${brandLogoHtml}
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 10px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.09em;">
                      Target Brand Workspace
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 3px; line-height: 1.25;">
                      ${brandName}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Invitation Message (Kisne bheja) -->
              <div style="padding: 14px 16px; background-color: #18181b; border: 1px solid #27272a; border-radius: 10px; margin-bottom: 24px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="width: 26px; vertical-align: top; padding-right: 10px; font-size: 16px;">
                      ✉️
                    </td>
                    <td style="font-size: 13px; line-height: 1.6; color: #d4d4d8;">
                      ${
                        inviterEmail
                          ? `<strong style="color: #ffffff;">${inviterEmail}</strong> has invited you to collaborate as an authorized team member for <strong style="color: #ffffff;">${brandName}</strong> on the Toy Creator publisher portal.`
                          : `You have been officially invited to join <strong style="color: #ffffff;">${brandName}</strong> as an authorized team member on the Toy Creator publisher portal.`
                      }
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Seat & Role Card (Kya role hai) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #242428;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em;">
                            Assigned Publisher Role
                          </div>
                          <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 4px;">
                            ${roleInfo.title}
                          </div>
                        </td>
                        <td align="right" style="vertical-align: top;">
                          <span style="display: inline-block; padding: 4px 10px; background-color: #27272a; border: 1px solid #3f3f46; border-radius: 6px; font-size: 10px; font-weight: 800; color: #e4e4e7; text-transform: uppercase; letter-spacing: 0.05em;">
                            ${role.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #242428;">
                    <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
                      Scope &amp; Access Level
                    </div>
                    <div style="font-size: 12px; color: #a1a1aa; line-height: 1.55;">
                      ${roleInfo.summary}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">
                      Authorized Capabilities
                    </div>
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
                        <td align="center" style="background-color: #27272a; border-radius: 10px; border: 1px solid rgba(255,255,255,0.22); box-shadow: 0 6px 18px rgba(0,0,0,0.6);">
                          <a href="${actionUrl}" 
                             style="display: inline-block; padding: 14px 34px; font-size: 12px; font-weight: 800; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em;">
                            ${ctaButtonText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Instant Activation Note -->
              <div style="padding: 14px 16px; background-color: #121214; border: 1px solid #202024; border-radius: 8px; font-size: 11px; line-height: 1.6; color: #888888; margin-bottom: 22px;">
                ${activationNoteHtml}
              </div>

              <!-- Support Section (support@producertoy.com mailto with icon) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #17171a; border: 1px solid #27272c; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width: 32px; vertical-align: middle; padding-right: 12px;">
                          <a href="mailto:${SUPPORT_EMAIL}" style="text-decoration: none; display: inline-block;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background-color: #242429; border: 1px solid #383840; text-align: center; line-height: 32px; font-size: 15px; color: #ffffff;">
                              ✉
                            </div>
                          </a>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em;">
                            Questions or Need Assistance?
                          </div>
                          <div style="font-size: 12px; color: #a1a1aa; margin-top: 2px;">
                            Contact Developer Support at 
                            <a href="mailto:${SUPPORT_EMAIL}" style="color: #60a5fa; text-decoration: none; font-weight: 700;">${SUPPORT_EMAIL}</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer with Bottom ProducerToy Logo (Redirects to producertoy.com, Drag Off) -->
          <tr>
            <td align="center" style="padding: 28px 24px; background-color: #0e0e10; border-top: 1px solid #202024;">
              
              <!-- Bottom ProducerToy Logo with drag off and redirect to producertoy.com -->
              <div style="margin-bottom: 16px;">
                <a href="${MAIN_SITE_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                  <img src="${PRODUCERTOY_BOTTOM_LOGO_URL}" 
                       alt="ProducerToy" 
                       width="160" 
                       draggable="false" 
                       style="display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none; max-width: 160px; width: 100%; height: auto; -webkit-user-drag: none; -khtml-user-drag: none; -moz-user-drag: none; -o-user-drag: none; user-select: none;" />
                </a>
              </div>

              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.06em;">
                Toy Creator — Audio Software Distribution Platform
              </p>
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #555555;">
                Operated by ProducerToy • Inquiries: <a href="mailto:${SUPPORT_EMAIL}" style="color: #888888; text-decoration: underline;">${SUPPORT_EMAIL}</a>
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

