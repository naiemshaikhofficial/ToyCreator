'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import { getBrandProducts, updateBrandProduct } from '@/lib/supabase/actions';
import {
  Package,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit,
  Key,
  Clock,
  BarChart3,
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';

/** Extract short concise product name (e.g., 'ProVerb — AI...' -> 'ProVerb') */
function cleanProductName(name: string): string {
  if (!name) return '';
  const parts = name.split(/\s*[-—:|]\s*/);
  if (parts[0] && parts[0].trim().length > 0) {
    return parts[0].trim();
  }
  return name.trim();
}

function ProductsListInner() {
  const { brand } = useBrand();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(() => typeParam || 'all');

  useEffect(() => {
    if (typeParam) {
      setSelectedType(typeParam);
    }
  }, [typeParam]);

  const loadProducts = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const data = await getBrandProducts(brand.id);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [brand?.id]);

  const toggleProductActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateBrandProduct(id, { is_active: !currentStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === 'all' || p.product_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <RoleGate allowedRoles={['owner', 'admin', 'developer']} sectionName="Audio Products Catalog">
      <div className="space-y-6 font-sans">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#181818] border border-[#2a2a2a] p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search products by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:border-[#42454e] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-[#42454e] transition-colors"
          >
            <option value="all">All Audio Types</option>
            <option value="plugin">VST / AU Plugins</option>
            <option value="sample_pack">Sample Packs</option>
            <option value="preset">Synth Presets</option>
            <option value="template">DAW Templates</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="toy-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Loading audio products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No products found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery || selectedType !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'Start publishing your first audio instrument or sample pack today.'}
            </p>
            <Link
              href="/dashboard/products/new"
              className="inline-flex btn-primary px-4 py-2 text-xs font-semibold rounded-lg mt-2"
            >
              + Create Product
            </Link>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[31%]" />
                <col className="w-[11%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]/50 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Formats & Specs</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1a1a1a]/70 transition-colors">
                    {/* Product Name & Cover */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#141414] border border-[#2a2a2a] overflow-hidden shrink-0 flex items-center justify-center">
                          {p.cover_image ? (
                            <img
                              src={p.cover_image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e: any) => {
                                e.target.src = '/Icon.webp';
                              }}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Link
                              href={`/dashboard/products/${p.id}`}
                              className="font-semibold text-white hover:text-zinc-300 transition-colors truncate"
                              title={p.name}
                            >
                              {cleanProductName(p.name)}
                            </Link>
                            <span className="text-[10px] font-mono text-zinc-400 bg-[#202020] px-1.5 py-0.5 rounded border border-zinc-700/40 shrink-0">
                              v{p.version || '1.0.0'}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-500 truncate block" title={`/${p.slug}`}>
                            /{p.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-3">
                      <span className="toy-badge toy-badge-zinc capitalize text-[10px] truncate max-w-full">
                        {p.product_type?.replace('_', ' ') || 'Plugin'}
                      </span>
                    </td>

                    {/* Formats & Specs */}
                    <td className="py-3.5 px-3 text-zinc-300 min-w-0">
                      <p className="truncate text-xs" title={p.vst_format || p.operating_system || 'Standard Audio'}>
                        {p.vst_format || p.operating_system || 'Standard Audio'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {p.download_url_win && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-zinc-300 border border-zinc-700/50 shrink-0">
                            WIN
                          </span>
                        )}
                        {p.download_url_mac && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-zinc-300 border border-zinc-700/50 shrink-0">
                            MAC
                          </span>
                        )}
                        {p.max_activation_seats && (
                          <span className="text-[10px] text-zinc-500 font-mono truncate">
                            {p.max_activation_seats} seats
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                      {parseFloat(p.price_usd) === 0
                        ? 'FREE'
                        : `$${parseFloat(p.price_usd).toFixed(2)}`}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 min-w-0">
                      <div className="flex flex-col gap-1 items-start min-w-0">
                        <button
                          onClick={() => toggleProductActive(p.id, p.is_active)}
                          className={`toy-badge cursor-pointer transition-colors text-[10px] ${
                            p.is_active ? 'toy-badge-charcoal' : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                          }`}
                          title="Click to toggle active/inactive"
                        >
                          {p.is_active ? 'Active' : 'Draft'}
                        </button>
                        {p.release_date && new Date(p.release_date).getTime() > Date.now() && (
                          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#202020] text-zinc-300 border border-zinc-700/60 truncate max-w-full flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                            <span className="truncate">Launch: {new Date(p.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                        )}
                        {!p.download_url && !p.download_url_win && !p.download_url_mac && !p.external_url && (
                          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-[#ff4053] text-black whitespace-nowrap uppercase tracking-wider">
                            No Files
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/analytics?productId=${p.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#282828] transition-colors"
                          title="Product Analytics & Telemetry"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/dashboard/products/${p.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#282828] transition-colors"
                          title="Manage License Pool & Serials"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/dashboard/products/${p.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#282828] transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <a
                          href={`https://producertoy.com/product/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#282828] transition-colors"
                          title="View on Live Marketplace"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </RoleGate>
  );
}

export default function ProductsListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-zinc-500">Loading catalog...</div>}>
      <ProductsListInner />
    </Suspense>
  );
}
