'use client';

import React from 'react';
import { useBrand } from '@/context/BrandContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut } from 'lucide-react';
import { CreatorApplicationForm } from './CreatorApplicationForm';

export function BrandGate({ children }: { children: React.ReactNode }) {
  const { user, isRegisteredBrand, isLoading, brand, signOut } = useBrand();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <div className="relative mb-4">
          <picture>
            <source srcSet="/logo.webp" type="image/webp" />
            <img
              src="/logo.png"
              alt="Toy Creator"
              className="w-16 h-16 object-contain animate-pulse"
            />
          </picture>
        </div>
        <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          Verifying Brand Authorization...
        </p>
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

  // Logged in, but NOT an approved registered brand in brand_members
  if (!isRegisteredBrand || !brand) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
        {/* Top Navbar */}
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="Toy Creator Emblem"
                className="w-8 h-8 object-contain"
              />
            </picture>
            <span className="font-extrabold text-sm tracking-tight text-white uppercase">
              Toy Creator
            </span>
          </div>

          <button
            onClick={() => signOut()}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content & Application Form */}
        <div className="max-w-2xl w-full mx-auto my-10 space-y-6">
          <div className="p-4 bg-[#181818] border border-zinc-800 rounded-xl flex items-start gap-3 text-xs text-zinc-300">
            <ShieldAlert className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white uppercase tracking-wider">
                Restricted Access • Registered Brands Only
              </p>
              <p className="text-zinc-400">
                You are currently signed in as <span className="font-mono text-zinc-200">{user.email}</span>. This account does not have an approved brand publisher seat. Fill out the application form below to request creator access.
              </p>
            </div>
          </div>

          <CreatorApplicationForm initialEmail={user.email || ''} />
        </div>

        <div className="text-center text-xs text-zinc-500 py-4 border-t border-zinc-800/50">
          Producer Toy Inc. • Audio Developer Partnerships
        </div>
      </div>
    );
  }

  // Brand is authorized!
  return <>{children}</>;
}
