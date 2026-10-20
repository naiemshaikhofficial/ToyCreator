'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getBrandPurchases } from '@/lib/supabase/actions';
import {
  ShoppingCart,
  Search,
  Download,
  Filter,
  DollarSign,
  User,
  CreditCard,
  Key,
  ShieldCheck,
  Package,
} from 'lucide-react';

export default function OrdersPage() {
  const { brand } = useBrand();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.id?.toLowerCase().includes(q) ||
      p.customer_name?.toLowerCase().includes(q) ||
      p.customer_email?.toLowerCase().includes(q) ||
      p.products?.name?.toLowerCase().includes(q) ||
      p.serial_key?.toLowerCase().includes(q)
    );
  });

  const totalAmount = purchases.reduce(
    (acc, p) => acc + (parseFloat(p.amount_paid) || 0),
    0
  );

  const exportCsv = () => {
    if (purchases.length === 0) return;
    const headers = 'ID,Customer,Email,Product,Amount,Currency,Date,SerialKey\n';
    const rows = purchases
      .map(
        (p) =>
          `"${p.id}","${p.customer_name || ''}","${p.customer_email || ''}","${
            p.products?.name || ''
          }",${p.amount_paid || 0},"${p.currency || 'USD'}","${p.purchased_at}","${
            p.serial_key || ''
          }"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${brand?.slug || 'brand'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Orders & Sales
          </h1>
          <p className="text-xs text-zinc-400">
            Real customer purchases and license transactions for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={purchases.length === 0}
          className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="toy-card p-4">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-xl font-bold text-white font-mono mt-1">
            {purchases.length}
          </p>
        </div>

        <div className="toy-card p-4">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Gross Sales
          </p>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
            ${totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="toy-card p-4">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Net Creator Share (85%)
          </p>
          <p className="text-xl font-bold text-indigo-400 font-mono mt-1">
            ${(totalAmount * 0.85).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by customer name, email, order ID, product, or serial key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Orders Table */}
      <div className="toy-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Fetching order history from Supabase...
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingCart className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No orders found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              When buyers purchase your audio products on producertoy.com, orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]/50 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Purchase ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">License Key</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredPurchases.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#1a1a1a]/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {ord.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{ord.customer_name || 'Customer'}</p>
                      <p className="text-[11px] text-zinc-400">{ord.customer_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-zinc-200">
                        {ord.products?.name || 'Audio Product'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {new Date(ord.purchased_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {ord.serial_key ? (
                        <span className="font-mono text-[10px] bg-zinc-800 text-indigo-300 px-2 py-0.5 rounded border border-white/5">
                          {ord.serial_key}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Instant Download</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ${parseFloat(ord.amount_paid || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="toy-badge toy-badge-emerald">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
