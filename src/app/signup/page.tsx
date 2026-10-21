'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { CreatorApplicationForm } from '@/components/CreatorApplicationForm';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      router.replace(`/invite?token=${encodeURIComponent(token)}`);
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-white selection:text-black">
      {/* Top Brand Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-3 border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <picture>
            <source srcSet="/logo.webp" type="image/webp" />
            <img
              src="/logo.png"
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
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          Approved Brand? <span className="text-white underline underline-offset-4">Sign In</span>
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="my-8 sm:my-12 max-w-4xl mx-auto w-full">
        {/* Team Seat Notice */}
        <div className="mb-6 p-3.5 bg-[#18181b] border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-zinc-300">
            <ShieldAlert className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span>
              Invited by a studio brand? Team member accounts require a secure invite link sent to your inbox.
            </span>
          </div>
          <Link
            href="/invite"
            className="text-white underline font-semibold hover:text-zinc-200 ml-3 flex-shrink-0"
          >
            Got an Invite? &rarr;
          </Link>
        </div>

        <CreatorApplicationForm />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zinc-500 py-4 border-t border-zinc-800/50">
        &copy; {new Date().getFullYear()} Producer Toy Inc. • Audio Developer Partnerships
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <SignupContent />
    </Suspense>
  );
}
