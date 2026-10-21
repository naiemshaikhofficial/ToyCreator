'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getBrandFullAnalyticsAction, BrandAnalyticsData } from '@/actions/analyticsActions';
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
  Package,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';
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

export default function AnalyticsPage() {
  const { brand } = useBrand();
  const [data, setData] = useState<BrandAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  const loadAnalytics = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const res = await getBrandFullAnalyticsAction(brand.id);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [brand?.id]);

  const grossRevenue = data?.grossRevenue ?? 0;
  const netEarnings = data?.netRoyalty70 ?? 0;
  const platformFee = data?.platformFee30 ?? 0;
  const totalVolume = data?.totalUnits ?? 0;
  const activeCatalogCount = data?.activeProductsCount ?? (data?.products?.length ?? 0);
  const revenueTrend = data?.revenueTimeline || [];
  const productPerformance = data?.productPerformance || [];
  const osTelemetry = data?.osTelemetry || [];
  const dawTelemetry = data?.dawTelemetry || [];
  const formatTelemetry = data?.formatTelemetry || [];
  const promotionalData = data?.promotionalData || [];

  const exportTelemetry = () => {
    const rows = [
      ['Metric', 'Value', 'Share'],
      ['Total Gross Revenue', `$${grossRevenue.toFixed(2)}`, '100%'],
      ['Platform Fee (30%)', `$${platformFee.toFixed(2)}`, '30%'],
      ['Net Creator Retain (70%)', `$${netEarnings.toFixed(2)}`, '70%'],
      ['Total Volume (Units)', totalVolume.toString(), '—'],
      ['Active Products in Catalog', activeCatalogCount.toString(), '—'],
      ['Active Hardware Device Seats', (data?.activeDeviceSeats ?? 0).toString(), '—'],
      ['--- REAL OS TELEMETRY ---', '', ''],
      ...osTelemetry.map((os) => [os.os, `${os.count} units`, `${os.share_percent}%`]),
      ['--- REAL DAW TELEMETRY ---', '', ''],
      ...dawTelemetry.map((daw) => [daw.daw, `${daw.count} units`, `${daw.share_percent}%`]),
      ['--- FORMAT TELEMETRY ---', '', ''],
      ...formatTelemetry.map((f) => [f.format, `${f.count} downloads`, `${f.share_percent}%`]),
    ];

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio_analytics_report_${brand?.slug || 'producer-toy'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGate allowedRoles={['owner', 'admin', 'finance']} sectionName="Sales & Financial Analytics">
      <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Sales & Audience Analytics
          </h1>
          <p className="text-xs text-zinc-400">
            Real customer telemetry, verified DAW distribution, and 70/30 ledger analytics for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-1 bg-[#181818] border border-[#2a2a2a] p-1 rounded-xl text-xs">
            {['7d', '30d', '90d', 'All'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  timeRange === t ? 'bg-[#34363d] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={exportTelemetry}
            className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2"
            title="Download verified analytics report"
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
            ${grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-400 font-medium">All verified purchases</span>
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
          <span className="text-[11px] text-zinc-400">Direct developer royalty</span>
        </div>

        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Total Units Sold
          </p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {totalVolume.toLocaleString()}
          </p>
          <span className="text-[11px] text-zinc-400">Genuine customer orders</span>
        </div>

        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Catalog
          </p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {activeCatalogCount}
          </p>
          <span className="text-[11px] text-zinc-400">Published products</span>
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
            {revenueTrend.length > 0 ? (
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
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#262626] rounded-xl space-y-2">
                <TrendingUp className="w-6 h-6 text-zinc-600" />
                <p className="text-xs text-zinc-300 font-medium">No sales recorded in this period</p>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  Once customers place orders on ProducerToy, live revenue trajectory and volume velocity will plot here automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Comparison Bar Chart */}
        <div className="toy-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Catalog Performance
              </h2>
              <p className="text-xs text-zinc-400">Revenue per published product in your catalog</p>
            </div>
            <BarChart3 className="w-4 h-4 text-zinc-300" />
          </div>

          <div className="h-64 w-full">
            {productPerformance.length > 0 ? (
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
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#262626] rounded-xl space-y-2">
                <Package className="w-6 h-6 text-zinc-600" />
                <p className="text-xs text-zinc-300 font-medium">No products published yet</p>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  Publish your first plugin or sample pack to monitor itemized sales performance.
                </p>
              </div>
            )}
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

          {osTelemetry.length > 0 ? (
            <div className="space-y-4 pt-2">
              {osTelemetry.map((item) => (
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
                  <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden">
                    <div
                      className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                      style={{ width: `${item.share_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
              <Laptop className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-300 font-medium">No customer device activations recorded yet</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                When customers authorize your plugins on macOS (Apple Silicon/Intel) or Windows via ProducerToy licensing, their operating systems and CPU architectures will populate here.
              </p>
            </div>
          )}
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

          {dawTelemetry.length > 0 ? (
            <div className="space-y-3.5 pt-2">
              {dawTelemetry.map((daw) => (
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
          ) : (
            <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
              <Music className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-300 font-medium">No workstation telemetry recorded yet</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Host DAW distribution (FL Studio, Ableton Live, Logic Pro, Cubase) is reported during client plugin challenge-response licensing checks.
              </p>
            </div>
          )}
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

          {formatTelemetry.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {formatTelemetry.map((item) => (
                <div
                  key={item.format}
                  className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] space-y-1"
                >
                  <p className="text-xs font-semibold text-white">{item.format}</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-black text-zinc-100 font-mono">
                      {item.share_percent}%
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">{item.count} orders</p>
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
          ) : (
            <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
              <HardDrive className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-300 font-medium">No download stream telemetry yet</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Direct streaming deliveries for VST3, AU, and universal sample archives are logged automatically when buyers download from their vault.
              </p>
            </div>
          )}
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

          {promotionalData.length > 0 ? (
            <div className="space-y-3 pt-2">
              {promotionalData.map((tier) => (
                <div
                  key={tier.tier}
                  className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white">{tier.tier}</p>
                    <p className="text-[11px] text-zinc-400">
                      Tier: <span className="font-mono text-zinc-300">{tier.avg_discount}</span>
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
          ) : (
            <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
              <Tag className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-300 font-medium">No promotional purchase data recorded</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Promotional elasticity metrics will display here when discounts or introductory campaign pricing are redeemed by customers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </RoleGate>
  );
}
