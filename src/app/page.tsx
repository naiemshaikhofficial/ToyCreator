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
  const creatorEarnings = grossRevenue * 0.85;
  const industryTraditionalEarnings = grossRevenue * 0.5;

  const faqs = [
    {
      q: 'What types of audio products can I publish?',
      a: 'Toy Creator supports Audio Plugins (VST3, AU, AAX, CLAP for Windows and macOS), Sample Packs & Sound Libraries (24-bit WAV, AIFF, MIDI), Synth Presets (Serum, Diva, Vital, Phase Plant), and DAW Project Templates.',
    },
    {
      q: 'How does the 85% creator revenue split work?',
      a: 'You retain 85% of net product sales. ProducerToy covers all global payment gateway fees, fraud protection, VAT/sales tax compliance, and cloud CDN hosting.',
    },
    {
      q: 'Can I generate and protect software license keys?',
      a: 'Yes. Toy Creator includes a built-in cryptographic license engine. You can configure hardware machine limits (e.g. 2 activations per user), offline authorization tokens, and revoke pirated keys instantly.',
    },
    {
      q: 'How do payouts work?',
      a: 'Automated monthly payouts are sent directly to your bank account via Stripe Connect or PayPal. Real-time earnings and sales breakdowns are visible anytime on your dashboard.',
    },
    {
      q: 'Who can become a creator on Toy Creator?',
      a: 'To maintain high audio standards, Toy Creator is curated. Audio software developers, DSP engineers, and sound designers can submit their portfolio via our partnership application to get approved.',
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

      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Gumroad-Style Hero Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1c1c1f] border border-[#2a2a2f] text-xs font-medium text-zinc-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="font-semibold text-white">The Creator Economy for Audio</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">Keep 85% of Every Sale</span>
        </div>

        {/* Hero Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-[1.08]">
          Sell your audio plugins &amp; sounds directly to music producers.
        </h1>

        <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mb-10 font-normal leading-relaxed">
          Toy Creator is the premier publisher platform for VST developers, DSP engineers, and sample designers. Distribute digital audio software worldwide with machine licensing and automated payouts.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto btn-white py-4 px-8 text-sm font-bold rounded-full flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] transition-transform"
          >
            <span>Apply for Brand Creator Access</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto py-4 px-8 text-sm font-semibold rounded-full bg-[#1c1c1f] hover:bg-[#26262a] border border-[#2e2e33] text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Lock className="w-4 h-4 text-zinc-400" />
            <span>Developer Sign In</span>
          </Link>
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
              85% / 15% Split
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
                <span>ProducerToy Fee: 15%</span>
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
            <h3 className="text-lg font-bold text-white mb-2">Cryptographic Licensing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Native hardware activation seats, challenge-response pairing, and offline token management built specifically for C++, JUCE, and VST3 plugins.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-[#161616] border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-white mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-time Sales Analytics</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Track gross revenue, conversion rates, refund ratios, top customers, and geographic traffic instantly from your creator command center.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-[#161616] border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-white mb-5">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">High-Speed Edge Delivery</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Distribute multi-gigabyte audio libraries and plugin installers worldwide with low latency and one-time authenticated signed URLs.
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
