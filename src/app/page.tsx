'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  BarChart3,
  Building2,
  Lock,
  Zap,
  Globe2,
  DollarSign,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { CreatorSpotlightBanner } from '@/components/CreatorSpotlightBanner';

export default function HomePage() {
  const { user, isRegisteredBrand, isLoading } = useBrand();
  const router = useRouter();

  // Interactive Earnings Calculator (Gumroad-style)
  const [productPrice, setProductPrice] = useState<number>(29);
  const [monthlySales, setMonthlySales] = useState<number>(100);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && user && isRegisteredBrand) {
      router.push('/dashboard');
    }
  }, [user, isRegisteredBrand, isLoading, router]);

  const grossRevenue = productPrice * monthlySales;
  const creatorEarnings = grossRevenue * 0.70;
  const industryTraditionalEarnings = grossRevenue * 0.5;

  const faqs = [
    {
      q: 'What types of audio products can I sell?',
      a: 'You can sell Audio Plugins (VST3, AU, AAX, CLAP for Mac and Windows), Sample Packs and Sound Kits (24-bit WAV, AIFF, MIDI), Synth Presets (Serum, Diva, Vital, Phase Plant), and DAW Project Templates.',
    },
    {
      q: 'How does the 70% creator revenue split work?',
      a: 'You receive 70% of eligible net sale proceeds. Deductions follow a transparent sequence: gross price, minus actual payment processing fees, split 70% Developer / 30% Platform. Zero hidden listing or monthly subscription fees.',
    },
    {
      q: 'Can I protect my plugins with license keys?',
      a: 'Yes! Toy Creator includes genuine serial key pool protection with concurrency locking. You can set computer activation limits per user, view claimed keys, and revoke compromised licenses anytime.',
    },
    {
      q: 'When and how do payouts work?',
      a: 'Settlements are manual, fully itemized monthly disbursements payable by the 15th calendar day of the following month with zero minimum payout threshold. Disbursed via SWIFT international bank wire, domestic transfer, or PayPal.',
    },
    {
      q: 'How does customer privacy and data sharing work?',
      a: 'By default, customer personal data is masked (r***r@example.com). Customer details are shared only when software activation strictly requires it and the buyer gives explicit pre-purchase consent under a strict non-marketing covenant.',
    },
    {
      q: 'Who can become a creator on Toy Creator?',
      a: 'Toy Creator is curated for quality. Audio software developers, plugin makers, and sound designers can apply to join our brand partner roster with fast 24–48h review.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-white selection:text-black font-sans">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-[#222222] px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <picture className="flex-shrink-0">
            <source srcSet="/logo.webp" type="image/webp" />
            <img
              src="/logo.png"
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
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/faq"
            className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            Developer FAQ
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#1f1f1f] transition-colors"
          >
            Brand Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg uppercase"
          >
            <span>Partner / Apply</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 sm:py-14 flex flex-col items-center text-center">
        {/* Spotlight Hero Banner (ProducerToy 1:1 Mascot Showcase) */}
        <div className="w-full mb-6">
          <CreatorSpotlightBanner />
        </div>

        {/* Formats Ticker */}
        <div className="mt-14 pt-8 border-t border-[#222222] w-full max-w-3xl">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
            Accepted Formats &amp; Standards
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-mono">
            {['VST3', 'AU (Audio Units)', 'AAX', 'CLAP', '24-Bit WAV', 'MIDI', 'Serum Presets', 'Vital', 'Diva', 'Kontakt'].map((fmt) => (
              <span
                key={fmt}
                className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#262626] text-zinc-300"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Gumroad-Style Interactive Earnings Calculator */}
        <section className="w-full max-w-4xl mt-24 p-8 sm:p-12 rounded-3xl bg-[#161616] border border-[#262626] text-left shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Transparent Monetization
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Calculate your creator earnings
              </h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-[#202020] border border-[#303030] text-xs font-semibold text-zinc-300">
              70% / 30% Split
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-2">
                  <span>Product Price:</span>
                  <span className="font-mono text-white">${productPrice} USD</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="199"
                  step="1"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Number(e.target.value))}
                  className="w-full accent-white h-2 bg-[#262626] rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-2">
                  <span>Estimated Sales / Month:</span>
                  <span className="font-mono text-white">{monthlySales} sales</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={monthlySales}
                  onChange={(e) => setMonthlySales(Number(e.target.value))}
                  className="w-full accent-white h-2 bg-[#262626] rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#121212] border border-[#282828] flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  You Take Home Every Month
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-mono">
                  ${creatorEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-xs text-zinc-400 font-sans font-normal ml-1">/ mo</span>
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Compared to traditional publishers ($
                  {industryTraditionalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  ), you save ${(creatorEarnings - industryTraditionalEarnings).toLocaleString()} every single month.
                </p>
              </div>

              <div className="pt-4 border-t border-[#202020] mt-4 flex items-center justify-between text-xs text-zinc-400">
                <span>Gross: ${grossRevenue.toLocaleString()}</span>
                <span>ProducerToy Fee: 30%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-24 text-left">
          <div className="p-7 rounded-2xl bg-[#161616] border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-white mb-5">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Built-in License Protection</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Protect your software from piracy. Generate license keys automatically, set computer activation limits per user, and manage customer keys with one click.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-[#161616] border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-white mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Sales &amp; Earnings</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              See your customer orders, daily sales revenue, and monthly payouts live. Keep full track of your best-selling plugins and sample packs.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-[#161616] border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-white mb-5">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fast Worldwide Downloads</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your buyers get lightning-fast, secure cloud downloads for heavy plugin installers and large sound archives anywhere across the globe.
            </p>
          </div>
        </section>

        {/* FAQ Section (Gumroad-style) */}
        <section className="w-full max-w-4xl mt-28 text-left">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-zinc-400 mt-2">
              Everything audio developers need to know about publishing on Producer Toy.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#161616] border border-[#262626] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:bg-[#1a1a1d] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-[#222226] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1c1c1f] hover:bg-[#252528] border border-white/10 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer group shadow-lg"
            >
              <span>View All 22+ Developer FAQs & Knowledge Base</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </section>

        {/* Final CTA Card */}
        <section className="w-full max-w-4xl mt-28 p-10 sm:p-14 rounded-3xl bg-[#161616] border border-[#2a2a2f] text-center shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to publish your audio tools?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Join the premier roster of audio plugin developers and sound designers. Submit your developer application today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto btn-white py-3.5 px-8 text-xs font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-2 shadow-xl"
            >
              <span>Apply for Creator Access</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto py-3.5 px-8 text-xs font-semibold uppercase tracking-wider rounded-full bg-[#202020] hover:bg-[#282828] border border-[#2e2e2e] text-white flex items-center justify-center gap-2 transition-colors"
            >
              <span>Sign In to Dashboard</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#202020] py-8 px-6 sm:px-12 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto">
        <p>&copy; {new Date().getFullYear()} Producer Toy Inc. All rights reserved. Toy Creator Portal.</p>
        <div className="flex items-center gap-6">
          <Link
            href="/faq"
            className="hover:text-white transition-colors"
          >
            Developer FAQ
          </Link>
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            ProducerToy Marketplace &rarr;
          </a>
          <a
            href="https://producertoy.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Privacy
          </a>
          <a
            href="https://producertoy.com/terms"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
