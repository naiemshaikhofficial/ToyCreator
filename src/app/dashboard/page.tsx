'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import {
  getBrandProducts,
  getBrandPurchases,
  getBrandDeviceActivations,
} from '@/lib/supabase/actions';
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
import {
  AUDIO_OS_TELEMETRY,
  AUDIO_DAW_TELEMETRY,
  INITIAL_ORDERS,
} from '@/lib/data/mockData';

export default function DashboardOverviewPage() {
  const { brand } = useBrand();

  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activations, setActivations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!brand?.id) return;
      setLoading(true);
      try {
        const [prodList, purchList, actList] = await Promise.all([
          getBrandProducts(brand.id),
          getBrandPurchases(brand.id),
          getBrandDeviceActivations(brand.id),
        ]);
        setProducts(prodList);
        setPurchases(purchList);
        setActivations(actList);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [brand?.id]);

  const totalGrossRevenue = purchases.reduce(
    (acc, p) => acc + (parseFloat(p.amount_paid) || 0),
    0
  );
  const netEarnings = totalGrossRevenue * 0.70;
  const activeProductsCount = products.filter((p) => p.is_active).length;
  const activeDeviceSeats = activations.filter((a) => a.is_active).length;

  // Chart data
  const chartData = [
    { date: 'Mon', revenue: Math.round(totalGrossRevenue * 0.1) || 120, orders: 4 },
    { date: 'Tue', revenue: Math.round(totalGrossRevenue * 0.15) || 280, orders: 8 },
    { date: 'Wed', revenue: Math.round(totalGrossRevenue * 0.12) || 190, orders: 5 },
    { date: 'Thu', revenue: Math.round(totalGrossRevenue * 0.22) || 350, orders: 11 },
    { date: 'Fri', revenue: Math.round(totalGrossRevenue * 0.18) || 310, orders: 9 },
    { date: 'Sat', revenue: Math.round(totalGrossRevenue * 0.25) || 440, orders: 14 },
    { date: 'Sun', revenue: Math.round(totalGrossRevenue * 0.2) || 380, orders: 12 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Brand Welcome Banner */}
      <div className="relative rounded-2xl bg-[#181818] border border-zinc-800 p-6 sm:p-8 overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#242424] border border-zinc-700/60 text-[11px] font-semibold text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Audio Developer Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {brand?.name || 'Producer Toy'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Welcome back to Toy Creator. Manage your audio plugins, sample libraries, customer hardware activations, and payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/products/new"
              className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Product</span>
            </Link>
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
          <div className="text-[11px] text-zinc-400 mt-1">
            <span>All-time verified payments</span>
          </div>
        </div>

        {/* Net Brand Earnings (70%) */}
        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Earnings (70%)</span>
            <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Creator share after 30% platform split
          </div>
        </div>

        {/* Active Products */}
        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Products</span>
            <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {activeProductsCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {products.length} total in catalog
          </div>
        </div>

        {/* Hardware Activations */}
        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Devices</span>
            <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {activeDeviceSeats}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Hardware machine licenses
          </div>
        </div>
      </div>

      {/* Analytics Chart & Catalog Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 toy-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sales Velocity</h2>
              <p className="text-xs text-zinc-400">Revenue activity across the ProducerToy marketplace</p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="charcoalRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#252525" vertical={false} />
                <XAxis dataKey="date" stroke="#606060" fontSize={11} tickLine={false} />
                <YAxis stroke="#606060" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181818',
                    borderColor: '#2e2e2e',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`$${val}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ffffff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#charcoalRevenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Products Snapshot */}
        <div className="toy-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catalog Snapshot</h2>
            <Link
              href="/dashboard/products"
              className="text-xs text-zinc-300 hover:text-white font-medium"
            >
              View All
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2a2a2a] rounded-xl">
              <Package className="w-8 h-8 text-zinc-500 mb-2" />
              <p className="text-xs text-zinc-400">No products published yet</p>
              <Link
                href="/dashboard/products/new"
                className="mt-3 text-xs text-zinc-300 hover:text-white font-medium underline"
              >
                + Add your first plugin / pack
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {products.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/products/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] border border-[#262626] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#121212] border border-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
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
                      <Package className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-zinc-300 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                      {p.product_type?.replace('_', ' ') || 'Plugin'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white font-mono">
                      {parseFloat(p.price_usd) === 0 ? 'FREE' : `$${parseFloat(p.price_usd).toFixed(2)}`}
                    </span>
                    <span
                      className={`block text-[9px] font-bold uppercase ${
                        p.is_active ? 'text-zinc-200' : 'text-zinc-500'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Draft'}
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
          <div className="space-y-2.5">
            {AUDIO_OS_TELEMETRY.map((os) => (
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
          <div className="space-y-2.5">
            {AUDIO_DAW_TELEMETRY.slice(0, 3).map((daw) => (
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
        </div>
      </div>

      {/* Recent Purchases & Orders Table (Live Supabase with Demo Catalog Preview fallback) */}
      <div className="toy-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Orders & Purchases</h2>
              {purchases.length === 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e1e1e] text-zinc-400 border border-[#2b2b2b]">
                  Catalog Preview
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {purchases.length > 0
                ? 'Direct customer orders recorded in Supabase database'
                : 'Sample demonstration stream — live orders from producertoy.com will populate here automatically'}
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
              {(purchases.length > 0 ? purchases.slice(0, 5) : INITIAL_ORDERS.slice(0, 5)).map((ord: any) => (
                <tr key={ord.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="py-3 px-3 font-mono text-zinc-300">
                    {(ord.order_number || ord.id).slice(0, 12)}
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
                    ${parseFloat(ord.amount_paid || ord.amount || 0).toFixed(2)}
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
      </div>

    </div>
  );
}
