'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { LogoIcon } from '@/components/Logo';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { validateTurnstileAction } from '@/actions/authActions';
import { ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!turnstileToken) {
      setErrorMsg('Security verification required. Please complete Cloudflare Turnstile before submitting.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const turnstileCheck = await validateTurnstileAction(turnstileToken);
      if (!turnstileCheck.success) {
        setTurnstileToken(null);
        throw new Error(turnstileCheck.error || 'Security verification failed. Please try again.');
      }

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });

      if (error) throw new Error(error.message);
      setIsResetEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Could not send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-4 py-8 sm:py-14 font-sans selection:bg-white selection:text-black">
      <div className="w-full max-w-[460px] bg-[#161616] border border-[#262626] rounded-2xl p-7 sm:p-10 shadow-2xl space-y-6 relative transition-all">
        {/* Top Back to Sign In Link */}
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-bold transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        {isResetEmailSent ? (
          <div className="flex flex-col items-center text-center space-y-6 py-2 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#202020] border border-[#2e2e2e] flex items-center justify-center relative">
              <CheckCircle2 className="w-8 h-8 text-white font-bold" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Reset link sent
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                We sent a secure password reset link to{' '}
                <span className="font-semibold text-white">{email}</span>. Click the link in the email to set a new password.
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs rounded-full tracking-wider uppercase transition-all flex items-center justify-center shadow-lg"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center space-y-3">
              <Link href="/" prefetch={true} className="hover:opacity-80 transition-opacity">
                <LogoIcon size={48} />
              </Link>

              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Reset your password
              </h1>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                Enter your registered brand developer email address and we'll send you a recovery link.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-[#ff4053] text-black font-extrabold p-3.5 rounded-2xl text-xs text-center space-y-2 shadow-lg animate-in fade-in">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
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

              {/* Cloudflare Turnstile */}
              <TurnstileWidget
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setErrorMsg('');
                }}
                onExpire={() => setTurnstileToken(null)}
              />

              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 active:bg-zinc-300 active:scale-[0.99] text-black font-extrabold text-xs rounded-full tracking-wider uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              >
                {loading ? (
                  <ButtonSpinner size={16} variant="dark" />
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            <div className="pt-3 text-center text-xs text-zinc-400 border-t border-[#262626]">
              <span>Remember your password? </span>
              <Link
                href="/login"
                className="text-white hover:underline font-bold transition-colors ml-1 cursor-pointer"
              >
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
