'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { getDeveloperTickets, createDeveloperTicket } from '@/lib/supabase/actions';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  ShieldCheck,
} from 'lucide-react';

export default function SupportPage() {
  const { brand, user } = useBrand();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Ticket form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [daw, setDaw] = useState('Ableton Live');
  const [osPlatform, setOsPlatform] = useState('macOS Apple Silicon');

  const loadTickets = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await getDeveloperTickets(user.email);
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user?.email]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Subject and issue description are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await createDeveloperTicket({
        name: brand?.name || user?.email?.split('@')[0] || 'Developer',
        email: user?.email || 'developer@producertoy.com',
        subject: subject.trim(),
        description: description.trim(),
        priority,
        daw,
        os_platform: osPlatform,
      });

      setSuccessMsg('Developer priority ticket submitted successfully.');
      setShowModal(false);
      setSubject('');
      setDescription('');
      await loadTickets();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setErrorMsg(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Developer Priority Support Desk
          </h1>
          <p className="text-xs text-zinc-400">
            Direct audio engineering assistance for VST compilation, CDN distribution, and licensing
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-sm uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>Open Developer Ticket</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#202020] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SLA Info Banner */}
      <div className="toy-card p-5 bg-[#181818] border border-zinc-800 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#242424] border border-zinc-700/60 flex items-center justify-center text-zinc-300 flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-white">Guaranteed 4-Hour SLA for Registered Brands</p>
          <p className="text-zinc-400 mt-0.5">
            Your developer tickets are directly routed to senior DSP engineers and the ProducerToy audio operations team.
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="toy-card overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Ticket History
          </h2>
          <span className="text-xs text-zinc-400">{tickets.length} tickets</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Loading support tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No active support tickets</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Need help with JUCE plugin compilation, sample instrument mapping, or tax verification? Open a ticket above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#222222]">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 hover:bg-[#1a1a1a]/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-300">
                      {t.ticket_number}
                    </span>
                    <span
                      className={`toy-badge ${
                        t.status === 'OPEN'
                          ? 'toy-badge-charcoal'
                          : 'toy-badge-zinc'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Priority: {t.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{t.subject}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-1">{t.description}</p>
                </div>

                <div className="text-right text-[11px] text-zinc-500 whitespace-nowrap">
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  {t.daw && <p className="text-zinc-400">{t.daw} • {t.os_platform}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Open Support Ticket */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Open Priority Developer Ticket</h3>
            <p className="text-xs text-zinc-400">
              Submit technical inquiries, VST activation debugging, or payout questions.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VST3 Apple Silicon signing issue on macOS Sequoia"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3 py-2 text-xs text-white focus:border-[#42454e] transition-colors"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Release Blocker)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Primary DAW
                  </label>
                  <input
                    type="text"
                    value={daw}
                    onChange={(e) => setDaw(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3 py-2 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Target OS
                  </label>
                  <input
                    type="text"
                    value={osPlatform}
                    onChange={(e) => setOsPlatform(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3 py-2 text-xs text-white focus:border-[#42454e] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Detailed Issue Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Include error codes, JUCE crash dumps, or reproduction steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3.5 text-xs text-white focus:border-[#42454e] transition-colors resize-none"
                />
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
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Ticket</span>
                    </>
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
