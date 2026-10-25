'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBrand } from '@/context/BrandContext';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AvatarStack, AvatarItem } from '@/components/spectrumui/avatar-stack';
import {
  UserPlus,
  Shield,
  Mail,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  X,
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
  { label: string }
> = {
  owner: { label: 'Brand Owner' },
  admin: { label: 'Brand Admin' },
  developer: { label: 'Developer & Sound Designer' },
  support: { label: 'Customer Support' },
  finance: { label: 'Finance & Operations' },
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function BrandTeamManager() {
  const { user, membership, brand } = useBrand();

  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<BrandTeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<BrandInvite[]>([]);

  // Selected member inspector & deletion state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'support' | 'finance'>('developer');
  const [inviting, setInviting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

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

  // Find currently selected member
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return teamMembers.find((m) => m.id === selectedMemberId) || null;
  }, [selectedMemberId, teamMembers]);

  // Convert real team members to AvatarStack items
  const avatarItems: AvatarItem[] = useMemo(() => {
    return teamMembers.map((m) => {
      const roleInfo = ROLE_DEFINITIONS[m.role] || ROLE_DEFINITIONS.developer;
      const isSelf = user?.id === m.userId;
      const displayName = m.name || (m.email ? m.email.split('@')[0] : 'Member');
      return {
        id: m.id,
        name: displayName,
        src: m.avatarUrl,
        role: isSelf ? `${roleInfo.label} (You)` : roleInfo.label,
        rawRole: m.role,
        email: m.email,
        createdAt: m.createdAt,
        isOnline: isSelf || m.status === 'active',
      };
    });
  }, [teamMembers, user?.id]);

  const activeMembersCount = teamMembers.length;
  const onlineMembersCount = teamMembers.filter(
    (m) => m.status === 'active' || m.userId === user?.id
  ).length;

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
        setSuccessMsg(`Invitation registered for ${inviteEmail.trim()}.`);
        setInviteEmail('');
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 4000);
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
        setSuccessMsg('Invitation revoked.');
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 3000);
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

    setActionLoadingId(memberId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await removeBrandMemberAction(memberId, brandId);
      if (res.success) {
        setSuccessMsg(`Team access revoked for ${memberEmail || 'member'}.`);
        if (selectedMemberId === memberId) {
          setSelectedMemberId(null);
          setConfirmDeleteId(null);
        }
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to remove member.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing member.');
    } finally {
      setActionLoadingId(null);
      setConfirmDeleteId(null);
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
        setSuccessMsg('Role updated.');
        await loadTeam();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.error || 'Failed to update role.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating member role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyInviteLink = (invite: BrandInvite) => {
    if (!invite.token) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://creators.producertoy.com';
    const inviteUrl = `${origin}/invite?token=${encodeURIComponent(invite.token)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. PROJECT TEAM LIVE CARD WITH SPECTRUM UI AVATAR STACK */}
      <div className="bg-[#141414] border border-[#222222] rounded-xl p-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Project team</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c1c1c] text-zinc-400 font-mono">
                {activeMembersCount} {activeMembersCount === 1 ? 'member' : 'members'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {loading
                  ? 'Syncing brand team...'
                  : `${activeMembersCount} ${activeMembersCount === 1 ? 'member' : 'members'} · ${onlineMembersCount} active`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {loading && teamMembers.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500 py-1 px-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Loading team...</span>
              </div>
            ) : (
              <AvatarStack
                items={avatarItems}
                max={5}
                size="md"
                selectedId={selectedMemberId}
                onAvatarClick={(item) => {
                  setSelectedMemberId((prev) => (prev === item.id ? null : item.id || null));
                  setConfirmDeleteId(null);
                }}
              />
            )}

            <button
              onClick={loadTeam}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Team Roster"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Selected Member Minimal Animated Bar */}
        <AnimatePresence mode="wait">
          {selectedMember && (
            <motion.div
              key={selectedMember.id}
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden pt-4 mt-4 border-t border-[#1f1f1f]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#101010] text-xs">
                {/* Member Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center font-bold text-white text-xs">
                    {selectedMember.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedMember.avatarUrl}
                        alt={selectedMember.name || selectedMember.email || 'Member'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {getInitials(selectedMember.name || selectedMember.email || 'TM')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-semibold text-white truncate">
                      {selectedMember.name || selectedMember.email}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono truncate">
                      {selectedMember.email}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e1e] text-zinc-300 font-mono">
                      {ROLE_DEFINITIONS[selectedMember.role]?.label || selectedMember.role}
                    </span>
                    {selectedMember.userId === user?.id && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        (You)
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {/* Role dropdown for Owner */}
                  {membership?.role === 'owner' && selectedMember.role !== 'owner' && (
                    <select
                      value={selectedMember.role}
                      disabled={actionLoadingId === selectedMember.id}
                      onChange={(e) => handleRoleChange(selectedMember.id, e.target.value as any)}
                      className="bg-[#181818] border border-[#2a2a2a] rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none cursor-pointer"
                    >
                      <option value="admin">Brand Admin</option>
                      <option value="developer">Developer</option>
                      <option value="support">Support</option>
                      <option value="finance">Finance</option>
                    </select>
                  )}

                  {/* Revoke button if allowed */}
                  {isOwnerOrAdmin &&
                    selectedMember.role !== 'owner' &&
                    selectedMember.userId !== user?.id && (
                      <div>
                        {confirmDeleteId === selectedMember.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-red-400">Revoke?</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(selectedMember.id, selectedMember.email)}
                              disabled={actionLoadingId === selectedMember.id}
                              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-semibold transition"
                            >
                              {actionLoadingId === selectedMember.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-white transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(selectedMember.id)}
                            className="px-2 py-1 text-[11px] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    )}

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId(null);
                      setConfirmDeleteId(null);
                    }}
                    className="p-1 text-zinc-500 hover:text-white transition"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Banners */}
      {successMsg && (
        <div className="p-3 bg-[#181818] border border-zinc-800 rounded-lg text-white text-xs flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#ff4053]/10 border border-[#ff4053]/25 rounded-lg text-white text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-[#ff4053] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. INVITE TEAM MEMBERS */}
      <div className="bg-[#141414] border border-[#222222] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
          Invite Team Members
        </h2>

        {isOwnerOrAdmin ? (
          <form onSubmit={handleSendInvite} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="collaborator@yourbrand.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-[#101010] border border-[#262626] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-zinc-400 transition-colors placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-[#101010] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white focus:border-zinc-400 transition-colors cursor-pointer outline-none"
                >
                  <option value="developer">Developer &amp; Sound Designer</option>
                  <option value="admin">Brand Admin</option>
                  <option value="support">Customer Support</option>
                  <option value="finance">Finance &amp; Operations</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="btn-primary w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-50"
                >
                  {inviting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Send Invite</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-3 rounded-lg bg-[#101010] text-xs text-zinc-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Only Brand Owners and Brand Admins can invite team members.</span>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[#1f1f1f]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-400 text-[11px] uppercase tracking-wider">
                Pending Invitations ({pendingInvites.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {pendingInvites.map((invite) => {
                const roleInfo = ROLE_DEFINITIONS[invite.role] || ROLE_DEFINITIONS.developer;
                const isCurrentInviteLoading = actionLoadingId === invite.id;

                return (
                  <div
                    key={invite.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#101010] gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-zinc-300 font-medium truncate block">
                          {invite.email}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Waiting to accept
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1a1a1a] text-zinc-400">
                        {roleInfo.label}
                      </span>

                      {invite.token && (
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(invite)}
                          className="px-2 py-0.5 text-zinc-400 hover:text-white bg-[#1a1a1a] rounded text-[10px] transition flex items-center gap-1"
                        >
                          {copiedInviteId === invite.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      )}

                      {isOwnerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(invite.id)}
                          disabled={isCurrentInviteLoading}
                          className="p-1 text-zinc-500 hover:text-red-400 transition"
                          title="Cancel Invitation"
                        >
                          {isCurrentInviteLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
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
    </div>
  );
}
