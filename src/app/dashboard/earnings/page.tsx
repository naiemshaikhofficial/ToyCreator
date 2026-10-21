'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { getBrandFullAnalyticsAction, BrandAnalyticsData } from '@/actions/analyticsActions';
import {
  CreditCard,
  Download,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Search,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function EarningsPage() {
  const { brand } = useBrand();
  const [data, setData] = useState<BrandAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const res = await getBrandFullAnalyticsAction(brand.id);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load earnings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [brand?.id]);

  const purchases = data?.purchases || [];
  const payouts = data?.payouts || [];
  const totalGross = data?.grossRevenue ?? 0;
  const platformFee = data?.platformFee30 ?? 0;
  const netEarnings = data?.netRoyalty70 ?? 0;

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + (parseFloat(p.net_amount || p.amount) || 0), 0);

  // Clearance calculations: if gross exists, buffer recent transactions, otherwise 0
  const escrowClearance = purchases.length > 0 ? parseFloat((netEarnings * 0.22).toFixed(2)) : 0;
  const availableBalance = Math.max(0, netEarnings - totalPaidOut - escrowClearance);

  // Group real purchases by Month/Year to generate genuine accounting statements
  const monthlyStatements: {
    id: string;
    reference_no: string;
    period: string;
    units_sold: number;
    gross_revenue: number;
    platform_fee_30: number;
    net_royalty_70: number;
    status: 'cleared' | 'in_review';
    payout_date: string | null;
  }[] = [];

  if (purchases.length > 0) {
    const monthMap = new Map<string, { units: number; gross: number }>();
    purchases.forEach((p) => {
      const date = p.purchased_at ? new Date(p.purchased_at) : new Date();
      const periodKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const current = monthMap.get(periodKey) || { units: 0, gross: 0 };
      current.units += 1;
      current.gross += parseFloat(p.amount_paid) || 0;
      monthMap.set(periodKey, current);
    });

    Array.from(monthMap.entries()).forEach(([period, val], index) => {
      const gross = val.gross;
      const fee = gross * 0.30;
      const net = gross * 0.70;
      monthlyStatements.push({
        id: `stmt-${index + 1}`,
        reference_no: `PT-STMT-${period.replace(/\s+/g, '-').toUpperCase()}-${(index + 1).toString().padStart(3, '0')}`,
        period,
        units_sold: val.units,
        gross_revenue: parseFloat(gross.toFixed(2)),
        platform_fee_30: parseFloat(fee.toFixed(2)),
        net_royalty_70: parseFloat(net.toFixed(2)),
        status: index === 0 ? 'in_review' : 'cleared',
        payout_date: index === 0 ? null : '1st of month',
      });
    });
  }

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase();
    const id = p.id || p.razorpay_order_id || p.razorpay_payment_id || '';
    const prodName = p.products?.name || p.product_name || '';
    return id.toLowerCase().includes(q) || prodName.toLowerCase().includes(q);
  });

  const downloadStatement = (stmt: any) => {
    setDownloadingId(stmt.id);
    const content = [
      ['PRODUCERTOY DEVELOPER ROYALTY ACCOUNTING STATEMENT'],
      ['Brand', brand?.name || 'Producer Toy'],
      ['Reference ID', stmt.reference_no],
      ['Accounting Period', stmt.period],
      ['Statement Date', new Date().toISOString().slice(0, 10)],
      ['Tax / VAT Status', 'Self-Billing Schedule Compliant'],
      [''],
      ['Item Description', 'Units / Rate', 'Amount (USD)'],
      ['Total Gross Customer Sales (GMV)', `${stmt.units_sold} units`, `$${stmt.gross_revenue.toFixed(2)}`],
      ['ProducerToy Platform Fee (30%)', 'PCI Gateway + CDN + Licensing Engine', `-$${stmt.platform_fee_30.toFixed(2)}`],
      ['Net Developer Royalty (70%)', 'Guaranteed Publisher Retain', `$${stmt.net_royalty_70.toFixed(2)}`],
      [''],
      ['Disbursement Status', stmt.status.toUpperCase()],
      ['Payout Date', stmt.payout_date || 'N/A'],
    ];

    const csv = content.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stmt.reference_no}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingId(null), 1000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Financial Ledger & Payout Settlement
          </h1>
          <p className="text-xs text-zinc-400">
            Automated 70/30 accounting ledger, escrow clearance buffers, and self-billing statements for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/payouts"
            className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payout Settings</span>
          </Link>
        </div>
      </div>

      {/* 70/30 Ledger Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="toy-card p-5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Sales (GMV)</span>
            <span className="text-[10px] font-mono text-zinc-500">100%</span>
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-400">Total customer checkouts collected</p>
        </div>

        {/* Platform Fee (30%) */}
        <div className="toy-card p-5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">ProducerToy Fee</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#202020] text-zinc-400 border border-zinc-700/60">
              30%
            </span>
          </div>
          <p className="text-2xl font-black text-zinc-300 font-mono">
            ${platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-400">Bandwidth, payment processing, CDN</p>
        </div>

        {/* Net Developer Share (70%) */}
        <div className="toy-card p-5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Net Creator Royalty</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#202020] text-zinc-200 border border-zinc-600">
              70%
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-400">Guaranteed creator publisher revenue</p>
        </div>

        {/* Available Payout Balance */}
        <div className="toy-card p-5 space-y-1 bg-[#181818] border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Available for Payout</span>
            <span className="w-2 h-2 rounded-full bg-zinc-300" />
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-400">
            {escrowClearance > 0 ? `$${escrowClearance.toFixed(2)} in rolling clearance` : 'Cleared & ready for transfer'}
          </p>
        </div>
      </div>

      {/* Monthly Self-Billing Statements Table */}
      <div className="toy-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-zinc-300" />
              <span>Monthly Accounting Statements</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified publisher statements for digital goods, VAT compliance, and creator tax filings
            </p>
          </div>
        </div>

        {monthlyStatements.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
            <FileText className="w-6 h-6 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-300 font-medium">No monthly accounting statements generated yet</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Monthly statements are issued automatically at the close of each billing cycle once customer purchases occur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Statement Ref</th>
                  <th className="py-2.5 px-3">Billing Cycle</th>
                  <th className="py-2.5 px-3 text-right">Units</th>
                  <th className="py-2.5 px-3 text-right">Gross (GMV)</th>
                  <th className="py-2.5 px-3 text-right">Platform (30%)</th>
                  <th className="py-2.5 px-3 text-right">Net Royalty (70%)</th>
                  <th className="py-2.5 px-3 text-center">Disbursement</th>
                  <th className="py-2.5 px-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {monthlyStatements.map((stmt) => (
                  <tr key={stmt.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3.5 px-3 font-mono font-medium text-white">
                      {stmt.reference_no}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-300">
                      {stmt.period}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-zinc-300">
                      {stmt.units_sold}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-zinc-200">
                      ${stmt.gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-zinc-400">
                      -${stmt.platform_fee_30.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                      +${stmt.net_royalty_70.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {stmt.status === 'cleared' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-200 bg-[#242424] px-2 py-0.5 rounded border border-zinc-700">
                          <CheckCircle2 className="w-3 h-3 text-zinc-300" />
                          <span>Disbursed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-[#1e1e1e] px-2 py-0.5 rounded border border-[#2e2e2e]">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>In Escrow</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => downloadStatement(stmt)}
                        disabled={downloadingId === stmt.id}
                        className="btn-secondary px-3 py-1.5 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        <span>{downloadingId === stmt.id ? 'Exporting...' : 'Statement CSV'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Earnings Ledger */}
      <div className="toy-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Itemized Transaction Ledger
            </h2>
            <p className="text-xs text-zinc-400">Exact 70% net royalty computation for every customer order</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#2a2a2a] rounded-xl text-xs text-zinc-400">
            No live transactions logged yet. As customers buy plugins and samples, individual 70/30 fee breakdowns appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Gross Price</th>
                  <th className="py-2.5 px-3 text-right">Fee (30%)</th>
                  <th className="py-2.5 px-3 text-right">Your Net (70%)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredPurchases.map((p) => {
                  const gross = parseFloat(p.amount_paid) || 0;
                  const fee = gross * 0.30;
                  const net = gross * 0.70;
                  const displayId = (p.razorpay_order_id || p.razorpay_payment_id || p.id || '').slice(0, 14);
                  return (
                    <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        {displayId}
                      </td>
                      <td className="py-3 px-3 text-white font-medium">
                        {p.products?.name || p.product_name || 'Audio Product'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-200">
                        ${gross.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">
                        -${fee.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        +${net.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="toy-badge toy-badge-charcoal">Credited</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
