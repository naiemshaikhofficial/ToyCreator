'use client';

import React, { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { useRouter } from 'next/navigation';
import { registerBrandForUser } from '@/lib/supabase/actions';
import { ShieldAlert, ArrowRight, Building2, Globe, Sparkles, Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

export function BrandGate({ children }: { children: React.ReactNode }) {
  const { user, isRegisteredBrand, isLoading, brand, signOut, refreshBrand } = useBrand();
  const router = useRouter();

  // Registration state for non-brand users
  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <div className="relative mb-4">
          <picture>
            <source srcSet="/Charcoal Headphone Bear Mascot.webp" type="image/webp" />
            <img
              src="/Charcoal Headphone Bear Mascot.png"
              alt="Toy Creator"
              className="w-16 h-16 object-contain animate-pulse"
            />
          </picture>
        </div>
        <p className="text-sm font-medium text-zinc-400">Verifying brand authorization...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  // Logged in, but NOT a registered brand in brand_members
  if (!isRegisteredBrand || !brand) {
    const handleRegisterBrand = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!brandName.trim()) {
        setErrorMsg('Please enter your audio brand or studio name.');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg('');

      try {
        const slug = brandName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        await registerBrandForUser({
          userId: user.id,
          brandName: brandName.trim(),
          brandSlug: slug,
          websiteUrl: websiteUrl.trim() || undefined,
          description: description.trim() || undefined,
          payoutEmail: user.email,
        });

        await refreshBrand();
      } catch (err: any) {
        console.error('Brand registration failed:', err);
        setErrorMsg(err.message || 'Failed to register brand. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-xl w-full bg-[#181818] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Registered Brand Required</h1>
              <p className="text-xs text-zinc-400">Toy Creator is exclusively for verified audio developers & publishers</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#202020] border border-[#2a2a2a] mb-6 text-sm text-zinc-300 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Logged in as:</span>
              <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">{user.email}</span>
            </div>
            <p className="text-xs text-zinc-400 pt-1 border-t border-[#2a2a2a]">
              This account does not have an active audio brand profile in the ProducerToy registry. Register your brand below to start managing products, sales, licenses, and payouts.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Fast Onboarding Form */}
          <form onSubmit={handleRegisterBrand} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Brand / Studio / Developer Name <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sonic Pulse Audio, Waveform DSP"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Website or Portfolio URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="url"
                  placeholder="https://yourbrand.com or Soundcloud/GitHub"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Developer Bio / Audio Focus
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of your plugins, sample instruments, or preset packs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3 text-sm text-white focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-accent py-3 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering Brand...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Register Brand & Open Toy Creator
                </>
              )}
            </button>
          </form>

          {/* Footer actions */}
          <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-zinc-400">
            <button
              onClick={() => signOut()}
              className="hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out / switch account
            </button>

            <a
              href="https://producertoy.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              ProducerToy Marketplace &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Brand is authorized! Render children
  return <>{children}</>;
}
