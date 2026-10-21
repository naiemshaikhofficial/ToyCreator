'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { createBrandProduct } from '@/lib/supabase/actions';
import {
  ArrowLeft,
  Package,
  DollarSign,
  Cpu,
  FileCode,
  Loader2,
  AlertCircle,
  Plus,
  Monitor,
  Download,
  HardDrive,
  Video,
  FileText,
  Image as ImageIcon,
  Key,
  Eye,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Details', icon: FileText, desc: 'Title & Pricing' },
  { id: 2, label: 'Media', icon: ImageIcon, desc: 'Artwork & Demos' },
  { id: 3, label: 'Installers', icon: HardDrive, desc: 'Files & DAWs' },
  { id: 4, label: 'Licensing', icon: Key, desc: 'Seats & Specs' },
  { id: 5, label: 'Publish', icon: Eye, desc: 'Review & Live' },
];

export default function NewProductPage() {
  const router = useRouter();
  const { brand } = useBrand();

  const [activeStep, setActiveStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [productType, setProductType] = useState('plugin');
  const [priceUsd, setPriceUsd] = useState('29.00');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('49.00');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [demoAudioUrl, setDemoAudioUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadUrlWin, setDownloadUrlWin] = useState('');
  const [downloadUrlMac, setDownloadUrlMac] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [vstFormat, setVstFormat] = useState('VST3, AU, AAX (64-bit)');
  const [operatingSystem, setOperatingSystem] = useState('macOS (Apple Silicon & Intel), Windows 10/11');
  const [supportedDaws, setSupportedDaws] = useState('Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase');
  const [pluginIdentifier, setPluginIdentifier] = useState('');
  const [maxSeats, setMaxSeats] = useState(3);
  const [offlineGraceDays, setOfflineGraceDays] = useState(14);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);

    if (brand?.slug) {
      setPluginIdentifier(`com.${brand.slug}.${generatedSlug}`);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product title is required.');
      setActiveStep(1);
      return;
    }
    if (!brand?.id) {
      setErrorMsg('Authorized brand not detected. Please sign in with a registered brand.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload: any = {
        name: name.trim(),
        slug: slug.trim(),
        brand_id: brand.id,
        product_type: productType,
        price_usd: parseFloat(priceUsd) || 0,
        original_price_usd: originalPriceUsd ? parseFloat(originalPriceUsd) : null,
        short_description: shortDesc.trim() || null,
        full_description: fullDesc.trim() || null,
        cover_image: coverImage.trim() || null,
        demo_audio_url: demoAudioUrl.trim() || null,
        download_url: downloadUrl.trim() || null,
        download_url_win: downloadUrlWin.trim() || null,
        download_url_mac: downloadUrlMac.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        file_size: fileSize.trim() || null,
        vst_format: productType === 'plugin' ? vstFormat.trim() : null,
        operating_system: operatingSystem.trim() || null,
        supported_daws: supportedDaws.trim() || null,
        plugin_identifier: productType === 'plugin' && pluginIdentifier ? pluginIdentifier.trim() : null,
        max_activation_seats: productType === 'plugin' ? Number(maxSeats) : 1,
        offline_grace_days: productType === 'plugin' ? Number(offlineGraceDays) : 14,
        is_active: isActive,
        is_featured: false,
      };

      const created = await createBrandProduct(payload);
      if (created?.id) {
        router.push(`/dashboard/products/${created.id}`);
      } else {
        router.push('/dashboard/products');
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      setErrorMsg(err.message || 'Failed to save product in database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            New Audio Product
          </h1>
          <p className="text-xs text-zinc-400">
            Publish a new plugin, sound pack, or preset bank under {brand?.name || 'your brand'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Publish Product</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* YouTube Studio Style Stepper Bar */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-2 sm:p-3">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map((step) => {
            const isCurrent = activeStep === step.id;
            const isDone = activeStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`relative flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 p-2 sm:px-3 sm:py-2.5 rounded-xl transition-all text-left ${
                  isCurrent
                    ? 'bg-[#222222] text-white shadow-sm border border-[#34363d]'
                    : isDone
                    ? 'text-zinc-300 hover:bg-[#1a1a1a]'
                    : 'text-zinc-500 hover:text-zinc-400 hover:bg-[#181818]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold ${
                    isCurrent
                      ? 'bg-white text-black'
                      : isDone
                      ? 'bg-[#282828] text-zinc-300'
                      : 'bg-[#181818] text-zinc-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <span className="block text-xs font-semibold truncate leading-tight">
                    {step.label}
                  </span>
                  <span className="hidden sm:block text-[10px] text-zinc-400 truncate">
                    {step.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stepped Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Details & Pricing */}
        {activeStep === 1 && (
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Basic Info & Pricing
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">Step 1 of 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ProVerb Algorithmic Reverb"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Storefront URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. proverb"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Product Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'plugin', label: 'Audio Plugin (VST)' },
                  { id: 'sample_pack', label: 'Sample Library' },
                  { id: 'preset', label: 'Synth Presets' },
                  { id: 'template', label: 'DAW Template' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setProductType(type.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                      productType === type.id
                        ? 'bg-[#222222] border-white text-white'
                        : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Selling Price (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Original / Regular Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPriceUsd}
                    onChange={(e) => setOriginalPriceUsd(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Short Tagline
              </label>
              <input
                type="text"
                placeholder="Next-gen studio plate and hall reverb"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Full Description & Highlights
              </label>
              <textarea
                rows={5}
                placeholder="Include features, DSP algorithms, factory presets, and sound character..."
                value={fullDesc}
                onChange={(e) => setFullDesc(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3.5 text-xs text-white focus:border-[#42454e] transition-colors resize-y leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Media & Previews */}
        {activeStep === 2 && (
          <div className="toy-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Artwork & Audio/Video Demos
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">Step 2 of 5</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Square Cover Image URL (600x600 recommended)
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-20 h-20 rounded-xl bg-[#121212] border border-[#2a2a2a] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = '/icon.png';
                      }}
                    />
                  ) : (
                    <Package className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <input
                    type="url"
                    placeholder="https://.../cover.png or /products/proverb.png"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                  <p className="text-[11px] text-zinc-400">
                    High-quality artwork displayed across all marketplace cards and detail pages.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#262626] space-y-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Demo Audio Preview URL (.mp3)
              </label>
              <input
                type="url"
                placeholder="https://.../audio/demo-track.mp3"
                value={demoAudioUrl}
                onChange={(e) => setDemoAudioUrl(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
              <p className="text-[11px] text-zinc-400">
                Powers the instant audio player on the product page.
              </p>
            </div>

            <div className="pt-3 border-t border-[#262626] space-y-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-zinc-400" />
                <span>YouTube Walkthrough Demo URL</span>
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Installers & Specs */}
        {activeStep === 3 && (
          <div className="toy-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Download Files & System Specs
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">Step 3 of 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Windows Installer (.exe / .zip)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://.../Setup-Win-x64.exe"
                  value={downloadUrlWin}
                  onChange={(e) => setDownloadUrlWin(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>macOS Installer (.pkg / .dmg)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://.../Universal-macOS.pkg"
                  value={downloadUrlMac}
                  onChange={(e) => setDownloadUrlMac(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262626]">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Universal / Presets Archive URL
                </label>
                <input
                  type="url"
                  placeholder="https://.../presets.zip"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Download Archive File Size
                </label>
                <input
                  type="text"
                  placeholder="e.g. 450 MB or 1.2 GB"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262626]">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Operating System Requirements
                </label>
                <input
                  type="text"
                  value={operatingSystem}
                  onChange={(e) => setOperatingSystem(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Supported DAWs
                </label>
                <input
                  type="text"
                  value={supportedDaws}
                  onChange={(e) => setSupportedDaws(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Licensing & Specs */}
        {activeStep === 4 && (
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Licensing & Machine Seats
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">Step 4 of 5</span>
            </div>

            {productType === 'plugin' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Plugin Formats
                    </label>
                    <input
                      type="text"
                      value={vstFormat}
                      onChange={(e) => setVstFormat(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Identifier (Reverse Domain)
                    </label>
                    <input
                      type="text"
                      value={pluginIdentifier}
                      onChange={(e) => setPluginIdentifier(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Max Machine Activation Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={maxSeats}
                      onChange={(e) => setMaxSeats(parseInt(e.target.value) || 3)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Offline Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={offlineGraceDays}
                      onChange={(e) => setOfflineGraceDays(parseInt(e.target.value) || 14)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-zinc-400">
                  You can upload automated license serial key batches immediately after saving this product.
                </div>
              </>
            ) : (
              <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl text-xs text-zinc-400">
                Sample libraries and preset banks do not require machine seat licensing. Customers will receive immediate secure download links after purchase.
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Review & Publish */}
        {activeStep === 5 && (
          <div className="toy-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Review & Catalog Visibility
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">Step 5 of 5</span>
            </div>

            {/* Visibility Toggle */}
            <div className="bg-[#121212] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Catalog Status: {isActive ? 'Live Immediately' : 'Save as Draft'}
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Publish to the ProducerToy marketplace catalog upon creation
                </p>
              </div>

              <input
                type="checkbox"
                id="isActiveCreate"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded bg-[#181818] border-[#34363d] text-[#34363d] focus:ring-zinc-600 cursor-pointer"
              />
            </div>

            {/* Summary Box */}
            <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Summary Preview
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Title:</span>
                  <span className="text-white font-medium">{name || 'Untitled'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Selling Price:</span>
                  <span className="text-white font-mono font-bold">${priceUsd || '0.00'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Category:</span>
                  <span className="text-zinc-300 capitalize">{productType.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Brand:</span>
                  <span className="text-zinc-300">{brand?.name || 'Registered Brand'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#222222]">
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeStep < 5 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Continue: {STEPS[activeStep]?.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
