'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getBrandPurchases } from '@/lib/supabase/actions';
import {
  ShoppingCart,
  Search,
  Download,
  Copy,
  Check,
  CreditCard,
} from 'lucide-react';
import { INITIAL_ORDERS } from '@/lib/data/mockData';

export default function OrdersPage() {
  const { brand } = useBrand();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!brand?.id) return;
      setLoading(true);
      try {
        const data = await getBrandPurchases(brand.id);
        setPurchases(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [brand?.id]);

  // Use live purchases if available, otherwise display INITIAL_ORDERS as realistic demonstration stream
  const activeOrders = purchases.length > 0 ? purchases : INITIAL_ORDERS;
  const isDemo = purchases.length === 0;

  const filteredPurchases = activeOrders.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    const id = p.id || p.order_number || '';
    const name = p.customer_name || '';
    const email = p.customer_email || '';
    const prodName = p.products?.name || p.product_name || '';
    const key = p.serial_key || p.license_key || '';
    return (
      id.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      prodName.toLowerCase().includes(q) ||
      key.toLowerCase().includes(q)
    );
  });

  const totalAmount = activeOrders.reduce(
    (acc: number, p: any) => acc + (parseFloat(p.amount_paid || p.amount) || 0),
    0
  );
  const netEarnings70 = totalAmount * 0.70;

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const exportCsv = () => {
    if (activeOrders.length === 0) return;
    const headers = 'Order Number,Customer Name,Email,Product,Gross Amount,Net Creator Retain (70%),Currency,Date,License Key\n';
    const rows = activeOrders
      .map((p: any) => {
        const gross = parseFloat(p.amount_paid || p.amount || 0);
        const net = gross * 0.70;
        const ordId = p.order_number || p.id;
        const name = p.customer_name || '';
        const email = p.customer_email || '';
        const prod = p.products?.name || p.product_name || '';
        const curr = p.currency || 'USD';
        const date = p.purchased_at || p.created_at;
        const key = p.serial_key || p.license_key || 'Instant Download';
        return `"${ordId}","${name}","${email}","${prod}",${gross.toFixed(2)},${net.toFixed(2)},"${curr}","${date}","${key}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${brand?.slug || 'producer-toy'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Orders & License Transactions
            </h1>
            {isDemo && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e1e1e] text-zinc-400 border border-[#2b2b2b]">
                Catalog Demo
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {isDemo
              ? 'Real-time order ledger & serial delivery records (demonstration catalog view)'
              : `Real customer purchases and license transactions for ${brand?.name || 'Producer Toy'}`}
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={activeOrders.length === 0}
          className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Accounting CSV</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="toy-card p-4 sm:p-5">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Completed Orders
          </p>
          <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            {activeOrders.length}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Verified customer checkouts</p>
        </div>

        <div className="toy-card p-4 sm:p-5">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Gross Sales (GMV)
          </p>
          <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Total checkout volume</p>
        </div>

        <div className="toy-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Net Creator Share (70%)
            </p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#242424] text-zinc-300 border border-zinc-700/60">
              70%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-zinc-100 font-mono mt-1">
            ${netEarnings70.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Guaranteed publisher payout</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by customer name, email, order ID, product, or license key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {/* Orders Table */}
      <div className="toy-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Loading order history...
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingCart className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No matching orders found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]/50 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">License Key</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Your Net (70%)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredPurchases.map((ord: any) => {
                  const gross = parseFloat(ord.amount_paid || ord.amount || 0);
                  const net = gross * 0.70;
                  const key = ord.serial_key || ord.license_key;
                  return (
                    <tr key={ord.id} className="hover:bg-[#1a1a1a]/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {(ord.order_number || ord.id).slice(0, 12)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{ord.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-zinc-400">{ord.customer_email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-zinc-200">
                          {ord.products?.name || ord.product_name || 'Audio Product'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        {new Date(ord.purchased_at || ord.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {key ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-[10px] bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded border border-white/5">
                              {key}
                            </span>
                            <button
                              onClick={() => copyToClipboard(key)}
                              className="text-zinc-500 hover:text-white transition-colors"
                              title="Copy License Key"
                            >
                              {copiedKey === key ? (
                                <Check className="w-3 h-3 text-zinc-300" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-500">Universal Direct</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                        ${gross.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        +${net.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="toy-badge toy-badge-charcoal">
                          Completed
                        </span>
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
