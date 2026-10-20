'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, Building2, Mail, Globe, Sparkles, Loader2, ArrowLeft, Headphones } from 'lucide-react';
import { createDeveloperTicket } from '@/lib/supabase/actions';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { validateTurnstileAction } from '@/actions/authActions';

export function CreatorApplicationForm({ initialEmail = '', onBack }: { initialEmail?: string; onBack?: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    email: initialEmail || '',
    websiteUrl: '',
    productType: 'plugin',
    catalogSize: '1 - 5 products',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.brandName.trim() || !formData.email.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!turnstileToken) {
      setErrorMsg('Security verification required. Please complete Cloudflare Turnstile before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const turnstileCheck = await validateTurnstileAction(turnstileToken);
      if (!turnstileCheck.success) {
        setTurnstileToken(null);
        throw new Error(turnstileCheck.error || 'Security verification failed. Please try again.');
      }
      // 1. Submit priority ticket in Supabase
      await createDeveloperTicket({
        name: `${formData.name} (${formData.brandName})`,
        email: formData.email.trim(),
        subject: `[Brand Application] Partnership Request from ${formData.brandName}`,
        description: `Brand Name: ${formData.brandName}\nWebsite/Portfolio: ${formData.websiteUrl || 'Not provided'}\nProduct Category: ${formData.productType}\nCatalog Size: ${formData.catalogSize}\n\nPitch / Details:\n${formData.message || 'No additional note'}`,
        priority: 'HIGH',
      });

      // 2. FormSubmit non-blocking background dispatch
      try {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('brand_name', formData.brandName);
        payload.append('email', formData.email);
        payload.append('website', formData.websiteUrl);
        payload.append('product_type', formData.productType);
        payload.append('catalog_size', formData.catalogSize);
        payload.append('message', formData.message);
        payload.append('_subject', `[Toy Creator Brand Application] ${formData.brandName} - ${formData.name}`);
        
        fetch('https://formsubmit.co/ajax/contact@producertoy.com', {
          method: 'POST',
          body: payload,
          headers: { Accept: 'application/json' },
        }).catch(() => {});
      } catch {
        // Fallback
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setErrorMsg(err.message || 'Could not submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-2xl animate-in fade-in duration-200 max-w-xl mx-auto">
        <div className="w-16 h-16 bg-[#202020] border border-[#34363d] rounded-full flex items-center justify-center mx-auto text-zinc-200">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Application Received</h2>
        <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
          Thank you for applying to publish on ProducerToy. Our audio developer partnerships team reviews every studio submission and catalog sample. We will contact you at <span className="font-mono text-white font-semibold">{formData.email}</span> within 24–48 hours.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="w-full sm:w-auto btn-secondary text-xs uppercase"
          >
            Submit Another Request
          </button>
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto btn-primary text-xs uppercase"
          >
            Visit Marketplace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6 max-w-2xl w-full mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      )}

      {/* Header */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
          Brand Creator Application
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Partner &amp; Publish with ProducerToy
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Toy Creator accounts are manually verified to protect audio IP and ensure platform quality. Submit your developer portfolio below to apply for brand registration.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Your Name <span className="text-zinc-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Mercer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#34363d] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Brand / Studio Name <span className="text-zinc-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sonic Pulse DSP, Waveform Labs"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#34363d] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Developer Email <span className="text-zinc-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="developer@yourbrand.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#34363d] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Website / Audio Portfolio
            </label>
            <input
              type="url"
              placeholder="https://yourbrand.com or Soundcloud/GitHub"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#34363d] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Audio Product Category
            </label>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#34363d] transition-colors"
            >
              <option value="plugin">Audio VST / AU / AAX Plugins</option>
              <option value="sample_pack">Sample Packs & Sound Libraries</option>
              <option value="preset">Synth Presets (Serum, Diva, Vital)</option>
              <option value="template">DAW Templates & Audio Tools</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Estimated Catalog Size
            </label>
            <select
              value={formData.catalogSize}
              onChange={(e) => setFormData({ ...formData, catalogSize: e.target.value })}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#34363d] transition-colors"
            >
              <option value="1 - 3 products">1 – 3 products</option>
              <option value="4 - 10 products">4 – 10 products</option>
              <option value="10+ products">10+ products</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
            Tell Us About Your Software / Audio Vision
          </label>
          <textarea
            rows={4}
            placeholder="Brief summary of your plugins, audio algorithms, or production sound design..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl p-3.5 text-xs text-white focus:border-[#34363d] transition-colors resize-none"
          />
        </div>

        {/* Cloudflare Turnstile */}
        <TurnstileWidget
          onSuccess={(token) => {
            setTurnstileToken(token);
            setErrorMsg('');
          }}
          onExpire={() => setTurnstileToken(null)}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className="w-full btn-primary py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Application...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Brand Application</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
