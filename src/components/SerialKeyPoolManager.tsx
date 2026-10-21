'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  Key,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  FileText,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  User,
  Calendar,
  CreditCard,
  Plus,
  Info,
} from 'lucide-react';
import {
  getProductSerialStatsAction,
  batchUploadSerialsAction,
  deleteSerialKeyAction,
} from '@/actions/serialActions';
import { SerialKeyPoolStats, ProductSerialKey } from '@/lib/types';

interface SerialKeyPoolManagerProps {
  productId: string;
  productName: string;
}

export default function SerialKeyPoolManager({
  productId,
  productName,
}: SerialKeyPoolManagerProps) {
  const [stats, setStats] = useState<SerialKeyPoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'claimed' | 'upload'>('available');
  const [availableSearch, setAvailableSearch] = useState('');
  const [claimedSearch, setClaimedSearch] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getProductSerialStatsAction(productId);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load serial stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [productId]);

  const handleBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;

    setUploading(true);
    setFeedbackMsg(null);

    try {
      const res = await batchUploadSerialsAction(productId, rawInput);
      if (res.success) {
        let msg = `Successfully added ${res.addedCount || 0} serial key(s) to the pool.`;
        if (res.duplicateCount && res.duplicateCount > 0) {
          msg += ` (${res.duplicateCount} duplicate keys skipped)`;
        }
        setFeedbackMsg({ type: 'success', text: msg });
        setRawInput('');
        await fetchStats();
        // Switch to available tab so creator immediately sees the newly uploaded keys
        setTimeout(() => setActiveTab('available'), 1200);
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Failed to upload serial keys.',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'An error occurred during upload.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawInput((prev) => (prev ? prev + '\n' + text : text));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteKey = async (serialId: string) => {
    if (!confirm('Are you sure you want to remove this unused serial key from the pool?')) {
      return;
    }

    startTransition(async () => {
      const res = await deleteSerialKeyAction(serialId, productId);
      if (res.success) {
        await fetchStats();
      } else {
        alert(res.error || 'Failed to remove key.');
      }
    });
  };

  const handleCopy = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportAvailableCsv = () => {
    const keys = stats?.availableKeys || [];
    if (keys.length === 0) {
      alert('No available keys to export.');
      return;
    }
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Serial Key,Status,Added At', ...keys.map((k) => `"${k.serial_key}","Available","${k.created_at}"`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-available-serials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportClaimedCsv = () => {
    const keys = stats?.claimedKeys || [];
    if (keys.length === 0) {
      alert('No claimed licenses to export.');
      return;
    }
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Serial Key,Customer Email,Customer Name,Order ID,Purchased At,Amount Paid,Currency',
        ...keys.map(
          (k) =>
            `"${k.serial_key}","${k.customer_email || ''}","${k.customer_name || ''}","${k.order_id || ''}","${
              k.purchased_at || k.created_at
            }","${k.amount_paid ?? 0}","${k.currency || 'USD'}"`
        ),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-claimed-licenses-audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter keys based on search inputs
  const filteredAvailableKeys = (stats?.availableKeys || []).filter((k) =>
    k.serial_key.toLowerCase().includes(availableSearch.toLowerCase())
  );

  const filteredClaimedKeys = (stats?.claimedKeys || []).filter((k) => {
    const q = claimedSearch.toLowerCase();
    return (
      k.serial_key.toLowerCase().includes(q) ||
      (k.customer_email && k.customer_email.toLowerCase().includes(q)) ||
      (k.customer_name && k.customer_name.toLowerCase().includes(q)) ||
      (k.order_id && k.order_id.toLowerCase().includes(q))
    );
  });

  const availableCount = stats?.available ?? 0;
  const claimedCount = stats?.used ?? 0;
  const totalCount = stats?.total ?? 0;

  return (
    <div className="toy-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a2a2a] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#202020] border border-[#34363d] flex items-center justify-center flex-shrink-0">
            <Key className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>License Keys & Automated Pool</span>
              <span className="text-[10px] font-mono font-normal text-zinc-400 bg-[#202020] px-2 py-0.5 rounded border border-zinc-700/50">
                Plugin Boutique Architecture
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Pre-load serials for checkout delivery and audit assigned customer licenses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh Pool"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className="btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Batch Upload</span>
          </button>
        </div>
      </div>

      {/* KPI Counters (Threshold-Aware) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Available Pool Counter */}
        <div
          onClick={() => setActiveTab('available')}
          className={`cursor-pointer border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
            activeTab === 'available'
              ? 'bg-[#181818] border-white shadow-sm'
              : 'bg-[#121212] border-[#262626] hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Available Pool
            </span>
            {availableCount === 0 ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                Depleted • Out of Stock
              </span>
            ) : availableCount <= 10 ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Low Stock
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#202020] text-zinc-300 border border-[#34363d]">
                Ready
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold font-mono ${
                availableCount === 0 ? 'text-red-400' : 'text-white'
              }`}
            >
              {availableCount}
            </span>
            <span className="text-[10px] text-zinc-400">Ready for automated checkout</span>
          </div>
        </div>

        {/* Claimed / Used Counter */}
        <div
          onClick={() => setActiveTab('claimed')}
          className={`cursor-pointer border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
            activeTab === 'claimed'
              ? 'bg-[#181818] border-white shadow-sm'
              : 'bg-[#121212] border-[#262626] hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Claimed Licenses
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#202020] text-zinc-300 border border-[#34363d]">
              Audited
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-zinc-200">
              {claimedCount}
            </span>
            <span className="text-[10px] text-zinc-400">Assigned to buyers</span>
          </div>
        </div>

        {/* Total Capacity Counter */}
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Total Pool Capacity
            </span>
            <span className="text-[9px] font-mono text-zinc-500">All Time</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-zinc-400">
              {totalCount}
            </span>
            <span className="text-[10px] text-zinc-400">Lifetime loaded keys</span>
          </div>
        </div>
      </div>

      {/* Threshold Warnings */}
      {availableCount === 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase tracking-wider text-[11px] text-red-300">
                  Storefront Checkout Locked
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                  Detected Out of Stock
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                All serial keys are depleted (<strong>0 available</strong>). This product is now automatically detected as <strong>Out of Stock</strong> on ProducerToy so buyers cannot accidentally purchase without receiving a license. Add keys now to immediately resume automated checkouts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className="px-3.5 py-2 bg-red-500 hover:bg-red-400 text-black font-bold rounded-xl text-xs transition-colors flex-shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Keys Now</span>
          </button>
        </div>
      )}

      {availableCount > 0 && availableCount <= 10 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Low Inventory ({availableCount} keys left):</strong> Batch upload additional keys to maintain uninterrupted customer checkouts.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className="px-3 py-1 bg-[#242424] border border-amber-500/40 text-amber-200 font-semibold rounded-lg text-xs hover:bg-[#303030] transition-colors flex-shrink-0"
          >
            Upload Batch
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-[#262626] gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'available'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Available Pool</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#202020] text-zinc-300 border border-[#2e2e2e]">
              {availableCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claimed')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'claimed'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-zinc-400" />
            <span>Claimed Licenses (Audit)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#202020] text-zinc-300 border border-[#2e2e2e]">
              {claimedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Batch Upload</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AVAILABLE POOL */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search available keys..."
                value={availableSearch}
                onChange={(e) => setAvailableSearch(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={exportAvailableCsv}
              disabled={availableCount === 0}
              className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Remaining (.csv)</span>
            </button>
          </div>

          {filteredAvailableKeys.length > 0 ? (
            <div className="border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#222222] bg-[#121212]">
              {filteredAvailableKeys.map((item) => (
                <div
                  key={item.id}
                  className="p-3 flex items-center justify-between text-xs hover:bg-[#181818] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full bg-zinc-300 flex-shrink-0" />
                    <span className="font-mono text-zinc-200 tracking-wide font-medium truncate">
                      {item.serial_key}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline-block flex-shrink-0">
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.serial_key)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#262626] transition-colors"
                      title="Copy Serial Key"
                    >
                      {copiedKey === item.serial_key ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteKey(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-[#262626] transition-colors"
                      title="Remove Key from Pool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
              <Key className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">
                {availableSearch ? 'No matching available keys found.' : 'No unassigned serial keys in queue.'}
              </p>
              {!availableSearch && (
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Serial Keys</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLAIMED LICENSES (BUYER AUDIT) */}
      {activeTab === 'claimed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by customer email, name, or key..."
                value={claimedSearch}
                onChange={(e) => setClaimedSearch(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={exportClaimedCsv}
              disabled={claimedCount === 0}
              className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Log (.csv)</span>
            </button>
          </div>

          {filteredClaimedKeys.length > 0 ? (
            <div className="border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#222222] bg-[#121212]">
              {filteredClaimedKeys.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between text-xs hover:bg-[#181818] transition-colors gap-3"
                >
                  {/* Left: Serial Key & Status */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white tracking-wide">
                        {item.serial_key}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.serial_key)}
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#262626] transition-colors"
                        title="Copy Key"
                      >
                        {copiedKey === item.serial_key ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202020] text-zinc-300 border border-[#34363d]">
                        Claimed
                      </span>
                    </div>

                    {/* Customer Email & Name */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                      {item.customer_email && (
                        <div className="flex items-center gap-1 text-zinc-300 font-mono">
                          <User className="w-3 h-3 text-zinc-500" />
                          <span>{item.customer_email}</span>
                          {item.customer_name && (
                            <span className="text-zinc-500">({item.customer_name})</span>
                          )}
                        </div>
                      )}

                      {item.order_id && (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                          <CreditCard className="w-3 h-3" />
                          <span>Ref: {item.order_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Date & Amount */}
                  <div className="flex items-center justify-between md:justify-end gap-3 text-right flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#222222]">
                    <div className="text-left md:text-right">
                      <div className="flex items-center md:justify-end gap-1 text-[11px] text-zinc-400">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>
                          {item.purchased_at
                            ? new Date(item.purchased_at).toLocaleString()
                            : new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {item.amount_paid !== null && item.amount_paid !== undefined && (
                        <span className="text-[11px] font-mono text-zinc-300 block">
                          ${item.amount_paid.toFixed(2)} {item.currency || 'USD'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-[#262626] rounded-xl space-y-2">
              <User className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">
                {claimedSearch ? 'No matching claimed licenses found.' : 'No licenses have been claimed by buyers yet.'}
              </p>
              <p className="text-[11px] text-zinc-500">
                When customers purchase this product on ProducerToy, their assigned serial key and order details will appear here automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BATCH UPLOAD / INGEST */}
      {activeTab === 'upload' && (
        <form onSubmit={handleBatchUpload} className="space-y-4 bg-[#141414] border border-[#262626] p-5 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-zinc-300" />
                <span>Batch Ingest License Serials</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Paste raw keys or upload an export file. Existing duplicate keys are skipped automatically.
              </p>
            </div>

            <label className="cursor-pointer text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 bg-[#202020] hover:bg-[#262626] px-3 py-1.5 rounded-lg border border-[#34363d] transition-colors self-start sm:self-auto">
              <FileText className="w-3.5 h-3.5" />
              <span>Import .txt / .csv</span>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={5}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`Paste license keys here, one per line:\nPROV-8492-XKD9-1029\nPROV-1928-SKDA-9941\nPROV-5830-WPQM-4018\nPROV-7201-ALPQ-6623`}
            className="w-full bg-[#101010] border border-[#2e2e2e] rounded-xl p-3 text-xs font-mono text-white placeholder-zinc-600 focus:border-[#42454e] transition-colors resize-y leading-relaxed"
          />

          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-[#202020] border border-zinc-700/60 text-white'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <span>Encrypted & stored securely in ProducerToy Vault for atomic checkout dispatch</span>
            </div>

            <button
              type="submit"
              disabled={uploading || !rawInput.trim()}
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting Serials...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Serials to Pool</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
