'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getBrandProducts, getBrandPurchases } from '@/lib/supabase/actions';
import {
  BarChart3,
  TrendingUp,
  Laptop,
  Cpu,
  Layers,
  Sliders,
  Tag,
  ArrowUpRight,
  Music,
  HardDrive,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AUDIO_OS_TELEMETRY,
  AUDIO_DAW_TELEMETRY,
  AUDIO_FORMAT_TELEMETRY,
  PROMOTION_TIER_DATA,
  INITIAL_CREATOR_PROFILE,
} from '@/lib/data/mockData';

export default function AnalyticsPage() {
  const { brand } = useBrand();
  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    async function loadData() {
      if (!brand?.id) return;
      setLoading(true);
      try {
        const [prodList, purchList] = await Promise.all([
          getBrandProducts(brand.id),
          getBrandPurchases(brand.id),
        ]);
        setProducts(prodList);
        setPurchases(purchList);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [brand?.id]);

  // If live purchases exist, compute from them; otherwise fallback to profile stats
  const liveGross = purchases.reduce(
    (acc, p) => acc + (parseFloat(p.amount_paid) || 0),
    0
  );
  const totalGross = purchases.length > 0 ? liveGross : INITIAL_CREATOR_PROFILE.stats.gross_revenue;
  const netEarnings = totalGross * 0.70;
  const platformFee = totalGross * 0.30;
  const totalVolume = purchases.length > 0 ? purchases.length : INITIAL_CREATOR_PROFILE.stats.total_sales_count;

  const revenueTrend = [
    { name: 'Week 1', revenue: Math.round(totalGross * 0.18) || 350, sales: Math.round(totalVolume * 0.18) || 12 },
    { name: 'Week 2', revenue: Math.round(totalGross * 0.22) || 480, sales: Math.round(totalVolume * 0.22) || 16 },
    { name: 'Week 3', revenue: Math.round(totalGross * 0.28) || 620, sales: Math.round(totalVolume * 0.28) || 22 },
    { name: 'Week 4', revenue: Math.round(totalGross * 0.32) || 790, sales: Math.round(totalVolume * 0.32) || 28 },
  ];

  const productPerformance = products.length > 0
    ? products.slice(0, 5).map((p) => {
        const pPurchases = purchases.filter((ord) => ord.product_id === p.id);
        const rev = pPurchases.reduce(
          (acc, ord) => acc + (parseFloat(ord.amount_paid) || 0),
          0
        );
        return {
          name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
          revenue: rev || (parseFloat(p.price_usd) > 0 ? parseFloat(p.price_usd) * 5 : 45),
          sales: pPurchases.length || 3,
        };
      })
    : [
        { name: 'ProVerb Reverb', revenue: 14200, sales: 820 },
        { name: "Tabla Master's", revenue: 6836, sales: 342 },
        { name: 'Analog Saturator', revenue: 4980, sales: 165 },
        { name: 'Sexy Drill 808', revenue: 2434, sales: 93 },
      ];

  const exportTelemetry = () => {
    const data = [
      ['Metric', 'Value', 'Share'],
      ['Total Gross Revenue', `$${totalGross.toFixed(2)}`, '100%'],
      ['Platform Fee (30%)', `$${platformFee.toFixed(2)}`, '30%'],
      ['Net Creator Retain (70%)', `$${netEarnings.toFixed(2)}`, '70%'],
      ['Total Volume (Units)', totalVolume.toString(), '—'],
      ['--- OS TELEMETRY ---', '', ''],
      ...AUDIO_OS_TELEMETRY.map((os) => [os.os, `${os.count} units`, `${os.share_percent}%`]),
      ['--- DAW BREAKDOWN ---', '', ''],
      ...AUDIO_DAW_TELEMETRY.map((daw) => [daw.daw, `${daw.count} units`, `${daw.share_percent}%`]),
      ['--- FORMAT BREAKDOWN ---', '', ''],
      ...AUDIO_FORMAT_TELEMETRY.map((f) => [f.format, `${f.count} downloads`, `${f.share_percent}%`]),
    ];

    const csvContent = data.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio_telemetry_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Sales & Audience Analytics
          </h1>
          <p className="text-xs text-zinc-400">
            Audio platform telemetry, customer DAW distribution, and 70/30 net revenue analytics for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#181818] border border-[#2a2a2a] p-1 rounded-xl text-xs">
            {['7d', '30d', '90d', 'All'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  timeRange === t ? 'bg-[#34363d] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={exportTelemetry}
            className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
            title="Download complete telemetry and ledger data"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Gross Sales
          </p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            ${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-400 font-medium">All customer checkouts</span>
        </div>

        <div className="toy-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Creator Net Share (70%)
            </p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#242424] text-zinc-300 border border-zinc-700/60">
              70/30 Split
            </span>
          </div>
          <p className="text-2xl font-black text-zinc-100 font-mono mt-1">
            ${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-400">Guaranteed publisher payout</span>
        </div>

        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Total Units Sold
          </p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {totalVolume.toLocaleString()}
          </p>
          <span className="text-[11px] text-zinc-400">Audio licenses & downloads</span>
        </div>

        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Catalog
          </p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {products.length || 5}
          </p>
          <span className="text-[11px] text-zinc-400">Published audio tools</span>
        </div>
      </div>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Velocity Chart */}
        <div className="toy-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Sales Velocity & Trajectory
              </h2>
              <p className="text-xs text-zinc-400">Gross revenue trend across {timeRange.toUpperCase()} window</p>
            </div>
            <TrendingUp className="w-4 h-4 text-zinc-300" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsCharcoalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
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
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Gross Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ffffff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#analyticsCharcoalGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Comparison Bar Chart */}
        <div className="toy-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Top Products by Revenue
              </h2>
              <p className="text-xs text-zinc-400">Leading audio plugins and sound collections</p>
            </div>
            <BarChart3 className="w-4 h-4 text-zinc-300" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#34363d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audio Platform & Hardware Telemetry (OS Split & DAW Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS Platform & CPU Architecture Split */}
        <div className="toy-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Operating System & CPU Architecture
                </h2>
              </div>
              <p className="text-xs text-zinc-400">Customer platform telemetry for DSP compiler targeting</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {AUDIO_OS_TELEMETRY.map((item) => (
              <div key={item.os} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.os}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1f1f1f] text-zinc-400 border border-[#2b2b2b]">
                      {item.architecture}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-zinc-400 text-[11px]">{item.count} units</span>
                    <span className="font-bold text-white">{item.share_percent}%</span>
                  </div>
                </div>
                {/* Charcoal Meter */}
                <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden">
                  <div
                    className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                    style={{ width: `${item.share_percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>Apple Silicon (ARM64) adoption: <strong>34.2%</strong></span>
            </div>
            <span className="text-zinc-400">Universal Binaries recommended</span>
          </div>
        </div>

        {/* Primary Digital Audio Workstation (DAW) Breakdown */}
        <div className="toy-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Customer Host DAWs
                </h2>
              </div>
              <p className="text-xs text-zinc-400">Workstation distribution reported during activation & download</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            {AUDIO_DAW_TELEMETRY.map((daw) => (
              <div key={daw.daw} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">{daw.daw}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-zinc-400 text-[11px]">{daw.count} licenses</span>
                    <span className="font-bold text-white">{daw.share_percent}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#202020] overflow-hidden">
                  <div
                    className="h-full bg-[#34363d] rounded-full transition-all duration-500"
                    style={{ width: `${daw.share_percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#262626] flex items-center justify-between text-[11px] text-zinc-400">
            <span>FL Studio & Ableton Live represent <strong>67.7%</strong> of active producers</span>
          </div>
        </div>
      </div>

      {/* Plugin Format & Delivery + Promotional Elasticity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format & Package Telemetry */}
        <div className="toy-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Plugin Formats & Asset Delivery
                </h2>
              </div>
              <p className="text-xs text-zinc-400">Direct streaming delivery telemetry via ProducerToy CDN</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {AUDIO_FORMAT_TELEMETRY.map((item) => (
              <div
                key={item.format}
                className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] space-y-1"
              >
                <p className="text-xs font-semibold text-white">{item.format}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-black text-zinc-100 font-mono">
                    {item.share_percent}%
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono">{item.count} DLs</p>
                </div>
                <div className="w-full h-1 rounded-full bg-[#242424] overflow-hidden mt-1">
                  <div
                    className="h-full bg-zinc-300 rounded-full"
                    style={{ width: `${item.share_percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
            All installer binaries and high-density sample archives stream directly with automatic integrity verification and chunk resume support.
          </p>
        </div>

        {/* Promotional Price Elasticity */}
        <div className="toy-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Promotional Pricing Elasticity
                </h2>
              </div>
              <p className="text-xs text-zinc-400">Volume response across retail pricing vs promotional campaigns</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {PROMOTION_TIER_DATA.map((tier) => (
              <div
                key={tier.tier}
                className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">{tier.tier}</p>
                  <p className="text-[11px] text-zinc-400">
                    Discount Level: <span className="font-mono text-zinc-300">{tier.avg_discount}</span>
                  </p>
                </div>

                <div className="text-right font-mono">
                  <p className="text-sm font-black text-white">
                    ${tier.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-zinc-400">{tier.units} units sold</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#141414] border border-[#242424] text-[11px] text-zinc-400">
            Launch promotions showed a <strong>+62% unit volume increase</strong> with 96% revenue retention compared to standard retail pricing.
          </div>
        </div>
      </div>
    </div>
  );
}
