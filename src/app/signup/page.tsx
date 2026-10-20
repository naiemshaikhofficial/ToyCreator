'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { registerBrandForUser } from '@/lib/supabase/actions';
import { useBrand } from '@/context/BrandContext';
import {
  Building2,
  Mail,
  Lock,
  Globe,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { refreshBrand } = useBrand();

  const [brandName, setBrandName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [audioCategory, setAudioCategory] = useState('plugin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setErrorMsg('Please specify your Audio Brand / Studio Name.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Sign up user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            brand_name: brandName.trim(),
            role: 'creator',
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create account. Please try again.');

      // 2. Generate slug and register brand in `brands` and `brand_members`
      const slug = brandName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      await registerBrandForUser({
        userId: authData.user.id,
        brandName: brandName.trim(),
        brandSlug: slug,
        websiteUrl: websiteUrl.trim() || undefined,
        description: `Official ${audioCategory === 'plugin' ? 'VST/AU Audio Plugin Developer' : 'Audio Sample & Preset Publisher'}`,
        payoutEmail: email.trim(),
      });

      // 3. Refresh context and enter dashboard
      await refreshBrand();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMsg(err.message || 'Could not complete brand registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-white selection:text-black">
      {/* Top Brand Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <picture>
            <source srcSet="/Charcoal Headphone Bear Mascot.webp" type="image/webp" />
            <img
              src="/Charcoal Headphone Bear Mascot.png"
              alt="Toy Creator Emblem"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
          </picture>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-white uppercase">
              Toy Creator
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
              by ProducerToy
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Already registered? <span className="text-white font-semibold underline underline-offset-4">Sign In</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-lg w-full mx-auto my-6">
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#222222] border border-white/5 text-[11px] font-semibold text-emerald-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Developer Onboarding</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Register Audio Brand</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Join the ProducerToy marketplace ecosystem. Retain 85% of every product sale.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Brand / Studio / Developer Name <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Waveform Audio, Analog Circuit Labs"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Developer Email <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="contact@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Password <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Primary Audio Focus
                </label>
                <select
                  value={audioCategory}
                  onChange={(e) => setAudioCategory(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                >
                  <option value="plugin">Audio VST / AU Plugins</option>
                  <option value="sample_pack">Sample Packs & Instruments</option>
                  <option value="preset">Synth Presets (Serum, Diva)</option>
                  <option value="template">DAW Project Templates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Website / Audio Portfolio
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    placeholder="https://yourbrand.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#202020] border border-[#2a2a2a] text-xs text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>85/15 Developer Split Included</span>
              </div>
              <p className="text-[11px] text-zinc-400 pl-5">
                Standard creator terms automatically applied. You retain full IP ownership of all audio software and audio assets.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-3 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Brand Account...
                </>
              ) : (
                <>
                  <span>Register Brand & Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-400">
            Already have a registered account?{' '}
            <Link href="/login" className="text-white hover:text-indigo-400 font-semibold underline underline-offset-4">
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zinc-400 py-4">
        Toy Creator • Powered by ProducerToy Audio Infrastructure
      </div>
    </div>
  );
}
