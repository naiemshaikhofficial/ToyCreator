'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getBrandDeviceActivations, revokeDeviceActivation } from '@/lib/supabase/actions';
import {
  KeyRound,
  Laptop,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Cpu,
  CheckCircle,
} from 'lucide-react';

export default function LicensingPage() {
  const { brand } = useBrand();
  const [activations, setActivations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadActivations = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const data = await getBrandDeviceActivations(brand.id);
      setActivations(data);
    } catch (err) {
      console.error('Failed to load device activations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivations();
  }, [brand?.id]);

  const handleRevoke = async (id: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to revoke the activation seat for "${deviceName}"? The customer workstation will be deactivated.`)) {
      return;
    }

    setRevokingId(id);
    try {
      await revokeDeviceActivation(id);
      setSuccessMsg(`Device activation for ${deviceName} successfully revoked.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setActivations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: false } : a))
      );
    } catch (err) {
      console.error('Revocation failed:', err);
      alert('Could not revoke activation seat.');
    } finally {
      setRevokingId(null);
    }
  };

  const filteredActivations = activations.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.device_name?.toLowerCase().includes(q) ||
      a.device_id_hash?.toLowerCase().includes(q) ||
      a.products?.name?.toLowerCase().includes(q) ||
      a.os?.toLowerCase().includes(q)
    );
  });

  const activeCount = activations.filter((a) => a.is_active).length;
  const revokedCount = activations.filter((a) => !a.is_active).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Audio Hardware Licensing & Device Activations
          </h1>
          <p className="text-xs text-zinc-400">
            Monitor real hardware seats, client DAWs, and machine hashes for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <button
          onClick={loadActivations}
          className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Hardware Status</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Studio Seats</span>
            <ShieldCheck className="w-4 h-4 text-zinc-300" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{activeCount}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Currently authorized hardware rigs</p>
        </div>

        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Revoked Seats</span>
            <ShieldAlert className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-black text-zinc-400 font-mono">{revokedCount}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Released or reset licenses</p>
        </div>

        <div className="toy-card p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Licensing Protocol</span>
            <Cpu className="w-4 h-4 text-zinc-300" />
          </div>
          <p className="text-sm font-bold text-white mt-1">JUCE Native Hardware Hash</p>
          <p className="text-[11px] text-zinc-400 mt-1">ECDSA Challenge-Response</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by computer name, hardware SHA-256 hash, product, or operating system..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
        />
      </div>

      {/* Activations Table */}
      <div className="toy-card overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Client Machine Activations
          </h2>
          <span className="text-xs text-zinc-400">{activations.length} total seats</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Querying active device signatures from Supabase...
          </div>
        ) : filteredActivations.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <KeyRound className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No device activations found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              When customers install your plugins and activate their studio workstations, machine signatures will be listed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]/50 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Device & Studio Rig</th>
                  <th className="py-3 px-4">Plugin</th>
                  <th className="py-3 px-4">OS Platform</th>
                  <th className="py-3 px-4">Hardware Signature Hash</th>
                  <th className="py-3 px-4">Last Verified</th>
                  <th className="py-3 px-4 text-right">Seat Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredActivations.map((a) => (
                  <tr key={a.id} className="hover:bg-[#1a1a1a]/70 transition-colors">
                    {/* Device Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#222222] border border-white/5 flex items-center justify-center text-zinc-300">
                          {a.os?.toLowerCase().includes('mac') ? (
                            <Laptop className="w-4 h-4" />
                          ) : (
                            <Monitor className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{a.device_name || 'Studio Workstation'}</p>
                          <span className="text-[10px] text-zinc-400">ID: {a.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Plugin */}
                    <td className="py-3.5 px-4 font-medium text-zinc-200">
                      {a.products?.name || 'ProVerb'}
                    </td>

                    {/* OS Platform */}
                    <td className="py-3.5 px-4 text-zinc-300">
                      <span className="toy-badge bg-zinc-800 text-zinc-300">
                        {a.os || 'Audio OS'}
                      </span>
                    </td>

                    {/* Hardware Hash */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 max-w-[180px] truncate" title={a.device_id_hash}>
                      {a.device_id_hash}
                    </td>

                    {/* Last Seen */}
                    <td className="py-3.5 px-4 text-zinc-400">
                      {a.last_seen_at ? new Date(a.last_seen_at).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`toy-badge ${
                          a.is_active ? 'toy-badge-charcoal' : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {a.is_active ? 'Active Seat' : 'Revoked'}
                      </span>
                    </td>

                    {/* Revoke Action */}
                    <td className="py-3.5 px-4 text-right">
                      {a.is_active ? (
                        <button
                          onClick={() => handleRevoke(a.id, a.device_name)}
                          disabled={revokingId === a.id}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-zinc-300 hover:text-white bg-[#252525] hover:bg-[#34363d] transition-colors border border-zinc-700"
                          title="Revoke workstation license seat"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">Deactivated</span>
                      )}
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
