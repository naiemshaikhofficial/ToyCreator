'use client';

import React, { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { completeBrandOnboardingAction } from '@/actions/brandActions';
import {
  Building2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  CreditCard,
  Globe,
  AlertCircle,
  HelpCircle,
  LogOut,
  Sparkles,
  Lock,
  Landmark,
} from 'lucide-react';
import DualAssetUploadInput from '@/components/DualAssetUploadInput';

interface BrandOnboardingWizardProps {
  onCompleted?: () => void;
}

const ONBOARDING_STEPS = [
  { id: 1, label: 'Brand Profile', desc: 'Identity & Studio Logo', icon: Building2 },
  { id: 2, label: 'Support & Payout', desc: 'Buyer Support & Settlement', icon: Mail },
  { id: 3, label: 'Legal Agreement', desc: 'Developer Distribution Contract', icon: FileText },
];

import { COUNTRIES } from '@/lib/countries';

export function BrandOnboardingWizard({ onCompleted }: BrandOnboardingWizardProps) {
  const { brand, membership, user, signOut, refreshBrand } = useBrand();

  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1: Brand Profile
  const [brandName, setBrandName] = useState(brand?.name || '');
  const [brandSlug, setBrandSlug] = useState(brand?.slug || '');
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [websiteUrl, setWebsiteUrl] = useState(brand?.website_url || '');

  // STEP 2: Support & Operations
  const [supportEmail, setSupportEmail] = useState(brand?.support_email || user?.email || '');
  const [country, setCountry] = useState(brand?.country || 'United States');
  const [payoutMethod, setPayoutMethod] = useState<'Bank Transfer' | 'PayPal'>(
    membership?.payout_method === 'PayPal' ? 'PayPal' : 'Bank Transfer'
  );
  // PayPal state
  const [paypalId, setPaypalId] = useState(
    membership?.payout_details?.paypal_id || (membership?.payout_method === 'PayPal' ? membership?.payout_email : '') || user?.email || ''
  );
  // Bank Transfer states
  const [accountHolderName, setAccountHolderName] = useState(
    membership?.payout_details?.account_holder_name || brand?.name || ''
  );
  const [bankName, setBankName] = useState(
    membership?.payout_details?.bank_name || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    membership?.payout_details?.account_number || ''
  );
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(
    membership?.payout_details?.account_number || ''
  );
  const [swiftCode, setSwiftCode] = useState(
    membership?.payout_details?.swift_code || ''
  );
  const [ifscCode, setIfscCode] = useState(
    membership?.payout_details?.ifsc_code || ''
  );
  const [accountType, setAccountType] = useState(
    membership?.payout_details?.account_type || 'Checking / Current'
  );

  // STEP 3: Legal Contract Execution
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('Founder / Audio Developer');
  const [contractAgreed, setContractAgreed] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate slug when name changes (if brand has default slug)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBrandName(val);
    if (!brand?.slug || brand.slug.startsWith('temp-') || brand.slug === 'producer-toy') {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setBrandSlug(generated);
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    setErrorMsg('');
    if (stepNumber === 1) {
      if (!brandName.trim()) {
        setErrorMsg('Please enter your audio brand or studio name.');
        return false;
      }
      if (!brandSlug.trim()) {
        setErrorMsg('Please specify a unique brand slug/handle.');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (!supportEmail.trim() || !supportEmail.includes('@')) {
        setErrorMsg('A valid customer support email is required for buyer technical inquiries.');
        return false;
      }
      if (payoutMethod === 'PayPal') {
        if (!paypalId.trim()) {
          setErrorMsg('Please specify your PayPal ID or registered PayPal email address.');
          return false;
        }
      } else {
        if (!accountHolderName.trim()) {
          setErrorMsg('Please enter the bank account holder / beneficiary legal name.');
          return false;
        }
        if (!bankName.trim()) {
          setErrorMsg('Please enter your bank name.');
          return false;
        }
        if (!accountNumber.trim()) {
          setErrorMsg('Please enter your bank account or IBAN number.');
          return false;
        }
        if (accountNumber.trim() !== confirmAccountNumber.trim()) {
          setErrorMsg('Bank account numbers do not match. Please verify your account number.');
          return false;
        }
        if (!swiftCode.trim() && !ifscCode.trim()) {
          setErrorMsg('Please provide either a SWIFT/BIC code (for international wire) or an IFSC code.');
          return false;
        }
      }
      return true;
    }

    if (stepNumber === 3) {
      if (!signatoryName.trim()) {
        setErrorMsg('Please provide your full legal name as the authorized digital signatory.');
        return false;
      }
      if (!contractAgreed) {
        setErrorMsg('You must review and accept the ProducerToy Developer Distribution Agreement to proceed.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompleteSetup = async () => {
    if (!brand?.id) {
      setErrorMsg('Brand profile session invalid. Please refresh or contact support.');
      return;
    }

    if (!validateStep(3)) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payoutDetails = payoutMethod === 'PayPal'
        ? {
            method: 'PayPal',
            paypal_id: paypalId.trim(),
          }
        : {
            method: 'Bank Transfer',
            account_holder_name: accountHolderName.trim(),
            bank_name: bankName.trim(),
            account_number: accountNumber.trim(),
            swift_code: swiftCode.trim().toUpperCase(),
            ifsc_code: ifscCode.trim().toUpperCase(),
            account_type: accountType,
          };

      const formattedPayoutSummary = payoutMethod === 'PayPal'
        ? paypalId.trim()
        : `${bankName.trim()} • A/C: ${accountNumber.trim()}${swiftCode.trim() ? ` • SWIFT: ${swiftCode.trim().toUpperCase()}` : ''}${ifscCode.trim() ? ` • IFSC: ${ifscCode.trim().toUpperCase()}` : ''}`;

      const res = await completeBrandOnboardingAction({
        brandId: brand.id,
        membershipId: membership?.id,
        brandName: brandName.trim(),
        brandSlug: brandSlug.trim(),
        logoUrl: logoUrl.trim() || null,
        description: description.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        supportEmail: supportEmail.trim(),
        country: country.trim(),
        payoutMethod,
        payoutEmail: formattedPayoutSummary,
        payoutDetails,
        signatoryName: signatoryName.trim(),
        signatoryTitle: signatoryTitle.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to complete onboarding.');
      }

      // Success! Refresh brand context to unlock dashboard
      await refreshBrand();
      if (onCompleted) {
        onCompleted();
      }
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setErrorMsg(err.message || 'An error occurred while saving your brand agreement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="border-b border-[#222222] bg-[#141414] px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="Toy Creator Emblem"
                className="w-7 h-7 object-contain"
              />
            </picture>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white uppercase">
                Toy Creator
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#242424] text-zinc-300 border border-zinc-700/60 uppercase tracking-wider">
                Brand Setup
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs text-zinc-400">
              Account: <strong className="text-zinc-200 font-mono">{user?.email}</strong>
            </span>
            <button
              onClick={() => signOut()}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 sm:py-10 flex-1">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2">
            {ONBOARDING_STEPS.map((step) => {
              const isCurrent = currentStep === step.id;
              const isDone = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    isCurrent
                      ? 'bg-[#1a1a1a] border-zinc-600 shadow-md'
                      : isDone
                      ? 'bg-[#151515] border-zinc-800/80 text-zinc-300'
                      : 'bg-[#131313] border-zinc-900 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                        isCurrent
                          ? 'bg-white text-black'
                          : isDone
                          ? 'bg-zinc-800 text-zinc-200'
                          : 'bg-zinc-900 text-zinc-600'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-zinc-200" /> : step.id}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-white' : isDone ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  <p className="hidden sm:block text-[11px] text-zinc-400 truncate">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Brand Profile Setup */}
        {currentStep === 1 && (
          <div className="toy-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#262626] pb-4">
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                Step 1 of 3 • Public Marketplace Identity
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                Configure Brand Developer Profile
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                This identity represents your brand across ProducerToy catalog pages, audio player cards, and customer receipts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Brand / Studio Name <span className="text-zinc-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sonic Pulse DSP"
                    value={brandName}
                    onChange={handleNameChange}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Brand URL Handle / Slug <span className="text-zinc-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sonic-pulse-dsp"
                    value={brandSlug}
                    onChange={(e) => setBrandSlug(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 focus:border-[#42454e] transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Catalog URL: producertoy.com/brands/{brandSlug || 'your-brand'}
                  </p>
                </div>
              </div>

              {/* Logo Upload Dual Input */}
              <div className="pt-2">
                <DualAssetUploadInput
                  label="Brand Square Logo"
                  info="512×512 px square PNG, SVG, or WebP recommended"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  assetCategory="cover"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  placeholder="Upload logo or enter URL (e.g. https://.../logo.png)"
                  icon={Building2}
                  thumbnailUrl={logoUrl}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Official Website or Portfolio
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    placeholder="https://yourbrand.com or https://soundcloud.com/..."
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Brand Bio &amp; Sound Philosophy
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your audio DSP vision, sampling techniques, or studio specialty..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl p-3.5 text-xs text-white focus:border-[#42454e] transition-colors resize-y leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#262626]">
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 uppercase tracking-wider shadow-lg"
              >
                <span>Continue to Support Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Support & Operations Setup */}
        {currentStep === 2 && (
          <div className="toy-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#262626] pb-4">
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                Step 2 of 3 • Customer Inquiries & Settlements
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                Support &amp; Payout Information
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configure your public customer support channel and payout destination for monthly revenue share distributions.
              </p>
            </div>

            <div className="space-y-5">
              {/* Customer Support Email */}
              <div className="p-4 bg-[#181818] border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Customer Support Email Channel <span className="text-zinc-400">*</span>
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  When producers purchase your audio software or sound packs, this email address is provided on their invoice and library dashboard for technical inquiries, DAW compatibility assistance, or sound design questions.
                </p>
                <input
                  type="email"
                  required
                  placeholder="support@yourbrand.com or developer@yourbrand.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              {/* Operating Country / Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Operating Country / Jurisdiction
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.isoCode} value={c.name}>
                        {c.flag ? `${c.flag} ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Settlement Payout Method Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Royalty Payout Destination <span className="text-zinc-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('Bank Transfer')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      payoutMethod === 'Bank Transfer'
                        ? 'bg-[#1e1e1e] border-white text-white shadow-md'
                        : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:border-[#42454e] hover:text-zinc-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${payoutMethod === 'Bank Transfer' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-zinc-400'}`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">Bank Transfer</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Direct Wire / SWIFT / IFSC Account</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod('PayPal')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      payoutMethod === 'PayPal'
                        ? 'bg-[#1e1e1e] border-white text-white shadow-md'
                        : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:border-[#42454e] hover:text-zinc-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${payoutMethod === 'PayPal' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-zinc-400'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">PayPal</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Instant PayPal Account Settlement</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Payout Form Fields */}
              {payoutMethod === 'PayPal' ? (
                <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl space-y-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    PayPal ID / Email Address <span className="text-zinc-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. payouts@yourbrand.com or yourname@paypal.me"
                    value={paypalId}
                    onChange={(e) => setPaypalId(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500">
                    ProducerToy will automatically disburse monthly royalties (70% net revenue) directly to this PayPal account.
                  </p>
                </div>
              ) : (
                <div className="p-4 sm:p-5 bg-[#141414] border border-[#262626] rounded-xl space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-[#242424] pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Landmark className="w-3.5 h-3.5 text-zinc-400" />
                      Bank Account Settlement Details
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Enter your official bank details. Wire and domestic transfers are processed monthly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Beneficiary / Legal Account Holder Name <span className="text-zinc-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Legal Name on Bank Account"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Bank Name <span className="text-zinc-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC Bank, Chase, Barclays"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Bank Account Number / IBAN <span className="text-zinc-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Account number or international IBAN"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#42454e] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Confirm Account Number / IBAN <span className="text-zinc-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Re-enter to confirm account number"
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value)}
                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#42454e] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        SWIFT / BIC Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFCINBB"
                        value={swiftCode}
                        onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:border-[#42454e] transition-colors"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">For International Wire</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:border-[#42454e] transition-colors"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">For Indian Bank Transfers</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Account Type
                      </label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                      >
                        <option value="Checking / Current">Checking / Current</option>
                        <option value="Savings">Savings</option>
                        <option value="Business Account">Business Account</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 uppercase tracking-wider shadow-lg"
              >
                <span>Review Legal Agreement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Legal Developer Distribution Agreement */}
        {currentStep === 3 && (
          <div className="toy-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#262626] pb-4">
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                Step 3 of 3 • Legal Publishing Contract
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                Developer Distribution Agreement
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Formal legal terms granting ProducerToy non-exclusive digital distribution rights while retaining 100% of your intellectual property.
              </p>
            </div>

            {/* Scrollable Legal Contract Box */}
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 max-h-72 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
              <div className="border-b border-zinc-800 pb-3">
                <p className="font-bold text-white uppercase tracking-wider">
                  ProducerToy Audio Developer Publishing &amp; Distribution Agreement
                </p>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Standard Contract Version 1.0 • Legally Binding Electronic Instrument
                </p>
              </div>

              <div className="space-y-3 text-[11px]">
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider">1. Grant of Non-Exclusive Distribution Rights</h4>
                  <p className="text-zinc-400 mt-0.5">
                    Developer hereby grants to ProducerToy a worldwide, non-exclusive, revocable license to market, promote, digitally distribute, host, and deliver Developer's audio plugins, digital sound libraries, and associated metadata to verified end-users through the ProducerToy platform.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider">2. Intellectual Property Retention (100% Creator Owned)</h4>
                  <p className="text-zinc-400 mt-0.5">
                    Developer expressly retains 100% ownership, copyright, title, patents, and all intellectual property rights in and to all DSP algorithms, source code, audio recordings, impulse responses, factory presets, artwork, and trademarks. Nothing in this Agreement transfers proprietary ownership of any audio asset to ProducerToy.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider">3. Revenue Split &amp; Remittance Schedule</h4>
                  <p className="text-zinc-400 mt-0.5">
                    Sales proceeds generated from end-user license purchases of Developer's catalog shall be remitted on the standard distribution split: seventy percent (70%) of net transaction revenues to Developer, and thirty percent (30%) retained by ProducerToy as platform distribution and hosting fee. Net distributions are settled on a scheduled calendar cycle directly to Developer's nominated payout account.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider">4. Warranty of Originality &amp; Non-Infringement</h4>
                  <p className="text-zinc-400 mt-0.5">
                    Developer warrants and represents that all published materials, audio waveforms, sample libraries, and DSP software binaries are original works of Developer or duly licensed from rightful rights holders. Developer certifies that catalog items do not infringe any third-party patent, copyright, trade secret, or trademark.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider">5. Buyer Support Obligations</h4>
                  <p className="text-zinc-400 mt-0.5">
                    Developer agrees to maintain the designated customer support email channel ({supportEmail || 'provided above'}) to address legitimate end-user technical inquiries, software bugs, or licensing issues within reasonable industry turnaround times.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider">6. Takedown &amp; Termination</h4>
                  <p className="text-zinc-400 mt-0.5">
                    Either party may terminate this digital distribution arrangement upon written notification. Upon takedown, public storefront listings will be removed while existing purchasers retain lawful redownload access to their previously purchased perpetual licenses.
                  </p>
                </div>
              </div>
            </div>

            {/* Digital Signature & Acceptance */}
            <div className="p-5 bg-[#181818] border border-zinc-800 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-300" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Electronic Execution &amp; Signature
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Authorized Signatory Full Legal Name <span className="text-zinc-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johnathan Doe"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Corporate Title / Authority
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Founder, CEO, Principal Developer"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer pt-2 select-none group">
                <input
                  type="checkbox"
                  checked={contractAgreed}
                  onChange={(e) => setContractAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#34363d] bg-[#121212] text-white focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors leading-relaxed">
                  I confirm that I am legally authorized to execute agreements on behalf of <strong className="text-white">{brandName || 'this Brand'}</strong>. I have read, understood, and formally agree to the ProducerToy Developer Publishing &amp; Distribution Agreement (v1.0).
                </span>
              </label>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
              <button
                type="button"
                onClick={handlePrev}
                disabled={submitting}
                className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 uppercase tracking-wider disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleCompleteSetup}
                disabled={submitting || !contractAgreed || !signatoryName.trim()}
                className="btn-primary px-7 py-3 rounded-xl text-xs font-bold flex items-center gap-2 uppercase tracking-wider shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Contract &amp; Initializing Dashboard...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Accept Agreement &amp; Unlock Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-500 py-4 border-t border-zinc-800/50">
        Producer Toy Inc. • Audio Developer Publishing &amp; Distribution
      </footer>
    </div>
  );
}
