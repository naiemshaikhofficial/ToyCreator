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
} from 'lucide-react';
import {
  getProductSerialStatsAction,
  batchUploadSerialsAction,
  deleteSerialKeyAction,
} from '@/actions/serialActions';
import { SerialKeyPoolStats } from '@/lib/types';

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
    // Reset input
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

  return (
    <div className="toy-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a2a2a] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#202020] border border-[#34363d] flex items-center justify-center flex-shrink-0">
            <Key className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>License Keys & Serials</span>
              <span className="text-[10px] font-mono font-normal text-zinc-400 bg-[#202020] px-2 py-0.5 rounded-full border border-zinc-700/50">
                Automated Delivery
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Pre-load serial numbers assigned automatically to buyers upon checkout
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Available Serials
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-white">
              {stats?.available ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400">Ready to assign</span>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Assigned / Claimed
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-zinc-300">
              {stats?.used ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400">Used by buyers</span>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Total Pool Capacity
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-zinc-400">
              {stats?.total ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400">Total keys</span>
          </div>
        </div>
      </div>

      {/* Batch Upload Form */}
      <form onSubmit={handleBatchUpload} className="space-y-3 bg-[#141414] border border-[#262626] p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Batch Upload License Keys</span>
          </label>

          <label className="cursor-pointer text-[11px] text-zinc-300 hover:text-white flex items-center gap-1.5 bg-[#202020] hover:bg-[#262626] px-2.5 py-1 rounded-lg border border-[#34363d] transition-colors self-start sm:self-auto">
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
          rows={3}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={`Paste license keys here, one per line:\nPROV-8492-XKD9-1029\nPROV-1928-SKDA-9941\nPROV-5830-WPQM-4018`}
          className="w-full bg-[#101010] border border-[#2e2e2e] rounded-xl p-3 text-xs font-mono text-white placeholder-zinc-600 focus:border-[#42454e] transition-colors resize-y"
        />

        {feedbackMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
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

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Encrypted & stored securely in ProducerToy Vault</span>
          </div>

          <button
            type="submit"
            disabled={uploading || !rawInput.trim()}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
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

      {/* Recent Keys List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Recent Keys in Pool ({stats?.recentKeys?.length || 0})
        </h3>

        {stats?.recentKeys && stats.recentKeys.length > 0 ? (
          <div className="border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#222222] bg-[#121212]">
            {stats.recentKeys.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between text-xs hover:bg-[#181818] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      item.is_used ? 'bg-zinc-600' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-mono text-zinc-200 tracking-wide font-medium">
                    {item.serial_key}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      item.is_used
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/40'
                        : 'bg-[#202020] text-zinc-300 border border-[#34363d]'
                    }`}
                  >
                    {item.is_used ? 'Claimed' : 'Available'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.serial_key)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-[#262626] transition-colors"
                    title="Copy Key"
                  >
                    {copiedKey === item.serial_key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {!item.is_used && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteKey(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-[#262626] transition-colors"
                      title="Remove Key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center border border-dashed border-[#262626] rounded-xl text-xs text-zinc-400">
            No serial keys uploaded yet. Paste serial keys above to enable automated license distribution upon purchase.
          </div>
        )}
      </div>
    </div>
  );
}
