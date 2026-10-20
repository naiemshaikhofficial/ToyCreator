'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Cpu,
  Layers,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const { user, isRegisteredBrand, isLoading } = useBrand();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && isRegisteredBrand) {
      router.push('/dashboard');
    }
  }, [user, isRegisteredBrand, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-[#222222] px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <picture className="flex-shrink-0">
            <source srcSet="/Charcoal Headphone Bear Mascot.webp" type="image/webp" />
            <img
              src="/Charcoal Headphone Bear Mascot.png"
              alt="Toy Creator Emblem"
              className="w-10 h-10 object-contain"
            />
          </picture>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white uppercase">
              Toy Creator
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
              by ProducerToy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#1f1f1f] transition-colors"
          >
            Brand Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-accent px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg"
          >
            <span>Register Brand</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center justify-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1e1e] border border-[#2e2e2e] text-xs font-medium text-zinc-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Official Audio Developer Portal</span>
          <span className="text-zinc-600">•</span>
          <span className="text-indigo-400">85% Creator Retain</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-[1.1]">
          Create. Publish.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Earn.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mb-10 font-normal leading-relaxed">
          The dedicated platform for music plugin developers, VST architects, sample pack creators, and sound designers to distribute products, protect licensing, and scale audio revenue.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto btn-white py-3.5 px-8 text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Join as Registered Brand</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto btn-secondary py-3.5 px-8 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <span>Access Developer Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full mt-20 text-left">
          <div className="p-6 rounded-2xl bg-[#181818] border border-[#2a2a2a]">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">VST & DSP Licensing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Native hardware activation seats, challenge-response pairing, and offline grace management built for JUCE and C++ plugins.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#2a2a2a]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Direct Payouts & 85% Split</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Transparent Stripe Connect and PayPal transfers. Keep 85% of every sale while ProducerToy handles global tax compliance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#2a2a2a]">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Instant Distribution CDN</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Distribute high-speed multi-gigabyte audio instruments, sample packs, and installers through low-latency edge storage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#202020] py-6 px-6 sm:px-12 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto">
        <p>&copy; {new Date().getFullYear()} Producer Toy Inc. All rights reserved. Toy Creator Portal.</p>
        <div className="flex items-center gap-6">
          <a href="https://producertoy.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            ProducerToy Marketplace
          </a>
          <a href="https://producertoy.com/privacy" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="https://producertoy.com/terms" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
}
