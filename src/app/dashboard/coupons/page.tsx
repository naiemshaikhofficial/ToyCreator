'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useBrand } from '@/context/BrandContext';
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Calendar,
  Layers,
  Users,
  Percent,
  DollarSign,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';
import {
  getBrandCouponsAction,
  getBrandProductsForCouponsAction,
  createCouponAction,
  toggleCouponStatusAction,
  deleteCouponAction,
  CouponItem,
} from '@/actions/couponActions';

export default function CouponsPage() {
  const { brand } = useBrand();

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; price_usd: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'percentage' | 'fixed' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountPercent, setFormDiscountPercent] = useState('20');
  const [formDiscountAmount, setFormDiscountAmount] = useState('10.00');
  const [formProductId, setFormProductId] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formMaxRedemptions, setFormMaxRedemptions] = useState('');

  const loadData = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const [couponsRes, prodsData] = await Promise.all([
        getBrandCouponsAction(brand.id),
        getBrandProductsForCouponsAction(brand.id),
      ]);
      if (couponsRes.success) {
        setCoupons(couponsRes.coupons);
      }
      setProducts(prodsData);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [brand?.id]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateRandomCode = () => {
    const prefixes = ['PROMO', 'DEAL', 'VIP', 'FLASH', 'SAVE'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setFormCode(`${p}${num}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand?.id) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await createCouponAction({
        brandId: brand.id,
        code: formCode,
        discountType: formDiscountType,
        discountPercent: formDiscountType === 'percentage' ? Number(formDiscountPercent) : undefined,
        discountAmountUsd: formDiscountType === 'fixed' ? Number(formDiscountAmount) : undefined,
        productId: formProductId || null,
        expiresAt: formExpiresAt || null,
        maxRedemptions: formMaxRedemptions ? Number(formMaxRedemptions) : null,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create coupon.');
        return;
      }

      setSuccessMsg(`Offer code "${res.coupon?.code}" created successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormDiscountType('percentage');
    setFormDiscountPercent('20');
    setFormDiscountAmount('10.00');
    setFormProductId('');
    setFormExpiresAt('');
    setFormMaxRedemptions('');
    setErrorMsg('');
  };

  const handleToggleStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, is_active: !currentStatus } : c))
      );
      const res = await toggleCouponStatusAction(couponId, currentStatus);
      if (!res.success) {
        loadData();
      }
    } catch (err) {
      loadData();
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this offer code? This cannot be undone.')) return;
    try {
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      await deleteCouponAction(couponId);
    } catch (err) {
      loadData();
    }
  };

  // Filtered
  const filteredCoupons = coupons.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = c.code.toLowerCase().includes(q);
      const prodMatch = c.products?.name?.toLowerCase().includes(q);
      if (!codeMatch && !prodMatch) return false;
    }

    if (filterType === 'percentage' && c.discount_type !== 'percentage') return false;
    if (filterType === 'fixed' && c.discount_type !== 'fixed') return false;
    if (filterType === 'active' && !c.is_active) return false;

    return true;
  });

  const activeCount = coupons.filter((c) => c.is_active).length;
  const totalRedeemed = coupons.reduce((acc, c) => acc + (c.times_redeemed || 0), 0);

  return (
    <RoleGate allowedRoles={['owner', 'admin', 'developer', 'finance']} sectionName="Offers & Discounts">
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Tag className="w-5 h-5 text-white" />
              <span>Offers & Discounts</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Create promotional coupon codes, flash discounts, and custom pricing incentives for {brand?.name || 'your catalog'}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              generateRandomCode();
              setIsModalOpen(true);
            }}
            className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Offer / Coupon</span>
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="toy-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-zinc-200" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Active Promo Deals
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-white">{activeCount}</span>
                <span className="text-[11px] text-zinc-400 font-mono">/ {coupons.length} total</span>
              </div>
            </div>
          </div>

          <div className="toy-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-zinc-200" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Total Redemptions
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-white">{totalRedeemed}</span>
                <span className="text-[11px] text-zinc-400">checkouts used</span>
              </div>
            </div>
          </div>

          <div className="toy-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center flex-shrink-0">
              <Percent className="w-5 h-5 text-zinc-200" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Storefront Integration
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-semibold text-zinc-200">Instant Checkout Apply</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="toy-card p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Offers' },
              { id: 'percentage', label: 'Percentage (%)' },
              { id: 'fixed', label: 'Fixed Off ($)' },
              { id: 'active', label: 'Active Only' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-[#282828] text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search code or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Coupon Listing Table */}
        <div className="toy-card overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <span>Loading offers & discount coupons...</span>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-400 space-y-2">
              <Tag className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-medium text-white">No promotional offers found</p>
              <p className="text-zinc-500 text-[11px] max-w-sm mx-auto">
                {searchQuery || filterType !== 'all'
                  ? 'No coupons match your current filter or search criteria.'
                  : 'Start offering promo codes to boost conversion rates on producertoy.com'}
              </p>
              {!searchQuery && filterType === 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    generateRandomCode();
                    setIsModalOpen(true);
                  }}
                  className="btn-primary mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Coupon</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#242424] bg-[#121212]/50 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Applicable Scope</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Expiration</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {filteredCoupons.map((c) => {
                    const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
                    const isLimitReached = c.max_redemptions ? c.times_redeemed >= c.max_redemptions : false;

                    return (
                      <tr key={c.id} className="hover:bg-[#161616] transition-colors group">
                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className="bg-[#1b1b1b] border border-[#2e2e2e] px-2.5 py-1 rounded-md text-xs tracking-wider">
                              {c.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(c.code)}
                              title="Copy code"
                              className="text-zinc-500 hover:text-white transition-colors"
                            >
                              {copiedCode === c.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Discount */}
                        <td className="py-3.5 px-4">
                          {c.discount_type === 'fixed' ? (
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <DollarSign className="w-3 h-3" />
                              <span>${Number(c.discount_amount_usd || 0).toFixed(2)} OFF</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                              <Percent className="w-3 h-3" />
                              <span>{c.discount_percent}% OFF</span>
                            </span>
                          )}
                        </td>

                        {/* Applicable Scope */}
                        <td className="py-3.5 px-4">
                          {c.products ? (
                            <div className="flex items-center gap-2 max-w-[220px]">
                              {c.products.cover_image && (
                                <img
                                  src={c.products.cover_image}
                                  alt=""
                                  className="w-6 h-6 rounded object-cover border border-[#2c2c2c] flex-shrink-0"
                                />
                              )}
                              <span className="truncate text-zinc-200 font-medium" title={c.products.name}>
                                {c.products.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 font-mono text-[11px] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#2a2a2a]">
                              Entire Catalog (All Products)
                            </span>
                          )}
                        </td>

                        {/* Redemptions */}
                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{c.times_redeemed}</span>
                            <span className="text-zinc-500">
                              {c.max_redemptions ? `/ ${c.max_redemptions}` : '(unlimited)'}
                            </span>
                          </div>
                          {isLimitReached && (
                            <span className="text-[10px] text-amber-400 block mt-0.5">Limit reached</span>
                          )}
                        </td>

                        {/* Expiration */}
                        <td className="py-3.5 px-4 text-zinc-400">
                          {c.expires_at ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                              <span
                                className={`text-[11px] font-mono ${
                                  isExpired ? 'text-red-400 font-semibold' : 'text-zinc-300'
                                }`}
                              >
                                {new Date(c.expires_at).toLocaleDateString()}
                              </span>
                              {isExpired && (
                                <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-mono">
                                  Expired
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[11px] font-mono">No Expiration</span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(c.id, c.is_active)}
                            disabled={isExpired}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative inline-flex items-center ${
                              c.is_active && !isExpired ? 'bg-white' : 'bg-[#2a2a2a]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full transition-transform transform ${
                                c.is_active && !isExpired
                                  ? 'translate-x-4 bg-black'
                                  : 'translate-x-0 bg-zinc-400'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Delete Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Coupon Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="toy-card bg-[#141414] max-w-lg w-full p-6 space-y-4 border border-[#2c2c2c] shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Create New Offer / Coupon
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                {/* Coupon Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Coupon Code *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Random Code</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#101010] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white uppercase tracking-wider focus:border-zinc-400 transition-colors"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Discount Structure *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormDiscountType('percentage')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        formDiscountType === 'percentage'
                          ? 'bg-white text-black border-white'
                          : 'bg-[#101010] text-zinc-400 border-[#2a2a2a] hover:text-white'
                      }`}
                    >
                      <Percent className="w-4 h-4" />
                      <span>Percentage Off (%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormDiscountType('fixed')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        formDiscountType === 'fixed'
                          ? 'bg-white text-black border-white'
                          : 'bg-[#101010] text-zinc-400 border-[#2a2a2a] hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Fixed Amount ($)</span>
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    {formDiscountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (USD $) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-xs font-mono">
                      {formDiscountType === 'percentage' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      step={formDiscountType === 'percentage' ? '1' : '0.01'}
                      min={formDiscountType === 'percentage' ? '1' : '0.50'}
                      max={formDiscountType === 'percentage' ? '100' : '999'}
                      required
                      value={formDiscountType === 'percentage' ? formDiscountPercent : formDiscountAmount}
                      onChange={(e) =>
                        formDiscountType === 'percentage'
                          ? setFormDiscountPercent(e.target.value)
                          : setFormDiscountAmount(e.target.value)
                      }
                      className="w-full bg-[#101010] border border-[#2e2e2e] rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono text-white focus:border-zinc-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Scope: Specific Product or All */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Applicable Products
                  </label>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full bg-[#101010] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-zinc-400 transition-colors"
                  >
                    <option value="">All Brand Products (Entire Catalog)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${Number(p.price_usd).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry & Max Redemptions Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className="w-full bg-[#101010] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-zinc-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Max Redemptions (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 100 (Blank = Unlimited)"
                      value={formMaxRedemptions}
                      onChange={(e) => setFormMaxRedemptions(e.target.value)}
                      className="w-full bg-[#101010] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-zinc-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242424]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#2a2a2a] text-zinc-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Offer...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Activate Offer Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
