'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  DollarSign,
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  FileText,
  UserCheck,
  ArrowLeft,
  X,
  Check,
  Copy
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FaqItem {
  id: string;
  category: 'money' | 'licensing' | 'privacy' | 'products' | 'support' | 'start';
  q: string;
  a: string;
  points?: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'money', label: 'Earnings & Payouts', icon: DollarSign },
  { id: 'licensing', label: 'License Keys & DRM', icon: ShieldCheck },
  { id: 'privacy', label: 'Customer Privacy', icon: Lock },
  { id: 'products', label: 'Products & Formats', icon: Cpu },
  { id: 'support', label: 'Support & Terms', icon: FileText },
  { id: 'start', label: 'Getting Started', icon: UserCheck },
] as const;

const FAQS: FaqItem[] = [
  // 1. Earnings & Payouts
  {
    id: 'commission',
    category: 'money',
    q: 'How much do I earn on each sale?',
    a: 'You keep 70% of the net sale proceeds, and ProducerToy keeps 30%. There are zero listing fees, zero setup costs, and no monthly subscription charges. You only pay when you make a sale.',
    points: [
      '70% goes directly to you.',
      '30% platform fee covers fast cloud downloads, payment processing systems, and buyer support.',
      'No hidden costs or surprise deductions.',
    ],
  },
  {
    id: 'calculation-order',
    category: 'money',
    q: 'How is my payout calculated?',
    a: 'We keep fee calculations simple and completely transparent:',
    points: [
      '1. Start with the price the customer actually paid.',
      '2. Any official sales tax or VAT is set aside.',
      '3. Standard payment processor fees (PayPal or credit card gateway fees) are deducted at exact cost.',
      '4. The remaining money is split 70% for you and 30% for ProducerToy.',
      '5. Outbound bank transfer fees (if any) are shown clearly on your monthly report with zero markup.',
    ],
  },
  {
    id: 'example-19',
    category: 'money',
    q: 'Can you show a simple example of a $19 sale?',
    a: 'Here is an easy example for a $19.00 plugin sale:',
    points: [
      'Customer pays: $19.00',
      'Payment processing fee (approx. provider cost): -$1.14',
      'Net proceeds: $17.86',
      'You get (70%): $12.50',
      'ProducerToy takes (30%): $5.36',
    ],
  },
  {
    id: 'payout-schedule',
    category: 'money',
    q: 'When and how do I get paid?',
    a: 'We pay creators once a month, by the 15th of every month. For example, all your January sales are paid out by February 15th.',
    points: [
      'No minimum payout amount — whether you earn $15 or $5,000, you get paid.',
      'Sent directly to your bank account via SWIFT/wire transfer, or to your business PayPal.',
      'You can download a clean CSV statement anytime showing every sale, fee, and payout.',
    ],
  },
  {
    id: 'refunds',
    category: 'money',
    q: 'What happens if a customer asks for a refund?',
    a: 'If a refund or payment dispute happens under our fair customer policy, that specific transaction is reversed. The deduction is shown clearly in your next monthly statement.',
  },

  // 2. License Keys & DRM
  {
    id: 'license-keys',
    category: 'licensing',
    q: 'How do license keys work on Toy Creator?',
    a: 'You can upload your own list of serial keys (CSV), or let our system create secure keys automatically. When a customer buys your software, a unique key is instantly placed into their private customer library.',
    points: [
      'Guaranteed real keys — our system never gives out fake or duplicate keys.',
      'Automatic inventory alerts when your key stock gets low.',
      'Instant access for the customer right after checkout.',
    ],
  },
  {
    id: 'computer-seats',
    category: 'licensing',
    q: 'Can I choose how many computers a user can activate?',
    a: 'Yes. You can choose the computer activation limit per license (for example, 2 computers for home studio and laptop). If a key is leaked or refunded, you can revoke it anytime from your dashboard.',
  },
  {
    id: 'external-api-webhook',
    category: 'licensing',
    q: 'Can I connect my own website or licensing API to generate keys dynamically?',
    a: 'Yes! If you already run your own website or cloud licensing server, you can connect it using our Live Developer Webhook API (Plugin Boutique standard):',
    points: [
      'Real-Time Key Dispatch: ProducerToy sends an authenticated HTTPS POST to your endpoint when an order is completed.',
      'HMAC-SHA256 Security: Every request is signed with your shared secret to prevent tampering or replay attacks.',
      'Use the Same API on Your Website: You can use your exact same internal licensing code for sales on your own website and ProducerToy.',
      'Zero-Blocker Fallback: If your server temporarily times out or experiences downtime, ProducerToy automatically falls back to an emergency CSV pool so you never lose a sale.',
      'Full Developer Guide & Code: Step-by-step documentation with ready-to-copy Next.js, Node.js, Python, and PHP snippets is available in your dashboard under "Developer Guide & API".',
    ],
  },

  // 3. Customer Privacy
  {
    id: 'privacy-default',
    category: 'privacy',
    q: 'Do I get the buyer’s personal email and phone number?',
    a: 'No, not by default. We protect customer privacy. In your dashboard and reports, customer emails are masked (for example: r***r@example.com), and personal phone numbers or physical addresses are never shared.',
  },
  {
    id: 'data-sharing-consent',
    category: 'privacy',
    q: 'What if my plugin needs the buyer’s email for activation?',
    a: 'If your software genuinely needs the buyer’s email for online license activation or custom updates, we show a clear notice at checkout. The customer must actively tick a consent box before buying.',
    points: [
      'The buyer sees your verified brand name and exactly why the information is needed.',
      'The consent box is never pre-checked.',
      'You are legally required to use their email only for licensing and support — never for marketing newsletters.',
    ],
  },

  // 4. Products & Formats
  {
    id: 'supported-formats',
    category: 'products',
    q: 'What types of audio products can I sell?',
    a: 'You can sell virtually any digital music production tool or sound library:',
    points: [
      'Audio Plugins: VST3, AU (Audio Units), AAX, and CLAP for Mac and Windows.',
      'Sample Packs & Sound Kits: 24-bit WAV, AIFF, and MIDI files.',
      'Synth Presets: Serum, Vital, Diva, Massive, Phase Plant, etc.',
      'Sampler Instruments: Kontakt (full/player), Decent Sampler, SFZ.',
      'DAW Project Templates: Ableton Live, FL Studio, Logic Pro, Cubase.',
    ],
  },
  {
    id: 'file-storage',
    category: 'products',
    q: 'How large can my installer files be?',
    a: 'We provide fast global cloud storage supporting files up to 10GB per product. Buyers get fast, resume-supported downloads from edge servers worldwide.',
  },
  {
    id: 'code-signing',
    category: 'products',
    q: 'Do my Mac and Windows installers need to be signed?',
    a: 'Yes, for the best customer experience. Mac installers (.pkg or .dmg) should be signed and notarized with an Apple Developer ID to prevent Gatekeeper warnings. Windows installers should be code-signed to avoid SmartScreen alerts.',
  },
  {
    id: 'updates',
    category: 'products',
    q: 'Can I release free updates and bug fixes for existing buyers?',
    a: 'Yes! You can upload new versions (like v1.0.1) anytime with a changelog. Past buyers can download the updated build from their library for free.',
  },

  // 5. Support & Terms
  {
    id: 'support-roles',
    category: 'support',
    q: 'Who handles customer support — ProducerToy or me?',
    a: 'We split support responsibilities based on what each party does best:',
    points: [
      'ProducerToy handles: User accounts, checkout, payments, download delivery, invoices, and billing issues.',
      'You handle: Plugin sound, DSP code, DAW compatibility questions, installation guides, and software bugs.',
      'We work together: If a download fails or a key needs verification, our teams cooperate directly.',
    ],
  },
  {
    id: 'eula-rules',
    category: 'support',
    q: 'Does my own software license (EULA) protect my plugin?',
    a: 'Yes. Your own product license explicitly governs how buyers can use your software, computer activations, and copyright. Your license takes priority over general store rules on all software matters.',
  },

  // 6. Getting Started
  {
    id: 'who-can-join',
    category: 'start',
    q: 'Who can become a creator on Toy Creator?',
    a: 'Toy Creator is curated for quality. We welcome audio software developers, plugin creators, boutique DSP builders, sound designers, and sample label owners with original, high-quality audio tools.',
  },
  {
    id: 'how-to-apply',
    category: 'start',
    q: 'How do I apply and start selling?',
    a: 'Click "Partner / Apply" and submit your name, website, and portfolio links. Our team reviews applications within 24 to 48 hours. Once approved, you get a secure invite link to create your brand account.',
  },
  {
    id: 'ownership',
    category: 'start',
    q: 'Do I keep full ownership of my audio tools?',
    a: 'Yes, 100%. You keep full copyright and ownership of your software, sounds, trademarks, and code. Selling on ProducerToy is non-exclusive — you can keep selling on your own website anytime.',
  },
];

