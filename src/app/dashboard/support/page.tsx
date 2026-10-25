'use client';

import React, { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import {
  getDeveloperTickets,
  createDeveloperTicket,
  getDeveloperTicketMessages,
  replyDeveloperTicket,
  escalateDeveloperTicketToTeam,
} from '@/lib/supabase/actions';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  ShieldCheck,
  Flame,
  X,
  Laptop,
  Music,
  ArrowUpRight,
} from 'lucide-react';

export default function SupportPage() {
  const { brand, user } = useBrand();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCheckAction = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'new') {
          setShowModal(true);
        }
      }
    };
    handleCheckAction();
    window.addEventListener('popstate', handleCheckAction);
    window.addEventListener('toy-new-ticket', () => setShowModal(true));
    return () => {
      window.removeEventListener('popstate', handleCheckAction);
      window.removeEventListener('toy-new-ticket', () => setShowModal(true));
    };
  }, []);

  // Ticket create form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [daw, setDaw] = useState('Ableton Live');
  const [osPlatform, setOsPlatform] = useState('macOS Apple Silicon');

  // Detail Drawer & Conversation Thread
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Escalation to ProducerToy Team Modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  const [activeTab, setActiveTab] = useState<'ALL' | 'CORE' | 'CUSTOMER'>('ALL');

  const loadTickets = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await getDeveloperTickets(user.email, brand?.id);
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user?.email, brand?.id]);

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
        brand_id: brand?.id,
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

  // Open Ticket Detail Drawer
  const handleSelectTicket = async (t: any) => {
    setSelectedTicket(t);
    setLoadingMessages(true);
    try {
      const msgs = await getDeveloperTicketMessages(t.id);
      setTicketMessages(msgs);
    } catch (err) {
      console.error('Error loading ticket thread:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send Reply from Developer
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const newMsg = await replyDeveloperTicket({
        ticketId: selectedTicket.id,
        message: replyText,
        senderName: brand?.name || user?.email?.split('@')[0] || 'Toy Creator Developer',
      });

      setTicketMessages([...ticketMessages, newMsg]);
      setReplyText('');
      setSuccessMsg('Response sent to ProducerToy support desk.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error sending reply:', err);
      setErrorMsg(err.message || 'Failed to send response');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Escalate to Producer Toy Core Team
  const handleEscalateToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !escalateReason.trim()) return;

    setIsEscalating(true);
    try {
      const newMsg = await escalateDeveloperTicketToTeam({
        ticketId: selectedTicket.id,
        reason: escalateReason,
        senderName: brand?.name || user?.email?.split('@')[0] || 'Brand Partner',
      });

      setSelectedTicket({ ...selectedTicket, status: 'ESCALATED_TO_TEAM', priority: 'URGENT' });
      setTicketMessages([...ticketMessages, newMsg]);
      setShowEscalateModal(false);
      setEscalateReason('');
      setSuccessMsg('Issue escalated directly to ProducerToy Core Engineering team.');
      await loadTickets();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error escalating ticket:', err);
      setErrorMsg(err.message || 'Failed to escalate ticket');
    } finally {
      setIsEscalating(false);
    }
  };

  // Segregate Core Team Requests vs Customer Plugin Queries
  const coreTickets = tickets.filter(
    (t) => t.category === 'DEVELOPER' || t.routing_source === 'DEVELOPER_DESK'
  );
  const customerTickets = tickets.filter(
    (t) => t.category !== 'DEVELOPER' && t.routing_source !== 'DEVELOPER_DESK'
  );

  const displayedTickets =
    activeTab === 'CORE'
      ? coreTickets
      : activeTab === 'CUSTOMER'
      ? customerTickets
      : tickets;

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Developer Support Desk
          </h1>
          <p className="text-xs text-zinc-400">
            ProducerToy core engineering tickets & customer plugin inquiries
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-sm tracking-wide"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Raise Core Ticket</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#1e1e1e] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-zinc-300 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#1e1e1e] border border-zinc-700/60 rounded-xl text-white text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-zinc-300 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Minimalist Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#242424] pb-3 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
            activeTab === 'ALL'
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          All ({tickets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CORE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
            activeTab === 'CORE'
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          Core Requests ({coreTickets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CUSTOMER')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
            activeTab === 'CUSTOMER'
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          Customer Plugin Issues ({customerTickets.length})
        </button>
      </div>

      {/* Tickets List */}
      <div className="toy-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-zinc-500 font-mono">
            Loading tickets...
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="p-10 text-center space-y-1.5">
            <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-1.5" />
            <h3 className="text-xs font-semibold text-white">No tickets in this view</h3>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              Use &ldquo;Raise Core Ticket&rdquo; to contact ProducerToy engineering or review customer plugin issues here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#202020]">
            {displayedTickets.map((t) => {
              const isCoreRequest =
                t.category === 'DEVELOPER' || t.routing_source === 'DEVELOPER_DESK';
              const isEscalatedTeam = t.status === 'ESCALATED_TO_TEAM';
              const isEscalatedDev = t.status === 'ESCALATED_TO_DEV';

              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className="p-4 hover:bg-[#181818] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-zinc-300">
                        {t.ticket_number}
                      </span>

                      {isCoreRequest ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#222] text-zinc-300 border border-zinc-700/60 uppercase">
                          CORE ASSISTANCE
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase">
                          PLUGIN QUERY
                        </span>
                      )}

                      {isEscalatedTeam ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-black font-mono uppercase animate-pulse">
                          <Flame className="w-2.5 h-2.5 fill-black" />
                          <span>CORE ESCALATION</span>
                        </span>
                      ) : isEscalatedDev ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#242424] text-zinc-200 border border-[#3a3a3a] font-mono uppercase">
                          <ArrowUpRight className="w-2.5 h-2.5" />
                          <span>ROUTED TO BRAND</span>
                        </span>
                      ) : (
                        <span
                          className={`toy-badge ${
                            t.status === 'OPEN'
                              ? 'toy-badge-charcoal'
                              : 'toy-badge-zinc'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      )}

                      <span className="text-[10px] text-zinc-500 font-mono">
                        {t.priority}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-white group-hover:text-zinc-200 transition">
                      {t.subject}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">{t.description}</p>
                  </div>

                  <div className="text-right text-[11px] text-zinc-500 whitespace-nowrap">
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    {t.daw && <p className="text-zinc-400 font-mono text-[10px]">{t.daw} • {t.os_platform}</p>}
                  </div>
                </div>
              );
            })}
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

      {/* Ticket Detail & Escalation Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#2a2a2a]">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs font-bold text-white bg-[#242424] px-2 py-0.5 rounded border border-[#333]">
                    {selectedTicket.ticket_number}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-white text-black font-bold uppercase">
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    Priority: {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1.5">
                  {selectedTicket.subject}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Contact: {selectedTicket.name} ({selectedTicket.email})
                </p>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Escalation to ProducerToy Team Button */}
            <div className="p-4 bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-white" />
                  <span>ProducerToy Team Escalation</span>
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Is this issue blocking your audio release or requiring DSP engineer intervention?
                </p>
              </div>

              {selectedTicket.status !== 'ESCALATED_TO_TEAM' ? (
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold font-mono transition flex items-center gap-1 shrink-0"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Escalate to Core Team</span>
                </button>
              ) : (
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#2a2a2a] text-white border border-[#383838]">
                  Active Core Escalation
                </span>
              )}
            </div>

            {/* Context Hardware Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-2">
                <Laptop className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">OS Platform</div>
                  <div className="text-white font-bold">{selectedTicket.os_platform || 'macOS / Windows'}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-2">
                <Music className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">DAW Environment</div>
                  <div className="text-white font-bold">{selectedTicket.daw || 'All DAWs'}</div>
                </div>
              </div>
            </div>

            {/* Original Issue Description */}
            <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                Ticket Description:
              </div>
              <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            {/* Conversation History */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
                Responses & Escalation Activity ({ticketMessages.length})
              </h4>

              {loadingMessages ? (
                <div className="p-6 text-center text-xs text-zinc-400 font-mono">
                  Loading responses...
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {ticketMessages.length > 0 ? (
                    ticketMessages.map((msg) => {
                      const isEscalatedMsg = msg.message?.startsWith('🔥 [ESCALATED') || msg.message?.startsWith('🚨 [ESCALATED');
                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                            isEscalatedMsg
                              ? 'bg-[#181818] border-white text-white font-mono'
                              : msg.sender_type === 'staff'
                              ? 'bg-[#222222] border-white/20 mr-6 text-white'
                              : 'bg-[#181818] border-[#2a2a2a] ml-6 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                            <span className="font-bold uppercase tracking-wider text-white">
                              {msg.sender_name || 'Support Staff'}
                            </span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-zinc-500 font-mono bg-[#141414] rounded-xl border border-[#262626]">
                      No messages on this ticket yet. Reply below to communicate with ProducerToy.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-[#2a2a2a]">
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to ProducerToy engineering or customer inquiry..."
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? 'Sending...' : 'Send Response'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Developer Escalation to ProducerToy Core Team */}
      {showEscalateModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Escalate to ProducerToy Team
                </h3>
              </div>
              <button
                onClick={() => setShowEscalateModal(false)}
                className="p-1 hover:bg-[#242424] rounded text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-sans">
              This will notify the ProducerToy Core Engineering team immediately and set the ticket priority to URGENT.
            </p>

            <form onSubmit={handleEscalateToTeam} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Escalation Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Detail why core team intervention is required (e.g. licensing server timeout, VST binary compilation crash on macOS Sequoia, CDN download failure)..."
                  className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2 bg-[#202020] text-zinc-300 hover:text-white rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEscalating}
                  className="px-5 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {isEscalating ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
