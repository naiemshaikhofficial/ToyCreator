'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useBrand } from '@/context/BrandContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Building,
  Users,
  CreditCard,
  Code,
  Shield,
  FileText,
  Activity,
  Copy,
  Check,
  Upload,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { BrandTeamManager } from '@/components/BrandTeamManager';
import { RoleGate } from '@/components/RoleGate';

type SettingsTab =
  | 'general'
  | 'team'
  | 'payouts'
  | 'developer'
  | 'security'
  | 'agreements'
  | 'audit';

const NAV_TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Building },
  { id: 'team', label: 'Brand Team & Members', icon: Users },
  { id: 'payouts', label: 'Payouts & Banking', icon: CreditCard },
  { id: 'developer', label: 'Developer & API Keys', icon: Code },
  { id: 'security', label: 'Security & Access', icon: Shield },
  { id: 'agreements', label: 'Agreements & Legal', icon: FileText },
  { id: 'audit', label: 'Activity & Audit', icon: Activity },
];

export default function SettingsPage() {
  const { user, brand } = useBrand();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Form states
  const [brandName, setBrandName] = useState(brand?.name || 'Producer Toy');
  const [brandSlug, setBrandSlug] = useState(brand?.slug || 'producer-toy');
  const [supportEmail, setSupportEmail] = useState(brand?.support_email || 'support@producertoy.com');
  const [websiteUrl, setWebsiteUrl] = useState(brand?.website_url || 'https://producertoy.com');

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState(false);

  // API Key & Webhook
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBrandId, setCopiedBrandId] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Password Update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const brandId = brand?.id || 'brd_prodtoy_4992b8';
  const apiKey = `pt_live_${brand?.slug || 'key'}_${user?.id?.slice(0, 12) || 'sec'}`;

  useEffect(() => {
    if (brand) {
      if (brand.name) setBrandName(brand.name);
      if (brand.slug) setBrandSlug(brand.slug);
      if (brand.support_email) setSupportEmail(brand.support_email);
      if (brand.website_url) setWebsiteUrl(brand.website_url);
    }
  }, [brand]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as SettingsTab;
      if (tabParam && NAV_TABS.some((t) => t.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const copyBrandId = () => {
    navigator.clipboard.writeText(brandId);
    setCopiedBrandId(true);
    setTimeout(() => setCopiedBrandId(false), 2000);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setGeneralSuccess(false);

    try {
      const supabase = getSupabaseBrowserClient();
      if (brand?.id) {
        await supabase
          .from('brands')
          .update({
            name: brandName,
            slug: brandSlug,
            support_email: supportEmail,
            website_url: websiteUrl,
          })
          .eq('id', brand.id);
      }
      setGeneralSuccess(true);
      setTimeout(() => setGeneralSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving brand settings:', err);
    } finally {
      setSavingGeneral(false);
    }
  };

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

  return (
    <RoleGate allowedRoles={['owner', 'admin']} sectionName="Portal & Brand Settings">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#222222] pb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Brand Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your brand profile, team governance, developer keys, and operational credentials
          </p>
        </div>

        {/* Dual Layout: Left Sub-Nav + Right Content Panels */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Sub-Navigation Menu (~3 cols) */}
          <nav className="md:col-span-3 space-y-0.5 sticky top-20">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Card Stack (~9 cols) */}
          <div className="md:col-span-9 space-y-6">
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Brand Name Card */}
                <form
                  onSubmit={handleSaveGeneral}
                  className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Brand Name</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Used to identify your brand across the ProducerToy catalog and marketplace.
                      </p>
                    </div>

                    <div className="max-w-md">
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="w-full bg-[#121212] border border-[#2c2c2c] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-[#222222] bg-[#131313] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">Maximum 32 characters.</span>
                    <button
                      type="submit"
                      disabled={savingGeneral}
                      className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition disabled:opacity-50"
                    >
                      {savingGeneral ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>

                {/* Brand Slug Card */}
                <div className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Storefront Slug</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Your public storefront URL on ProducerToy.
                      </p>
                    </div>

                    <div className="max-w-md flex items-center rounded-lg border border-[#2c2c2c] bg-[#121212] overflow-hidden">
                      <span className="px-3 text-xs font-mono text-zinc-500 bg-[#181818] border-r border-[#2c2c2c] py-2">
                        producertoy.com/brand/
                      </span>
                      <input
                        type="text"
                        value={brandSlug}
                        onChange={(e) => setBrandSlug(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-[#222222] bg-[#131313] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">Lowercase letters, numbers, and dashes.</span>
                    <button
                      onClick={handleSaveGeneral}
                      className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition"
                    >
                      Update Slug
                    </button>
                  </div>
                </div>

                {/* Brand Logo Card */}
                <div className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Brand Logo</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Square logo displayed in product cards, licenses, and catalog listings.
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl bg-[#202020] border border-[#2e2e2e] flex items-center justify-center overflow-hidden shrink-0">
                        {brand?.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white uppercase">
                            {brandName[0]}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#2e2e2e] text-xs font-medium text-white border border-[#333333] transition flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload New</span>
                            <input type="file" accept="image/*" className="hidden" />
                          </label>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-[#202020] text-xs font-medium text-zinc-400 hover:text-white transition"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Recommended 512x512px. PNG or WebP, max 2MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand ID Card */}
                <div className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Brand ID</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        The unique identifier for this brand within the ProducerToy API & licensing engine.
                      </p>
                    </div>

                    <div className="max-w-md flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={brandId}
                        className="flex-1 bg-[#121212] border border-[#2c2c2c] rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 select-all outline-none"
                      />
                      <button
                        onClick={copyBrandId}
                        className="px-3 py-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-zinc-300 hover:text-white border border-[#333333] text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        {copiedBrandId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Support Email & Website Card */}
                <div className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Support & Website</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Contact channel for buyers and your official external website.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          className="w-full bg-[#121212] border border-[#2c2c2c] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                          Official Website
                        </label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="w-full bg-[#121212] border border-[#2c2c2c] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-[#222222] bg-[#131313] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">Shown in order receipts and licenses.</span>
                    <button
                      onClick={handleSaveGeneral}
                      disabled={savingGeneral}
                      className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition"
                    >
                      Save Contacts
                    </button>
                  </div>
                </div>

                {generalSuccess && (
                  <div className="p-3 bg-[#181818] border border-zinc-700 rounded-lg text-white text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-zinc-300" />
                    <span>Brand settings saved successfully.</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. TEAM & MEMBERS TAB */}
            {activeTab === 'team' && <BrandTeamManager />}

            {/* 3. PAYOUTS & BANKING TAB */}
            {activeTab === 'payouts' && (
              <div className="space-y-6">
                <div className="bg-[#161616] border border-[#242424] rounded-xl p-5 space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Payout Distribution</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Weekly payouts are automatically credited every Monday via direct bank or Stripe Connect.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#121212] border border-[#222222] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Default Split</p>
                      <p className="text-[11px] text-zinc-400 font-mono">70% Creator / 30% Platform</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-[#202020] text-zinc-300 border border-[#2e2e2e] rounded">
                      Standard
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DEVELOPER & API KEYS TAB */}
            {activeTab === 'developer' && (
              <div className="space-y-6">
                <div className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Live Brand API Key</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Authenticate JUCE audio plugins, C++ SDK builds, and server-to-server activations.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 max-w-lg">
                      <input
                        type="password"
                        readOnly
                        value={apiKey}
                        className="flex-1 bg-[#121212] border border-[#2c2c2c] rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 select-all outline-none"
                      />
                      <button
                        onClick={copyApiKey}
                        className="px-3 py-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-zinc-300 hover:text-white border border-[#333333] text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-[#222222] bg-[#131313] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">Do not expose in public repositories.</span>
                    <button className="px-3 py-1.5 rounded-lg border border-[#333333] hover:bg-[#202020] text-xs text-zinc-300 transition">
                      Roll Key
                    </button>
                  </div>
                </div>

                <div className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Webhook Delivery URL</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Receive instant HTTP POST alerts for order completions and license seat revocations.
                      </p>
                    </div>

                    <div className="max-w-lg">
                      <input
                        type="url"
                        placeholder="https://api.yourbrand.com/webhooks/producertoy"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-[#121212] border border-[#2c2c2c] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-[#222222] bg-[#131313] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">Payload: application/json</span>
                    <button className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition">
                      Save Webhook
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleUpdatePassword}
                  className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Change Password</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Ensure your account uses a secure password of at least 6 characters.
                      </p>
                    </div>

                    {passwordMsg && (
                      <div className="p-3 bg-[#181818] border border-zinc-700 rounded-lg text-white text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-zinc-300" />
                        <span>{passwordMsg}</span>
                      </div>
                    )}

                    {passwordError && (
                      <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#121212] border border-[#2c2c2c] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#121212] border border-[#2c2c2c] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-[#222222] bg-[#131313] flex items-center justify-end text-xs">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition disabled:opacity-50"
                    >
                      {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 6. AGREEMENTS TAB */}
            {activeTab === 'agreements' && (
              <div className="space-y-6">
                <div className="bg-[#161616] border border-[#242424] rounded-xl p-5 space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Creator Distribution Agreement</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Binding terms of distribution, intellectual property rights, and platform revenue splits.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#121212] border border-[#222222] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">ProducerToy Creator Terms v2.4</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">Status: Signed & Verified</p>
                    </div>
                    <a
                      href="/dashboard/documents"
                      className="px-3 py-1.5 rounded bg-[#202020] text-zinc-300 hover:text-white border border-[#2c2c2c] text-xs transition"
                    >
                      View PDF
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 7. AUDIT TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="bg-[#161616] border border-[#242424] rounded-xl p-5 space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Security & Audit Activity</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tamper-evident logs of staff access, product publishing, and key updates.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { event: 'Brand profile updated', time: 'Just now', user: user?.email },
                      { event: 'API Key generated', time: '2 hours ago', user: 'system' },
                      { event: 'Team permission check', time: '1 day ago', user: user?.email },
                    ].map((log, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#121212] border border-[#222222] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-200">{log.event}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
                          <span>{log.user}</span>
                          <span>•</span>
                          <span>{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
