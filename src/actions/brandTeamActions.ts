'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { requireBrandMembership } from '@/lib/auth/serverAuth';

export interface BrandTeamMember {
  id: string;
  userId: string;
  email?: string;
  role: 'owner' | 'admin' | 'developer' | 'support' | 'finance';
  status: 'active' | 'pending_approval' | 'suspended';
  createdAt: string;
}

export interface BrandInvite {
  id: string;
  brandId: string;
  email: string;
  role: 'admin' | 'developer' | 'support' | 'finance';
  status: 'pending' | 'accepted' | 'revoked';
  token?: string;
  createdAt: string;
}

/**
 * Fetch all team members and pending invites for a brand
 */
export async function getBrandTeamAction(brandId: string) {
  try {
    await requireBrandMembership(brandId);
    const admin = getAdminClient();

    // 1. Fetch active members
    const { data: members, error: memErr } = await admin
      .from('brand_members')
      .select('id, user_id, role, status, created_at')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: true });

    if (memErr) throw memErr;

    // Fetch user emails from auth.users via admin
    const teamMembers: BrandTeamMember[] = [];
    if (members && members.length > 0) {
      for (const m of members) {
        let userEmail = 'Authorized Member';
        try {
          const { data: userData } = await admin.auth.admin.getUserById(m.user_id);
          if (userData?.user?.email) {
            userEmail = userData.user.email;
          }
        } catch {
          // ignore error fetching single user
        }

        teamMembers.push({
          id: m.id,
          userId: m.user_id,
          email: userEmail,
          role: m.role as any,
          status: m.status as any,
          createdAt: m.created_at,
        });
      }
    }

    // 2. Fetch pending invites
    const { data: invites, error: invErr } = await admin
      .from('brand_invites')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invErr) throw invErr;

    const pendingInvites: BrandInvite[] = (invites || []).map((inv) => ({
      id: inv.id,
      brandId: inv.brand_id,
      email: inv.email,
      role: inv.role as any,
      status: inv.status as any,
      token: inv.token || undefined,
      createdAt: inv.created_at,
    }));

    return { success: true, teamMembers, pendingInvites };
  } catch (err: any) {
    console.error('getBrandTeamAction error:', err);
    return { success: false, error: err.message || 'Failed to load brand team.', teamMembers: [], pendingInvites: [] };
  }
}

/**
 * Send an email invitation to join the brand
 */
