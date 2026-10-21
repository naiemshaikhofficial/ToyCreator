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
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { brand } = useBrand();
  const productId = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
        vst_format: vstFormat.trim() || null,
        max_activation_seats: Number(maxSeats),
        offline_grace_days: Number(offlineGraceDays),
        is_active: isActive,
      });

      setSuccessMsg('Product updated successfully in database.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMsg(err.message || 'Failed to update product in Supabase.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        Loading product details from Supabase...
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
      {/* Header */}
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
            <span>Live Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
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
        {/* Core Specs */}
        <div className="toy-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-zinc-300" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Product Details & Pricing
              </h2>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">
              ID: {product.id.slice(0, 8)}...
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Product Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Marketplace Slug (Fixed)
              </label>
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
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Selling Price (USD)
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
                Original Price (USD)
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
              Short Description
            </label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Full Description & Technical Specifications
            </label>
            <textarea
              rows={6}
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3.5 text-xs text-white focus:border-[#42454e] transition-colors resize-y"
            />
          </div>
        </div>

        {/* Licensing & Hardware Config */}
        {product.product_type === 'plugin' && (
          <div className="toy-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
              <Cpu className="w-4 h-4 text-zinc-300" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                VST Licensing & Machine Seats
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Plugin Identifier
                </label>
                <input
                  type="text"
                  disabled
                  value={product.plugin_identifier || 'None assigned'}
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Formats
                </label>
                <input
                  type="text"
                  value={vstFormat}
                  onChange={(e) => setVstFormat(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Max Activation Seats
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
                  Offline Grace Days
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
          </div>
        )}

        {/* Media & URLs */}
        <div className="toy-card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Cover Image URL
              </label>
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-lg bg-[#141414] border border-[#2a2a2a] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = '/icon.png';
                      }}
                    />
                  ) : (
                    <Package className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://... or /products/proverb.png"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Demo Audio Preview URL
              </label>
              <input
                type="text"
                value={demoAudioUrl}
                onChange={(e) => setDemoAudioUrl(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Secure Download File / Cloud Link
            </label>
            <input
              type="text"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded bg-[#121212] border-[#2e2e2e] text-[#34363d] focus:ring-zinc-600"
            />
            <label htmlFor="isActiveEdit" className="text-xs text-zinc-300 font-medium cursor-pointer">
              Product is active and visible to buyers on ProducerToy
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/products"
            className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-semibold"
          >
            Cancel
          </Link>
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
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
