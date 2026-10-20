'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useBrand } from '@/context/BrandContext';
import { LogoIcon } from '@/components/Logo';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { validateTurnstileAction } from '@/actions/authActions';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshBrand } = useBrand();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    // Cloudflare Turnstile Bot Verification Check
    if (!turnstileToken) {
      setErrorMsg('Security verification required. Please complete Cloudflare Turnstile before signing in.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Validate Turnstile on server
      const turnstileCheck = await validateTurnstileAction(turnstileToken);
      if (!turnstileCheck.success) {
        setTurnstileToken(null);
        throw new Error(turnstileCheck.error || 'Security verification failed. Please complete the captcha again.');
      }

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          throw new Error('Incorrect email or password. Please verify your credentials.');
        } else if (msg.includes('email not confirmed')) {
          throw new Error('Please confirm your email address before signing in.');
        }
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
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-4 py-8 sm:py-14 font-sans selection:bg-white selection:text-black">
      {/* Dark Auth Card Container (#161616 background, border #262626, rounded-2xl) */}
      <div className="w-full max-w-[460px] bg-[#161616] border border-[#262626] rounded-2xl p-7 sm:p-10 shadow-2xl space-y-6 relative transition-all">
        {/* Header Logo + Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" prefetch={true} className="hover:opacity-80 transition-opacity">
            <LogoIcon size={48} />
          </Link>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sign in to Toy Creator
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            Authorized Brand Developer &amp; Audio Publisher Portal
          </p>
        </div>

        {/* Error Banner Matching ProducerToy */}
        {errorMsg && (
          <div className="bg-[#ff4053] text-black font-extrabold p-3.5 rounded-2xl text-xs text-center space-y-2 shadow-lg animate-in fade-in">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-[12px] font-semibold text-zinc-300">
              Email Address
            </label>
            <input
              type="email"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-11 bg-[#181818] border border-[#282828] hover:border-[#383838] focus:border-zinc-300 text-white text-[13px] px-3.5 rounded-md outline-none transition-colors placeholder:text-zinc-500 shadow-sm touch-manipulation select-text"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-zinc-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ paddingLeft: '14px', paddingRight: '44px' }}
                className="w-full h-11 bg-[#181818] border border-[#282828] hover:border-[#383838] focus:border-zinc-300 text-white text-[13px] rounded-md outline-none transition-colors placeholder:text-zinc-500 shadow-sm touch-manipulation select-text"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                }}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile Verification Widget */}
          <TurnstileWidget
            onSuccess={(token) => {
              setTurnstileToken(token);
              setErrorMsg('');
            }}
            onExpire={() => setTurnstileToken(null)}
          />

          {/* Submit Button Matching ProducerToy */}
          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full py-3.5 bg-white hover:bg-zinc-200 active:bg-zinc-300 active:scale-[0.99] text-black font-extrabold text-xs rounded-full tracking-wider uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation mt-2"
          >
            {loading ? (
              <ButtonSpinner size={16} variant="dark" />
            ) : (
              <span>Sign In to Toy Creator</span>
            )}
          </button>
        </form>

        {/* Bottom Footer Actions */}
        <div className="pt-4 text-center text-xs text-zinc-400 border-t border-[#262626] space-y-2.5">
          <p>
            Want to publish audio tools?{' '}
            <Link
              href="/signup"
              className="text-white hover:underline font-bold transition-colors ml-1 cursor-pointer"
            >
              Apply for Brand Access &rarr;
            </Link>
          </p>
          <p className="text-[11px] text-zinc-500">
            <a
              href="https://producertoy.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              ProducerToy Marketplace &rarr;
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
