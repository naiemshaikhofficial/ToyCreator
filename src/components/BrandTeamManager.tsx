'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBrand } from '@/context/BrandContext';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import {
  getBrandTeamAction,
  inviteBrandMemberAction,
  revokeBrandInviteAction,
  removeBrandMemberAction,
  updateBrandMemberRoleAction,
  BrandTeamMember,
  BrandInvite,
} from '@/actions/brandTeamActions';

const ROLE_DEFINITIONS: Record<
  'owner' | 'admin' | 'developer' | 'support' | 'finance',
  { label: string; badgeClass: string; description: string }
> = {
  owner: {
    label: 'Brand Owner',
    badgeClass: 'bg-white/10 text-white border-white/20',
    description: 'Full administrative control (contracts, payouts, catalog, product deletion, team invites & role assignment).',
  },
  admin: {
    label: 'Brand Admin',
    badgeClass: 'bg-zinc-700/40 text-zinc-200 border-zinc-600/50',
    description: 'Catalog management, release publishing, serial pool uploads, and team invites. Cannot alter bank payouts or transfer ownership.',
  },
  developer: {
    label: 'Developer / Sound Designer',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Audio product catalog access (DSP specs, installer packages, sample archives, presets). No access to banking or earnings.',
  },
  support: {
    label: 'Support Agent',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Access to customer orders, serial key audits, license lookup, and developer support tickets. Cannot edit binaries or payouts.',
  },
  finance: {
    label: 'Finance / Operations',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'View-only access to sales analytics, transaction logs, monthly payout receipts, and revenue statements.',
  },
};

