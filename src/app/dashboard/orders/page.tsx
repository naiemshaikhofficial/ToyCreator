'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import { getBrandFullAnalyticsAction } from '@/actions/analyticsActions';
import {
  ShoppingCart,
  Search,
  Download,
  Copy,
  Check,
  CreditCard,
  RefreshCw,
  RotateCcw,
  FileText,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';

function OrdersPageInner() {
  const { brand } = useBrand();
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get('status') || 'all';
  const tabParam = searchParams.get('tab') || 'orders';

  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [activeTab, setActiveTab] = useState(tabParam);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (statusParam) setStatusFilter(statusParam);
    if (tabParam) setActiveTab(tabParam);
  }, [statusParam, tabParam]);

  const loadOrders = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const res = await getBrandFullAnalyticsAction(brand.id);
      if (res.success && res.data) {
        setPurchases(res.data.purchases || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [brand?.id]);

  const filteredPurchases = purchases.filter((p: any) => {
    // Status filter
    if (statusFilter === 'completed' && (p.is_refunded || p.status === 'refunded')) {
      return false;
    }
    if (statusFilter === 'refunded' && !(p.is_refunded || p.status === 'refunded')) {
      return false;
    }

    const q = searchQuery.toLowerCase();
    const id = p.id || p.razorpay_order_id || p.razorpay_payment_id || '';
    const name = p.customer_name || '';
    const prodName = p.products?.name || p.product_name || '';
    const key = p.serial_key || '';
    return (
      id.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      prodName.toLowerCase().includes(q) ||
      key.toLowerCase().includes(q)
    );
  });

  const totalAmount = purchases.reduce(
    (acc: number, p: any) => acc + (parseFloat(p.amount_paid) || 0),
    0
  );
  const netEarnings70 = totalAmount * 0.70;

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const exportCsv = () => {
    if (purchases.length === 0) return;
    const headers = 'Order Number,Customer,Privacy,Product,Gross Amount,Net Creator Retain (70%),Currency,Date,License Key\n';
    const rows = purchases
      .map((p: any) => {
        const gross = parseFloat(p.amount_paid || 0);
        const net = gross * 0.70;
        const ordId = p.razorpay_order_id || p.razorpay_payment_id || p.id;
        const name = p.customer_name || 'Customer';
        const prod = p.products?.name || p.product_name || 'Audio Product';
        const curr = p.currency || 'USD';
        const date = p.purchased_at || p.created_at;
        const key = p.serial_key || 'Instant Download';
        return `"${ordId}","${name}","Protected Buyer","${prod}",${gross.toFixed(2)},${net.toFixed(2)},"${curr}","${date}","${key}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${brand?.slug || 'producer-toy'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGate allowedRoles={['owner', 'admin', 'support', 'finance']} sectionName="Customer Orders & Sales Ledger">
      <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Orders & License Transactions
          </h1>
          <p className="text-xs text-zinc-400">
            Real customer purchases and license transactions for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCsv}
            disabled={purchases.length === 0}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Accounting CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="toy-card p-4 sm:p-5">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Completed Orders
          </p>
          <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            {purchases.length}
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

      {/* Category Tabs: All Orders, Completed Sales, Refunds & Disputes, Invoices */}
      <div className="flex items-center gap-2 border-b border-[#242424] pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => {
            setStatusFilter('all');
            setActiveTab('orders');
            router.replace('/dashboard/orders');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
            statusFilter === 'all' && activeTab === 'orders'
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>All Orders</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#202020] text-zinc-300">
            {purchases.length}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('completed');
            setActiveTab('orders');
            router.replace('/dashboard/orders?status=completed');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
            statusFilter === 'completed' && activeTab === 'orders'
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Completed Sales</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#202020] text-zinc-300">
            {purchases.filter((p: any) => !p.is_refunded && p.status !== 'refunded').length}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('refunded');
            setActiveTab('orders');
            router.replace('/dashboard/orders?status=refunded');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
            statusFilter === 'refunded' && activeTab === 'orders'
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refunds & Disputes</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#202020] text-zinc-300">
            {purchases.filter((p: any) => p.is_refunded || p.status === 'refunded').length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('invoices');
            router.replace('/dashboard/orders?tab=invoices');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices & Receipts</span>
        </button>
      </div>

      {statusFilter === 'refunded' && (
        <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-zinc-300 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              Refund & License Invalidation Policy
            </h4>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              When an order refund is completed on ProducerToy, the customer&apos;s machine license seat limit is automatically locked, and the DRM API immediately revokes VST/AU desktop activation.
            </p>
          </div>
        </div>
      )}

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
            Loading verified orders...
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingCart className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">
              {searchQuery ? 'No matching orders found' : 'No customer orders placed yet'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'When customers purchase your audio plugins or sound libraries on ProducerToy, their order receipts, customer email, and issued license keys will be displayed here in real time.'}
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
                  const gross = parseFloat(ord.amount_paid || 0);
                  const net = gross * 0.70;
                  const key = ord.serial_key;
                  const displayId = (ord.razorpay_order_id || ord.razorpay_payment_id || ord.id || '').slice(0, 14);
                  return (
                    <tr key={ord.id} className="hover:bg-[#1a1a1a]/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {displayId}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{ord.customer_name || 'Customer'}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Buyer Protected</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-200">
                        {ord.products?.name || ord.product_name || 'Audio Product'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        {new Date(ord.purchased_at || ord.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {key ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-zinc-300 bg-[#121212] px-2 py-0.5 rounded border border-[#2a2a2a]">
                              {key}
                            </span>
                            <button
                              onClick={() => copyToClipboard(key)}
                              className="text-zinc-500 hover:text-white p-1 rounded"
                              title="Copy License Key"
                            >
                              {copiedKey === key ? (
                                <Check className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">Direct Delivery</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white font-medium">
                        ${gross.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${net.toFixed(2)}
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
    </RoleGate>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-zinc-500">Loading orders ledger...</div>}>
      <OrdersPageInner />
    </Suspense>
  );
}
