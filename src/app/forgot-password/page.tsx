'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });

      if (error) throw new Error(error.message);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Could not send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-white selection:text-black font-sans">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/login" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white">Reset Brand Password</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Enter your registered developer email to receive a secure recovery link.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success ? (
            <div className="p-5 bg-[#202020] border border-zinc-700/60 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-white mx-auto" />
              <p className="text-sm font-semibold text-white">Recovery Link Sent</p>
              <p className="text-xs text-zinc-300">
                Check your inbox at <span className="text-white font-mono">{email}</span> for instructions to reset your developer credentials.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-xs text-zinc-300 hover:text-white font-medium underline"
              >
                Return to Sign In &rarr;
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Developer Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="developer@yourbrand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <span>Sending link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-zinc-500 py-4">
        Toy Creator • Powered by ProducerToy Audio Infrastructure
      </div>
    </div>
  );
}
