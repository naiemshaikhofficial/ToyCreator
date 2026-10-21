'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  DollarSign,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  FileText,
  UserCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  X,
  CreditCard,
  Building,
  AlertCircle
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'monetization' | 'licensing' | 'privacy' | 'products' | 'support' | 'onboarding';
  q: string;
  a: string;
  details?: string[];
  tags: string[];
}

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'monetization', label: 'Commissions & Payouts', icon: DollarSign },
  { id: 'licensing', label: 'License Keys & DRM', icon: ShieldCheck },
  { id: 'privacy', label: 'Customer Privacy & Data Sharing', icon: Lock },
  { id: 'products', label: 'Formats & Storage', icon: Cpu },
  { id: 'support', label: 'Support & EULA Terms', icon: FileText },
  { id: 'onboarding', label: 'Onboarding & Guidelines', icon: UserCheck },
] as const;

const FAQS_DATA: FaqItem[] = [
  // 1. Monetization & Payouts
  {
    id: 'commission-split',
    category: 'monetization',
    q: 'What is the commission split on Toy Creator?',
    a: 'Producer Toy operates on a transparent 70% Developer / 30% Platform Fee model on eligible net sale proceeds. You keep 70% of every sale after actual payment processor fees, with zero hidden markups or surprise deductions.',
    details: [
      '70% of eligible net sale proceeds is disbursed directly to the developer.',
      '30% platform fee supports global cloud hosting, fraud prevention, payment gateway integrations, and multi-region download infrastructure.',
      'Zero listing fees, zero monthly hosting subscriptions, and zero upfront placement fees.',
    ],
    tags: ['commission', 'revenue split', '70/30', 'percentage', 'fees'],
  },
  {
    id: 'deduction-order',
    category: 'monetization',
    q: 'What is the exact deduction sequence from a customer payment?',
    a: 'Deductions are calculated in a strict, standardized sequence so developers have complete mathematical transparency on every order.',
    details: [
      '1. Gross Customer Price: The actual price paid by the customer after any promotional discount.',
      '2. Exclude Transaction Taxes: Separately collected sales taxes or VAT are excluded from revenue share.',
      '3. Deduct Payment Gateway Processing Fees: Actual third-party processing fees (e.g. PayPal international 4.40% + $0.30 fixed fee or card gateway interchange) and transaction-specific currency conversion charges are deducted.',
      '4. Revenue Split: The remaining net sale proceeds are divided: 70% to the Developer and 30% to Producer Toy.',
      '5. Outbound Payout Fee: Actual bank wire / SWIFT transfer fees are deducted from the developer disbursement, itemized separately without markup.',
    ],
    tags: ['deductions', 'calculation sequence', 'payment processing', 'taxes', 'net proceeds'],
  },
  {
    id: 'example-19-sale',
    category: 'monetization',
    q: 'Can you provide a worked calculation for an illustrative $19 sale?',
    a: 'Here is an illustrative calculation for a standard $19.00 audio plugin or sound pack sale:',
    details: [
      'Customer Retail Price: $19.00',
      'Assumed Payment Processing Fee: -$1.14 (illustrative provider fee, replaced by actual recorded fee)',
      'Eligible Net Proceeds: $17.86',
      'Developer Share (70%): $12.50',
      'Producer Toy Platform Share (30%): $5.36',
      'Note: This example assumes no applicable discounts or transaction taxes. Bank transfer fees, if applicable, appear itemized on your monthly settlement statement.',
    ],
    tags: ['19 dollar example', 'worked calculation', 'groove console', 'developer share', 'math'],
  },
  {
    id: 'payout-schedule',
    category: 'monetization',
    q: 'When and how are developer payouts disbursed?',
    a: 'Developer payouts are manual, fully itemized monthly disbursements processed by the 15th calendar day of the following month for the preceding month’s earnings.',
    details: [
      'Payout Schedule: Payable by the 15th calendar day of the following month (e.g., January earnings are settled by February 15th).',
      'Zero Minimum Threshold: No arbitrary $100 or $500 threshold — you receive your payout regardless of sales volume.',
      'Payment Methods: International SWIFT / bank wire transfer to corporate bank accounts, domestic NEFT/RTGS for India-based developers, or PayPal business transfer.',
      'Itemized CSV Accounting: Every payout includes an itemized breakdown of order IDs, customer price, processing fees, and net creator retain.',
    ],
    tags: ['payout schedule', 'monthly payouts', 'wire transfer', 'swift', 'bank transfer', 'threshold', '15th'],
  },
  {
    id: 'refunds-chargebacks',
    category: 'monetization',
    q: 'How are refunds and chargebacks handled in developer earnings?',
    a: 'If a customer transaction is refunded or disputed according to our Platform Customer Support & Refund Policy, the corresponding sale is reversed.',
    details: [
      'The refunded amount and corresponding commission are adjusted against current or upcoming settlement cycles.',
      'Producer Toy investigates fraudulent chargeback claims with payment processors to protect creators from malicious dispute abuse.',
      'All refund deductions are itemized in your monthly settlement statement with full transaction references.',
    ],
    tags: ['refunds', 'chargebacks', 'disputes', 'accounting', 'settlement adjustment'],
  },

  // 2. License Keys & DRM
  {
    id: 'license-drm',
    category: 'licensing',
    q: 'How does built-in license protection and key delivery work?',
    a: 'Toy Creator provides an automated Serial Key Pool system with optimistic concurrency locking to protect your software while providing instant delivery to buyers.',
    details: [
      'Guaranteed Genuine Keys: Products configured for pooled delivery pull genuine keys from your uploaded serial inventory.',
      'No Duplicate Claims: Database row-level locks prevent race conditions and duplicate key claims.',
      'Instant Buyer Delivery: License keys appear immediately in the customer’s private Producer Toy Library and email receipt upon verified payment.',
      'Inventory Alerts: Automatic dashboard notifications when your serial key inventory drops below safety thresholds.',
    ],
    tags: ['license keys', 'serial keys', 'drm', 'piracy protection', 'activation'],
  },
  {
    id: 'computer-seats',
    category: 'licensing',
    q: 'Can I set computer activation limits and manage customer seats?',
    a: 'Yes. You can specify the authorized machine activation limit per customer license (e.g., 2 computers for desktop studio + laptop).',
    details: [
      'Configure seat limits per product listing in your developer dashboard.',
      'View claimed serial keys and associated purchase dates directly in your dashboard.',
      'Revoke keys with one click in the event of confirmed piracy, fraudulent purchases, or processed refunds.',
    ],
    tags: ['seats', 'computer activations', 'machine lock', 'revoke key'],
  },
  {
    id: 'no-dummy-keys',
    category: 'licensing',
    q: 'Does Toy Creator ever generate fake or dummy serial keys?',
    a: 'No. For all products that require genuine serial keys, our delivery engine strictly enforces real key inventory from your uploaded CSV pool. We never fabricate placeholder keys for commercial plugins.',
    details: [
      'Our licensing engine uses strict database transactions to verify key availability before completing key assignment.',
      'If your inventory is depleted, our platform alerts you to restock immediately rather than generating unverified placeholders.',
    ],
    tags: ['dummy keys', 'genuine keys', 'serial pool', 'integrity'],
  },

  // 3. Customer Privacy & Data Sharing
  {
    id: 'customer-privacy-default',
    category: 'privacy',
    q: 'Do developers get access to customer personal emails and phone numbers?',
    a: 'By default, NO. Producer Toy enforces a strict Privacy-First architecture. Customer personal information is never automatically shared, harvested, or sold to third parties.',
    details: [
      'Default Data Masking: Customer emails are masked in developer dashboards and CSV exports (e.g., r***r@example.com).',
      'No Unnecessary PII: Customer phone numbers, physical addresses, and payment card details are never exposed to developers.',
      'Support Mediated: Routine platform support is mediated by Producer Toy so developers do not need raw buyer emails.',
    ],
    tags: ['privacy', 'pii', 'data masking', 'customer emails', 'gdpr'],
  },
  {
    id: 'seller-data-sharing-consent',
    category: 'privacy',
    q: 'When and how can customer data be shared with a developer?',
    a: 'Customer information is shared ONLY when a product has a legitimate technical requirement for software licensing, online activation, or product-specific support, AND the customer gives explicit pre-purchase consent.',
    details: [
      'Verified Developer Notice: Checkout displays a prominent Seller Data Sharing Notice with your verified brand name, exact fields shared, and permitted purpose.',
      'Unchecked Consent Control: The consent checkbox is NEVER pre-checked. Customers must actively opt in.',
      'Immutable Audit Trail: Customer consent timestamp, version, and order reference are stored in our secure database.',
      'Independent Per Product: Consent for one product does not authorize sharing for unrelated products or brands.',
    ],
    tags: ['data sharing', 'consent', 'checkout notice', 'activation requirement', 'audit trail'],
  },
  {
    id: 'developer-privacy-covenant',
    category: 'privacy',
    q: 'What are the developer’s obligations regarding shared customer data?',
    a: 'Developers who receive customer information under verified consent are legally bound by a strict Non-Marketing Covenant.',
    details: [
      'Permitted Purpose Only: Customer data may ONLY be used for the disclosed purpose (software licensing, computer activation, or direct bug resolution).',
      'No Unsolicited Marketing: You may NOT add customer emails to general marketing newsletters or promotional campaigns without separate opt-in consent.',
      'No Onward Transfer: You may not sell, rent, or disclose customer personal information to any third party.',
      'Security Duty: You must implement reasonable administrative and technical safeguards to protect customer data.',
    ],
    tags: ['covenant', 'non-marketing', 'legal obligation', 'gdpr compliance', 'restrictions'],
  },

  // 4. Products, Formats & Storage
  {
    id: 'accepted-formats',
    category: 'products',
    q: 'What types of audio products and formats can I sell?',
    a: 'Toy Creator supports the full spectrum of professional music production tools and digital soundware.',
    details: [
      'Audio Plugins & FX: VST3, AU (Audio Units), AAX, CLAP for macOS (Apple Silicon & Intel) and Windows (64-bit).',
      'Sample Packs & Sound Kits: 24-bit WAV, AIFF, and MIDI files.',
      'Synth Presets: Xfer Serum, Vital, u-he Diva, NI Massive, Phase Plant, Sylenth1, and more.',
      'Sampler Instruments: Native Instruments Kontakt (full & player), Decent Sampler, SFZ.',
      'DAW Project Templates: Ableton Live, FL Studio, Logic Pro, Cubase, Studio One.',
    ],
    tags: ['formats', 'vst3', 'au', 'aax', 'clap', 'wav', 'midi', 'presets', 'kontakt'],
  },
  {
    id: 'file-hosting-storage',
    category: 'products',
    q: 'What are the installer hosting and file upload size limits?',
    a: 'We provide enterprise cloud storage and multi-region CDN distribution with support for up to 10GB per product installer or archive.',
    details: [
      'Global Edge CDN: Fast, low-latency downloads for buyers in 100+ countries.',
      'Cryptographic Checksums: Automated hash verification ensures downloads are never corrupted in transit.',
      'Dual-Asset Support: Separate Mac (.dmg/.pkg) and Windows (.exe/.zip) installer files hosted cleanly under one product listing.',
    ],
    tags: ['file size', 'cdn', 'cloud storage', '10gb', 'fast downloads', 'dual asset'],
  },
  {
    id: 'code-signing',
    category: 'products',
    q: 'Are macOS and Windows plugin builds required to be signed and notarized?',
    a: 'Yes. To provide a professional customer experience and prevent OS security warnings, software binaries must be properly signed.',
    details: [
      'macOS: Apple Silicon & Intel installers (.pkg or .dmg) must be signed with an Apple Developer ID and notarized by Apple Gatekeeper.',
      'Windows: .exe or .msi installers should be signed with an OV/EV Code Signing Certificate to establish Microsoft SmartScreen reputation.',
      'Security: Unsigned binaries risk buyer antivirus blocks and customer return requests.',
    ],
    tags: ['code signing', 'notarization', 'apple gatekeeper', 'smartscreen', 'security'],
  },
  {
    id: 'version-updates',
    category: 'products',
    q: 'Can I release version updates, hotfixes, and changelogs?',
    a: 'Yes! Your developer dashboard lets you release version increments (e.g., v1.0.0 → v1.0.1) anytime.',
    details: [
      'Attach clear changelogs and release notes to notify your user base.',
      'Past verified buyers can immediately download the updated build from their Producer Toy Customer Library at zero extra cost.',
      'Old binary archives are safely versioned so you can rollback if necessary.',
    ],
    tags: ['version updates', 'patches', 'changelog', 'hotfixes', 'free updates'],
  },

  // 5. Support & EULA Terms
  {
    id: 'support-responsibilities',
    category: 'support',
    q: 'Who handles customer support — Producer Toy or the developer?',
    a: 'Customer support is structured under our Universal Multi-Vendor Responsibility Model, clearly dividing marketplace infrastructure from software-specific support.',
    details: [
      'Producer Toy Platform Responsibilities: Marketplace accounts, checkout billing, order receipts, download library infrastructure, platform CDN delivery, and payment gateway dispute triage.',
      'Developer / Brand Responsibilities: Product descriptions, system compatibility (OS/DAW), installation guides, license activation/serial keys, audio DSP glitches, software bug fixes, and product-specific troubleshooting.',
      'Joint Cooperation: Both parties cooperate on failed digital delivery, license key investigations, refund triage, and security incident response.',
    ],
    tags: ['support model', 'responsibilities', 'customer support', 'troubleshooting', 'developer role'],
  },
  {
    id: 'eula-order-of-precedence',
    category: 'support',
    q: 'How does the developer product license (EULA) interact with Producer Toy terms?',
    a: 'We uphold a clear legal Order of Precedence ensuring your software intellectual property is fully protected by your own license terms.',
    details: [
      '1. Mandatory Applicable Law: Takes precedence where required by statute.',
      '2. Developer Product-Specific License (EULA): Directly governs the permitted use of the specific audio plugin, machine activations, computer seats, reverse-engineering restrictions, and intellectual property. It explicitly takes precedence on software matters.',
      '3. Producer Toy Platform Terms: Govern user accounts, marketplace access, checkout security, and platform operations.',
      'Customers are presented with and accept your product license prior to completing their checkout.',
    ],
    tags: ['eula', 'product license', 'order of precedence', 'intellectual property', 'terms'],
  },

  // 6. Onboarding & Guidelines
  {
    id: 'who-can-join',
    category: 'onboarding',
    q: 'Who is eligible to become a creator on Toy Creator?',
    a: 'Toy Creator is curated for quality. We welcome audio software developers, boutique DSP engineers, sound designers, sample label founders, and preset creators with a track record of quality releases.',
    details: [
      'We accept independent developers, audio startups, and established software brands.',
      'Products are reviewed for audio quality, system stability, installer security, and accurate documentation.',
      'You must hold complete intellectual property rights or valid distribution licenses for all content you publish.',
    ],
    tags: ['eligibility', 'creators', 'developers', 'quality review', 'who can join'],
  },
  {
    id: 'invite-process',
    category: 'onboarding',
    q: 'How does the application and brand invite process work?',
    a: 'To maintain high marketplace standards, onboarding is invitation and application-based.',
    details: [
      '1. Submit Application: Fill out our quick Creator Application with links to your portfolio, website, or audio demos.',
      '2. Review & Approval: Our developer relations team reviews your application within 24 to 48 business hours.',
      '3. Secure Invite Token: Approved creators receive a cryptographic Brand Invite Token to register their developer workspace.',
      '4. Setup & Launch: Complete your brand profile, configure payout bank details, upload product installers & serial keys, and launch on Producer Toy.',
    ],
    tags: ['application', 'invite token', 'registration', 'onboarding workflow', 'approval'],
  },
  {
    id: 'ip-ownership',
    category: 'onboarding',
    q: 'Do I maintain 100% ownership of my intellectual property?',
    a: 'Yes, absolutely. You retain 100% full ownership of your code, audio recordings, trademarks, brand identity, and intellectual property.',
    details: [
      'Distribution on Producer Toy is strictly non-exclusive.',
      'You are completely free to distribute your products on your own website or other retail platforms concurrently.',
      'You can update, modify, or unpublish your products whenever you choose.',
    ],
    tags: ['ip ownership', 'non-exclusive', 'copyright', 'retain rights', 'ownership'],
  },
];

