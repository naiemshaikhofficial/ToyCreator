'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { getProductById, updateBrandProduct, getCatalogCategories } from '@/lib/supabase/actions';
import { createCustomCategoryAction, createCustomSubcategoryAction } from '@/actions/categoryActions';
import ProdyCopilotModal, { ProdyApplyMode } from '@/components/ProdyCopilotModal';
import {
  ArrowLeft,
  Package,
  Cpu,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Monitor,
  Download,
  HardDrive,
  Video,
  Layers,
  FileText,
  Image as ImageIcon,
  Key,
  Eye,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  ShieldCheck,
  Check,
  Tag,
  Music,
  Plus,
  X,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import SerialKeyPoolManager from '@/components/SerialKeyPoolManager';
import DualAssetUploadInput from '@/components/DualAssetUploadInput';

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
  { id: 4, label: 'Licensing', icon: Key, desc: 'Seats & Serials' },
  { id: 5, label: 'Visibility', icon: Eye, desc: 'Review & Publish' },
];


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { brand } = useBrand();
  const productId = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('plugin');

  // Dynamic Catalog Categories, Subcategories & Genres
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState('');

  // Pricing & Descriptions
  const [priceUsd, setPriceUsd] = useState('');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('');
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
  const [releaseYear, setReleaseYear] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [publisher, setPublisher] = useState('');
  const [licenseType, setLicenseType] = useState('Royalty-Free Commercial');
  const [changelog, setChangelog] = useState('');
  const [supportedDaws, setSupportedDaws] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [vstFormat, setVstFormat] = useState('');

  // Licensing & Machine Seats
  const [maxSeats, setMaxSeats] = useState(3);
  const [offlineGraceDays, setOfflineGraceDays] = useState(14);
  const [licenseDeliveryType, setLicenseDeliveryType] = useState<'pool' | 'direct_download'>('pool');
  const [deliveryMethod, setDeliveryMethod] = useState<'direct_download' | 'serial_key' | 'dedicated_licensing_server'>('serial_key');

  // Visibility & Referral
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [buttonText, setButtonText] = useState('');

  // Prody AI Copilot State
  const [showProdyModal, setShowProdyModal] = useState(false);
  const [aiAppliedMsg, setAiAppliedMsg] = useState('');

  // Custom Category & Subcategory Creation State
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [addingSub, setAddingSub] = useState(false);

  const handleApplyProdyProduct = (data: any, mode: ProdyApplyMode = 'all') => {
    if (mode === 'all' || mode === 'title') {
      if (data.name) setName(data.name);
    }
    if (mode === 'all' || mode === 'category') {
      if (data.category_slug) {
        const match = categoriesList.find((c) => c.slug === data.category_slug);
        if (match) {
          setCategoryId(match.id);
          setProductType(data.category_slug === 'sample-pack' ? 'sample_pack' : 'plugin');
        }
      }
      if (data.subcategory_id) {
        setSubcategoryId(data.subcategory_id);
      } else if (data.subcategory_name) {
        const matchSub = subcategoriesList.find((s) => s.name.toLowerCase() === data.subcategory_name.toLowerCase());
        if (matchSub) setSubcategoryId(matchSub.id);
      }
    }
    if (mode === 'all' || mode === 'genres') {
      if (Array.isArray(data.category_slugs) && data.category_slugs.length > 0) {
        setSelectedGenres(data.category_slugs);
      }
    }
    if (mode === 'all' || mode === 'pricing') {
      if (data.price_usd) setPriceUsd(data.price_usd.toString());
      if (data.original_price_usd) setOriginalPriceUsd(data.original_price_usd.toString());
    }
    if (mode === 'all' || mode === 'description') {
      if (data.short_description) setShortDesc(data.short_description);
      if (data.full_description) setFullDesc(data.full_description);
    }
    if (mode === 'all' || mode === 'specs') {
      if (data.vst_format) setVstFormat(data.vst_format);
      if (data.operating_system) setOperatingSystem(data.operating_system);
      if (data.supported_daws) setSupportedDaws(data.supported_daws);
      if (data.license_delivery_type) setLicenseDeliveryType(data.license_delivery_type);
      if (data.license_type) setLicenseType(data.license_type);
    }

    const modeLabels: Record<string, string> = {
      all: '✨ Applied complete product details to form!',
      title: '🏷️ Applied Title!',
      description: '📝 Applied Google SEO descriptions!',
      category: '📂 Applied Category & Subcategory!',
      genres: '🎵 Applied Target Genres!',
      pricing: '💲 Applied Product Pricing!',
      specs: '🎛️ Applied VST Specs & DAWs!',
    };

    setAiAppliedMsg(modeLabels[mode] || '✨ Prody applied product data!');
    setTimeout(() => setAiAppliedMsg(''), 4000);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res = await createCustomCategoryAction(newCatName.trim());
      if (res.success && res.data) {
        setCategoriesList((prev) => [...prev, res.data]);
        setCategoryId(res.data.id);
        setShowAddCat(false);
        setNewCatName('');
      } else {
        alert(res.error || 'Failed to create category.');
      }
    } finally {
      setAddingCat(false);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !categoryId) return;
    setAddingSub(true);
    try {
      const res = await createCustomSubcategoryAction(categoryId, newSubName.trim());
      if (res.success && res.data) {
        setSubcategoriesList((prev) => [...prev, res.data]);
        setSubcategoryId(res.data.id);
        setShowAddSub(false);
        setNewSubName('');
      } else {
        alert(res.error || 'Failed to create subcategory.');
      }
    } finally {
      setAddingSub(false);
    }
  };

  useEffect(() => {
    async function loadCatalog() {
      const { categories, subcategories } = await getCatalogCategories();
      setCategoriesList(categories);
      setSubcategoriesList(subcategories);
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setLoading(true);
      try {
        const data = await getProductById(productId);
        if (data) {
          setProduct(data);
          setName(data.name || '');
          setProductType(data.product_type || 'plugin');
          setCategoryId(data.category_id || '');
          setSubcategoryId(data.subcategory_id || '');
          setSelectedGenres(Array.isArray(data.category_slugs) ? data.category_slugs : []);
          setPriceUsd(data.price_usd?.toString() || '0');
          setOriginalPriceUsd(data.original_price_usd?.toString() || '');
          setExternalUrl(data.external_url || '');
          setButtonText(data.button_text || '');
          setShortDesc(data.short_description || '');
          setFullDesc(data.full_description || '');
          setCoverImage(data.cover_image || '');
          setDemoAudioUrl(data.demo_audio_url || '');
          setDownloadUrl(data.download_url || '');
          setDownloadUrlWin(data.download_url_win || '');
          setDownloadUrlMac(data.download_url_mac || '');
          setYoutubeUrl(data.youtube_url || '');
          setFileSize(data.file_size || '');
          setVersion(data.version || '1.0.0');
          setReleaseYear(data.release_year || new Date().getFullYear().toString());
          setReleaseDate(data.release_date || new Date().toISOString().split('T')[0]);
          setPublisher(data.publisher || brand?.name || 'Producer Toy');
          setLicenseType(data.license_type || 'Royalty-Free Commercial');
          setLicenseDeliveryType((data.license_delivery_type as any) || (data.delivery_method === 'direct_download' ? 'direct_download' : 'pool'));
          setChangelog(data.changelog || '');
          setSupportedDaws(data.supported_daws || '');
          setOperatingSystem(data.operating_system || '');
          setVstFormat(data.vst_format || '');
          setMaxSeats(data.max_activation_seats || 3);
          setOfflineGraceDays(data.offline_grace_days || 14);
          setIsActive(data.is_active ?? true);
          setIsFeatured(data.is_featured ?? false);
          setIsComingSoon(data.is_coming_soon ?? false);
          const initialDelivery = data.delivery_method || (data.product_type === 'sample_pack' || data.product_type === 'preset' ? 'direct_download' : 'serial_key');
          setDeliveryMethod(initialDelivery as any);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId, brand?.name]);

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const targetId = product?.id || productId;
      await updateBrandProduct(targetId, {
        name: name.trim(),
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
        publisher: publisher.trim() || null,
        license_type: licenseType.trim() || null,
        license_delivery_type: licenseDeliveryType,
        changelog: changelog.trim() || null,
        supported_daws: supportedDaws.trim() || null,
        operating_system: operatingSystem.trim() || null,
        vst_format: vstFormat.trim() || null,
        max_activation_seats: Number(maxSeats),
        offline_grace_days: Number(offlineGraceDays),
        delivery_method: licenseDeliveryType === 'direct_download' ? 'direct_download' : deliveryMethod,
        is_active: isActive,
        is_featured: isFeatured,
        is_coming_soon: isComingSoon,
      });

      setSuccessMsg('All product details saved successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMsg(err.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-3">
        <Package className="w-10 h-10 text-zinc-600 mx-auto" />
        <h2 className="text-base font-bold text-white">Product Not Found</h2>
        <Link href="/dashboard/products" className="btn-secondary px-4 py-2 text-xs">
          Return to Products
        </Link>
      </div>
    );
  }

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
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {product.name}
            </h1>
            <span className="text-[11px] font-mono text-zinc-300 bg-[#202020] px-2 py-0.5 rounded-md border border-[#34363d]">
              v{version || '1.0.0'}
            </span>
            <span
              className={`toy-badge ${
                isActive ? 'toy-badge-charcoal' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {isActive ? 'Live' : 'Draft'}
            </span>
            {!downloadUrl && !downloadUrlWin && !downloadUrlMac && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Out of Stock (No Files)</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowProdyModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-[#1c1c1c] hover:bg-[#252525] border border-white/20 text-white transition-all shadow-sm group hover:border-white/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
            <span>Ask Prody</span>
          </button>
          <a
            href={`https://producertoy.com/product/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save</span>
          </button>
        </div>
      </div>

      {aiAppliedMsg && (
        <div className="p-3.5 bg-[#181818] border border-white/30 rounded-xl text-white text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-white flex-shrink-0" />
            <span className="font-medium">{aiAppliedMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiAppliedMsg('')}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

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
            const Icon = step.icon;
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

      {/* Main Step Content Container */}
      <div className="space-y-6">
        {/* STEP 1: Details & Pricing */}
        {activeStep === 1 && (
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Product Details & Pricing
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">
                Step 1 of 5
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel label="Product Title" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div>
                <FormLabel
                  label="Storefront Slug"
                  info="Permanent unique URL identifier on producertoy.com"
                />
                <input
                  type="text"
                  disabled
                  value={product.slug || ''}
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Category & Subcategory Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel
                    label="Category *"
                    info="Choose the primary marketplace category for your product"
                    icon={Package}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddCat(!showAddCat)}
                    className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Add Category</span>
                  </button>
                </div>

                {showAddCat && (
                  <div className="mb-2.5 p-2.5 bg-[#171717] border border-[#2a2a2a] rounded-xl flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Presets, MIDI, FX..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-[#101010] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      disabled={addingCat || !newCatName.trim()}
                      onClick={handleCreateCategory}
                      className="px-2.5 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {addingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCat(false)}
                      className="p-1.5 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#222222] border-white text-white shadow-sm'
                            : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#181818]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel
                    label="Subcategory"
                    info="Specific audio instrument, effect, or pack style"
                    icon={Tag}
                  />
                  {categoryId && (
                    <button
                      type="button"
                      onClick={() => setShowAddSub(!showAddSub)}
                      className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Subcategory</span>
                    </button>
                  )}
                </div>

                {showAddSub && (
                  <div className="mb-2.5 p-2.5 bg-[#171717] border border-[#2a2a2a] rounded-xl flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Serum Presets, Vocal Chops..."
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="flex-1 bg-[#101010] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      disabled={addingSub || !newSubName.trim()}
                      onClick={handleCreateSubcategory}
                      className="px-2.5 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {addingSub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSub(false)}
                      className="p-1.5 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

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
                <FormLabel label="Selling Price (USD)" />
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
                  info="Optional strikethrough list price to display promotional discount"
                />
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 59.00"
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
                info="One-sentence hook shown on marketplace cards and catalog search results"
              />
              <input
                type="text"
                placeholder="High-end algorithmic reverb for modern music producers"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <div>
              <FormLabel
                label="Full Description"
                info="Comprehensive feature notes, preset lists, and audio specifications"
              />
              <textarea
                rows={6}
                placeholder="Detailed features, sound design notes, preset counts, and workflow highlights..."
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
              <span className="font-mono text-[10px] text-zinc-400">
                Step 2 of 5
              </span>
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
                placeholder="https://... or /products/proverb.png"
                icon={ImageIcon}
                thumbnailUrl={coverImage}
              />
            </div>

            {/* Audio Preview Dual Mode */}
            <div className="pt-3 border-t border-[#262626] w-full min-w-0">
              <DualAssetUploadInput
                label="Audio Preview"
                info="Direct MP3 or WAV audio stream for the storefront player"
                value={demoAudioUrl}
                onChange={setDemoAudioUrl}
                assetCategory="demo_audio"
                accept="audio/mp3,audio/mpeg,audio/wav"
                placeholder="https://.../audio/proverb-demo.mp3"
              />
            </div>

            {/* Video Demo */}
            <div className="pt-3 border-t border-[#262626] space-y-2 w-full min-w-0">
              <FormLabel
                label="Video Walkthrough"
                info="YouTube video link embedded on product details page"
                icon={Video}
              />
              <input
                type="text"
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
          <div className="toy-card p-6 space-y-5 w-full min-w-0">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Installers & System Compatibility
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">
                Step 3 of 5
              </span>
            </div>

            {!downloadUrl && !downloadUrlWin && !downloadUrlMac && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-3 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-200">No Downloadable Deliverables Attached:</span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    This product is currently marked as <strong>Out of Stock</strong> on ProducerToy. Checkout is locked so customers cannot accidentally purchase an empty product without files. Upload an installer or paste a drive link below.
                  </p>
                </div>
              </div>
            )}

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
                  placeholder="https://.../ProVerb-Win-Setup.exe"
                  icon={Monitor}
                />
              </div>

              <div className="min-w-0 w-full overflow-hidden">
                <DualAssetUploadInput
                  label="macOS Installer"
                  info="Universal binary (.pkg / .dmg) for Apple Silicon & Intel"
                  value={downloadUrlMac}
                  onChange={setDownloadUrlMac}
                  onFileSizeDetected={setFileSize}
                  assetCategory="mac_installer"
                  accept=".pkg,.dmg,.zip"
                  placeholder="https://.../ProVerb-macOS-Universal.pkg"
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
                  placeholder="https://.../Presets-Universal.zip"
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

            {/* DAWs & OS requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262626]">
              <div>
                <FormLabel
                  label="Operating System"
                  info="System requirements (e.g. Windows 10/11 64-bit, macOS 12+)"
                />
                <input
                  type="text"
                  placeholder="Windows 10/11 64-bit, macOS 12+ (Apple Silicon & Intel)"
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
                  placeholder="Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper"
                  value={supportedDaws}
                  onChange={(e) => setSupportedDaws(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            {/* Release Version & Changelog */}
            <div className="pt-3 border-t border-[#262626] space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Release Version
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
                    placeholder="e.g. 1.0.0, 1.1.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormLabel
                    label="Changelog"
                    info="Release notes and patch highlights visible to customers"
                  />
                  <textarea
                    rows={3}
                    placeholder={`• Fixed buffer latency in Ableton Live & Logic Pro\n• Optimized CPU consumption by 15%\n• Added 24 new studio hall presets`}
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

        {/* STEP 4: Licensing & Serials */}
        {activeStep === 4 && (
          <div className="space-y-6">
            {/* Delivery Architecture Selector */}
            <div className="toy-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-300" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Delivery & License Architecture
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {deliveryMethod === 'direct_download' ? 'Direct CDN Delivery' : 'License Controlled'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('direct_download')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    deliveryMethod === 'direct_download'
                      ? 'bg-[#181818] border-white text-white shadow-sm'
                      : 'bg-[#121212] border-[#262626] text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between text-white">
                    <span>Direct Download</span>
                    {deliveryMethod === 'direct_download' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Keyless delivery. Perfect for Sample Packs, Loops, Presets, and freeware audio tools.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('serial_key')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    deliveryMethod === 'serial_key'
                      ? 'bg-[#181818] border-white text-white shadow-sm'
                      : 'bg-[#121212] border-[#262626] text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between text-white">
                    <span>Serial Key Pool</span>
                    {deliveryMethod === 'serial_key' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Pre-loaded pool of unique serial keys assigned automatically to buyers upon checkout.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('dedicated_licensing_server')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    deliveryMethod === 'dedicated_licensing_server'
                      ? 'bg-[#181818] border-white text-white shadow-sm'
                      : 'bg-[#121212] border-[#262626] text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between text-white">
                    <span>Machine Seat Auth</span>
                    {deliveryMethod === 'dedicated_licensing_server' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Cryptographic machine-bound seat challenge activation server (ProVerb model).
                  </p>
                </button>
              </div>
            </div>

            {deliveryMethod !== 'direct_download' && (
              <div className="toy-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-zinc-300" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Plugin Licensing Configuration
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Step 4 of 5
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <FormLabel
                      label="Plugin Formats"
                      info="Architectures (e.g. VST3, AU, AAX, CLAP 64-bit)"
                    />
                    <input
                      type="text"
                      placeholder="VST3, AU, AAX (64-bit)"
                      value={vstFormat}
                      onChange={(e) => setVstFormat(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                    />
                  </div>

                  <div>
                    <FormLabel
                      label="Machine Seats"
                      info="Concurrent hardware activations per user license"
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
                      info="Days a workstation can run offline before requiring license ping"
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
              </div>
            )}

            {/* Conditional Delivery View: Keyless vs Serial Key Pool */}
            {deliveryMethod === 'direct_download' ? (
              <div className="toy-card p-6 space-y-3 bg-[#131313] border-[#282828]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#202020] border border-[#34363d] flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Keyless Direct Download Delivery Active</span>
                      <span className="text-[9px] font-mono text-zinc-400 bg-[#1e1e1e] px-2 py-0.5 rounded border border-zinc-700/50">
                        Royalty-Free Delivery
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Buyers receive instant download access upon purchase with full royalty-free commercial rights. No serial key entry is required. This product is exempt from serial inventory thresholds and maintains 100% in-stock availability as long as installer files or audio archives are attached in Step 3.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <SerialKeyPoolManager
                productId={product.id}
                productName={product.name}
              />
            )}
          </div>
        )}

        {/* STEP 5: Visibility & Review */}
        {activeStep === 5 && (
          <div className="toy-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Review & Catalog Visibility
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">
                Step 5 of 5
              </span>
            </div>

            {/* Active Toggle Box */}
            <div className="space-y-3">
              <div className="bg-[#121212] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Catalog Status: {isActive ? 'Live on Storefront' : 'Draft Mode (Hidden)'}
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    When enabled, verified music producers can discover and purchase this item.
                  </p>
                </div>

                <input
                  type="checkbox"
                  id="isActiveToggle"
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
                  id="isFeaturedEdit"
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
                  id="isComingSoonEdit"
                  checked={isComingSoon}
                  onChange={(e) => setIsComingSoon(e.target.checked)}
                  className="w-5 h-5 rounded bg-[#181818] border-[#34363d] text-white focus:ring-zinc-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Product Configuration Checklist */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Asset Readiness Checklist
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-[#121212] border border-[#222222] rounded-lg flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${coverImage ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-zinc-300">Cover Artwork:</span>
                  <span className="font-mono text-[11px] text-zinc-400 ml-auto">
                    {coverImage ? 'Configured' : 'Missing'}
                  </span>
                </div>

                <div className="p-3 bg-[#121212] border border-[#222222] rounded-lg flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${demoAudioUrl ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  <span className="text-zinc-300">Demo Audio:</span>
                  <span className="font-mono text-[11px] text-zinc-400 ml-auto">
                    {demoAudioUrl ? 'Active' : 'None'}
                  </span>
                </div>

                <div className="p-3 bg-[#121212] border border-[#222222] rounded-lg flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${downloadUrlWin ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  <span className="text-zinc-300">Windows Installer:</span>
                  <span className="font-mono text-[11px] text-zinc-400 ml-auto">
                    {downloadUrlWin ? 'Linked' : 'Optional'}
                  </span>
                </div>

                <div className="p-3 bg-[#121212] border border-[#222222] rounded-lg flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${downloadUrlMac ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  <span className="text-zinc-300">macOS Installer:</span>
                  <span className="font-mono text-[11px] text-zinc-400 ml-auto">
                    {downloadUrlMac ? 'Linked' : 'Optional'}
                  </span>
                </div>

                <div className="p-3 bg-[#121212] border border-[#222222] rounded-lg flex items-center gap-2 sm:col-span-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-zinc-300">Release Version:</span>
                  <span className="font-mono text-[11px] text-zinc-300 ml-auto">
                    v{version || '1.0.0'} {changelog ? '• Release notes provided' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Stepper Navigation & Action Bar */}
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
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg uppercase tracking-wider cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Prody AI Copilot Modal */}
      <ProdyCopilotModal
        isOpen={showProdyModal}
        onClose={() => setShowProdyModal(false)}
        brandName={brand?.name}
        onApplyProduct={handleApplyProdyProduct}
        currentFormValues={{
          name,
          slug: product?.slug || '',
          productType,
          categorySlug: categoriesList.find((c) => c.id === categoryId)?.slug || (productType === 'sample_pack' ? 'sample-pack' : 'plugin'),
          subcategoryName: subcategoriesList.find((s) => s.id === subcategoryId)?.name,
          selectedGenres,
          priceUsd,
          originalPriceUsd,
          shortDesc,
          fullDesc,
          vstFormat,
        }}
      />
    </div>
  );
}
