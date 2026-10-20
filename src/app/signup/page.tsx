'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreatorApplicationForm } from '@/components/CreatorApplicationForm';

export default function SignupPage() {
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
      <div className="my-8 sm:my-12">
        <CreatorApplicationForm />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zinc-500 py-4 border-t border-zinc-800/50">
        &copy; {new Date().getFullYear()} Producer Toy Inc. • Audio Developer Partnerships
      </div>
    </div>
  );
}
