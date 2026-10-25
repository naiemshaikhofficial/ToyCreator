'use client';

import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Landmark,
  CreditCard,
} from 'lucide-react';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import DualAssetUploadInput from '@/components/DualAssetUploadInput';
import { submitSellerApplicationAction } from '@/actions/sellerApplicationActions';

interface CreatorApplicationFormProps {
  initialEmail?: string;
  onBack?: () => void;
}

const SECTIONS = [
  'Company Overview',
  'Products & Marketing',
  'Technical (DRM)',
  'Business & Legal',
  'Contacts',
  'Commercial Setup',
];

const PRODUCT_TYPES = ['Presets', 'Plugins', 'Samples', 'Kontakt Instruments'];

const ACCOUNTING_PERIODS = [
  'Monthly (1st of every month)',
  'Bi-Weekly (Accelerated schedule)',
  'Quarterly',
];

const PRICING_OPTIONS = [
  'Fixed USD Base Pricing',
  'Multi-Currency Matrix (USD, EUR, GBP, INR)',
  'Parity-Adjusted Global Pricing',
];

export function CreatorApplicationForm({ initialEmail = '', onBack }: CreatorApplicationFormProps) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');

  // 1: Company
  const [manufacturerName, setManufacturerName] = useState('');
  const [website, setWebsite] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [companyOverview, setCompanyOverview] = useState('');
  const [establishedDate, setEstablishedDate] = useState('');
  const [productTypes, setProductTypes] = useState<string[]>(['Plugins', 'Samples']);
  const [userBaseEstimate, setUserBaseEstimate] = useState('');

  // 2: Products & Marketing
  const [productCatalog, setProductCatalog] = useState('');
  const [releasePlans, setReleasePlans] = useState('');
  const [videoWalkthroughs, setVideoWalkthroughs] = useState('');
  const [marketingAssets, setMarketingAssets] = useState('');
  const [nfrCopies, setNfrCopies] = useState('');

  // 3: Technical
  const [drmSystem, setDrmSystem] = useState(
    'ProducerToy Native Cloud DRM & Licensing (Machine Activation + Offline Leases)'
  );

  // 4: Business & Legal
  const [manufacturerBio, setManufacturerBio] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [fullLegalName, setFullLegalName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // 5: Contacts
  const [email, setEmail] = useState(initialEmail || '');
  const [productContactEmail, setProductContactEmail] = useState(initialEmail || '');
  const [serialsContactEmail, setSerialsContactEmail] = useState(initialEmail || '');
  const [supportContactEmail, setSupportContactEmail] = useState(initialEmail || '');
  const [accountingContactEmail, setAccountingContactEmail] = useState(initialEmail || '');
  const [partnerAreaEmails, setPartnerAreaEmails] = useState(initialEmail || '');

  // 6: Commercial
  const [paymentPreference, setPaymentPreference] = useState<'Bank Transfer' | 'PayPal'>('Bank Transfer');
  const [accountingPeriod, setAccountingPeriod] = useState(ACCOUNTING_PERIODS[0]);
  const [productListPricing, setProductListPricing] = useState(PRICING_OPTIONS[0]);

  const toggleProductType = (item: string) => {
    setProductTypes((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  const autoFillContacts = () => {
    const val = email.trim();
    if (!val) return;
    setProductContactEmail(val);
    setSerialsContactEmail(val);
    setSupportContactEmail(val);
    setAccountingContactEmail(val);
    setPartnerAreaEmails(val);
  };

  const validate = (current: number): boolean => {
    setErrorMsg('');
    if (current === 1) {
      if (!manufacturerName.trim()) return err('Enter manufacturer name');
      if (!website.trim()) return err('Enter website URL');
      if (!socialMedia.trim()) return err('Enter social media links');
      if (!companyOverview.trim()) return err('Enter company overview');
      if (!establishedDate.trim()) return err('Enter established date');
      if (productTypes.length === 0) return err('Select at least one product type');
      if (!userBaseEstimate.trim()) return err('Enter user base estimate');
    }
    if (current === 2) {
      if (!productCatalog.trim()) return err('Enter product catalog & pricing');
      if (!releasePlans.trim()) return err('Enter upcoming release plans');
      if (!videoWalkthroughs.trim()) return err('Enter video walkthrough links');
      if (!marketingAssets.trim()) return err('Enter marketing asset links');
      if (!nfrCopies.trim()) return err('Enter NFR copy access details');
    }
    if (current === 3) {
      if (!drmSystem.trim()) return err('Describe your DRM / licensing system');
    }
    if (current === 4) {
      if (!manufacturerBio.trim()) return err('Enter manufacturer biography');
      if (!logoUrl.trim()) return err('Upload your logo');
      if (!fullLegalName.trim()) return err('Enter full legal signatory name');
      if (!businessAddress.trim()) return err('Enter business address');
    }
    if (current === 5) {
      if (!email.trim() || !email.includes('@')) return err('Enter a valid primary email');
      if (!productContactEmail.trim()) return err('Enter product contact email');
      if (!serialsContactEmail.trim()) return err('Enter serials contact email');
      if (!supportContactEmail.trim()) return err('Enter customer support email');
      if (!accountingContactEmail.trim()) return err('Enter accounting email');
      if (!partnerAreaEmails.trim()) return err('Enter partner area email');
    }
    return true;
  };

  const err = (msg: string) => {
    setErrorMsg(msg);
    return false;
  };

  const nextStep = () => {
    if (validate(step)) {
      setStep((s) => Math.min(s + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(6)) return;
    if (!turnstileToken) {
      setErrorMsg('Complete security verification');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await submitSellerApplicationAction({
        manufacturerName,
        website,
        socialMedia,
        companyOverview,
        establishedDate,
        productTypes,
        userBaseEstimate,

        productCatalog,
        releasePlans,
        videoWalkthroughs,
        marketingAssets,
        nfrCopies,

        drmSystem,

        manufacturerBio,
        logoUrl,
        fullLegalName,
        businessAddress,

        email,
        productContactEmail,
        serialsContactEmail,
        supportContactEmail,
        accountingContactEmail,
        partnerAreaEmails,

        paymentPreference,
        accountingPeriod,
        productListPricing,

        turnstileToken,
      });

      if (!res.success) throw new Error(res.error || 'Submission failed');

      setReceiptNumber(res.ticketNumber || 'APP-RECEIVED');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setErrorMsg(e.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#141414] border border-[#242424] rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
            Reference #{receiptNumber}
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Application Received</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Our audio developer team reviews applications within 24–48 hours. We will reply to <span className="text-white font-mono">{email}</span>.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary px-5 py-2 text-xs uppercase font-semibold inline-block"
          >
            Go to ProducerToy
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-5 max-w-xl w-full mx-auto font-sans">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#242424] pb-3">
        <div>
          <h1 className="text-lg font-bold text-white">Seller Application</h1>
          <p className="text-xs text-zinc-400">{SECTIONS[step - 1]}</p>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {step} / 6
        </span>
      </div>

      {/* Thin Step Line */}
      <div className="grid grid-cols-6 gap-1">
        {SECTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 rounded-full transition-all duration-150 ${
              i + 1 <= step ? 'bg-white' : 'bg-[#262626]'
            }`}
          />
        ))}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Company Overview */}
        {step === 1 && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Official brand name"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Website *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Social Media Links *
              </label>
              <input
                type="text"
                required
                placeholder="Instagram, YouTube, X, SoundCloud"
                value={socialMedia}
                onChange={(e) => setSocialMedia(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Company Overview *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Brief description of your products and audio technology..."
                value={companyOverview}
                onChange={(e) => setCompanyOverview(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white transition-colors resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Established Date *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2021"
                  value={establishedDate}
                  onChange={(e) => setEstablishedDate(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  User Base Estimate *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5,000+ users"
                  value={userBaseEstimate}
                  onChange={(e) => setUserBaseEstimate(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Product Types *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRODUCT_TYPES.map((type) => {
                  const active = productTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleProductType(type)}
                      className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                        active
                          ? 'bg-white text-black border-white'
                          : 'bg-[#181818] text-zinc-400 border-[#2a2a2a] hover:border-zinc-500'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Products & Marketing */}
        {step === 2 && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Product Catalog &amp; Pricing *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Product list with pricing and URLs..."
                value={productCatalog}
                onChange={(e) => setProductCatalog(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white transition-colors resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Release Plans *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Product releases for next 3–6 months..."
                value={releasePlans}
                onChange={(e) => setReleasePlans(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white transition-colors resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Video Walkthroughs *
              </label>
              <input
                type="text"
                required
                placeholder="YouTube or demo video links"
                value={videoWalkthroughs}
                onChange={(e) => setVideoWalkthroughs(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Marketing Assets *
              </label>
              <input
                type="text"
                required
                placeholder="Press kit, audio demos, reviews"
                value={marketingAssets}
                onChange={(e) => setMarketingAssets(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                NFR Copies Access *
              </label>
              <input
                type="text"
                required
                placeholder="Download links or evaluation license details"
                value={nfrCopies}
                onChange={(e) => setNfrCopies(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 3: Technical (DRM) */}
        {step === 3 && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                DRM System Description *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe your DRM or licensing approach..."
                value={drmSystem}
                onChange={(e) => setDrmSystem(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white transition-colors resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() =>
                  setDrmSystem(
                    'ProducerToy Native Cloud DRM & Licensing (Machine Activation + Offline Leases)'
                  )
                }
                className="p-2.5 rounded-lg border border-[#2a2a2a] bg-[#181818] text-zinc-400 hover:text-white hover:border-zinc-500 text-left text-[11px]"
              >
                ProducerToy Cloud DRM
              </button>
              <button
                type="button"
                onClick={() =>
                  setDrmSystem('Pre-generated Serial Key Pool uploaded to ProducerToy')
                }
                className="p-2.5 rounded-lg border border-[#2a2a2a] bg-[#181818] text-zinc-400 hover:text-white hover:border-zinc-500 text-left text-[11px]"
              >
                Serial Key Pool
              </button>
              <button
                type="button"
                onClick={() =>
                  setDrmSystem('Live Webhook Keygen Server (API call on checkout)')
                }
                className="p-2.5 rounded-lg border border-[#2a2a2a] bg-[#181818] text-zinc-400 hover:text-white hover:border-zinc-500 text-left text-[11px]"
              >
                Live Webhook Keygen
              </button>
              <button
                type="button"
                onClick={() =>
                  setDrmSystem('DRM-Free WAV Samples & Synth Presets')
                }
                className="p-2.5 rounded-lg border border-[#2a2a2a] bg-[#181818] text-zinc-400 hover:text-white hover:border-zinc-500 text-left text-[11px]"
              >
                DRM-Free Audio
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Business & Legal */}
        {step === 4 && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Manufacturer Biography *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Brand history, sound philosophy, and mission..."
                value={manufacturerBio}
                onChange={(e) => setManufacturerBio(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white transition-colors resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Hi-Resolution Logo *
              </label>
              <DualAssetUploadInput
                label="Brand Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                assetCategory="brand-logo"
                placeholder="Upload logo (WebP optimized)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Authorized contract signatory"
                  value={fullLegalName}
                  onChange={(e) => setFullLegalName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Business Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street, City, Postal Code, Country"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Contacts */}
        {step === 5 && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={autoFillContacts}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors"
              >
                Auto-fill with Primary
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Primary Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@yourbrand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Product Specialist *
                </label>
                <input
                  type="email"
                  required
                  placeholder="products@yourbrand.com"
                  value={productContactEmail}
                  onChange={(e) => setProductContactEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Serials / Licensing *
                </label>
                <input
                  type="email"
                  required
                  placeholder="licensing@yourbrand.com"
                  value={serialsContactEmail}
                  onChange={(e) => setSerialsContactEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Customer Support *
                </label>
                <input
                  type="email"
                  required
                  placeholder="support@yourbrand.com"
                  value={supportContactEmail}
                  onChange={(e) => setSupportContactEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Accounting / Payouts *
                </label>
                <input
                  type="email"
                  required
                  placeholder="finance@yourbrand.com"
                  value={accountingContactEmail}
                  onChange={(e) => setAccountingContactEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Partner Portal Access *
                </label>
                <input
                  type="text"
                  required
                  placeholder="manager@yourbrand.com"
                  value={partnerAreaEmails}
                  onChange={(e) => setPartnerAreaEmails(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Commercial */}
        {step === 6 && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Payment Preference *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentPreference('Bank Transfer')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    paymentPreference === 'Bank Transfer'
                      ? 'bg-white text-black border-white'
                      : 'bg-[#181818] text-zinc-400 border-[#2a2a2a] hover:border-zinc-500'
                  }`}
                >
                  <Landmark className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">Bank Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentPreference('PayPal')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    paymentPreference === 'PayPal'
                      ? 'bg-white text-black border-white'
                      : 'bg-[#181818] text-zinc-400 border-[#2a2a2a] hover:border-zinc-500'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">PayPal</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Accounting Period *
              </label>
              <select
                value={accountingPeriod}
                onChange={(e) => setAccountingPeriod(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              >
                {ACCOUNTING_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Pricing Strategy *
              </label>
              <select
                value={productListPricing}
                onChange={(e) => setProductListPricing(e.target.value)}
                className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
              >
                {PRICING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-1">
              <TurnstileWidget
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setErrorMsg('');
                }}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#242424]">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn-secondary px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="btn-primary px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
