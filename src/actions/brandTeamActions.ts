'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

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
  createdAt: string;
}

/**
 * Fetch all team members and pending invites for a brand
 */
export async function getBrandTeamAction(brandId: string) {
  try {
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

    // Insert or update pending invite
    const { data: existingInvite } = await admin
      .from('brand_invites')
      .select('id')
      .eq('brand_id', params.brandId)
      .eq('email', cleanEmail)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      await admin
        .from('brand_invites')
        .update({
          role: params.role,
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
      });
      if (insErr) throw insErr;
    }

    // If the user already has an auth account, we can immediately add them to brand_members!
    if (existingUser) {
      await admin.from('brand_members').insert({
        user_id: existingUser.id,
        brand_id: params.brandId,
        role: params.role,
        status: 'active',
      });

      await admin
        .from('brand_invites')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('brand_id', params.brandId)
        .eq('email', cleanEmail);
    }

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('inviteBrandMemberAction error:', err);
    return { success: false, error: err.message || 'Failed to send brand team invitation.' };
  }
}

/**
 * Revoke or cancel a pending invite
 */
export async function revokeBrandInviteAction(inviteId: string, brandId: string) {
  try {
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
