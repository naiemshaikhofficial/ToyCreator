'use client';

import React, { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Eye,
  X,
  ExternalLink,
  Scale,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';
import {
  UNIVERSAL_AGREEMENT_SECTIONS,
  UNIVERSAL_SCHEDULE_A,
  UNIVERSAL_RISK_MATRIX,
} from '@/lib/legal/universalSellerAgreement';

export default function DocumentsPage() {
  const { brand } = useBrand();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('sec_1');

  const brandDisplayName = brand?.name || 'Authorized Brand';

  const documents = [
    {
      id: 'doc_universal_agreement',
      title: 'Universal Brand & Seller Distribution Agreement',
      category: 'Master Terms',
      version: 'v2.4 (Universal)',
      status: 'Active & Enforceable',
      effectiveDate: 'Standard Publisher Terms',
      description:
        'Standard master marketplace terms covering 70/30 split, direct checkout, library delivery, C++/DSP copyright ownership, anti-piracy risk allocation, and pre-launch review.',
      hasInteractiveView: true,
    },
    {
      id: 'doc_schedule_a',
      title: 'Commercial Terms & Revenue Share Schedule (Schedule A)',
      category: 'Commercial Schedule',
      version: 'v1.2 (Active)',
      status: 'Active',
      effectiveDate: 'Standard Schedule',
      description:
        'Contractual guarantee of 70% developer revenue share on Eligible Net Proceeds, monthly settlements by the 15th, zero minimum payout threshold, and international payout rails.',
      hasInteractiveView: true,
    },
    {
      id: 'doc_03',
      title: 'United States IRS Form W-8BEN (Foreign Tax Certificate)',
      category: 'Tax & Compliance',
      version: '2026 Rev',
      status: 'Verified',
      effectiveDate: 'Valid through Dec 31, 2028',
      description:
        'Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting for international royalty disbursements.',
      hasInteractiveView: false,
    },
    {
      id: 'doc_04',
      title: 'Anti-Piracy & Hardware Security Licensing Rider',
      category: 'Security Protocol',
      version: 'v1.0 (Active)',
      status: 'Active',
      effectiveDate: 'Active',
      description:
        'Hardware signature verification, ECDSA asymmetric pairing protocol, live keygen webhook SLA, and offline grace compliance terms for digital audio workstation licensing.',
      hasInteractiveView: false,
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGate allowedRoles={['owner', 'finance']} sectionName="Legal Contracts & Tax Documents">
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Agreements & Legal Documents
            </h1>
            <p className="text-xs text-zinc-400">
              Universal master distribution terms, commercial schedules, and compliance documents for{' '}
              <span className="text-white font-semibold">{brandDisplayName}</span>
            </p>
          </div>
          <button
            onClick={() => setActiveModal('doc_universal_agreement')}
            className="toy-btn-primary text-xs py-2 px-3.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read Master Agreement</span>
          </button>
        </div>

        {/* Compliance Status Card */}
        <div className="toy-card p-6 bg-[#181818] border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#242424] border border-zinc-700/60 flex items-center justify-center text-zinc-300 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Universal Seller Compliance Status: Active
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  70/30 Standard
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                All required digital audio distribution terms, copyright protections, and tax compliance certificates are active.
                Your brand is cleared for worldwide direct sales.
              </p>
            </div>
          </div>

          <span className="toy-badge toy-badge-charcoal self-start sm:self-auto font-mono text-[11px]">
            UDYAM-MH-01-0264011
          </span>
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="toy-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="toy-badge toy-badge-zinc">{doc.category}</span>
                  <span className="text-[10px] font-mono text-zinc-300 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {doc.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{doc.title}</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{doc.description}</p>
              </div>

              <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono text-[11px]">{doc.version}</span>
                <div className="flex items-center gap-3">
                  {doc.hasInteractiveView && (
                    <button
                      onClick={() => setActiveModal(doc.id)}
                      className="hover:text-white flex items-center gap-1 transition-colors font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (doc.id === 'doc_universal_agreement') {
                        setActiveModal('doc_universal_agreement');
                      } else {
                        alert(`Downloading verified copy of "${doc.title}"...`);
                      }
                    }}
                    className="hover:text-white flex items-center gap-1.5 transition-colors font-medium text-zinc-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Master Agreement Modal */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#181818]/90">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Scale className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      Brand & Seller Distribution Agreement
                    </h2>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Universal Master Terms • Producer Toy & {brandDisplayName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    title="Print Agreement"
                    className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable Legal Reader */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed font-sans divide-y divide-zinc-800/60">
                {/* Preamble / Summary Banner */}
                <div className="pb-4">
                  <div className="p-4 rounded-xl bg-[#1e1e1e] border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase font-bold">
                        Master Universal Terms
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Registration: UDYAM-MH-01-0264011
                      </span>
                    </div>
                    <p className="text-zinc-200 font-medium">
                      Between <strong className="text-white">Producer Toy</strong> (Naiemoddin Nijamoddin Shaikh, Sole Proprietor) and{' '}
                      <strong className="text-white">{brandDisplayName}</strong>.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Standard universal non-exclusive distribution terms for digital audio plugins (VST3/AU/AAX), sound libraries,
                      and sample packs on Producer Toy.
                    </p>
                  </div>
                </div>

                {/* 18 Universal Clauses Accordion */}
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                    Agreement Clauses (1 through 18)
                  </h3>

                  {UNIVERSAL_AGREEMENT_SECTIONS.map((sec) => {
                    const isOpen = expandedSection === sec.id;
                    return (
                      <div
                        key={sec.id}
                        className="rounded-xl border border-zinc-800/80 bg-[#161616] overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedSection(isOpen ? null : sec.id)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
                        >
                          <span className="font-semibold text-white flex items-center gap-2">
                            <span className="font-mono text-emerald-400 font-bold">{sec.number}.</span>
                            {sec.title}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="p-4 pt-1 space-y-3 bg-[#121212]/50 border-t border-zinc-800/60 text-zinc-300">
                            {sec.subsections.map((sub) => (
                              <div key={sub.number} className="flex gap-2">
                                <span className="font-mono text-zinc-500 flex-shrink-0">{sub.number}</span>
                                <p>{sub.text.replace(/Seller/g, brandDisplayName)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Schedule A Table */}
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Schedule A — Commercial Terms & Revenue Share
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1c1c1c] text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                        <tr>
                          <th className="p-3">Commercial Term</th>
                          <th className="p-3">Universal Standard Specification</th>
                          <th className="p-3">{brandDisplayName} Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {UNIVERSAL_SCHEDULE_A.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/20">
                            <td className="p-3 font-semibold text-white">{row.term}</td>
                            <td className="p-3 text-zinc-300">{row.standard}</td>
                            <td className="p-3 font-mono text-emerald-400 font-medium">{row.selection}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Schedule D: Risk Allocation Matrix */}
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Schedule D — Risk Allocation Summary Matrix
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1c1c1c] text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                        <tr>
                          <th className="p-3">Scenario</th>
                          <th className="p-3">Responsible Party</th>
                          <th className="p-3">Operational Standard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {UNIVERSAL_RISK_MATRIX.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/20">
                            <td className="p-3 font-semibold text-white">{row.scenario}</td>
                            <td className="p-3 font-mono text-zinc-300">{row.responsibleParty}</td>
                            <td className="p-3 text-zinc-400">{row.standard}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-800/80 bg-[#181818]/90 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono text-[11px]">
                  Direct inquiries: legal@producetoy.com
                </span>
                <button
                  onClick={() => setActiveModal(null)}
                  className="toy-btn-primary text-xs py-2 px-4"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
