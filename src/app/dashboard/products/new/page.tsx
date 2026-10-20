'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { createBrandProduct } from '@/lib/supabase/actions';
import {
  ArrowLeft,
  Sparkles,
  Package,
  DollarSign,
  Cpu,
  Layers,
  KeyRound,
  FileCode,
  Loader2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const { brand } = useBrand();

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
  const [vstFormat, setVstFormat] = useState('VST3, AU, AAX (64-bit)');
  const [operatingSystem, setOperatingSystem] = useState('macOS (Apple Silicon & Intel), Windows 10/11');
  const [supportedDaws, setSupportedDaws] = useState('Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase');
  const [pluginIdentifier, setPluginIdentifier] = useState('');
  const [maxSeats, setMaxSeats] = useState(3);
  const [offlineGraceDays, setOfflineGraceDays] = useState(14);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate slug and plugin identifier from name
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product title is required.');
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
        vst_format: productType === 'plugin' ? vstFormat.trim() : null,
        operating_system: operatingSystem.trim() || null,
        supported_daws: supportedDaws.trim() || null,
        plugin_identifier: productType === 'plugin' && pluginIdentifier ? pluginIdentifier.trim() : null,
        max_activation_seats: productType === 'plugin' ? Number(maxSeats) : 1,
        offline_grace_days: productType === 'plugin' ? Number(offlineGraceDays) : 14,
        is_active: isActive,
        is_featured: false,
      };

      await createBrandProduct(payload);
      router.push('/dashboard/products');
    } catch (err: any) {
      console.error('Error creating product:', err);
      setErrorMsg(err.message || 'Failed to save product in Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
        <div className="mt-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Publish New Audio Product
          </h1>
          <p className="text-xs text-zinc-400">
            Publishing under <span className="text-white font-semibold">{brand?.name || 'Producer Toy'}</span>
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Product Information */}
        <div className="toy-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
            <Package className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Product Title <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ProVerb Algorithmic Reverb, 808 Heatwave"
                value={name}
                onChange={handleNameChange}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                URL Slug <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="proverb-algorithmic-reverb"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Product Type <span className="text-indigo-400">*</span>
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
              >
                <option value="plugin">Audio Plugin (VST/AU/AAX)</option>
                <option value="sample_pack">Sample Pack & Loops</option>
                <option value="preset">Synth Presets (Serum, Diva)</option>
                <option value="template">DAW Project Template</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Price (USD) <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="29.00 (Enter 0 for Free)"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono text-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Original Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="49.00 (Optional strike-through)"
                  value={originalPriceUsd}
                  onChange={(e) => setOriginalPriceUsd(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono text-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Short Summary Description
            </label>
            <input
              type="text"
              placeholder="Crisp 1-sentence product summary displayed in marketplace store cards..."
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Full Product Description & Documentation
            </label>
            <textarea
              rows={5}
              placeholder="Detailed audio engine features, technical specifications, installation guide..."
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3.5 text-xs text-white focus:border-indigo-500 transition-colors resize-y"
            />
          </div>
        </div>

        {/* Section 2: Audio Plugin Architecture & Licensing (Shown for plugins) */}
        {productType === 'plugin' && (
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                VST Architecture & Hardware Licensing
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Plugin Identifier (Reverse DNS)
                </label>
                <input
                  type="text"
                  placeholder="com.brand.pluginname"
                  value={pluginIdentifier}
                  onChange={(e) => setPluginIdentifier(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 focus:border-indigo-500 transition-colors"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Used by the ProducerToy licensing server for hardware challenge-response pairing
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Supported Plugin Formats
                </label>
                <input
                  type="text"
                  value={vstFormat}
                  onChange={(e) => setVstFormat(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Max Activation Seats per Customer
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(parseInt(e.target.value) || 3)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-indigo-500 transition-colors"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Number of studio computers a customer can simultaneously activate
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Offline Grace Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={offlineGraceDays}
                  onChange={(e) => setOfflineGraceDays(parseInt(e.target.value) || 14)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-indigo-500 transition-colors"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Days plugin can run on customer machine without phone-home verification
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Supported DAWs
              </label>
              <input
                type="text"
                value={supportedDaws}
                onChange={(e) => setSupportedDaws(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Section 3: Media & Distribution URLs */}
        <div className="toy-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
            <FileCode className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Media & Distribution Links
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Cover Image URL
              </label>
              <input
                type="url"
                placeholder="https://.../cover.png or /Icon.webp"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Demo Audio Preview URL
              </label>
              <input
                type="url"
                placeholder="https://.../demo-track.mp3"
                value={demoAudioUrl}
                onChange={(e) => setDemoAudioUrl(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Secure Download File / Cloud Link
            </label>
            <input
              type="url"
              placeholder="https://... (Google Drive, Cloudflare R2, or S3 secure link)"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Provided securely to verified customers after completed purchase
            </span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded bg-[#121212] border-[#2e2e2e] text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-xs text-zinc-300 font-medium cursor-pointer">
              Publish immediately to ProducerToy Marketplace catalog
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/products"
            className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-accent px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing to Database...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
