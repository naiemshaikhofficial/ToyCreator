'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useBrand } from '@/context/BrandContext';
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshBrand } = useBrand();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      await refreshBrand();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-white selection:text-black font-sans">
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

        <a
          href="https://producertoy.com"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          ProducerToy Marketplace &rarr;
        </a>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
          {/* Heading */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#242424] border border-white/5 text-[11px] font-semibold text-zinc-300 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
              <span>Registered Brand Access</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Brand Developer Sign In</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Sign in with your authorized ProducerToy brand credentials
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Developer / Brand Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="developer@yourbrand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 font-semibold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Toy Creator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access for Owner / Reviewer Testing */}
          <div className="mt-6 pt-5 border-t border-[#262626]">
            <p className="text-[11px] text-zinc-400 mb-2 font-medium">Quick Fill Authorized Owner:</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('naiemshaikhofficial@gmail.com');
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#2e2e2e] text-xs text-zinc-300 flex items-center justify-between transition-colors"
              >
                <span className="font-mono text-[11px]">naiemshaikhofficial@gmail.com</span>
                <span className="text-[10px] text-zinc-300 font-semibold uppercase">Producer Toy Owner</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-400">
            Want to publish audio tools?{' '}
            <Link href="/signup" className="text-white hover:text-zinc-200 font-semibold underline underline-offset-4">
              Apply for Brand Access &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zinc-500 py-4">
        Toy Creator • Powered by ProducerToy Audio Infrastructure
      </div>
    </div>
  );
}