export async function inviteBrandMemberAction(params: {
  brandId: string;
  email: string;
  role: 'admin' | 'developer' | 'support' | 'finance';
  invitedByUserId?: string;
}) {
  try {
    const session = await requireBrandMembership(params.brandId, ['owner', 'admin']);
    const admin = getAdminClient();
    const cleanEmail = params.email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    // Check if member already exists in brand_members
    // First find if there's a user with this email
    const { data: userList } = await admin.auth.admin.listUsers();
    const existingUser = (userList?.users as any[])?.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      const { data: existingMember } = await admin
        .from('brand_members')
        .select('id')
        .eq('brand_id', params.brandId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return { success: false, error: 'This user is already a member of your brand team.' };
      }
    }

    // Generate a secure cryptographically random invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    let finalToken = inviteToken;

    // Insert or update pending invite
    const { data: existingInvite } = await admin
      .from('brand_invites')
      .select('id, token')
      .eq('brand_id', params.brandId)
      .eq('email', cleanEmail)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      if (existingInvite.token) finalToken = existingInvite.token;
      await admin
        .from('brand_invites')
        .update({
          role: params.role,
          token: finalToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInvite.id);
    } else {
      const { error: insErr } = await admin.from('brand_invites').insert({
        brand_id: params.brandId,
        email: cleanEmail,
        role: params.role,
        invited_by_user_id: params.invitedByUserId || null,
        status: 'pending',
        token: finalToken,
      });
      if (insErr) throw insErr;
    }

    // If the user already has an auth account, link them to brand_members right away
    if (existingUser) {
      const { data: memCheck } = await admin
        .from('brand_members')
        .select('id')
        .eq('brand_id', params.brandId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (!memCheck) {
        await admin.from('brand_members').insert({
          user_id: existingUser.id,
          brand_id: params.brandId,
          role: params.role,
          status: 'active',
        });
      }

      await admin
        .from('brand_invites')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('brand_id', params.brandId)
        .eq('email', cleanEmail);
    }

    // Fetch brand name, logo & inviter email for email notification
    let brandName = 'ProducerToy Studio';
    let brandLogoUrl: string | undefined;
    try {
      const { data: brandData } = await admin
        .from('brands')
        .select('name, logo_url')
        .eq('id', params.brandId)
        .maybeSingle();
      if (brandData?.name) brandName = brandData.name;
      if (brandData?.logo_url) brandLogoUrl = brandData.logo_url;
    } catch (e) {
      console.warn('Could not fetch brand details for invite email:', e);
    }

    let inviterEmail: string | undefined;
    if (params.invitedByUserId) {
      try {
        const { data: inviterUser } = await admin.auth.admin.getUserById(params.invitedByUserId);
        inviterEmail = inviterUser?.user?.email;
      } catch {
        // ignore error fetching inviter
      }
    }

    // Send official branded invite email via Resend
    let emailSent = false;
    let emailError: string | undefined;
    try {
      const { sendBrandTeamInviteEmail } = await import('@/lib/email/teamInviteEmail');
      const emailResult = await sendBrandTeamInviteEmail({
        to: cleanEmail,
        brandName,
        brandLogoUrl,
        role: params.role,
        inviterEmail,
        inviteToken: finalToken,
        isNewAccount: !existingUser,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
    } catch (mailErr: any) {
      console.error('Error dispatching team invite email:', mailErr);
      emailError = mailErr?.message;
    }

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true, emailSent, emailError };
  } catch (err: any) {
    console.error('inviteBrandMemberAction error:', err);
    return { success: false, error: err.message || 'Failed to send brand team invitation.' };
  }
}

/**
 * Validates a team invitation token from the database
 */
export async function validateInviteTokenAction(token: string): Promise<{
  success: boolean;
  error?: string;
  invite?: {
    email: string;
    role: 'admin' | 'developer' | 'support' | 'finance';
    brandId: string;
    brandName: string;
    brandLogoUrl?: string | null;
    isExistingUser: boolean;
  };
}> {
  if (!token || typeof token !== 'string' || token.trim().length < 16) {
    return { success: false, error: 'Invalid or missing invitation token.' };
  }

  try {
    const admin = getAdminClient();
    const cleanToken = token.trim();

    const { data: invite, error: invErr } = await admin
      .from('brand_invites')
      .select('id, brand_id, email, role, status, token')
      .eq('token', cleanToken)
      .maybeSingle();

    if (invErr || !invite) {
      return { success: false, error: 'Invitation not found. Please verify your link or request a new invite.' };
    }

    if (invite.status === 'revoked') {
      return { success: false, error: 'This invitation has been revoked by the studio administrator.' };
    }

    if (invite.status === 'accepted') {
      return {
        success: false,
        error: 'This invitation has already been accepted. Please sign in to access your dashboard.',
      };
    }

    // Fetch brand name & logo
    let brandName = 'ProducerToy Studio';
    let brandLogoUrl: string | null = null;
    try {
      const { data: brandData } = await admin
        .from('brands')
        .select('name, logo_url')
        .eq('id', invite.brand_id)
        .maybeSingle();
      if (brandData?.name) brandName = brandData.name;
      if (brandData?.logo_url) brandLogoUrl = brandData.logo_url;
    } catch {
      // ignore
    }

    // Check if user already exists
    const { data: userList } = await admin.auth.admin.listUsers();
    const existingUser = (userList?.users as any[])?.find(
      (u: any) => u.email?.toLowerCase() === invite.email.toLowerCase()
    );

    return {
      success: true,
      invite: {
        email: invite.email,
        role: invite.role as any,
        brandId: invite.brand_id,
        brandName,
        brandLogoUrl,
        isExistingUser: Boolean(existingUser),
      },
    };
  } catch (err: any) {
    console.error('validateInviteTokenAction error:', err);
    return { success: false, error: err.message || 'Failed to validate invitation token.' };
  }
}

/**
 * Completes secure token-based account registration for an invited member
 */
export async function acceptInviteAndRegisterAction(params: {
  token: string;
  fullName: string;
  password: string;
  turnstileToken: string;
}): Promise<{ success: boolean; error?: string; email?: string }> {
  try {
    const { token, fullName, password, turnstileToken } = params;

    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Invalid invitation token.' };
    }

    if (!fullName || !fullName.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }

    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    // Verify Cloudflare Turnstile token
    const { validateTurnstileAction } = await import('@/actions/authActions');
    const turnstileCheck = await validateTurnstileAction(turnstileToken);
    if (!turnstileCheck.success) {
      return { success: false, error: turnstileCheck.error || 'Security verification failed. Please try again.' };
    }

    const admin = getAdminClient();

    // 1. Verify invite token from database
    const { data: invite, error: invErr } = await admin
      .from('brand_invites')
      .select('*')
      .eq('token', token.trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (invErr || !invite) {
      return { success: false, error: 'Invitation is invalid, expired, or has already been claimed.' };
    }

    const cleanEmail = invite.email.trim().toLowerCase();

    // 2. Check if user already exists
    const { data: userList } = await admin.auth.admin.listUsers();
    const existingUser = (userList?.users as any[])?.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // 3. Create the user securely in Supabase Auth
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true, // Email confirmed because token was sent to this exact email
        user_metadata: {
          full_name: fullName.trim(),
        },
      });

      if (createErr || !created?.user) {
        throw new Error(createErr?.message || 'Failed to create account.');
      }

      userId = created.user.id;

      // 4. Upsert into public.profiles
      try {
        await admin.from('profiles').upsert({
          id: userId,
          email: cleanEmail,
          full_name: fullName.trim(),
          display_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        });
      } catch (profErr) {
        console.warn('profiles upsert note:', profErr);
      }
    }

    // 5. Add to brand_members
    const { data: existingMember } = await admin
      .from('brand_members')
      .select('id')
      .eq('brand_id', invite.brand_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingMember) {
      const { error: memErr } = await admin.from('brand_members').insert({
        user_id: userId,
        brand_id: invite.brand_id,
        role: invite.role,
        status: 'active',
      });
      if (memErr) throw memErr;
    }

    // 6. Update invite status to accepted
    await admin
      .from('brand_invites')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true, email: cleanEmail };
  } catch (err: any) {
    console.error('acceptInviteAndRegisterAction error:', err);
    return { success: false, error: err.message || 'Failed to complete registration.' };
  }
}