export default function CreatorFaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set(['commission-split', 'deduction-order']));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFaqs(new Set(filteredFaqs.map((f) => f.id)));
  };

  const collapseAll = () => {
    setExpandedFaqs(new Set());
  };

  const copyFaqLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/faq#${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inQuestion = faq.q.toLowerCase().includes(q);
      const inAnswer = faq.a.toLowerCase().includes(q);
      const inDetails = faq.details?.some((d) => d.toLowerCase().includes(q)) ?? false;
      const inTags = faq.tags.some((t) => t.toLowerCase().includes(q));

      return inQuestion || inAnswer || inDetails || inTags;
    });
  }, [searchQuery, selectedCategory]);

  // Structured Data Schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS_DATA.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${faq.a} ${faq.details ? faq.details.join(' ') : ''}`,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-white selection:text-black font-sans">
      {/* Schema.org FAQPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 sm:py-16 flex flex-col">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Creator Home</span>
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Developer Knowledge Base
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-3 max-w-3xl leading-relaxed">
            Everything audio developers, plugin creators, and sound designers need to know about publishing on Producer Toy. Clear commission splits, monthly settlement rules, license key DRM, customer privacy, and technical requirements.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full mb-8">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by question, topic, or keyword (e.g., 70% split, payouts, serial keys, privacy, EULA)..."
            className="w-full h-13 pl-12 pr-10 rounded-2xl bg-[#161616] border border-[#262626] focus:border-white/30 focus:outline-none text-sm text-white placeholder:text-zinc-500 transition-colors shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {FAQ_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#181818] border border-[#262626] text-zinc-400 hover:text-white hover:bg-[#202020]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Counter & Expand/Collapse Toggle */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-6 px-1">
          <span>
            Showing <strong className="text-white">{filteredFaqs.length}</strong> of {FAQS_DATA.length} developer questions
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={expandAll}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={collapseAll}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* FAQ Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#161616] border border-[#262626] my-6">
            <HelpCircle className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No matching questions found</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
              We couldn’t find any answers matching &ldquo;{searchQuery}&rdquo;. Try another search term or browse by category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqs.has(faq.id);
              const isCopied = copiedId === faq.id;

              return (
                <div
                  key={faq.id}
                  id={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'bg-[#18181c] border-white/20 shadow-xl'
                      : 'bg-[#161616] border-[#262626] hover:border-[#353535]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isExpanded}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.04]">
                          {FAQ_CATEGORIES.find((c) => c.id === faq.category)?.label || faq.category}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {faq.q}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                      <button
                        type="button"
                        onClick={(e) => copyFaqLink(faq.id, e)}
                        title="Copy direct link to question"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Copy link"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <ChevronDown
                        className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-zinc-300 leading-relaxed border-t border-white/[0.06] animate-in fade-in duration-150">
                      <p className="mb-3 text-zinc-200 font-medium">{faq.a}</p>

                      {faq.details && faq.details.length > 0 && (
                        <div className="p-4 rounded-xl bg-[#121214] border border-white/[0.06] space-y-2 mt-3 text-xs sm:text-sm text-zinc-300">
                          {faq.details.map((detail, dIdx) => (
                            <div key={dIdx} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
                          Tags:
                        </span>
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#202020] text-zinc-400 border border-white/[0.04]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Resource Links Card */}
        <div className="w-full mt-16 p-6 sm:p-8 rounded-3xl bg-[#161616] border border-[#262626] grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#202020] border border-[#2e2e2e] text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Universal Support Model</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Clearly defined roles dividing marketplace billing from developer DSP troubleshooting.
              </p>
              <a
                href="https://producertoy.com/support"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-white mt-2 hover:underline"
              >
                <span>Read Support Policy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#202020] border border-[#2e2e2e] text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Privacy &amp; Data Sharing</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Privacy-first default masking with explicit pre-purchase customer consent for software licensing.
              </p>
              <a
                href="https://producertoy.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-white mt-2 hover:underline"
              >
                <span>Read Privacy Terms</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#202020] border border-[#2e2e2e] text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Monthly Settlements</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Disbursements payable by the 15th of the following month with zero minimum threshold.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-white mt-2 hover:underline"
              >
                <span>View Payout Reports</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <section className="w-full mt-16 p-10 sm:p-14 rounded-3xl bg-[#161616] border border-[#2a2a2f] text-center shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Have more questions about publishing?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Our developer relations team is here to assist audio software developers, DSP engineers, and sound designers through every step of distribution.
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
          <Link href="/faq" className="text-white font-medium hover:underline">
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