export function BrandTeamManager() {
  const { user, membership, brand } = useBrand();

  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<BrandTeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<BrandInvite[]>([]);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'support' | 'finance'>('developer');
  const [inviting, setInviting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Status feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const brandId = brand?.id || membership?.brand_id;
  const isOwnerOrAdmin = membership?.role === 'owner' || membership?.role === 'admin';

  const loadTeam = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const res = await getBrandTeamAction(brandId);
      if (res.success) {
        setTeamMembers(res.teamMembers);
        setPendingInvites(res.pendingInvites);
      } else {
        setErrorMsg(res.error || 'Failed to load brand team.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching brand team.');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId || !inviteEmail.trim()) return;

    setInviting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await inviteBrandMemberAction({
        brandId,
        email: inviteEmail.trim(),
        role: inviteRole,
        invitedByUserId: user?.id,
      });

      if (res.success) {
        if (res.emailSent) {
          setSuccessMsg(`Team invitation email dispatched to ${inviteEmail.trim()} from info@producertoy.com.`);
        } else {
          setSuccessMsg(`Team invitation registered for ${inviteEmail.trim()}.`);
        }
        setInviteEmail('');
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg(res.error || 'Could not send invitation.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to invite colleague.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!brandId) return;
    setActionLoadingId(inviteId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await revokeBrandInviteAction(inviteId, brandId);
      if (res.success) {
        setSuccessMsg('Pending invitation revoked.');
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to revoke invite.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error revoking invite.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail?: string) => {
    if (!brandId) return;
    const confirmRemoval = window.confirm(
      `Are you sure you want to revoke team access for ${memberEmail || 'this team member'}?`
    );
    if (!confirmRemoval) return;

    setActionLoadingId(memberId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await removeBrandMemberAction(memberId, brandId);
      if (res.success) {
        setSuccessMsg('Team member removed.');
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to remove member.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing member.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: 'owner' | 'admin' | 'developer' | 'support' | 'finance'
  ) => {
    if (!brandId) return;
    setActionLoadingId(memberId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await updateBrandMemberRoleAction(memberId, brandId, newRole);
      if (res.success) {
        setSuccessMsg('Member role updated.');
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to update role.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating member role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="toy-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a2a2a] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#202020] border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Brand Team Access & Permissions
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                {teamMembers.length} {teamMembers.length === 1 ? 'Seat' : 'Seats'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Role-Based Access Control (RBAC) for studio collaborators and co-developers
            </p>
          </div>
        </div>

        <button
          onClick={loadTeam}
          disabled={loading}
          className="btn-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto text-zinc-300 hover:text-white"
          title="Refresh Team List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Banners */}
      {successMsg && (
        <div className="p-3.5 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-[#ff4053]/15 border border-[#ff4053]/30 rounded-xl text-white text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#ff4053] flex-shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Invite Member Section (Only for Owner or Admin) */}
      {isOwnerOrAdmin ? (
        <form onSubmit={handleSendInvite} className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
            <UserPlus className="w-4 h-4 text-zinc-300" />
            <span>Invite Team Member</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Colleague Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="collaborator@yourbrand.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Publisher Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors cursor-pointer"
              >
                <option value="developer">Developer / Sound Designer</option>
                <option value="admin">Brand Admin</option>
                <option value="support">Support Agent</option>
                <option value="finance">Finance / Operations</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="btn-primary w-full py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-50"
              >
                {inviting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 pt-1">
            <span className="text-zinc-300 font-semibold">{ROLE_DEFINITIONS[inviteRole].label}: </span>
            {ROLE_DEFINITIONS[inviteRole].description}
          </p>
        </form>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424] text-xs text-zinc-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <span>Only Brand Owners and Brand Admins have permission to invite or modify team members.</span>
        </div>
      )}

      {/* Active Team Members List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-zinc-300" />
            <span>Authorized Team Members</span>
          </div>
          <span className="text-[10px] text-zinc-500">Active Seats</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            <span>Loading authorized team...</span>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#141414] border border-[#242424] text-center text-xs text-zinc-500">
            No team members found.
          </div>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((member) => {
              const roleInfo = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.developer;
              const isSelf = user?.id === member.userId;
              const isOwner = member.role === 'owner';
              const isCurrentMemberActionLoading = actionLoadingId === member.id;

              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#141414] border border-[#242424] hover:border-[#303030] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#242424] border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 uppercase">
                      {member.email ? member.email[0] : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white truncate">
                          {member.email}
                        </p>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 uppercase tracking-wider font-mono">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {/* Role selector for Owner, or static badge */}
                    {membership?.role === 'owner' && !isOwner ? (
                      <select
                        value={member.role}
                        disabled={isCurrentMemberActionLoading}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                        className="bg-[#121212] border border-[#2e2e2e] rounded-lg pl-2.5 pr-8 py-1.5 text-[11px] text-white focus:border-[#42454e] transition-colors cursor-pointer"
                      >
                        <option value="admin">Brand Admin</option>
                        <option value="developer">Developer</option>
                        <option value="support">Support Agent</option>
                        <option value="finance">Finance</option>
                      </select>
                    ) : (
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${roleInfo.badgeClass}`}
                      >
                        {roleInfo.label}
                      </span>
                    )}

                    {/* Member Removal Button */}
                    {isOwnerOrAdmin && !isOwner && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.email)}
                        disabled={isCurrentMemberActionLoading}
                        title="Revoke Team Access"
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                      >
                        {isCurrentMemberActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-[#202020]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>Pending Invitations</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {pendingInvites.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {pendingInvites.map((invite) => {
              const roleInfo = ROLE_DEFINITIONS[invite.role] || ROLE_DEFINITIONS.developer;
              const isCurrentInviteLoading = actionLoadingId === invite.id;

              return (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#141414]/60 border border-[#242424] border-dashed gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#1e1e1e] border border-zinc-700/50 flex items-center justify-center text-[11px] text-zinc-400 flex-shrink-0">
                      <Mail className="w-3 h-3 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-300 truncate">
                        {invite.email}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Invited {new Date(invite.createdAt).toLocaleDateString()} • Pending First Login
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                      {roleInfo.label}
                    </span>

                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={isCurrentInviteLoading}
                        title="Cancel Invitation"
                        className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        {isCurrentInviteLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
