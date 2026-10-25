'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import { getBrandFullAnalyticsAction, BrandAnalyticsData } from '@/actions/analyticsActions';
import {
  TrendingUp,
  Download,
  Package,
  RefreshCw,
  ShoppingCart,
  Eye,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ProductTrafficInteractivePie } from '@/components/ui/charts/ProductTrafficInteractivePie';

/** Extract clean short product name */
function cleanProductName(name: string): string {
  if (!name) return '';
  const parts = name.split(/\s*[-—:|]\s*/);
  if (parts[0] && parts[0].trim().length > 0) {
    return parts[0].trim();
  }
  return name.trim();
}

function AnalyticsContent() {
  const { brand } = useBrand();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<BrandAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('28d');

  // Currently selected product
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    return searchParams.get('productId') || null;
  });

  const loadAnalytics = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const res = await getBrandFullAnalyticsAction(brand.id);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [brand?.id]);

  useEffect(() => {
    const pId = searchParams.get('productId');
    if (pId) {
      setSelectedProductId(pId);
    }
  }, [searchParams]);

  const grossRevenue = data?.grossRevenue ?? 0;
  const netEarnings = data?.netRoyalty70 ?? 0;
  const totalVolume = data?.totalUnits ?? 0;
  const products = data?.products || [];
  const purchases = data?.purchases || [];
  const activations = data?.activations || [];
  const analyticsEvents = data?.analyticsEvents || [];

  // Active selected product
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Real product-level metrics
  const productMetricsList = useMemo(() => {
    return products.map((p) => {
      const pPurchases = purchases.filter((ord) => ord.product_id === p.id);
      const units = pPurchases.length;
      const rev = pPurchases.reduce((acc, ord) => {
        const isUsd = ord.currency === 'USD' || (!ord.currency && ord.paypal_order_id);
        const amt = parseFloat(ord.amount_paid) || parseFloat(p.price_usd) || 0;
        return isUsd ? acc + amt : acc;
      }, 0);

      const pEvents = analyticsEvents.filter((e) => e.product_id === p.id);
      const views = pEvents.filter((e) => e.event_type === 'view').length;
      const carts = pEvents.filter((e) => e.event_type === 'cart_add').length;
      const clicks = pEvents.filter((e) => e.event_type === 'external_click').length;

      return {
        ...p,
        unitsSold: units,
        revenue: Number(rev.toFixed(2)),
        netShare: Number((rev * 0.7).toFixed(2)),
        views,
        carts,
        clicks,
      };
    }).sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);
  }, [products, purchases, analyticsEvents]);

  // Selected product stats
  const activeProductStats = useMemo(() => {
    if (!selectedProduct) return null;
    return productMetricsList.find((p) => p.id === selectedProduct.id) || null;
  }, [selectedProduct, productMetricsList]);

  // Overall catalog real totals
  const totalViews = useMemo(() => {
    return productMetricsList.reduce((acc, p) => acc + p.views, 0);
  }, [productMetricsList]);

  const totalCarts = useMemo(() => {
    return productMetricsList.reduce((acc, p) => acc + p.carts, 0);
  }, [productMetricsList]);

  const totalClicks = useMemo(() => {
    return productMetricsList.reduce((acc, p) => acc + p.clicks, 0);
  }, [productMetricsList]);

  // Real Daily Timeline: Computed strictly from real purchases
  const dailyTimelineData = useMemo(() => {
    const targetPurchases = selectedProduct
      ? purchases.filter((ord) => ord.product_id === selectedProduct.id)
      : purchases;

    if (targetPurchases.length === 0) {
      return [];
    }

    const dateMap = new Map<string, { revenue: number; sales: number }>();
    targetPurchases.forEach((p) => {
      const isUsd = p.currency === 'USD' || (!p.currency && p.paypal_order_id);
      const amt = isUsd ? (parseFloat(p.amount_paid) || (p.products?.price_usd ? parseFloat(p.products.price_usd) : 0)) : 0;
      const dateStr = p.purchased_at
        ? new Date(p.purchased_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recent';

      const existing = dateMap.get(dateStr) || { revenue: 0, sales: 0 };
      existing.revenue += amt;
      existing.sales += 1;
      dateMap.set(dateStr, existing);
    });

    return Array.from(dateMap.entries()).map(([name, val]) => ({
      name,
      revenue: parseFloat(val.revenue.toFixed(2)),
      sales: val.sales,
    }));
  }, [selectedProduct, purchases]);

  // Real traffic pie segments
  const trafficPieData = useMemo(() => {
    const isSingle = Boolean(selectedProduct && activeProductStats);
    const carts = isSingle ? activeProductStats!.carts : totalCarts;
    const clicks = isSingle ? activeProductStats!.clicks : totalClicks;
    const views = isSingle ? activeProductStats!.views : totalViews;
    const units = isSingle ? activeProductStats!.unitsSold : totalVolume;

    const items = [
      { key: 'carts', label: 'Added to Cart', count: carts, color: '#38bdf8' },
      { key: 'clicks', label: 'Link Clicks', count: clicks, color: '#a855f7' },
      { key: 'views', label: 'Store Views', count: views, color: '#10b981' },
      { key: 'orders', label: 'Orders Placed', count: units, color: '#ffffff' },
    ];

    const sum = items.reduce((acc, cur) => acc + cur.count, 0);
    return items.map((i) => ({
      ...i,
      sharePercent: sum > 0 ? Math.round((i.count / sum) * 100) : 0,
    }));
  }, [selectedProduct, activeProductStats, totalCarts, totalClicks, totalViews, totalVolume]);

  return (
    <RoleGate allowedRoles={['owner', 'admin', 'finance']} sectionName="Sales & Financial Analytics">
      <div className="space-y-6 font-sans">
        {/* Minimalist Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Left: Product Identity or Catalog Overview */}
          <div className="flex items-center gap-3 min-w-0">
            {selectedProduct ? (
              <>
                <button
                  onClick={() => {
                    setSelectedProductId(null);
                    router.push('/dashboard/analytics');
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#181818] transition shrink-0"
                  title="All Products"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="w-8 h-8 rounded-lg bg-[#161616] border border-[#2a2a2a] overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedProduct.cover_image ? (
                    <img
                      src={selectedProduct.cover_image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = '/icon.png';
                      }}
                    />
                  ) : (
                    <Package className="w-4 h-4 text-zinc-500" />
                  )}
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-white text-sm sm:text-base tracking-tight truncate">
                    {cleanProductName(selectedProduct.name)}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#2a2a2a] shrink-0">
                    v{selectedProduct.version || '1.0.0'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0 hidden md:inline">
                    {parseFloat(selectedProduct.price_usd) === 0 ? 'FREE' : `$${parseFloat(selectedProduct.price_usd).toFixed(2)}`}
                  </span>
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Overview</h1>
                <p className="text-xs text-zinc-500">Catalog performance & telemetry</p>
              </div>
            )}
          </div>

          {/* Right: Controls (Switcher, Timeframe, Live Store, Refresh) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <select
              value={selectedProductId || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setSelectedProductId(null);
                  router.push('/dashboard/analytics');
                } else {
                  setSelectedProductId(val);
                  router.push(`/dashboard/analytics?productId=${val}`);
                }
              }}
              className="bg-[#141414] border border-[#262626] hover:border-zinc-500 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {cleanProductName(p.name)}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-[#141414] border border-[#262626] p-0.5 rounded-lg text-xs">
              {['7d', '28d', '90d', 'all'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    timeRange === t ? 'bg-[#262626] text-white font-medium' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {selectedProduct && (
              <a
                href={`https://producertoy.com/product/${selectedProduct.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:text-white transition"
                title="View in Live Store"
              >
                <span>Live Store</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            )}

            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="btn-secondary p-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Creator Earnings (70%) */}
          <div className="toy-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Creator Royalty (70%)</span>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono mt-1">
              ${(selectedProduct ? (activeProductStats?.revenue || 0) * 0.7 : netEarnings).toFixed(2)}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono mt-1">
              Gross: ${(selectedProduct ? activeProductStats?.revenue || 0 : grossRevenue).toFixed(2)}
            </p>
          </div>

          {/* Card 2: Units Sold */}
          <div className="toy-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Orders Placed</span>
              <Package className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono mt-1">
              {selectedProduct ? activeProductStats?.unitsSold : totalVolume}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono mt-1">
              Verified customer purchases
            </p>
          </div>

          {/* Card 3: In Carts */}
          <div className="toy-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Added to Cart</span>
              <ShoppingCart className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono mt-1">
              {(selectedProduct ? activeProductStats?.carts : totalCarts) || 0}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono mt-1">
              Customer cart additions
            </p>
          </div>

          {/* Card 4: Store Views / Link Clicks */}
          <div className="toy-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {selectedProduct?.external_url ? 'External Clicks' : 'Store Views'}
              </span>
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono mt-1">
              {(selectedProduct ? (selectedProduct.external_url ? activeProductStats?.clicks : activeProductStats?.views) : totalViews) || 0}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono mt-1">
              {selectedProduct?.external_url ? 'Outbound link clicks' : 'Marketplace page visits'}
            </p>
          </div>
        </div>

        {/* Daily Sales Chart */}
        <div className="toy-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Daily Sales</h3>
              <p className="text-xs text-zinc-400">
                {selectedProduct
                  ? `Revenue trajectory for ${cleanProductName(selectedProduct.name)}.`
                  : 'Revenue trajectory across all verified orders.'}
              </p>
            </div>
          </div>

          <div className="h-60 sm:h-64 w-full pt-2">
            {dailyTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cleanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                  <XAxis dataKey="name" stroke="#666666" fontSize={11} tickLine={false} />
                  <YAxis stroke="#666666" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161616',
                      borderColor: '#2a2a2a',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cleanGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#262626] rounded-xl space-y-1">
                <Activity className="w-5 h-5 text-zinc-600" />
                <p className="text-xs text-zinc-300 font-medium">No sales recorded yet</p>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  Daily revenue points will display here as customers purchase on ProducerToy.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Engagement Breakdown */}
        <ProductTrafficInteractivePie
          title={selectedProduct ? `${cleanProductName(selectedProduct.name)} Engagement` : 'Cart & Action Breakdown'}
          subtitle="Cart additions, clicks, views and completed orders"
          data={trafficPieData}
        />

        {/* Product List Table (When viewing All Products) */}
        {!selectedProduct && (
          <div className="toy-card overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#242424]">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Catalog Telemetry</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Click any product to view its individual analytics.</p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{productMetricsList.length} Products</span>
            </div>

            <div className="w-full overflow-hidden">
              <table className="w-full text-left text-xs table-fixed">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#242424] bg-[#161616] text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">In Carts</th>
                    <th className="py-3 px-3">Orders</th>
                    <th className="py-3 px-3">Royalty (70%)</th>
                    <th className="py-3 px-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {productMetricsList.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        router.push(`/dashboard/analytics?productId=${p.id}`);
                      }}
                      className="hover:bg-[#181818] cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                            idx === 0 ? 'bg-white text-black' : 'bg-[#222222] text-zinc-400'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2a2a2a] overflow-hidden shrink-0 flex items-center justify-center">
                            {p.cover_image ? (
                              <img
                                src={p.cover_image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e: any) => {
                                  e.target.src = '/icon.png';
                                }}
                              />
                            ) : (
                              <Package className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                          <span className="font-semibold text-white group-hover:text-zinc-200 transition-colors truncate">
                            {cleanProductName(p.name)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="toy-badge toy-badge-zinc capitalize text-[10px]">
                          {p.product_type?.replace('_', ' ') || 'Plugin'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-sky-400">
                        {p.carts}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {p.unitsSold}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-white">
                        ${p.netShare.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="text-zinc-400 group-hover:text-white inline-flex items-center gap-1 font-medium transition text-xs">
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-zinc-500">Loading analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
