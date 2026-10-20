'use client';

import React, { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  Building2,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
} from 'lucide-react';

export default function ProfilePage() {
  const { brand, user, membership, refreshBrand } = useBrand();

  const [brandName, setBrandName] = useState(brand?.name || '');
  const [websiteUrl, setWebsiteUrl] = useState(brand?.website_url || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || '');
  const [payoutEmail, setPayoutEmail] = useState(membership?.payout_email || user?.email || '');
  const [payoutMethod, setPayoutMethod] = useState(membership?.payout_method || 'Stripe Connect');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand?.id) return;

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const admin = getAdminClient();

      // 1. Update brand info in brands table
      const { error: brandErr } = await admin
        .from('brands')
        .update({
          name: brandName.trim(),
          website_url: websiteUrl.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
        })
        .eq('id', brand.id);

      if (brandErr) throw brandErr;

      // 2. Update payout info in brand_members table
      if (membership?.id) {
        await admin
          .from('brand_members')
          .update({
            payout_email: payoutEmail.trim() || null,
            payout_method: payoutMethod,
          })
          .eq('id', membership.id);
      }

      await refreshBrand();
      setSuccessMsg('Brand developer profile saved successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update brand profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Brand Developer Profile
        </h1>
        <p className="text-xs text-zinc-400">
          Public marketplace identity and payout configuration for {brand?.name || 'Producer Toy'}
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand Information */}
        <div className="toy-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
            <Building2 className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Audio Brand Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Brand Name
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Brand Identifier / Slug (Fixed)
              </label>
              <input
                type="text"
                disabled
                value={brand?.slug || 'producer-toy'}
                className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Official Website
              </label>
              <input
                type="url"
                placeholder="https://yourbrand.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Brand Logo URL
              </label>
              <input
                type="text"
                placeholder="https://... or /logo.webp"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Brand Bio & Sound Design Focus
            </label>
            <textarea
              rows={4}
              placeholder="Tell producers and sound engineers about your audio philosophy, DSP algorithms, or sampling hardware..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3.5 text-xs text-white focus:border-[#42454e] transition-colors resize-y"
            />
          </div>
        </div>

        {/* Payout & Settlement Settings */}
        <div className="toy-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
            <CreditCard className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Settlement & Payout Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Payout Gateway Method
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              >
                <option value="Stripe Connect">Stripe Connect (Recommended)</option>
                <option value="PayPal Business">PayPal Business</option>
                <option value="Wise Transfer">Wise (Bank Transfer)</option>
                <option value="Direct Wire">International SWIFT / Wire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Settlement Email / Account ID
              </label>
              <input
                type="email"
                required
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg uppercase tracking-wider"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
