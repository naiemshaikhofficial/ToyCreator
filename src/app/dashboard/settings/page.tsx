'use client';

import React, { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Bell,
  Webhook,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { BrandTeamManager } from '@/components/BrandTeamManager';

export default function SettingsPage() {
  const { user, brand } = useBrand();

  const [saleNotifications, setSaleNotifications] = useState(true);
  const [payoutNotifications, setPayoutNotifications] = useState(true);
  const [licenseNotifications, setLicenseNotifications] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const apiKey = `pt_live_${brand?.slug || 'key'}_${user?.id?.slice(0, 12) || 'sec'}`;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    setPasswordMsg('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMsg('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 4000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Portal & Developer Settings
        </h1>
        <p className="text-xs text-zinc-400">
          Team access, security credentials, webhook endpoints, and notification preferences
        </p>
      </div>

      {/* Brand Team & RBAC Management */}
      <BrandTeamManager />

      {/* Notifications */}
      <div className="toy-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
          <Bell className="w-4 h-4 text-zinc-300" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Email & Operational Notifications
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#242424] cursor-pointer hover:border-[#333333] transition-colors">
            <div>
              <p className="text-xs font-semibold text-white">New Sale & Order Notifications</p>
              <p className="text-[11px] text-zinc-400">Receive an email whenever a customer purchases your audio tools</p>
            </div>
            <input
              type="checkbox"
              checked={saleNotifications}
              onChange={(e) => setSaleNotifications(e.target.checked)}
              className="w-4 h-4 rounded bg-[#121212] border-[#2e2e2e] text-[#34363d] focus:ring-zinc-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#242424] cursor-pointer hover:border-[#333333] transition-colors">
            <div>
              <p className="text-xs font-semibold text-white">Weekly Payout Transfer Confirmations</p>
              <p className="text-[11px] text-zinc-400">Alerts when funds are disbursed to your bank or Stripe</p>
            </div>
            <input
              type="checkbox"
              checked={payoutNotifications}
              onChange={(e) => setPayoutNotifications(e.target.checked)}
              className="w-4 h-4 rounded bg-[#121212] border-[#2e2e2e] text-[#34363d] focus:ring-zinc-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#242424] cursor-pointer hover:border-[#333333] transition-colors">
            <div>
              <p className="text-xs font-semibold text-white">Hardware Seat Limit Warning</p>
              <p className="text-[11px] text-zinc-400">Notify when a customer activates maximum allowed machine seats</p>
            </div>
            <input
              type="checkbox"
              checked={licenseNotifications}
              onChange={(e) => setLicenseNotifications(e.target.checked)}
              className="w-4 h-4 rounded bg-[#121212] border-[#2e2e2e] text-[#34363d] focus:ring-zinc-600"
            />
          </label>
        </div>
      </div>

      {/* Developer API & Webhooks */}
      <div className="toy-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
          <Webhook className="w-4 h-4 text-zinc-300" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Developer API & Webhooks
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Live Brand API Key
          </label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              readOnly
              value={apiKey}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 select-all"
            />
            <button
              onClick={copyApiKey}
              className="btn-secondary px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 flex-shrink-0"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Authenticate server-to-server JUCE audio licensing verification requests
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Webhook Delivery URL
          </label>
          <input
            type="url"
            placeholder="https://api.yourbrand.com/webhooks/producertoy"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            We will POST JSON payloads for <code className="text-zinc-400 font-mono">order.completed</code> and <code className="text-zinc-400 font-mono">license.revoked</code>
          </p>
        </div>
      </div>

      {/* Security & Password */}
      <div className="toy-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
          <Shield className="w-4 h-4 text-zinc-300" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Security & Credentials
          </h2>
        </div>

        {passwordMsg && (
          <div className="p-3.5 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingPassword}
              className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
