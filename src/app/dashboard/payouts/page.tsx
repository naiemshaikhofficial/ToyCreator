'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getBrandFullAnalyticsAction } from '@/actions/analyticsActions';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  CreditCard,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function PayoutsPage() {
  const { brand, user, membership } = useBrand();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      const res = await getBrandFullAnalyticsAction(brand.id);
      if (res.success && res.data) {
        setPayouts(res.data.payouts || []);
        setPurchases(res.data.purchases || []);
      }
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [brand?.id]);

  const totalGross = purchases.reduce(
    (acc, p) => acc + (parseFloat(p.amount_paid) || 0),
    0
  );
  const netEarnings = totalGross * 0.70;

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + (parseFloat(p.net_amount || p.amount) || 0), 0);

  const availableBalance = Math.max(0, netEarnings - totalPaidOut);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(requestAmount);
    if (!amt || amt <= 0) {
      setErrorMsg('Please enter a valid payout amount.');
      return;
    }
    if (amt > availableBalance) {
      setErrorMsg(`Requested amount exceeds available balance ($${availableBalance.toFixed(2)}).`);
      return;
    }

    setRequesting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const admin = getAdminClient();
      const payoutNumber = `PAY-${Date.now().toString().slice(-6)}`;

      const { data, error } = await admin
        .from('payouts')
        .insert({
          payout_number: payoutNumber,
          brand_id: brand?.id,
          user_id: user?.id,
          amount: amt,
          currency: 'USD',
          status: 'scheduled',
          destination: `${membership?.payout_method || 'Stripe Connect'} (${membership?.payout_email || user?.email})`,
          method: membership?.payout_method || 'Stripe Connect',
          fee: 0,
          net_amount: amt,
        })
        .select('*')
        .single();

      if (error) throw error;

      setStatusMsg(`Payout request of $${amt.toFixed(2)} submitted successfully.`);
      setShowModal(false);
      setRequestAmount('');
      await loadData();
    } catch (err: any) {
      console.error('Error submitting payout:', err);
      setErrorMsg(err.message || 'Failed to submit payout request.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Payout Management
          </h1>
          <p className="text-xs text-zinc-400">
            Automated and manual creator payouts for {brand?.name || 'Producer Toy'}
          </p>
        </div>

        <button
          onClick={() => {
            setRequestAmount(availableBalance.toFixed(2));
            setShowModal(true);
          }}
          disabled={availableBalance < 10}
          className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-sm disabled:opacity-50"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Request Payout</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* KPI Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Available Balance
          </p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            ${availableBalance.toFixed(2)}
          </p>
          <span className="text-[11px] text-zinc-400">Ready to transfer to bank</span>
        </div>

        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Lifetime Paid Out
          </p>
          <p className="text-2xl font-black text-zinc-300 font-mono mt-1">
            ${totalPaidOut.toFixed(2)}
          </p>
          <span className="text-[11px] text-zinc-400">Successfully disbursed</span>
        </div>

        <div className="toy-card p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Payout Destination
          </p>
          <p className="text-sm font-bold text-white mt-1 truncate">
            {membership?.payout_method || 'Stripe Connect'}
          </p>
          <span className="text-[11px] font-mono text-zinc-400 truncate block">
            {membership?.payout_email || user?.email}
          </span>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="toy-card overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Payout History & Transfers
          </h2>
          <span className="text-xs text-zinc-400">{payouts.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Loading payout records...
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No payouts recorded yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Once you accrue $10.00 or more in audio product sales, you can request an instant transfer here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]/50 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Payout Ref</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Fee</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1a1a1a]/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {p.payout_number || p.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {p.destination || 'Stripe Connect'}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-400">
                      ${parseFloat(p.fee || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ${parseFloat(p.net_amount || p.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="toy-badge toy-badge-charcoal capitalize">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Request Payout */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Request Funds Transfer</h3>
            <p className="text-xs text-zinc-400">
              Transfer available audio earnings to your verified payout method.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Transfer Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={availableBalance}
                    required
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-7 pr-3 py-2.5 text-sm font-mono text-white focus:border-[#42454e] transition-colors"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Available: ${availableBalance.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => setRequestAmount(availableBalance.toFixed(2))}
                    className="text-zinc-300 hover:text-white underline"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#202020] border border-[#2a2a2a] rounded-xl text-xs text-zinc-300 space-y-1">
                <p className="text-zinc-400">Destination:</p>
                <p className="font-semibold text-white">
                  {membership?.payout_method || 'Stripe Connect'} ({membership?.payout_email || user?.email})
                </p>
                <p className="text-[10px] text-zinc-400 pt-1">
                  Processed on standard weekly schedule (Fridays) with 0 transfer fee.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Confirm Payout</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
