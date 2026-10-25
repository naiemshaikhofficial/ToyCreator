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
  Globe,
  Radio,
  Zap,
  Eye,
  EyeOff,
  Code,
  Terminal,
} from 'lucide-react';
import {
  getProductSerialStatsAction,
  batchUploadSerialsAction,
  deleteSerialKeyAction,
  updateProductLicenseConfigAction,
  testExternalLicenseApiAction,
} from '@/actions/serialActions';
import { SerialKeyPoolStats, ProductSerialKey, ProductLicenseApiConfig } from '@/lib/types';

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
  const [activeTab, setActiveTab] = useState<'available' | 'claimed' | 'upload' | 'webhook'>('available');
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

  // Webhook / Live API Configuration State
  const [deliveryType, setDeliveryType] = useState<'pool' | 'external_api'>('pool');
  const [apiUrl, setApiUrl] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [timeoutMs, setTimeoutMs] = useState(3000);
  const [fallbackToPool, setFallbackToPool] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    statusCode?: number;
    receivedKey?: string;
    rawPreview?: string;
    error?: string;
  } | null>(null);
  const [configFeedback, setConfigFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getProductSerialStatsAction(productId);
      if (res.success && res.data) {
        setStats(res.data);
        if (res.data.licenseConfig) {
          const cfg = res.data.licenseConfig;
          setDeliveryType(cfg.license_delivery_type === 'external_api' ? 'external_api' : 'pool');
          setApiUrl(cfg.license_api_url || '');
          setApiSecret(cfg.license_api_secret || '');
          setTimeoutMs(cfg.license_api_timeout_ms || 3000);
          setFallbackToPool(cfg.license_api_fallback_to_pool ?? true);
        }
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

  const handleBatchUpload = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
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

  const handleSaveLicenseConfig = async () => {
    setSavingConfig(true);
    setConfigFeedback(null);
    try {
      const res = await updateProductLicenseConfigAction(productId, {
        license_delivery_type: deliveryType,
        license_api_url: apiUrl,
        license_api_secret: apiSecret,
        license_api_timeout_ms: timeoutMs,
        license_api_fallback_to_pool: fallbackToPool,
      });
      if (res.success) {
        setConfigFeedback({
          type: 'success',
          text: 'License architecture & webhook settings updated successfully.',
        });
        await fetchStats();
      } else {
        setConfigFeedback({
          type: 'error',
          text: res.error || 'Failed to save webhook settings.',
        });
      }
    } catch (err: any) {
      setConfigFeedback({
        type: 'error',
        text: err.message || 'An error occurred while saving.',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestEndpoint = async () => {
    if (!apiUrl.trim()) {
      alert('Please enter your Webhook Endpoint URL first.');
      return;
    }
    setTestingApi(true);
    setTestResult(null);
    try {
      const res = await testExternalLicenseApiAction(productId, apiUrl, apiSecret);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: err.message || 'Unexpected test execution failure.',
      });
    } finally {
      setTestingApi(false);
    }
  };

  const handleGenerateSecret = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setApiSecret(`pt_sec_live_${randomHex}`);
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
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-zinc-300 shrink-0" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
            License Keys & Serials
          </h2>
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
      {availableCount === 0 && deliveryType !== 'external_api' && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs">
              <strong>Pool Depleted:</strong> Product is paused on storefront until serial keys are added.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-black font-semibold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Keys</span>
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

          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'webhook'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Developer Webhook / API</span>
            {deliveryType === 'external_api' ? (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[#202020] text-zinc-400 border border-[#2e2e2e]">
                API
              </span>
            )}
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
        <div className="space-y-4 bg-[#141414] border border-[#262626] p-5 rounded-xl">
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
              type="button"
              onClick={handleBatchUpload}
              disabled={uploading || !rawInput.trim()}
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm cursor-pointer"
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
        </div>
      )}

      {/* TAB 4: DEVELOPER WEBHOOK / API INTEGRATION */}
      {activeTab === 'webhook' && (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Select Licensing Architecture
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Plugin Boutique & Splice Standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setDeliveryType('pool')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  deliveryType === 'pool'
                    ? 'bg-[#181818] border-white text-white shadow-sm'
                    : 'bg-[#141414] border-[#262626] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Pre-Loaded CSV Batch Pool</span>
                  {deliveryType === 'pool' && <Check className="w-4 h-4 text-white" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Best for PACE iLok batches, fixed pre-generated serial lists, or offline cryptographic keygens.
                </p>
              </div>

              <div
                onClick={() => setDeliveryType('external_api')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  deliveryType === 'external_api'
                    ? 'bg-[#181818] border-white text-white shadow-sm'
                    : 'bg-[#141414] border-[#262626] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Live Developer Webhook / API</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Dynamic
                    </span>
                  </span>
                  {deliveryType === 'external_api' && <Check className="w-4 h-4 text-white" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Dispatches an authenticated HTTPS POST to your own server/website to generate keys in real-time on purchase.
                </p>
              </div>
            </div>
          </div>

          {/* Webhook Configuration Form */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-5 rounded-xl space-y-4">
            <div className="border-b border-[#242424] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Developer API Endpoint & Secret</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Configure your webhook URL where ProducerToy will request serial keys upon verified checkout
                </p>
              </div>
            </div>

            {configFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  configFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {configFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{configFeedback.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Endpoint URL */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Webhook Endpoint URL (HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://api.yourbrand.com/v1/licenses/issue"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  ProducerToy will send an authenticated POST request with order metadata and event <code className="text-zinc-300 font-mono">license.generate</code>.
                </span>
              </div>

              {/* API Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Webhook Shared Secret (HMAC-SHA256 Token)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSecret}
                    className="text-[10px] text-zinc-400 hover:text-white transition-colors underline"
                  >
                    Generate New Secret
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder="pt_sec_live_..."
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2e2e2e] rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono text-white focus:border-[#42454e] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Sent in header <code className="text-zinc-300 font-mono">Authorization: Bearer &lt;secret&gt;</code> and used to calculate the <code className="text-zinc-300 font-mono">X-ProducerToy-Signature</code> HMAC header.
                </span>
              </div>

              {/* Timeout & Fallback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Request Timeout SLA
                  </label>
                  <select
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                  >
                    <option value={1500}>1,500 ms (Fastest SLA)</option>
                    <option value={3000}>3,000 ms (Recommended Standard)</option>
                    <option value={5000}>5,000 ms (Maximum Grace)</option>
                  </select>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    If your server does not respond within this duration, the request will safely abort.
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Emergency Resilience
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={fallbackToPool}
                      onChange={(e) => setFallbackToPool(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#181818] border-[#2e2e2e] text-[#34363d] focus:ring-zinc-600"
                    />
                    <span className="text-xs text-zinc-300">
                      Fallback to pre-loaded CSV pool if webhook fails
                    </span>
                  </label>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Guarantees buyers receive a license even if your hosting service experiences downtime.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={handleTestEndpoint}
                  disabled={testingApi || !apiUrl.trim()}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 text-zinc-300 ${testingApi ? 'animate-pulse' : ''}`} />
                  <span>{testingApi ? 'Pinging Endpoint...' : 'Send Diagnostic Test Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveLicenseConfig}
                  disabled={savingConfig}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm"
                >
                  {savingConfig ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Webhook Settings</span>
                    </>
                  )}
                </button>
              </div>

              {/* Diagnostic Test Ping Result Box */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-red-500/10 border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span>
                        {testResult.success ? 'Diagnostic Ping Successful' : 'Diagnostic Ping Failed'}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40">
                      Latency: {testResult.latencyMs}ms • Status: {testResult.statusCode || 'N/A'}
                    </span>
                  </div>

                  {testResult.receivedKey && (
                    <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 font-mono text-[11px] text-white flex items-center justify-between">
                      <span>Parsed Serial: <strong>{testResult.receivedKey}</strong></span>
                      <span className="text-[9px] text-emerald-400">Valid Format</span>
                    </div>
                  )}

                  {testResult.error && (
                    <p className="text-[11px] text-red-300 leading-relaxed">
                      {testResult.error}
                    </p>
                  )}

                  {testResult.rawPreview && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase">Raw Server Response Preview:</span>
                      <pre className="bg-black/60 p-2 rounded text-[10px] font-mono text-zinc-300 overflow-x-auto">
                        {testResult.rawPreview}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Integration Specification & Code Snippet */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#242424] pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-zinc-300" />
                <span>Developer Integration Specification</span>
              </h4>
              <span className="text-[10px] text-zinc-400">Node.js / Express or Python</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              When a customer completes purchase, ProducerToy will send a signed <code className="text-zinc-300 font-mono">POST</code> request. Your endpoint must respond within your SLA with JSON containing the generated key:
            </p>

            <pre className="bg-[#0d0d0d] border border-[#222222] p-3 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`// Expected JSON Response from your Server:
{
  "status": "success",
  "serial_key": "YOURBRAND-XXXX-YYYY-ZZZZ",
  "seats": 3,
  "instructions": "Enter this key in plugin activation dialog."
}`}
            </pre>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              💡 <strong>Unified API:</strong> You can use this exact same licensing microservice for checkouts on your own brand website. When verifying ProducerToy webhooks, simply compare the <code className="text-zinc-400 font-mono">X-ProducerToy-Signature</code> header with an HMAC-SHA256 digest of the request body using your secret key.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
