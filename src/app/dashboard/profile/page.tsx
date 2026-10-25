'use client';

import React, { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { updateBrandProfileAction } from '@/actions/brandActions';
import {
  Building2,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Mail,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Lock,
  Landmark,
} from 'lucide-react';
import DualAssetUploadInput from '@/components/DualAssetUploadInput';
import { RoleGate } from '@/components/RoleGate';
import { COUNTRIES } from '@/lib/countries';

export default function ProfilePage() {
  const { brand, user, membership, refreshBrand } = useBrand();

  const [brandName, setBrandName] = useState(brand?.name || '');
  const [websiteUrl, setWebsiteUrl] = useState(brand?.website_url || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || '');
  const [supportEmail, setSupportEmail] = useState(brand?.support_email || user?.email || '');
  const [country, setCountry] = useState(brand?.country || 'United States');
  
  // Payout Method State: Bank Transfer vs PayPal
  const [payoutMethod, setPayoutMethod] = useState<'Bank Transfer' | 'PayPal'>(
    membership?.payout_method === 'PayPal' ? 'PayPal' : 'Bank Transfer'
  );
  const [paypalId, setPaypalId] = useState(
    membership?.payout_details?.paypal_id || (membership?.payout_method === 'PayPal' ? membership?.payout_email : '') || user?.email || ''
  );
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

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showContractTerms, setShowContractTerms] = useState(false);

  const isOwner = membership?.role === 'owner';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand?.id) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (isOwner) {
        if (payoutMethod === 'PayPal') {
          if (!paypalId.trim()) {
            setErrorMsg('Please specify your PayPal ID or registered PayPal email address.');
            setSaving(false);
            return;
          }
        } else {
          if (!accountHolderName.trim()) {
            setErrorMsg('Please enter the bank account holder / beneficiary legal name.');
            setSaving(false);
            return;
          }
          if (!bankName.trim()) {
            setErrorMsg('Please enter your bank name.');
            setSaving(false);
            return;
          }
          if (!accountNumber.trim()) {
            setErrorMsg('Please enter your bank account or IBAN number.');
            setSaving(false);
            return;
          }
          if (accountNumber.trim() !== confirmAccountNumber.trim()) {
            setErrorMsg('Bank account numbers do not match. Please verify your account number.');
            setSaving(false);
            return;
          }
          if (!swiftCode.trim() && !ifscCode.trim()) {
            setErrorMsg('Please provide either a SWIFT/BIC code (for international wire) or an IFSC code.');
            setSaving(false);
            return;
          }
        }
      }

      const payoutDetails = isOwner ? (
        payoutMethod === 'PayPal'
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
            }
      ) : undefined;

      const formattedPayoutSummary = isOwner ? (
        payoutMethod === 'PayPal'
          ? paypalId.trim()
          : `${bankName.trim()} • A/C: ${accountNumber.trim()}${swiftCode.trim() ? ` • SWIFT: ${swiftCode.trim().toUpperCase()}` : ''}${ifscCode.trim() ? ` • IFSC: ${ifscCode.trim().toUpperCase()}` : ''}`
      ) : undefined;

      const result = await updateBrandProfileAction(brand.id, membership?.id, {
        brandName: brandName.trim(),
        websiteUrl: websiteUrl.trim() || null,
        description: description.trim() || null,
        logoUrl: logoUrl.trim() || null,
        supportEmail: supportEmail.trim() || null,
        country: country.trim() || null,
        payoutEmail: formattedPayoutSummary,
        payoutMethod: isOwner ? payoutMethod : undefined,
        payoutDetails,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      await refreshBrand();
      setSuccessMsg('Brand developer profile saved successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update brand profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGate allowedRoles={['owner', 'admin']} sectionName="Brand Profile Settings">
      <div className="max-w-3xl mx-auto space-y-6 font-sans">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Brand Developer Profile
          </h1>
          <p className="text-xs text-zinc-400">
            Public marketplace identity, support channels, and payout configuration for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        {successMsg && (
          <div className="p-4 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Brand Information */}
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
              <Building2 className="w-4 h-4 text-zinc-300" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Audio Brand Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Brand Identifier / Slug (Fixed)
                </label>
                <input
                  type="text"
                  disabled
                  value={brand?.slug || 'producer-toy'}
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-400 cursor-not-allowed"
                />
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
                placeholder="Upload file or enter logo URL"
                icon={Building2}
                thumbnailUrl={logoUrl}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Official Website
                </label>
                <input
                  type="url"
                  placeholder="https://yourbrand.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Operating Jurisdiction / Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.isoCode} value={c.name}>
                      {c.flag ? `${c.flag} ` : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Brand Bio & Sound Design Focus
              </label>
              <textarea
                rows={4}
                placeholder="Tell producers and sound engineers about your audio philosophy, DSP algorithms, or sampling hardware..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3.5 text-xs text-white focus:border-[#42454e] transition-colors resize-y"
              />
            </div>
          </div>

          {/* Customer Support Channel */}
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
              <Mail className="w-4 h-4 text-zinc-300" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Customer Support & Technical Inquiries
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Public Customer Support Email <span className="text-zinc-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="support@yourbrand.com"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                This email address is displayed on customer receipts and library dashboards for DAW technical assistance and licensing inquiries.
              </p>
            </div>
          </div>

          {/* Payout & Settlement Settings */}
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Settlement & Payout Configuration
                </h2>
              </div>
              {!isOwner && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Lock className="w-3 h-3" />
                  <span>Owner Only</span>
                </span>
              )}
            </div>

            {!isOwner && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  Bank settlement settings are locked. Only the <strong>Brand Owner</strong> can modify payout accounts and routing destinations.
                </span>
              </div>
            )}

            {/* Payout Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Royalty Settlement Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => setPayoutMethod('Bank Transfer')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    payoutMethod === 'Bank Transfer'
                      ? 'bg-[#1e1e1e] border-white text-white shadow-md'
                      : 'bg-[#121212] border-[#2e2e2e] text-zinc-400 hover:border-[#42454e] hover:text-zinc-200'
                  } ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                  disabled={!isOwner}
                  onClick={() => setPayoutMethod('PayPal')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    payoutMethod === 'PayPal'
                      ? 'bg-[#1e1e1e] border-white text-white shadow-md'
                      : 'bg-[#121212] border-[#2e2e2e] text-zinc-400 hover:border-[#42454e] hover:text-zinc-200'
                  } ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  PayPal ID / Email Address <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="email"
                  disabled={!isOwner}
                  required
                  placeholder="e.g. payouts@yourbrand.com or yourname@paypal.me"
                  value={paypalId}
                  onChange={(e) => setPaypalId(e.target.value)}
                  className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors ${
                    !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
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
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Beneficiary / Legal Account Holder Name <span className="text-zinc-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isOwner}
                      required
                      placeholder="Legal Name on Bank Account"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors ${
                        !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Bank Name <span className="text-zinc-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isOwner}
                      required
                      placeholder="e.g. HDFC Bank, Chase, Barclays"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors ${
                        !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Bank Account Number / IBAN <span className="text-zinc-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isOwner}
                      required
                      placeholder="Account number or international IBAN"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#42454e] transition-colors ${
                        !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Confirm Account Number / IBAN <span className="text-zinc-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isOwner}
                      required
                      placeholder="Re-enter to confirm account number"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#42454e] transition-colors ${
                        !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      SWIFT / BIC Code
                    </label>
                    <input
                      type="text"
                      disabled={!isOwner}
                      placeholder="e.g. HDFCINBB"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                      className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:border-[#42454e] transition-colors ${
                        !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">For International Wire</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      disabled={!isOwner}
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:border-[#42454e] transition-colors ${
                        !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">For Indian Bank Transfers</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Account Type
                    </label>
                    <select
                      disabled={!isOwner}
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className={`w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors ${
                        !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
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

          {/* Legal Developer Publishing Agreement Card */}
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Developer Publishing Agreement
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1e281e] text-emerald-400 border border-emerald-800/60 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />
                <span>Active &amp; Executed</span>
              </span>
            </div>

            <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">
                    ProducerToy Distribution Agreement ({brand?.contract_version || 'v1.0'})
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Executed by: <span className="text-zinc-200 font-medium">{brand?.contract_signatory_name || 'Authorized Signatory'}</span>
                    {brand?.contract_accepted_at && (
                      <> • {new Date(brand.contract_accepted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowContractTerms(!showContractTerms)}
                  className="btn-secondary text-[11px] px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showContractTerms ? 'Hide Terms' : 'View Agreement'}</span>
                  {showContractTerms ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showContractTerms && (
                <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-300 space-y-2 max-h-48 overflow-y-auto leading-relaxed">
                  <p className="font-bold text-white uppercase">Key Contract Terms:</p>
                  <p>• <strong>100% IP Ownership:</strong> Developer retains full ownership and copyrights of all DSP algorithms, binaries, sound recordings, and trademarks.</p>
                  <p>• <strong>70% / 30% Split:</strong> Developer receives 70% of net marketplace revenues remitted monthly.</p>
                  <p>• <strong>Warranty:</strong> Developer certifies all software code, samples, and artwork are original and non-infringing.</p>
                  <p>• <strong>Support:</strong> Developer provides legitimate customer technical support via registered support email.</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg uppercase tracking-wider"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </RoleGate>
  );
}

