'use client';

import React from 'react';
import { useBrand } from '@/context/BrandContext';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Lock,
  Building,
} from 'lucide-react';

export default function DocumentsPage() {
  const { brand } = useBrand();

  const documents = [
    {
      id: 'doc_01',
      title: 'Toy Creator Developer & Publisher Agreement',
      category: 'Master Terms',
      version: 'v2.4 (2026)',
      status: 'Signed & Active',
      effectiveDate: 'August 1, 2026',
      description: 'Master non-exclusive distribution terms. Grants ProducerToy right to market and distribute your audio software while you retain 100% intellectual property ownership.',
    },
    {
      id: 'doc_02',
      title: '85/15 Developer Revenue Share Schedule',
      category: 'Revenue Share',
      version: 'v1.2 (Active)',
      status: 'Active',
      effectiveDate: 'Standard Schedule',
      description: 'Contractual guarantee that developer retains 85% of net product sales. 15% marketplace platform fee covers payment processing, multi-gigabyte CDN bandwidth, and hardware activation servers.',
    },
    {
      id: 'doc_03',
      title: 'United States IRS Form W-8BEN (Foreign Tax Certificate)',
      category: 'Tax & Compliance',
      version: '2026 Rev',
      status: 'Verified',
      effectiveDate: 'Valid through Dec 31, 2028',
      description: 'Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting for international royalty disbursements.',
    },
    {
      id: 'doc_04',
      title: 'JUCE / C++ DSP Hardware Anti-Piracy Licensing Rider',
      category: 'Security Protocol',
      version: 'v1.0',
      status: 'Active',
      effectiveDate: 'Active',
      description: 'Hardware signature verification, ECDSA asymmetric pairing protocol, and offline grace compliance terms for digital audio workstation licensing.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Agreements & Legal Documents
        </h1>
        <p className="text-xs text-zinc-400">
          Official publisher agreements, royalty schedules, and compliance forms for {brand?.name || 'Producer Toy'}
        </p>
      </div>

      {/* Compliance Status Card */}
      <div className="toy-card p-6 bg-gradient-to-r from-[#181818] via-[#1a1a1a] to-[#161616] border border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Full Publisher Compliance Status: Active</h3>
            <p className="text-xs text-zinc-400">
              All required distribution terms and tax certificates are up-to-date. Your brand is cleared for automated worldwide sales.
            </p>
          </div>
        </div>

        <span className="toy-badge toy-badge-emerald self-start sm:self-auto">
          Verified Developer
        </span>
      </div>

      {/* Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="toy-card p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="toy-badge toy-badge-violet">{doc.category}</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  {doc.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">{doc.title}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{doc.description}</p>
            </div>

            <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">{doc.version}</span>
              <button
                onClick={() => alert(`Downloading copy of "${doc.title}"...`)}
                className="hover:text-white flex items-center gap-1.5 transition-colors font-medium text-zinc-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
