'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { createBrandProduct, getCatalogCategories } from '@/lib/supabase/actions';
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
  Info,
  Tag,
  Music,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import DualAssetUploadInput from '@/components/DualAssetUploadInput';
import { RoleGate } from '@/components/RoleGate';

const PRESET_GENRES = [
  'Hip Hop',
  'Trap',
  'Drill',
  'Bollywood',
  'Lo-Fi',
  'EDM',
  'Pop',
  'Cinematic',
  'R&B',
  'Rock',
  'Acoustic',
  'Ambient',
];

function FormLabel({
  label,
  info,
  icon: Icon,
}: {
  label: string;
  info?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />}
      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
        {label}
      </label>
      {info && (
        <div className="relative group/info flex items-center flex-shrink-0">
          <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/info:block z-30 w-56 p-2 rounded-lg bg-[#1e1e1e] border border-zinc-700 text-[11px] font-normal normal-case text-zinc-200 shadow-2xl pointer-events-none text-left leading-relaxed">
            {info}
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Dynamic Catalog Categories, Subcategories & Genres
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState('');

  // Pricing & Descriptions
  const [priceUsd, setPriceUsd] = useState('29.00');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('49.00');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');

  // Media
  const [coverImage, setCoverImage] = useState('');
  const [demoAudioUrl, setDemoAudioUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Files & Downloads
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadUrlWin, setDownloadUrlWin] = useState('');
  const [downloadUrlMac, setDownloadUrlMac] = useState('');
  const [fileSize, setFileSize] = useState('');

  // Release Info & Specs
  const [version, setVersion] = useState('1.0.0');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear().toString());
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [publisher, setPublisher] = useState(brand?.name || 'Producer Toy');
  const [licenseType, setLicenseType] = useState('Royalty-Free Commercial');
  const [changelog, setChangelog] = useState('');
  const [vstFormat, setVstFormat] = useState('VST3, AU, AAX (64-bit)');
  const [operatingSystem, setOperatingSystem] = useState('macOS (Apple Silicon & Intel), Windows 10/11');
  const [supportedDaws, setSupportedDaws] = useState('Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase');
  const [pluginIdentifier, setPluginIdentifier] = useState('');

  // Licensing & Machine Seats
  const [maxSeats, setMaxSeats] = useState(3);
  const [offlineGraceDays, setOfflineGraceDays] = useState(14);
  const [licenseDeliveryType, setLicenseDeliveryType] = useState<'pool' | 'direct_download'>('pool');

  // Visibility & Referral
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [buttonText, setButtonText] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load catalog categories & subcategories from Supabase
  useEffect(() => {
    async function loadCatalog() {
      const { categories, subcategories } = await getCatalogCategories();
      setCategoriesList(categories);
      setSubcategoriesList(subcategories);

      const defaultCat = categories.find((c) => c.slug === 'plugin') || categories[0];
      if (defaultCat) {
        setCategoryId(defaultCat.id);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    if (brand?.name && (!publisher || publisher === 'Producer Toy')) {
      setPublisher(brand.name);
    }
  }, [brand?.name]);

  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId);
    setSubcategoryId('');
    const cat = categoriesList.find((c) => c.id === catId);
    if (cat?.slug === 'sample-pack') {
      setProductType('sample_pack');
      setLicenseDeliveryType('direct_download');
    } else if (cat?.slug === 'plugin') {
      setProductType('plugin');
      setLicenseDeliveryType('pool');
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (!trimmed) return;
    if (!selectedGenres.includes(trimmed)) {
      setSelectedGenres((prev) => [...prev, trimmed]);
    }
    setCustomGenre('');
  };

  const handleRemoveGenre = (genre: string) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== genre));
  };

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
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        category_slugs: selectedGenres.length > 0 ? selectedGenres : null,
        price_usd: parseFloat(priceUsd) || 0,
        original_price_usd: originalPriceUsd ? parseFloat(originalPriceUsd) : null,
        external_url: externalUrl.trim() || null,
        button_text: buttonText.trim() || null,
        short_description: shortDesc.trim() || null,
        full_description: fullDesc.trim() || null,
        cover_image: coverImage.trim() || null,
        demo_audio_url: demoAudioUrl.trim() || null,
        download_url: downloadUrl.trim() || null,
        download_url_win: downloadUrlWin.trim() || null,
        download_url_mac: downloadUrlMac.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        file_size: fileSize.trim() || null,
        version: version.trim() || '1.0.0',
        release_year: releaseYear.trim() || null,
        release_date: releaseDate.trim() || null,
        publisher: publisher.trim() || brand.name || null,
        license_type: licenseType.trim() || null,
        license_delivery_type: licenseDeliveryType,
        changelog: changelog.trim() || null,
        vst_format: productType === 'plugin' ? vstFormat.trim() : null,
        operating_system: operatingSystem.trim() || null,
        supported_daws: supportedDaws.trim() || null,
        plugin_identifier: productType === 'plugin' && pluginIdentifier ? pluginIdentifier.trim() : null,
        max_activation_seats: productType === 'plugin' ? Number(maxSeats) : 1,
        offline_grace_days: productType === 'plugin' ? Number(offlineGraceDays) : 14,
        delivery_method: licenseDeliveryType === 'direct_download' ? 'direct_download' : 'serial_key',
        is_active: isActive,
        is_featured: isFeatured,
        is_coming_soon: isComingSoon,
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
    <RoleGate allowedRoles={['owner', 'admin', 'developer']} sectionName="Product Publisher">
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
                <FormLabel label="Product Title *" />
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
                <FormLabel
                  label="Storefront URL Slug"
                  info="Auto-generated URL path on producertoy.com"
                />
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

            {/* Category & Subcategory Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel
                  label="Category *"
                  info="Choose the primary marketplace category for your product"
                  icon={Package}
                />
                <div className="grid grid-cols-2 gap-2">
                  {(categoriesList.length > 0 ? categoriesList : [
                    { id: '67acb330-6687-4a5b-bfb7-2bbf911c0967', name: 'Audio Plugin', slug: 'plugin' },
                    { id: 'a3333333-3333-3333-3333-333333333333', name: 'Sample Pack', slug: 'sample-pack' },
                  ]).map((cat) => {
                    const isSelected = categoryId === cat.id || (productType === 'sample_pack' ? cat.slug === 'sample-pack' : cat.slug === 'plugin');
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#222222] border-white text-white shadow-sm'
                            : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#181818]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FormLabel
                  label="Subcategory"
                  info="Specific audio instrument, effect, or pack style"
                  icon={Tag}
                />
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                >
                  <option value="">Select a subcategory (optional)</option>
                  {subcategoriesList
                    .filter((s) => !categoryId || s.category_id === categoryId)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Helps music producers filter and find your product quickly
                </p>
              </div>
            </div>

            {/* Genres & Musical Style Tags */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#141414] border border-[#242424]">
              <div className="flex items-center justify-between">
                <FormLabel
                  label="Genre & Musical Style"
                  info="Select all applicable genres or add custom styles (saved in product tags)"
                  icon={Music}
                />
                <span className="text-[10px] font-mono text-zinc-400">
                  {selectedGenres.length} selected
                </span>
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'bg-[#181818] border border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#202020]'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-zinc-500" />}
                      <span>{genre}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Genre Input */}
              <div className="flex gap-2 pt-1.5">
                <input
                  type="text"
                  placeholder="Type a custom genre (e.g. Afrobeats, Synthwave, Techno)..."
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomGenre();
                    }
                  }}
                  className="flex-1 bg-[#121212] border border-[#2e2e2e] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddCustomGenre}
                  disabled={!customGenre.trim()}
                  className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* Active Selected Tags Display */}
              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedGenres.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#222222] border border-[#333333] text-[10px] text-zinc-200 font-mono"
                    >
                      <span>{g}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGenre(g)}
                        className="text-zinc-500 hover:text-white"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel label="Selling Price (USD) *" />
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
                <FormLabel
                  label="Original Price (USD)"
                  info="Optional strikethrough price to show promotional discount"
                />
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

            {/* Direct Link & Brand Referral Redirect */}
            <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel
                  label="Direct Store Link / Brand Referral (Optional)"
                  info="If you have an external brand store, affiliate partnership, or partner deal (e.g. Ford partnership, direct checkout), enter your link here. On producertoy.com, customers will be redirected directly to this URL."
                />
                <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c1c] border border-[#2c2c2c] px-2 py-0.5 rounded-full">
                  External Referral
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Destination URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://brand.com/products/toy or referral link"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-[#42454e] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Custom Button CTA Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Get on Brand Website / Buy from Partner"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-[#42454e] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <FormLabel
                label="Short Tagline"
                info="One-sentence hook displayed on cards and catalog search"
              />
              <input
                type="text"
                placeholder="Next-gen studio plate and hall reverb"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <div>
              <FormLabel
                label="Full Description"
                info="Detailed DSP algorithms, features, factory presets, and sound character"
              />
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

            {/* Cover Artwork Dual Mode with Integrated Live Preview */}
            <div className="w-full min-w-0">
              <DualAssetUploadInput
                label="Cover Artwork"
                info="600×600 px square PNG or WebP recommended"
                value={coverImage}
                onChange={setCoverImage}
                assetCategory="cover"
                accept="image/png,image/jpeg,image/webp"
                placeholder="https://.../cover.png or /products/proverb.png"
                icon={ImageIcon}
                thumbnailUrl={coverImage}
              />
            </div>

            {/* Audio Preview Dual Mode */}
            <div className="pt-3 border-t border-[#262626]">
              <DualAssetUploadInput
                label="Audio Preview"
                info="Direct MP3 or WAV audio stream for the storefront player"
                value={demoAudioUrl}
                onChange={setDemoAudioUrl}
                assetCategory="demo_audio"
                accept="audio/mp3,audio/mpeg,audio/wav"
                placeholder="https://.../audio/demo-track.mp3"
              />
            </div>

            <div className="pt-3 border-t border-[#262626] space-y-2">
              <FormLabel
                label="Video Walkthrough"
                info="YouTube video link embedded on product details page"
                icon={Video}
              />
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

            {/* OS Specific Binary Installers with Dual Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 w-full">
              <div className="min-w-0 w-full overflow-hidden">
                <DualAssetUploadInput
                  label="Windows Installer"
                  info="64-bit VST3 installer or archive (.exe / .zip)"
                  value={downloadUrlWin}
                  onChange={setDownloadUrlWin}
                  onFileSizeDetected={setFileSize}
                  assetCategory="win_installer"
                  accept=".exe,.zip,.msi"
                  placeholder="https://.../Setup-Win-x64.exe"
                  icon={Monitor}
                />
              </div>

              <div className="min-w-0 w-full overflow-hidden">
                <DualAssetUploadInput
                  label="macOS Installer"
                  info="Universal package (.pkg / .dmg) for Apple Silicon & Intel"
                  value={downloadUrlMac}
                  onChange={setDownloadUrlMac}
                  onFileSizeDetected={setFileSize}
                  assetCategory="mac_installer"
                  accept=".pkg,.dmg,.zip"
                  placeholder="https://.../Universal-macOS.pkg"
                  icon={Download}
                />
              </div>
            </div>

            {/* Universal Archive & Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262626] min-w-0 w-full">
              <div className="min-w-0 w-full overflow-hidden">
                <DualAssetUploadInput
                  label="Universal Archive"
                  info="Cross-platform ZIP containing sample libraries, WAV files, or presets"
                  value={downloadUrl}
                  onChange={setDownloadUrl}
                  onFileSizeDetected={setFileSize}
                  assetCategory="universal_zip"
                  accept=".zip,.rar,.7z"
                  placeholder="https://.../presets.zip"
                />
              </div>

              <div>
                <FormLabel
                  label="Archive Size"
                  info="Displayed on download badges and catalog cards. Auto-detected on upload"
                />
                <input
                  type="text"
                  placeholder="e.g. 2.4 GB or 350 MB"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262626]">
              <div>
                <FormLabel
                  label="Operating System"
                  info="System requirements (e.g. Windows 10/11 64-bit, macOS 12+)"
                />
                <input
                  type="text"
                  value={operatingSystem}
                  onChange={(e) => setOperatingSystem(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <FormLabel
                  label="Supported DAWs"
                  info="Compatible workstations (e.g. Ableton Live, FL Studio, Logic Pro)"
                />
                <input
                  type="text"
                  value={supportedDaws}
                  onChange={(e) => setSupportedDaws(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            {/* Initial Release Version */}
            <div className="pt-3 border-t border-[#262626] space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Initial Version
                </h3>
                <span className="text-[10px] font-mono font-normal text-zinc-300 bg-[#202020] px-2 py-0.5 rounded border border-[#34363d]">
                  v{version || '1.0.0'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FormLabel
                    label="Version Number"
                    info="Semantic version (SemVer). Updates preserve active buyer licenses automatically"
                  />
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormLabel
                    label="Release Notes"
                    info="Initial patch notes and changelog visible to buyers"
                  />
                  <textarea
                    rows={2}
                    placeholder="Initial public release for macOS and Windows"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3 text-xs text-white focus:border-[#42454e] transition-colors resize-y leading-relaxed font-mono"
                  />
                </div>
              </div>

              {/* Release Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#262626]">
                <div>
                  <FormLabel
                    label="Release Year"
                    info="Year published in the catalog"
                  />
                  <input
                    type="text"
                    placeholder="2025"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                  />
                </div>

                <div>
                  <FormLabel
                    label="Publisher / Label"
                    info="Publisher or brand name shown on the storefront"
                  />
                  <input
                    type="text"
                    placeholder="Brand name"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                </div>

                <div>
                  <FormLabel
                    label="License Terms"
                    info="License terms granted to buyer"
                  />
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  >
                    <option value="Royalty-Free Commercial">Royalty-Free Commercial</option>
                    <option value="Single User Perpetual">Single User Perpetual</option>
                    <option value="Multi-Seat Studio License">Multi-Seat Studio License</option>
                    <option value="Educational / Non-Commercial">Educational / Non-Commercial</option>
                  </select>
                </div>
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
                  Licensing & Delivery Method
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">Step 4 of 5</span>
            </div>

            {/* Delivery Method Choice */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#141414] border border-[#242424]">
              <FormLabel
                label="Delivery & Key Method"
                info="Choose how buyers receive their purchase"
                icon={Key}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLicenseDeliveryType('pool')}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${
                    licenseDeliveryType === 'pool'
                      ? 'bg-[#222222] border-white text-white'
                      : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-white">Serial Key License</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Issues a unique cryptographic key from your serial pool upon purchase
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLicenseDeliveryType('direct_download')}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${
                    licenseDeliveryType === 'direct_download'
                      ? 'bg-[#222222] border-white text-white'
                      : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-white">Direct Download Only</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Instant file download links without requiring machine key authorization
                  </p>
                </button>
              </div>
            </div>

            {productType === 'plugin' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FormLabel
                      label="Plugin Formats"
                      info="Supported architectures (e.g. VST3, AU, AAX, CLAP 64-bit)"
                    />
                    <input
                      type="text"
                      value={vstFormat}
                      onChange={(e) => setVstFormat(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                    />
                  </div>

                  <div>
                    <FormLabel
                      label="Identifier"
                      info="Unique reverse-domain identifier (e.g. com.brand.plugin)"
                    />
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
                    <FormLabel
                      label="Machine Seats"
                      info="Maximum concurrent device activations permitted per purchase"
                    />
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
                    <FormLabel
                      label="Offline Grace"
                      info="Number of days the plugin can operate offline before periodic ping"
                    />
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

            {/* Visibility Toggles */}
            <div className="space-y-3">
              <div className="bg-[#121212] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Catalog Status: {isActive ? 'Live on Storefront' : 'Draft (Hidden)'}
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Make this product public and available for purchase immediately
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isActiveCreate"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded bg-[#181818] border-[#34363d] text-white focus:ring-zinc-600 cursor-pointer"
                />
              </div>

              <div className="bg-[#121212] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Featured Product
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Highlight in featured storefront carousels and top recommendations
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isFeaturedCreate"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded bg-[#181818] border-[#34363d] text-white focus:ring-zinc-600 cursor-pointer"
                />
              </div>

              <div className="bg-[#121212] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Coming Soon Badge
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Display pre-launch teaser badge for upcoming sound packs or plugins
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isComingSoonCreate"
                  checked={isComingSoon}
                  onChange={(e) => setIsComingSoon(e.target.checked)}
                  className="w-5 h-5 rounded bg-[#181818] border-[#34363d] text-white focus:ring-zinc-600 cursor-pointer"
                />
              </div>
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
    </RoleGate>
  );
}
