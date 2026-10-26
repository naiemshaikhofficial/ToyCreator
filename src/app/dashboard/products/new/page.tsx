'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { createBrandProduct, getCatalogCategories } from '@/lib/supabase/actions';
import { createCustomCategoryAction, createCustomSubcategoryAction } from '@/actions/categoryActions';
import ProdyCopilotModal, { ProdyApplyMode } from '@/components/ProdyCopilotModal';
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
  FolderPlus,
  HelpCircle,
} from 'lucide-react';
import DualAssetUploadInput from '@/components/DualAssetUploadInput';
import { RoleGate } from '@/components/RoleGate';
import { ProductReleaseScheduler } from '@/components/products/ProductReleaseScheduler';

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

export function isValidYouTubeUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  // Validates standard watch URL, embed URL, shorts, and shortlinks (youtu.be)
  const reg = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?(.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)[\w-]{11}(.*)?$/;
  return reg.test(trimmed);
}

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

  // Custom Brand FAQs (Max 5 Limit)
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  const handleAddFaq = () => {
    if (faqs.length >= 5) return;
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

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

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

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
      if (data.name) {
        setName(data.name);
        setSlug(data.slug);
        if (brand?.slug) {
          setPluginIdentifier(`com.${brand.slug}.${data.slug}`);
        }
      }
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
      title: '🏷️ Applied Title & URL slug!',
      description: '📝 Applied Google SEO descriptions!',
      category: '📂 Applied Category & Subcategory!',
      genres: '🎵 Applied Target Genres!',
      pricing: '💲 Applied Product Pricing!',
      specs: '🎛️ Applied VST Specs & DAWs!',
    };

    if (mode === 'all') {
      setFieldErrors({});
    }
    setErrorMsg('');

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
    clearFieldError('name');
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);
    clearFieldError('slug');

    if (brand?.slug) {
      setPluginIdentifier(`com.${brand.slug}.${generatedSlug}`);
      clearFieldError('pluginIdentifier');
    }
  };

  const validateStep = (stepNumber: number): { valid: boolean; firstError: string; errors: Record<string, string> } => {
    const errs: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!name.trim()) {
        errs.name = 'Product title is required';
      }
      if (!slug.trim()) {
        errs.slug = 'Storefront URL slug is required';
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
        errs.slug = 'Slug must only contain lowercase letters, numbers, and hyphens';
      }
      if (!categoryId) {
        errs.categoryId = 'Please select a product category';
      }
      const availableSubs = subcategoriesList.filter((s) => !categoryId || s.category_id === categoryId);
      if (availableSubs.length > 0 && !subcategoryId) {
        errs.subcategoryId = 'Please select a subcategory';
      }
      if (selectedGenres.length === 0) {
        errs.genres = 'Select at least 1 musical genre or style tag';
      }
      if (!priceUsd.trim() || isNaN(Number(priceUsd)) || Number(priceUsd) < 0) {
        errs.priceUsd = 'Valid selling price (USD) is required';
      }
      if (!shortDesc.trim()) {
        errs.shortDesc = 'Short tagline hook is required';
      }
      if (!fullDesc.trim()) {
        errs.fullDesc = 'Full description is required';
      }
      for (let i = 0; i < faqs.length; i++) {
        if (!faqs[i].question.trim() || !faqs[i].answer.trim()) {
          errs.faqs = 'Please complete both question and answer for all FAQs, or remove empty items';
          break;
        }
      }
    } else if (stepNumber === 2) {
      if (!coverImage.trim()) {
        errs.coverImage = 'Cover artwork is required';
      }
      if (!youtubeUrl.trim()) {
        errs.youtubeUrl = 'YouTube walkthrough video is required';
      } else if (!isValidYouTubeUrl(youtubeUrl)) {
        errs.youtubeUrl = 'Only valid YouTube URLs are accepted (e.g. https://www.youtube.com/watch?v=...)';
      }
    } else if (stepNumber === 3) {
      if (productType === 'plugin') {
        if (!downloadUrlWin.trim() && !downloadUrlMac.trim()) {
          errs.installers = 'At least one installer (Windows or macOS) is required';
        }
      } else {
        if (!downloadUrl.trim() && !downloadUrlWin.trim() && !downloadUrlMac.trim()) {
          errs.installers = 'At least one download file or installer is required';
        }
      }
      if (!operatingSystem.trim()) {
        errs.operatingSystem = 'Operating system requirement is required';
      }
      if (!supportedDaws.trim()) {
        errs.supportedDaws = 'Supported DAWs list is required';
      }
      if (!version.trim()) {
        errs.version = 'Version number is required';
      }
    } else if (stepNumber === 4) {
      if (productType === 'plugin') {
        if (!vstFormat.trim()) {
          errs.vstFormat = 'Plugin format is required (e.g. VST3, AU, AAX)';
        }
        if (!pluginIdentifier.trim()) {
          errs.pluginIdentifier = 'Plugin identifier is required (e.g. com.brand.plugin)';
        }
        if (!maxSeats || maxSeats < 1) {
          errs.maxSeats = 'At least 1 machine seat is required';
        }
        if (!offlineGraceDays || offlineGraceDays < 1) {
          errs.offlineGraceDays = 'Valid offline grace period is required';
        }
      }
    }

    const keys = Object.keys(errs);
    return {
      valid: keys.length === 0,
      firstError: keys.length > 0 ? errs[keys[0]] : '',
      errors: errs,
    };
  };

  const validateAllSteps = (): { valid: boolean; firstInvalidStep: number; firstError: string; errors: Record<string, string> } => {
    let combinedErrors: Record<string, string> = {};
    for (let s = 1; s <= 4; s++) {
      const res = validateStep(s);
      if (!res.valid) {
        combinedErrors = { ...combinedErrors, ...res.errors };
        return {
          valid: false,
          firstInvalidStep: s,
          firstError: res.firstError,
          errors: combinedErrors,
        };
      }
    }
    return { valid: true, firstInvalidStep: 0, firstError: '', errors: {} };
  };

  const stepHasError = (stepId: number) => {
    if (stepId === 1) {
      return Boolean(
        fieldErrors.name ||
        fieldErrors.slug ||
        fieldErrors.categoryId ||
        fieldErrors.subcategoryId ||
        fieldErrors.genres ||
        fieldErrors.priceUsd ||
        fieldErrors.shortDesc ||
        fieldErrors.fullDesc ||
        fieldErrors.faqs
      );
    }
    if (stepId === 2) {
      return Boolean(fieldErrors.coverImage || fieldErrors.youtubeUrl);
    }
    if (stepId === 3) {
      return Boolean(
        fieldErrors.installers ||
        fieldErrors.operatingSystem ||
        fieldErrors.supportedDaws ||
        fieldErrors.version
      );
    }
    if (stepId === 4) {
      return Boolean(
        fieldErrors.vstFormat ||
        fieldErrors.pluginIdentifier ||
        fieldErrors.maxSeats ||
        fieldErrors.offlineGraceDays
      );
    }
    return false;
  };

  const handleNextStep = () => {
    const res = validateStep(activeStep);
    if (!res.valid) {
      setErrorMsg(res.firstError);
      setFieldErrors((prev) => ({ ...prev, ...res.errors }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrorMsg('');
    setActiveStep((prev) => Math.min(5, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < activeStep) {
      setActiveStep(targetStep);
      return;
    }
    for (let s = 1; s < targetStep; s++) {
      const res = validateStep(s);
      if (!res.valid) {
        setErrorMsg(res.firstError);
        setFieldErrors((prev) => ({ ...prev, ...res.errors }));
        setActiveStep(s);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    setErrorMsg('');
    setActiveStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = validateAllSteps();
    if (!res.valid) {
      setErrorMsg(res.firstError);
      setFieldErrors(res.errors);
      setActiveStep(res.firstInvalidStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        external_url: null,
        button_text: null,
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
        faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()).slice(0, 5),
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

  // Real-time Form Readiness Tracking (Animata Progress)
  const readinessCriteria = [
    { label: 'Product Title', isDone: Boolean(name.trim()), weight: 15 },
    { label: 'URL Identifier', isDone: Boolean(slug.trim()), weight: 10 },
    { label: 'Price (USD)', isDone: Boolean(priceUsd.trim() && !isNaN(Number(priceUsd)) && Number(priceUsd) >= 0), weight: 10 },
    { label: 'Short & Full Description', isDone: Boolean(shortDesc.trim() && fullDesc.trim()), weight: 15 },
    { label: 'Category & Subcategory', isDone: Boolean(categoryId && (subcategoriesList.filter((s) => s.category_id === categoryId).length === 0 || subcategoryId)), weight: 10 },
    { label: 'Cover Artwork', isDone: Boolean(coverImage.trim()), weight: 15 },
    { label: 'Installers / Download Link', isDone: Boolean(productType === 'plugin' ? (downloadUrlWin.trim() || downloadUrlMac.trim()) : (downloadUrl.trim() || downloadUrlWin.trim() || downloadUrlMac.trim())), weight: 15 },
    { label: 'YouTube Walkthrough', isDone: isValidYouTubeUrl(youtubeUrl), weight: 5 },
    { label: 'Software Specs & Version', isDone: Boolean(version.trim()), weight: 5 },
  ];

  const completedCount = readinessCriteria.filter((c) => c.isDone).length;
  const totalCriteria = readinessCriteria.length;
  const progressPercent = Math.min(
    100,
    readinessCriteria.reduce((acc, c) => acc + (c.isDone ? c.weight : 0), 0)
  );
  const nextMissing = readinessCriteria.find((c) => !c.isDone)?.label;

  return (
    <RoleGate allowedRoles={['owner', 'admin', 'developer']} sectionName="Product Publisher">
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Products</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            New Audio Product
          </h1>
          <p className="text-xs text-zinc-400">
            Publish a new plugin, sound pack, or preset bank under {brand?.name || 'your brand'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowProdyModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] text-zinc-300 hover:text-white transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>Ask Prody</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Product</span>
              </>
            )}
          </button>
        </div>
      </div>

      {aiAppliedMsg && (
        <div className="p-3 bg-[#181818] border border-white/20 rounded-xl text-white text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span className="font-medium">{aiAppliedMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiAppliedMsg('')}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#ff4053] text-black font-extrabold px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="p-1 text-black/70 hover:text-black transition-colors"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sleek Step Navigation & Readiness */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {STEPS.map((step) => {
            const isCurrent = activeStep === step.id;
            const isDone = activeStep > step.id;
            const hasErr = stepHasError(step.id);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-[#222222] text-white font-semibold border border-[#34363d]'
                    : isDone
                    ? 'text-zinc-300 hover:text-white hover:bg-[#181818]'
                    : 'text-zinc-500 hover:text-zinc-400 hover:bg-[#161616]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    hasErr
                      ? 'bg-[#ff4053] text-black font-extrabold'
                      : isCurrent
                      ? 'bg-white text-black'
                      : isDone
                      ? 'bg-[#2e2e2e] text-zinc-200'
                      : 'bg-[#181818] text-zinc-600'
                  }`}
                >
                  {hasErr ? '!' : isDone ? <Check className="w-2.5 h-2.5" /> : step.id}
                </span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Minimalist Progress Pill */}
        <div className="flex items-center gap-2.5 shrink-0 text-xs font-mono">
          <span className="text-[11px] text-zinc-400">
            {progressPercent}% Ready
          </span>
          <div className="w-20 h-1.5 bg-[#181818] rounded-full overflow-hidden border border-[#262626]">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
                  className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors ${
                    fieldErrors.name
                      ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                      : 'border-[#2e2e2e] focus:border-[#42454e]'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <FormLabel
                  label="Storefront URL Slug *"
                  info="Auto-generated URL path on producertoy.com"
                />
                <input
                  type="text"
                  required
                  placeholder="e.g. proverb"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    clearFieldError('slug');
                  }}
                  className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs font-mono text-white transition-colors ${
                    fieldErrors.slug
                      ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                      : 'border-[#2e2e2e] focus:border-[#42454e]'
                  }`}
                />
                {fieldErrors.slug && (
                  <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.slug}</span>
                  </p>
                )}
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
                            : fieldErrors.categoryId
                            ? 'bg-[#121212] border-[#ff4053]/50 text-zinc-400 hover:text-white hover:bg-[#181818]'
                            : 'bg-[#121212] border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#181818]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.categoryId && (
                  <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.categoryId}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel
                    label="Subcategory *"
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
                  onChange={(e) => {
                    setSubcategoryId(e.target.value);
                    clearFieldError('subcategoryId');
                  }}
                  className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors ${
                    fieldErrors.subcategoryId
                      ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                      : 'border-[#2e2e2e] focus:border-[#42454e]'
                  }`}
                >
                  <option value="">Select a subcategory</option>
                  {subcategoriesList
                    .filter((s) => !categoryId || s.category_id === categoryId)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
                {fieldErrors.subcategoryId ? (
                  <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.subcategoryId}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Helps music producers filter and find your product quickly
                  </p>
                )}
              </div>
            </div>

            {/* Genres & Musical Style Tags */}
            <div className="space-y-2 pt-2 border-t border-[#222222]">
              <div className="flex items-center justify-between">
                <FormLabel
                  label="Genre & Musical Style *"
                  info="Select all applicable genres or add custom styles (saved in product tags)"
                  icon={Music}
                />
                <span className="text-[10px] font-mono text-zinc-500">
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
                      onClick={() => {
                        toggleGenre(genre);
                        clearFieldError('genres');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'bg-[#141414] border border-[#262626] text-zinc-400 hover:text-white hover:bg-[#1c1c1c]'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-zinc-500" />}
                      <span>{genre}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Genre Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Type a custom genre (e.g. Afrobeats, Synthwave, Techno)..."
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomGenre();
                      clearFieldError('genres');
                    }
                  }}
                  className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white focus:border-zinc-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleAddCustomGenre();
                    clearFieldError('genres');
                  }}
                  disabled={!customGenre.trim()}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </div>

              {fieldErrors.genres && (
                <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.genres}</span>
                </p>
              )}

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
                    onChange={(e) => {
                      setPriceUsd(e.target.value);
                      clearFieldError('priceUsd');
                    }}
                    className={`w-full bg-[#121212] border rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono text-white transition-colors ${
                      fieldErrors.priceUsd
                        ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                        : 'border-[#2e2e2e] focus:border-[#42454e]'
                    }`}
                  />
                </div>
                {fieldErrors.priceUsd && (
                  <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.priceUsd}</span>
                  </p>
                )}
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

            <div>
              <FormLabel
                label="Short Tagline *"
                info="One-sentence hook displayed on cards and catalog search"
              />
              <input
                type="text"
                placeholder="Next-gen studio plate and hall reverb"
                value={shortDesc}
                onChange={(e) => {
                  setShortDesc(e.target.value);
                  clearFieldError('shortDesc');
                }}
                className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors ${
                  fieldErrors.shortDesc
                    ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                    : 'border-[#2e2e2e] focus:border-[#42454e]'
                }`}
              />
              {fieldErrors.shortDesc && (
                <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.shortDesc}</span>
                </p>
              )}
            </div>

            <div>
              <FormLabel
                label="Full Description *"
                info="Detailed DSP algorithms, features, factory presets, and sound character"
              />
              <textarea
                rows={5}
                placeholder="Include features, DSP algorithms, factory presets, and sound character..."
                value={fullDesc}
                onChange={(e) => {
                  setFullDesc(e.target.value);
                  clearFieldError('fullDesc');
                }}
                className={`w-full bg-[#121212] border rounded-xl p-3.5 text-xs text-white transition-colors resize-y leading-relaxed ${
                  fieldErrors.fullDesc
                    ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                    : 'border-[#2e2e2e] focus:border-[#42454e]'
                }`}
              />
              {fieldErrors.fullDesc && (
                <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.fullDesc}</span>
                </p>
              )}
            </div>

            {/* Custom Product FAQs */}
            <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <FormLabel
                  label="Product FAQs"
                  icon={HelpCircle}
                />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-zinc-400 bg-[#1c1c1c] border border-[#2c2c2c] px-2 py-0.5 rounded-full">
                    {faqs.length} / 5
                  </span>
                  {faqs.length < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddFaq();
                        clearFieldError('faqs');
                      }}
                      className="btn-secondary px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-[#252525] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  )}
                </div>
              </div>

              {fieldErrors.faqs && (
                <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.faqs}</span>
                </p>
              )}

              {faqs.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-[#111111] border border-dashed border-[#262626] text-center space-y-1">
                  <p className="text-xs text-zinc-400">No custom FAQs added.</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddFaq();
                      clearFieldError('faqs');
                    }}
                    className="mt-1 text-xs text-white hover:text-zinc-300 font-medium inline-flex items-center gap-1 underline underline-offset-4"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add question</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#111111] border border-[#2a2a2a] space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                          FAQ #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveFaq(idx);
                            clearFieldError('faqs');
                          }}
                          className="text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                          title="Remove FAQ item"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Question (e.g. Does this plugin include dry/wet mix presets?)"
                          value={faq.question}
                          onChange={(e) => {
                            handleFaqChange(idx, 'question', e.target.value);
                            clearFieldError('faqs');
                          }}
                          className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-[#42454e] transition-colors"
                        />
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          placeholder="Answer (clear, helpful answer for prospective buyers)..."
                          value={faq.answer}
                          onChange={(e) => {
                            handleFaqChange(idx, 'answer', e.target.value);
                            clearFieldError('faqs');
                          }}
                          className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg p-3 text-xs text-white placeholder-zinc-600 focus:border-[#42454e] transition-colors resize-y leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  Artwork & Video Walkthrough
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">Step 2 of 5</span>
            </div>

            {/* Cover Artwork Dual Mode with Integrated Live Preview */}
            <div className="w-full min-w-0">
              <DualAssetUploadInput
                label="Cover Artwork *"
                info="600×600 px square PNG or WebP required"
                value={coverImage}
                onChange={(val) => {
                  setCoverImage(val);
                  clearFieldError('coverImage');
                }}
                assetCategory="cover"
                accept="image/png,image/jpeg,image/webp"
                placeholder="https://.../cover.png or /products/proverb.png"
                icon={ImageIcon}
                thumbnailUrl={coverImage}
                hasError={Boolean(fieldErrors.coverImage)}
                errorMessage={fieldErrors.coverImage}
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
              <div className="flex items-center justify-between">
                <FormLabel
                  label="Video Walkthrough (YouTube Only) *"
                  info="YouTube video link embedded on product details page"
                  icon={Video}
                />
                <span className="text-[10px] font-mono text-zinc-400 bg-[#161616] border border-[#262626] px-2 py-0.5 rounded">
                  Required
                </span>
              </div>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  clearFieldError('youtubeUrl');
                }}
                className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors font-mono ${
                  fieldErrors.youtubeUrl
                    ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                    : 'border-[#2e2e2e] focus:border-[#42454e]'
                }`}
              />
              {fieldErrors.youtubeUrl ? (
                <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 text-[#ff4053]" />
                  <span>{fieldErrors.youtubeUrl}</span>
                </p>
              ) : (
                <p className="text-[10px] text-zinc-500">
                  Only YouTube URLs are accepted (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)
                </p>
              )}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Product Installers *
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-[#161616] border border-[#262626] px-2 py-0.5 rounded">
                  {productType === 'plugin' ? 'At least 1 installer required (Win or Mac)' : 'Download package required'}
                </span>
              </div>

              {fieldErrors.installers && (
                <div className="p-2.5 rounded-xl bg-[#ff4053]/10 border border-[#ff4053]/30 text-[#ff4053] text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#ff4053]" />
                  <span>{fieldErrors.installers}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 w-full pt-1">
                <div className="min-w-0 w-full overflow-hidden">
                  <DualAssetUploadInput
                    label="Windows Installer"
                    info="64-bit VST3 installer or archive (.exe / .zip)"
                    value={downloadUrlWin}
                    onChange={(val) => {
                      setDownloadUrlWin(val);
                      clearFieldError('installers');
                    }}
                    onFileSizeDetected={setFileSize}
                    assetCategory="win_installer"
                    accept=".exe,.zip,.msi"
                    placeholder="https://.../Setup-Win-x64.exe"
                    icon={Monitor}
                    hasError={Boolean(fieldErrors.installers && !downloadUrlWin && !downloadUrlMac)}
                  />
                </div>

                <div className="min-w-0 w-full overflow-hidden">
                  <DualAssetUploadInput
                    label="macOS Installer"
                    info="Universal package (.pkg / .dmg) for Apple Silicon & Intel"
                    value={downloadUrlMac}
                    onChange={(val) => {
                      setDownloadUrlMac(val);
                      clearFieldError('installers');
                    }}
                    onFileSizeDetected={setFileSize}
                    assetCategory="mac_installer"
                    accept=".pkg,.dmg,.zip"
                    placeholder="https://.../Universal-macOS.pkg"
                    icon={Download}
                    hasError={Boolean(fieldErrors.installers && !downloadUrlWin && !downloadUrlMac)}
                  />
                </div>
              </div>
            </div>

            {/* Universal Archive & Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262626] min-w-0 w-full">
              <div className="min-w-0 w-full overflow-hidden">
                <DualAssetUploadInput
                  label="Universal Archive"
                  info="Cross-platform ZIP containing sample libraries, WAV files, or presets"
                  value={downloadUrl}
                  onChange={(val) => {
                    setDownloadUrl(val);
                    clearFieldError('installers');
                  }}
                  onFileSizeDetected={setFileSize}
                  assetCategory="universal_zip"
                  accept=".zip,.rar,.7z"
                  placeholder="https://.../presets.zip"
                  hasError={Boolean(fieldErrors.installers && !downloadUrl && !downloadUrlWin && !downloadUrlMac)}
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
                  label="Operating System *"
                  info="System requirements (e.g. Windows 10/11 64-bit, macOS 12+)"
                />
                <input
                  type="text"
                  value={operatingSystem}
                  onChange={(e) => {
                    setOperatingSystem(e.target.value);
                    clearFieldError('operatingSystem');
                  }}
                  className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors ${
                    fieldErrors.operatingSystem
                      ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                      : 'border-[#2e2e2e] focus:border-[#42454e]'
                  }`}
                />
                {fieldErrors.operatingSystem && (
                  <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.operatingSystem}</span>
                  </p>
                )}
              </div>

              <div>
                <FormLabel
                  label="Supported DAWs *"
                  info="Compatible workstations (e.g. Ableton Live, FL Studio, Logic Pro)"
                />
                <input
                  type="text"
                  value={supportedDaws}
                  onChange={(e) => {
                    setSupportedDaws(e.target.value);
                    clearFieldError('supportedDaws');
                  }}
                  className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors ${
                    fieldErrors.supportedDaws
                      ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                      : 'border-[#2e2e2e] focus:border-[#42454e]'
                  }`}
                />
                {fieldErrors.supportedDaws && (
                  <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.supportedDaws}</span>
                  </p>
                )}
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
                    label="Version Number *"
                    info="Semantic version (SemVer). Updates preserve active buyer licenses automatically"
                  />
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={version}
                    onChange={(e) => {
                      setVersion(e.target.value);
                      clearFieldError('version');
                    }}
                    className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs font-mono text-white transition-colors ${
                      fieldErrors.version
                        ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                        : 'border-[#2e2e2e] focus:border-[#42454e]'
                    }`}
                  />
                  {fieldErrors.version && (
                    <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{fieldErrors.version}</span>
                    </p>
                  )}
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
                      label="Plugin Formats *"
                      info="Supported architectures (e.g. VST3, AU, AAX, CLAP 64-bit)"
                    />
                    <input
                      type="text"
                      value={vstFormat}
                      onChange={(e) => {
                        setVstFormat(e.target.value);
                        clearFieldError('vstFormat');
                      }}
                      className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors ${
                        fieldErrors.vstFormat
                          ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                          : 'border-[#2e2e2e] focus:border-[#42454e]'
                      }`}
                    />
                    {fieldErrors.vstFormat && (
                      <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.vstFormat}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <FormLabel
                      label="Identifier *"
                      info="Unique reverse-domain identifier (e.g. com.brand.plugin)"
                    />
                    <input
                      type="text"
                      value={pluginIdentifier}
                      onChange={(e) => {
                        setPluginIdentifier(e.target.value);
                        clearFieldError('pluginIdentifier');
                      }}
                      className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs font-mono text-white transition-colors ${
                        fieldErrors.pluginIdentifier
                          ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                          : 'border-[#2e2e2e] focus:border-[#42454e]'
                      }`}
                    />
                    {fieldErrors.pluginIdentifier && (
                      <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.pluginIdentifier}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FormLabel
                      label="Machine Seats *"
                      info="Maximum concurrent device activations permitted per purchase"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={maxSeats}
                      onChange={(e) => {
                        setMaxSeats(parseInt(e.target.value) || 1);
                        clearFieldError('maxSeats');
                      }}
                      className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs font-mono text-white transition-colors ${
                        fieldErrors.maxSeats
                          ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                          : 'border-[#2e2e2e] focus:border-[#42454e]'
                      }`}
                    />
                    {fieldErrors.maxSeats && (
                      <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.maxSeats}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <FormLabel
                      label="Offline Grace *"
                      info="Number of days the plugin can operate offline before periodic ping"
                    />
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={offlineGraceDays}
                      onChange={(e) => {
                        setOfflineGraceDays(parseInt(e.target.value) || 1);
                        clearFieldError('offlineGraceDays');
                      }}
                      className={`w-full bg-[#121212] border rounded-xl px-3.5 py-2.5 text-xs font-mono text-white transition-colors ${
                        fieldErrors.offlineGraceDays
                          ? 'border-[#ff4053] focus:border-[#ff4053] bg-[#ff4053]/5'
                          : 'border-[#2e2e2e] focus:border-[#42454e]'
                      }`}
                    />
                    {fieldErrors.offlineGraceDays && (
                      <p className="text-[11px] text-[#ff4053] font-medium flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.offlineGraceDays}</span>
                      </p>
                    )}
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

            {/* 3D WheelPicker Product Release Scheduler */}
            <ProductReleaseScheduler
              initialReleaseDate={releaseDate}
              initialIsComingSoon={isComingSoon}
              initialIsActive={isActive}
              onChange={({ releaseDate: newRelDate, isComingSoon: newCs, isActive: newAct }) => {
                setReleaseDate(newRelDate);
                setIsComingSoon(newCs);
                setIsActive(newAct);
              }}
            />



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
                onClick={() => {
                  setErrorMsg('');
                  setActiveStep((prev) => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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
                onClick={handleNextStep}
                className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Continue: {STEPS[activeStep]?.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleSubmit()}
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

      {/* Prody AI Copilot Modal */}
      <ProdyCopilotModal
        isOpen={showProdyModal}
        onClose={() => setShowProdyModal(false)}
        brandName={brand?.name}
        currentFormValues={{
          name,
          slug,
          productType,
          categorySlug: categoriesList.find((c) => c.id === categoryId)?.slug || (productType === 'sample_pack' ? 'sample-pack' : 'plugin'),
          subcategoryName: subcategoriesList.find((s) => s.id === subcategoryId)?.name,
          selectedGenres,
          priceUsd,
          originalPriceUsd,
          shortDesc,
          fullDesc,
          vstFormat,
          externalUrl: '',
        }}
        onApplyProduct={handleApplyProdyProduct}
      />
    </div>
    </RoleGate>
  );
}
