'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { getBrandFullAnalyticsAction, BrandAnalyticsData } from '@/actions/analyticsActions';
import {
  DollarSign,
  TrendingUp,
  Package,
  Plus,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { hasPermission, BrandRole, ROLE_BADGES } from '@/lib/rbac';
import { AreaSparkline, LineSparkline, BarSparkline } from '@/components/ui/charts/Sparklines';
import { TopProductsRevenueCard } from '@/components/ui/charts/TopProductsRevenueCard';

export default function DashboardOverviewPage() {
  const { brand, membership } = useBrand();
  const currentRole = membership?.role as BrandRole | undefined;
  const canManageProducts = hasPermission(currentRole, 'canManageProducts');
  const canViewEarnings = hasPermission(currentRole, 'canViewEarnings');
  const canViewOrders = hasPermission(currentRole, 'canViewOrders');
  const canManageLicensing = hasPermission(currentRole, 'canManageLicensing');
  const roleBadge = currentRole ? ROLE_BADGES[currentRole] : null;

  const [data, setData] = useState<BrandAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const res = await getBrandFullAnalyticsAction(brand.id);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [brand?.id]);

  const totalGrossRevenue = data?.grossRevenue ?? 0;
  const netEarnings = data?.netRoyalty70 ?? 0;
  const activeProductsCount = data?.activeProductsCount ?? 0;
  const activeDeviceSeats = data?.activeDeviceSeats ?? 0;
  const products = data?.products || [];
  const purchases = data?.purchases || [];
  const osTelemetry = data?.osTelemetry || [];
  const dawTelemetry = data?.dawTelemetry || [];
  const chartData = data?.revenueTimeline || [];

  // 100% Sales-Related Donut Distributions
  const salesByCategoryData = React.useMemo(() => {
    return [
      { label: 'Audio Plugins (VST3/AU)', value: 55, maxValue: 100, color: '#ffffff', subtitle: 'Virtual Instruments & Effects' },
      { label: 'Sample Packs & WAV Stems', value: 25, maxValue: 100, color: '#e4e4e7', subtitle: 'Drum Kits & Melodic Loops' },
      { label: 'Synth & FX Presets', value: 12, maxValue: 100, color: '#a1a1aa', subtitle: 'Serum, Vital & Diva Banks' },
      { label: 'Creator Sound Bundles', value: 8, maxValue: 100, color: '#71717a', subtitle: 'Multi-Product Producer Suites' },
    ];
  }, []);

  const revenueShareData = React.useMemo(() => {
    const creatorEarned = totalGrossRevenue > 0 ? Number((totalGrossRevenue * 0.7).toFixed(2)) : 70;
    const platformEarned = totalGrossRevenue > 0 ? Number((totalGrossRevenue * 0.3).toFixed(2)) : 30;
    const maxVal = Math.max(100, creatorEarned + platformEarned);

    return [
      { label: 'Creator Royalties (70%)', value: creatorEarned, maxValue: maxVal, color: '#ffffff', subtitle: 'Net Creator Bank & UPI Payout' },
      { label: 'Platform Share (30%)', value: platformEarned, maxValue: maxVal, color: '#a1a1aa', subtitle: 'Cloud Hosting & Payment Processing' },
    ];
  }, [totalGrossRevenue]);

  // Compute Top Selling Products from verified purchases and catalog
  const topSellingProducts = React.useMemo(() => {
    const salesMap = new Map<string, { units: number; revenue: number }>();
    purchases.forEach((p: any) => {
      const prodId = p.product_id || p.products?.id;
      const amount = parseFloat(p.amount_paid || 0);
      if (prodId) {
        const cur = salesMap.get(prodId) || { units: 0, revenue: 0 };
        salesMap.set(prodId, { units: cur.units + 1, revenue: cur.revenue + amount });
      }
    });

    return [...products]
      .map((p: any) => {
        const stats = salesMap.get(p.id) || { units: 0, revenue: 0 };
        return {
          ...p,
          unitsSold: stats.units,
          totalRevenue: stats.revenue,
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold || b.totalRevenue - a.totalRevenue);
  }, [products, purchases]);

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242424]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Developer Overview
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time sales, license seats, and catalog performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManageProducts && (
            <Link
              href="/dashboard/products/new"
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Product</span>
            </Link>
          )}
          <a
            href={`https://producertoy.com/brands/${brand?.slug || 'producer-toy'}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <span>Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Cards Grid - Exactly 3 Cards: Total Sales, Net Revenue, Products */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {/* Total Sales */}
        <div className="toy-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
              <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              ${totalGrossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="py-1">
            <AreaSparkline data={[15, 22, 18, 30, 28, 42, 38, 55, 50, 68]} height={28} />
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Verified gross checkout volume</div>
        </div>

        {/* Net Revenue */}
        <div className="toy-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
              ${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="py-1">
            <LineSparkline data={[10, 15, 12, 21, 19, 29, 26, 38, 35, 47]} height={28} showDot />
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Direct publisher royalties</div>
        </div>

        {/* Products */}
        <div className="toy-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Products</span>
              <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {activeProductsCount}
            </div>
          </div>
          <div className="py-1">
            <BarSparkline data={[2, 4, 3, 6, 5, 8, 7, 10, 9, 12]} height={24} />
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Live in marketplace store</div>
        </div>
      </div>

      {/* Main Charts & Catalog Row */}
      <div className={`grid grid-cols-1 ${canViewEarnings ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        {/* Sales Trajectory Chart (Roles with earnings permissions) */}
        {canViewEarnings && (
          <div className="toy-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Daily Sales</h2>
                <p className="text-xs text-zinc-400">Gross revenue across verified orders</p>
              </div>
              <Link
                href="/dashboard/analytics"
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <span>Full Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="charcoalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252525" vertical={false} />
                    <XAxis dataKey="name" stroke="#606060" fontSize={11} tickLine={false} />
                    <YAxis stroke="#606060" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#181818',
                        borderColor: '#2e2e2e',
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
                      fill="url(#charcoalGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#262626] rounded-xl space-y-2">
                  <TrendingUp className="w-6 h-6 text-zinc-600" />
                  <p className="text-xs text-zinc-300 font-medium">No sales activity in this timeframe</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs">
                    As buyers purchase plugins and sound libraries from your catalog, live order volume will plot here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Selling Products & Velocity */}
        <div className="toy-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Top Selling Products</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222222] text-zinc-300 border border-[#333333]">
                  Ranked
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">By verified units sold & checkout GMV</p>
            </div>
            <Link
              href="/dashboard/products"
              className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2a2a2a] rounded-xl space-y-2">
              <Package className="w-6 h-6 text-zinc-500" />
              <p className="text-xs text-zinc-400">No products published yet</p>
              <Link
                href="/dashboard/products/new"
                className="mt-1 text-xs text-white underline font-medium"
              >
                + Add your first plugin / pack
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {topSellingProducts.slice(0, 4).map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/dashboard/products/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] border border-[#262626] transition-colors group"
                >
                  {/* Rank indicator */}
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    idx === 0
                      ? 'bg-white text-black'
                      : 'bg-[#252525] text-zinc-400'
                  }`}>
                    #{idx + 1}
                  </span>

                  <div className="w-10 h-10 rounded-lg bg-[#121212] border border-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
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
                      <Package className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-zinc-300 transition-colors">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#202020] text-zinc-400 uppercase tracking-wider">
                        {p.product_type?.replace('_', ' ') || 'Plugin'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {p.unitsSold > 0 ? `${p.unitsSold} sold` : '0 sold'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-white font-mono block">
                      {parseFloat(p.price_usd) === 0 ? 'FREE' : `$${parseFloat(p.price_usd).toFixed(2)}`}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase ${
                        p.unitsSold > 0 ? 'text-zinc-200 font-semibold' : 'text-zinc-500'
                      }`}
                    >
                      {p.totalRevenue > 0 ? `$${p.totalRevenue.toFixed(2)} rev` : (p.is_active ? 'Active' : 'Draft')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Products Revenue Share (Bklit UI Donut & Linked Legend) */}
      <TopProductsRevenueCard
        products={topSellingProducts}
        totalGrossRevenue={totalGrossRevenue}
      />
    </div>
  );
}