export default function CreatorFaqPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [openValues, setOpenValues] = useState<string[]>(['commission', 'calculation-order']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/faq#${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const filtered = useMemo(() => {
    return FAQS.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase().trim();
      return (
        f.q.toLowerCase().includes(s) ||
        f.a.toLowerCase().includes(s) ||
        f.points?.some((p) => p.toLowerCase().includes(s))
      );
    });
  }, [search, category]);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-white selection:text-black font-sans">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-[#222222] px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <picture className="flex-shrink-0">
            <source srcSet="/logo.webp" type="image/webp" />
            <img src="/logo.png" alt="Toy Creator Emblem" className="w-10 h-10 object-contain" />
          </picture>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white uppercase">Toy Creator</span>
            <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">by ProducerToy</span>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            Overview
          </Link>
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 hidden md:flex"
          >
            <span>Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
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

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 sm:py-16 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Creator Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Everything you need to know about selling plugins, sample packs, and sound tools on ProducerToy. Simple answers, no confusing legalese.
          </p>
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full mb-6">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions (e.g., 70% split, payouts, serial keys, privacy, formats)..."
            className="w-full h-12 pl-11 pr-10 rounded-xl bg-[#181818] border border-[#262626] focus:border-zinc-400 focus:outline-none text-xs sm:text-sm text-white placeholder:text-zinc-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Minimalist Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-black'
                    : 'bg-[#181818] border border-[#262626] text-zinc-400 hover:text-white hover:bg-[#202020]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-black' : 'text-zinc-400'}`} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-4 px-1">
          <span>{filtered.length} questions</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpenValues(filtered.map((f) => f.id))}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Open all
            </button>
            <span>•</span>
            <button
              onClick={() => setOpenValues([])}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Close all
            </button>
          </div>
        </div>

        {/* FAQ Accordion */}
        {filtered.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-[#161616] border border-[#242424] my-6">
            <p className="text-sm font-semibold text-zinc-300 mb-1">No matching questions found</p>
            <p className="text-xs text-zinc-500 mb-4">Try searching for something else or clear your search.</p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
              }}
              className="px-4 py-2 rounded-lg bg-[#242424] hover:bg-[#2c2c2c] text-xs font-semibold text-white transition-colors"
            >
              Show all questions
            </button>
          </div>
        ) : (
          <Accordion
            type="multiple"
            variant="filled"
            indicator="plus"
            value={openValues}
            onValueChange={setOpenValues}
            className="w-full space-y-2.5"
          >
            {filtered.map((item) => {
              const isCopied = copiedId === item.id;

              return (
                <AccordionItem
                  key={item.id}
                  id={item.id}
                  value={item.id}
                  className="rounded-xl bg-[#161616] hover:bg-[#1a1a1a] transition-colors border border-[#242424]"
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <AccordionTrigger className="w-full p-5 text-left text-sm sm:text-base font-bold text-white leading-snug hover:text-white">
                      <span className="flex-1 pr-2">{item.q}</span>
                    </AccordionTrigger>
                    <button
                      type="button"
                      onClick={(e) => copyLink(item.id, e)}
                      title="Copy link"
                      className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                      aria-label="Copy link to question"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <AccordionContent className="px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-[#202020] pt-3.5">
                    <p className="text-zinc-300">{item.a}</p>

                    {item.points && item.points.length > 0 && (
                      <div className="mt-3 p-3.5 rounded-lg bg-[#111111] border border-[#202020] space-y-1.5 text-xs text-zinc-400">
                        {item.points.map((pt, pIdx) => (
                          <p key={pIdx} className="leading-relaxed">
                            {pt}
                          </p>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Minimal Bottom CTA Card */}
        <div className="w-full mt-16 p-8 sm:p-10 rounded-2xl bg-[#161616] border border-[#242424] text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
            Ready to sell your audio tools?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mb-6 leading-relaxed">
            Join independent audio developers and sound designers worldwide. Submit your application today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto btn-white py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
            >
              <span>Apply for Creator Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto py-3 px-6 text-xs font-semibold uppercase tracking-wider rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#2a2a2a] text-white flex items-center justify-center transition-colors"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#202020] py-8 px-6 sm:px-12 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto">
        <p>&copy; {new Date().getFullYear()} Producer Toy Inc. All rights reserved. Toy Creator Portal.</p>
        <div className="flex items-center gap-6">
          <Link href="/faq" className="text-zinc-300 hover:text-white transition-colors">
            Developer FAQ
          </Link>
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-300 transition-colors"
          >
            ProducerToy Marketplace &rarr;
          </a>
          <a
            href="https://producertoy.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-300 transition-colors"
          >
            Privacy
          </a>
          <a
            href="https://producertoy.com/terms"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-300 transition-colors"
          >
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
