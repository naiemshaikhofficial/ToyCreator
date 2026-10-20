'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { getBrandPurchases, getBrandPayouts } from '@/lib/supabase/actions';
import {
  Coins,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';

export default function EarningsPage() {
  const { brand } = useBrand();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!brand?.id) return;
      setLoading(true);
      try {
        const [purchList, payList] = await Promise.all([
          getBrandPurchases(brand.id),
          getBrandPayouts(brand.id),
        ]);
        setPurchases(purchList);
        setPayouts(payList);
      } catch (err) {
        console.error('Failed to load earnings data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [brand?.id]);

  const totalGross = purchases.reduce(
    (acc, p) => acc + (parseFloat(p.amount_paid) || 0),
    0
  );
  const platformFee = totalGross * 0.15;
  const netEarnings = totalGross * 0.85;

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + (parseFloat(p.net_amount || p.amount) || 0), 0);

  const availableBalance = Math.max(0, netEarnings - totalPaidOut);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Financial Earnings & Revenue Share
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time accounting breakdown for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <Link
          href="/dashboard/payouts"
          className="btn-accent px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-lg"
        >
          <CreditCard className="w-4 h-4" />
          <span>Manage Payouts</span>
        </Link>
      </div>

      {/* 4-Card Accounting Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Gross Sales
          </p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            ${totalGross.toFixed(2)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Total customer checkout value</p>
        </div>

        {/* Platform Fee (15%) */}
        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Platform Fee (15%)
          </p>
          <p className="text-2xl font-black text-zinc-400 font-mono mt-1">
            -${platformFee.toFixed(2)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Covers CDN, gateways & licensing</p>
        </div>

        {/* Net Creator Earnings (85%) */}
        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Net Creator Retain (85%)
          </p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            ${netEarnings.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">Your guaranteed publisher share</p>
        </div>

        {/* Available Balance */}
        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Available for Payout
          </p>
          <p className="text-2xl font-black text-indigo-400 font-mono mt-1">
            ${availableBalance.toFixed(2)}
          </p>
          <p className="text-[11px] text-indigo-300 mt-1">Ready for transfer</p>
        </div>
      </div>

      {/* Explanatory Banner: The 85/15 Audio Developer Split */}
      <div className="toy-card p-6 bg-gradient-to-r from-[#1a1a1a] via-[#1c1c1c] to-[#181818] border border-[#2e2e2e]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="toy-badge toy-badge-emerald">ProducerToy Creator Promise</span>
              <span className="text-xs font-bold text-white">Guaranteed 85% Developer Revenue</span>
            </div>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Unlike legacy plugin distribution portals that take 30% to 50%, Toy Creator ensures developers retain 85% of net revenues. ProducerToy's 15% platform fee covers worldwide PCI payment gateway fees, multi-gigabyte edge CDN file hosting, continuous anti-piracy licensing servers, and global sales tax / VAT compliance.
            </p>
          </div>

          <Link
            href="/dashboard/documents"
            className="btn-secondary px-4 py-2 text-xs font-medium whitespace-nowrap self-start sm:self-auto"
          >
            View Revenue Schedule &rarr;
          </Link>
        </div>
      </div>

      {/* Order Earnings Ledger */}
      <div className="toy-card p-5 sm:p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Transaction Ledger & Fee Split Breakdown
        </h2>

        {purchases.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#2a2a2a] rounded-xl text-xs text-zinc-400">
            No transactions yet. As audio products are sold, each line item with exact fee calculations will be logged here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Gross Price</th>
                  <th className="py-2.5 px-3 text-right">Fee (15%)</th>
                  <th className="py-2.5 px-3 text-right">Your Net (85%)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {purchases.map((p) => {
                  const gross = parseFloat(p.amount_paid) || 0;
                  const fee = gross * 0.15;
                  const net = gross * 0.85;
                  return (
                    <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        {p.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-3 text-white font-medium">
                        {p.products?.name || 'Audio Product'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-200">
                        ${gross.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">
                        -${fee.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        +${net.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="toy-badge toy-badge-emerald">Credited</span>
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
