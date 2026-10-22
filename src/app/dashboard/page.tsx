'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { getBrandFullAnalyticsAction, BrandAnalyticsData } from '@/actions/analyticsActions';
import {
  DollarSign,
  TrendingUp,
  Package,
  KeyRound,
  Plus,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Laptop,
  Music,
  ShoppingBag,
  RefreshCw,
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
      {/* Brand Welcome Banner */}
      <div className="relative rounded-2xl bg-[#181818] border border-zinc-800 p-6 sm:p-8 overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#242424] border border-zinc-700/60 text-[11px] font-semibold text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Audio Developer Portal</span>
              </div>
              {roleBadge && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold ${roleBadge.badgeClass}`}>
                  {roleBadge.label}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {brand?.name || 'Producer Toy'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Welcome back to Toy Creator. Manage your audio plugins, sample libraries, customer hardware activations, and payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManageProducts && (
              <Link
                href="/dashboard/products/new"
                className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Product</span>
              </Link>
            )}
            <a
              href={`https://producertoy.com/brands/${brand?.slug || 'producer-toy'}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <span>Public Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {canViewEarnings ? (
          <>
            {/* Gross Revenue */}
            <div className="toy-card p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
                <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                ${totalGrossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Verified gross checkout volume</div>
            </div>

            {/* Net Royalty (70%) */}
            <div className="toy-card p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Retain (70%)</span>
                <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
                ${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Direct publisher royalties</div>
            </div>
          </>
        ) : (
          <>
            {/* Supported DAWs */}
            <div className="toy-card p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Host DAWs</span>
                <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                  <Music className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {dawTelemetry.length > 0 ? `${dawTelemetry.length} DAWs` : 'Universal'}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">DAW host integrations verified</div>
            </div>

            {/* Client OS Platforms */}
            <div className="toy-card p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">OS Platforms</span>
                <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                  <Laptop className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {osTelemetry.length > 0 ? `${osTelemetry.length} Systems` : 'Win / Mac'}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Active client architectures</div>
            </div>
          </>
        )}

        {/* Active Products */}
        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Catalog</span>
            <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {activeProductsCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Live in marketplace store</div>
        </div>

        {/* Device Activations */}
        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Studio Seats</span>
            <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {activeDeviceSeats}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Customer hardware rigs authorized</div>
        </div>
      </div>

      {/* Main Charts & Catalog Row */}
      <div className={`grid grid-cols-1 ${canViewEarnings ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        {/* Sales Trajectory Chart (Roles with earnings permissions) */}
        {canViewEarnings && (
          <div className="toy-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sales Velocity Trajectory</h2>
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

      {/* Audio Platform & Host DAW Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OS Platform Breakdown */}
        <div className="toy-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Operating Systems</h3>
            </div>
            <Link href="/dashboard/analytics" className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-medium">
              <span>View Specs</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {osTelemetry.length > 0 ? (
            <div className="space-y-2.5">
              {osTelemetry.slice(0, 3).map((os) => (
                <div key={os.os} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{os.os}</span>
                    <span className="font-mono font-bold text-white">{os.share_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#202020] overflow-hidden">
                    <div className="h-full bg-zinc-200 rounded-full" style={{ width: `${os.share_percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-[#262626] rounded-xl text-xs text-zinc-400">
              No device activations recorded yet
            </div>
          )}
        </div>

        {/* Primary Host DAWs */}
        <div className="toy-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Digital Audio Workstations</h3>
            </div>
            <Link href="/dashboard/analytics" className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-medium">
              <span>Telemetry</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {dawTelemetry.length > 0 ? (
            <div className="space-y-2.5">
              {dawTelemetry.slice(0, 3).map((daw) => (
                <div key={daw.daw} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{daw.daw}</span>
                    <span className="font-mono font-bold text-white">{daw.share_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#202020] overflow-hidden">
                    <div className="h-full bg-[#34363d] rounded-full" style={{ width: `${daw.share_percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-[#262626] rounded-xl text-xs text-zinc-400">
              No DAW host telemetry recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Purchases & Orders Table (Only for roles with order access) */}
      {canViewOrders && (
        <div className="toy-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Orders & Purchases</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Direct verified customer orders recorded on ProducerToy
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2a2a2a] text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Order / Purchase ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {purchases.slice(0, 5).map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        {(ord.razorpay_order_id || ord.razorpay_payment_id || ord.id).slice(0, 14)}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-white">{ord.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-zinc-400">{ord.customer_email}</p>
                      </td>
                      <td className="py-3 px-3 text-zinc-200">
                        {ord.products?.name || ord.product_name || 'Audio Product'}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        {new Date(ord.purchased_at || ord.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        ${parseFloat(ord.amount_paid || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="toy-badge toy-badge-charcoal">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
              <ShoppingBag className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-300 font-medium">No customer orders placed yet</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                When customers purchase your plugins or sound packs on ProducerToy, their orders will appear here automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
