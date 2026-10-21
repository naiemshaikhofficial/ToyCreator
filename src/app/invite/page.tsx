'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useBrand } from '@/context/BrandContext';
import { LogoIcon } from '@/components/Logo';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import {
  validateInviteTokenAction,
  acceptInviteAndRegisterAction,
  claimInviteWithTokenAction,
} from '@/actions/brandTeamActions';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, Lock, Building } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Brand Admin',
  developer: 'Developer / Sound Designer',
  support: 'Support Agent',
  finance: 'Finance / Operations',
};

function InviteAcceptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { refreshBrand } = useBrand();

  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<{
    email: string;
    role: 'admin' | 'developer' | 'support' | 'finance';
    brandId: string;
    brandName: string;
    brandLogoUrl?: string | null;
    isExistingUser: boolean;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Validate token on mount
  useEffect(() => {
    let isMounted = true;

    async function validate() {
      if (!token || token.trim().length < 16) {
        if (isMounted) {
          setValidationError(
            'Direct account creation is disabled. Toy Creator team seats require a valid brand invitation token. Please check the link in your email or contact your brand administrator.'
          );
          setValidating(false);
        }
        return;
      }

      try {
        const res = await validateInviteTokenAction(token);
        if (!isMounted) return;

        if (res.success && res.invite) {
          setInviteData(res.invite);
        } else {
          setValidationError(
            res.error || 'This invitation link is invalid, expired, or has already been accepted.'
          );
        }
      } catch (err: any) {
        if (isMounted) {
          setValidationError(err.message || 'Failed to validate invitation token.');
        }
      } finally {
        if (isMounted) setValidating(false);
      }
    }

    validate();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Submit Handler for NEW USER Account Creation
  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !inviteData || !token) return;

    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!turnstileToken) {
      setFormError('Security verification required. Please complete Cloudflare Turnstile.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      // 1. Create account on server and link to brand
      const regResult = await acceptInviteAndRegisterAction({
        token,
        fullName: fullName.trim(),
        password,
        turnstileToken,
      });

      if (!regResult.success) {
        throw new Error(regResult.error || 'Failed to complete registration.');
      }

      // 2. Sign in with Supabase client to establish session
      const supabase = getSupabaseBrowserClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: inviteData.email,
        password,
      });

      if (signErr) {
        // Fallback: direct to login if auto-signin blocked
        router.push(`/login?email=${encodeURIComponent(inviteData.email)}&verified=1`);
        return;
      }

      await refreshBrand();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Invite registration error:', err);
      setFormError(err.message || 'Registration failed. Please try again.');
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Handler for EXISTING USER Sign In
  const handleSignInAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !inviteData || !token) return;

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    if (!turnstileToken) {
      setFormError('Security verification required. Please complete Cloudflare Turnstile.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: signErr } = await supabase.auth.signInWithPassword({
        email: inviteData.email,
        password,
      });

      if (signErr) {
        throw new Error('Incorrect password. Please verify your credentials or reset your password.');
      }

      if (authData.user) {
        // Link member seat if not already linked
        await claimInviteWithTokenAction(token, authData.user.id);
      }

      await refreshBrand();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Invite signin error:', err);
      setFormError(err.message || 'Sign in failed. Please verify your password.');
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading State
  if (validating) {
    return (
      <div className="w-full max-w-[460px] bg-[#161616] border border-[#262626] rounded-2xl p-10 shadow-2xl flex flex-col items-center justify-center space-y-4">
        <ButtonSpinner size={32} variant="light" />
        <p className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
          Verifying Invitation Token...
        </p>
      </div>
    );
  }

  // 2. Error / Invalid Token State
  if (validationError || !inviteData) {
    return (
      <div className="w-full max-w-[480px] bg-[#161616] border border-[#262626] rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6 text-center animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Invitation Required
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            You need a valid invite link to create a team account on Toy Creator. If a brand invited you, please open the link sent to your email. If your link expired, ask your brand manager to send a new one.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <Link
            href="/login"
            className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs rounded-full tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Sign In with Existing Account
          </Link>
          <Link
            href="/signup"
            className="w-full py-3 bg-[#1e1e22] hover:bg-[#27272c] text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs rounded-full tracking-wider uppercase transition-all flex items-center justify-center"
          >
            Apply for Brand Access &rarr;
          </Link>
        </div>

        <div className="pt-4 border-t border-[#262626] text-[11px] text-zinc-500">
          Need assistance? Contact{' '}
          <a
            href="mailto:support@producertoy.com"
            className="text-zinc-400 underline hover:text-white transition-colors"
          >
            support@producertoy.com
          </a>
        </div>
      </div>
    );
  }

  const roleTitle = ROLE_LABELS[inviteData.role] || inviteData.role;
  const brandInitial = (inviteData.brandName || 'B').trim().charAt(0).toUpperCase();

  // 3. Valid Token Screen (New Account Creation OR Existing User Sign In)
  return (
    <div className="w-full max-w-[490px] bg-[#161616] border border-[#262626] rounded-2xl p-7 sm:p-10 shadow-2xl space-y-6 relative transition-all">
      {/* Header Logo */}
      <div className="flex flex-col items-center text-center space-y-2">
        <Link href="/" prefetch={true} className="hover:opacity-80 transition-opacity">
          <LogoIcon size={44} />
        </Link>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Toy Creator • Publisher Portal
        </span>
      </div>

      {/* Brand & Seat Spotlight Card */}
      <div className="p-4 bg-[#1a1a1e] border border-[#2e2e34] rounded-xl flex items-center gap-4">
        {inviteData.brandLogoUrl ? (
          <img
            src={inviteData.brandLogoUrl}
            alt={inviteData.brandName}
            className="w-12 h-12 rounded-xl object-cover border border-zinc-700/60 flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
            {brandInitial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Brand Team
            </span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[9px] font-extrabold uppercase text-zinc-300">
              {inviteData.role}
            </span>
          </div>
          <div className="text-base font-extrabold text-white truncate mt-0.5">
            {inviteData.brandName}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            {roleTitle}
          </div>
        </div>
      </div>

      {/* Screen Title */}
      <div className="space-y-1 text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          {inviteData.isExistingUser ? `Join ${inviteData.brandName}` : 'Create Your Account'}
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {inviteData.isExistingUser
            ? `Enter your password to accept the invitation and access ${inviteData.brandName}.`
            : `Set your password to join ${inviteData.brandName} on Toy Creator.`}
        </p>
      </div>

      {/* Error Banner */}
      {formError && (
        <div className="bg-[#ff4053] text-black font-extrabold p-3 rounded-xl text-xs text-center flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* FORM: NEW USER vs EXISTING USER */}
      {inviteData.isExistingUser ? (
        <form onSubmit={handleSignInAndJoin} className="space-y-4">
          {/* Email (Locked) */}
          <div className="space-y-1">
            <label className="block text-[12px] font-semibold text-zinc-300">
              Email Address
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                disabled
                value={inviteData.email}
                className="w-full h-11 bg-[#131313] border border-[#262626] text-zinc-400 text-[13px] px-3.5 rounded-md outline-none cursor-not-allowed select-none"
              />
              <span className="absolute right-3 text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Linked
              </span>
            </div>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 bg-[#181818] border border-[#282828] hover:border-[#383838] focus:border-zinc-300 text-white text-[13px] px-3.5 pr-10 rounded-md outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Turnstile */}
          <TurnstileWidget
            onSuccess={(t) => {
              setTurnstileToken(t);
              setFormError('');
            }}
            onExpire={() => setTurnstileToken(null)}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !turnstileToken}
            className="w-full py-3.5 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-extrabold text-xs rounded-full tracking-wider uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <ButtonSpinner size={16} variant="dark" />
            ) : (
              <span>Sign In &amp; Join {inviteData.brandName}</span>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterAndJoin} className="space-y-4">
          {/* Email (Locked to invited address) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-zinc-300">
                Your Email Address
              </label>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Invited Email
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="email"
                disabled
                value={inviteData.email}
                className="w-full h-11 bg-[#131313] border border-[#262626] text-zinc-300 text-[13px] px-3.5 rounded-md outline-none cursor-not-allowed select-none"
              />
              <Lock className="w-3.5 h-3.5 text-zinc-500 absolute right-3" />
            </div>
            <p className="text-[10px] text-zinc-500">
              Your new account will be created under this email.
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-[12px] font-semibold text-zinc-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full h-11 bg-[#181818] border border-[#282828] hover:border-[#383838] focus:border-zinc-300 text-white text-[13px] px-3.5 rounded-md outline-none transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-[12px] font-semibold text-zinc-300">
              Create Password <span className="text-zinc-500 font-normal">(min 8 characters)</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 bg-[#181818] border border-[#282828] hover:border-[#383838] focus:border-zinc-300 text-white text-[13px] px-3.5 pr-10 rounded-md outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-[12px] font-semibold text-zinc-300">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 bg-[#181818] border border-[#282828] hover:border-[#383838] focus:border-zinc-300 text-white text-[13px] px-3.5 pr-10 rounded-md outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-zinc-400 hover:text-white"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Turnstile */}
          <TurnstileWidget
            onSuccess={(t) => {
              setTurnstileToken(t);
              setFormError('');
            }}
            onExpire={() => setTurnstileToken(null)}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !turnstileToken}
            className="w-full py-3.5 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-extrabold text-xs rounded-full tracking-wider uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? (
              <ButtonSpinner size={16} variant="dark" />
            ) : (
              <span>Create Account &amp; Join {inviteData.brandName}</span>
            )}
          </button>
        </form>
      )}

      {/* Footer Info */}
      <div className="pt-4 text-center text-xs text-zinc-400 border-t border-[#262626] space-y-2">
        <p className="text-[11px] text-zinc-500">
          Already have an account under a different email?{' '}
          <Link href="/login" className="text-zinc-300 underline hover:text-white">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-4 py-8 sm:py-14 font-sans selection:bg-white selection:text-black">
      <Suspense
        fallback={
          <div className="w-full max-w-[460px] bg-[#161616] border border-[#262626] rounded-2xl p-10 shadow-2xl flex flex-col items-center justify-center space-y-4">
            <ButtonSpinner size={32} variant="light" />
            <p className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
              Loading Invitation...
            </p>
          </div>
        }
      >
        <InviteAcceptForm />
      </Suspense>
    </div>
  );
}