/**
 * Claims a pending invite for an existing authenticated user
 */
export async function claimInviteWithTokenAction(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { data: invite, error: invErr } = await admin
      .from('brand_invites')
      .select('*')
      .eq('token', token.trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (invErr || !invite) {
      return { success: false, error: 'Invitation not found or already claimed.' };
    }

    // Add to brand_members
    const { data: existingMember } = await admin
      .from('brand_members')
      .select('id')
      .eq('brand_id', invite.brand_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingMember) {
      await admin.from('brand_members').insert({
        user_id: userId,
        brand_id: invite.brand_id,
        role: invite.role,
        status: 'active',
      });
    }

    // Update invite status to accepted
    await admin
      .from('brand_invites')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('claimInviteWithTokenAction error:', err);
    return { success: false, error: err.message || 'Failed to claim invitation.' };
  }
}

/**
 * Revoke or cancel a pending invite
 */
export async function revokeBrandInviteAction(inviteId: string, brandId: string) {
  try {
    await requireBrandMembership(brandId, ['owner', 'admin']);
    const admin = getAdminClient();

    const { error } = await admin
      .from('brand_invites')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', inviteId)
      .eq('brand_id', brandId);

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err: any) {
    console.error('revokeBrandInviteAction error:', err);
    return { success: false, error: err.message || 'Failed to revoke invite.' };
  }
}

/**
 * Remove / Revoke a team member from the brand
 */
export async function removeBrandMemberAction(memberId: string, brandId: string) {
  try {
    await requireBrandMembership(brandId, ['owner', 'admin']);
    const admin = getAdminClient();

    // Verify target is not the only owner
    const { data: member } = await admin
      .from('brand_members')
      .select('role')
      .eq('id', memberId)
      .eq('brand_id', brandId)
      .maybeSingle();

    if (member?.role === 'owner') {
      const { count } = await admin
        .from('brand_members')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
        .eq('role', 'owner');

      if ((count || 0) <= 1) {
        return { success: false, error: 'Cannot remove the primary brand owner. Transfer ownership first.' };
      }
    }

    const { error } = await admin
      .from('brand_members')
      .delete()
      .eq('id', memberId)
      .eq('brand_id', brandId);

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('removeBrandMemberAction error:', err);
    return { success: false, error: err.message || 'Failed to remove team member.' };
  }
}

/**
 * Update member role (e.g. promote or restrict permissions)
 */
export async function updateBrandMemberRoleAction(
  memberId: string,
  brandId: string,
  newRole: 'owner' | 'admin' | 'developer' | 'support' | 'finance'
) {
  try {
    await requireBrandMembership(brandId, ['owner', 'admin']);
    const admin = getAdminClient();

    const { error } = await admin
      .from('brand_members')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('brand_id', brandId);

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err: any) {
    console.error('updateBrandMemberRoleAction error:', err);
    return { success: false, error: err.message || 'Failed to update member role.' };
  }
}

/**
 * Automatically claim any pending invite when an invited user logs in
 */
export async function claimPendingInvitesForUser(userId: string, email: string) {
  try {
    const admin = getAdminClient();
    const cleanEmail = email.trim().toLowerCase();

    // Check if there are pending invites for this email
    const { data: invites } = await admin
      .from('brand_invites')
      .select('*')
      .eq('email', cleanEmail)
      .eq('status', 'pending');

    if (!invites || invites.length === 0) return { claimed: 0 };

    let claimed = 0;
    for (const inv of invites) {
      // Upsert membership
      const { error: insErr } = await admin.from('brand_members').upsert({
        user_id: userId,
        brand_id: inv.brand_id,
        role: inv.role,
        status: 'active',
      });

      if (!insErr) {
        await admin
          .from('brand_invites')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', inv.id);
        claimed++;
      }
    }

    return { claimed };
  } catch (err) {
    console.error('claimPendingInvitesForUser error:', err);
    return { claimed: 0 };
  }
}
