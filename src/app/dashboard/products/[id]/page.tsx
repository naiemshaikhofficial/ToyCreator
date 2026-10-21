'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { getProductById, updateBrandProduct } from '@/lib/supabase/actions';
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
} from 'lucide-react';
import SerialKeyPoolManager from '@/components/SerialKeyPoolManager';
import DualAssetUploadInput from '@/components/DualAssetUploadInput';

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
  const [priceUsd, setPriceUsd] = useState('');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [demoAudioUrl, setDemoAudioUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadUrlWin, setDownloadUrlWin] = useState('');
  const [downloadUrlMac, setDownloadUrlMac] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [changelog, setChangelog] = useState('');
  const [supportedDaws, setSupportedDaws] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [vstFormat, setVstFormat] = useState('');
  const [maxSeats, setMaxSeats] = useState(3);
  const [offlineGraceDays, setOfflineGraceDays] = useState(14);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setLoading(true);
      try {
        const data = await getProductById(productId);
        if (data) {
          setProduct(data);
          setName(data.name || '');
          setPriceUsd(data.price_usd?.toString() || '0');
          setOriginalPriceUsd(data.original_price_usd?.toString() || '');
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
          setChangelog(data.changelog || '');
          setSupportedDaws(data.supported_daws || '');
          setOperatingSystem(data.operating_system || '');
          setVstFormat(data.vst_format || '');
          setMaxSeats(data.max_activation_seats || 3);
          setOfflineGraceDays(data.offline_grace_days || 14);
          setIsActive(data.is_active ?? true);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const targetId = product?.id || productId;
      await updateBrandProduct(targetId, {
        name: name.trim(),
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
        version: version.trim() || '1.0.0',
        changelog: changelog.trim() || null,
        supported_daws: supportedDaws.trim() || null,
        operating_system: operatingSystem.trim() || null,
        vst_format: vstFormat.trim() || null,
        max_activation_seats: Number(maxSeats),
        offline_grace_days: Number(offlineGraceDays),
        is_active: isActive,
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
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
      <form onSubmit={handleSave} className="space-y-6">
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
            </div>
          </div>
        )}

        {/* STEP 4: Licensing & Serials */}
        {activeStep === 4 && (
          <div className="space-y-6">
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

            {/* Embedded Serial Key Pool */}
            <SerialKeyPoolManager
              productId={product.id}
              productName={product.name}
            />
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
                className="w-5 h-5 rounded bg-[#181818] border-[#34363d] text-[#34363d] focus:ring-zinc-600 cursor-pointer"
              />
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
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg uppercase tracking-wider"
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
      </form>
    </div>
  );
}
