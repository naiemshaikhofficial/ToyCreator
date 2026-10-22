'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Check,
  Lightbulb,
  ArrowRight,
  Package,
  Tag,
  DollarSign,
  FileText,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  generateProductWithProdyAction,
  brainstormProductIdeasAction,
  type ProdyGeneratedProduct,
  type ProdyBrainstormIdea,
} from '@/actions/prodyActions';

interface ProdyCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string;
  onApplyProduct: (product: ProdyGeneratedProduct) => void;
}

const INSPIRATION_CHIPS = [
  'Vintage Tape Saturator',
  'Drill 808 & Dark Piano Kit',
  'Bollywood Tabla & Flute Trap',
  'Analog Synth Serum Presets',
  'Silky R&B Vocal Chops',
  'Lush Plate Reverb VST',
  'Punchy Phonk Drum Pack',
  'Lo-Fi Vinyl Keys',
];

export default function ProdyCopilotModal({
  isOpen,
  onClose,
  brandName = 'Producer Toy',
  onApplyProduct,
}: ProdyCopilotModalProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'brainstorm'>('generate');
  const [prompt, setPrompt] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'auto' | 'plugin' | 'sample-pack'>('auto');

  // Loading & Data States
  const [generating, setGenerating] = useState(false);
  const [brainstorming, setBrainstorming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedProduct, setGeneratedProduct] = useState<ProdyGeneratedProduct | null>(null);
  const [ideas, setIdeas] = useState<ProdyBrainstormIdea[]>([]);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) {
      setErrorMsg('Please enter an idea, keywords, or click a suggestion chip.');
      return;
    }

    setGenerating(true);
    setErrorMsg('');
    setApplied(false);

    try {
      const res = await generateProductWithProdyAction({
        prompt: textToUse,
        categorySlug: categoryFilter,
        brandName,
      });

      if (res.success && res.data) {
        setGeneratedProduct(res.data);
      } else {
        setErrorMsg(res.error || 'Failed to generate product metadata.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error calling Prody AI Copilot.');
    } finally {
      setGenerating(false);
    }
  };

  const handleBrainstorm = async () => {
    setBrainstorming(true);
    setErrorMsg('');
    try {
      const res = await brainstormProductIdeasAction({
        brandName,
        categoryFilter: categoryFilter === 'auto' ? 'all' : categoryFilter,
      });

      if (res.success && res.ideas) {
        setIdeas(res.ideas);
      } else {
        setErrorMsg(res.error || 'Failed to brainstorm ideas.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating brainstorm concepts.');
    } finally {
      setBrainstorming(false);
    }
  };

  const handleApply = () => {
    if (!generatedProduct) return;
    onApplyProduct(generatedProduct);
    setApplied(true);
    setTimeout(() => {
      onClose();
      setApplied(false);
    }, 900);
  };

  const handlePickIdea = (idea: ProdyBrainstormIdea) => {
    setActiveTab('generate');
    setPrompt(idea.prompt);
    handleGenerate(idea.prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-[#2a2a2a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#242424] flex items-center justify-between bg-gradient-to-r from-[#161616] to-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Prody AI Copilot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Prody AI v2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                AI audio product strategist for {brandName} • Instant 1-click listing creator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#202020] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-[#222222] bg-[#141414] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Idea to Product Listing</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('brainstorm');
              if (ideas.length === 0) handleBrainstorm();
            }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'brainstorm'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Brainstorm Concepts (No Ideas)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {activeTab === 'generate' ? (
            <div className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  What are you creating? (Rough Concept or Sound Notes)
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A punchy 808 sub bass plugin with analog tube saturation and pitch glide, or a Bollywood flute and tabla trap soundbank for drill beats..."
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:border-white transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* Quick Inspiration Chips */}
              <div>
                <span className="text-[11px] font-medium text-zinc-400 block mb-1.5">
                  Quick Idea Presets (Click to Fill):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setPrompt(chip);
                        handleGenerate(chip);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2a2a2a] hover:border-zinc-500 text-[11px] text-zinc-300 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-500 text-[11px]">Format:</span>
                  {(['auto', 'plugin', 'sample-pack'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                        categoryFilter === cat
                          ? 'bg-zinc-200 text-black font-semibold'
                          : 'bg-[#181818] text-zinc-400 hover:text-white border border-[#2a2a2a]'
                      }`}
                    >
                      {cat === 'auto' ? 'Auto-Detect' : cat.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={generating || !prompt.trim()}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Prody is Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Generate Full Product</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Result Preview Card */}
              {generatedProduct && (
                <div className="mt-4 p-4 rounded-xl bg-[#161616] border border-[#2c2c2c] space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{generatedProduct.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {generatedProduct.category_slug === 'plugin' ? 'Audio Plugin' : 'Sample Pack'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">
                      ${generatedProduct.price_usd.toFixed(2)}
                      {generatedProduct.original_price_usd && (
                        <span className="text-zinc-500 line-through text-[11px] ml-1.5 font-normal">
                          ${generatedProduct.original_price_usd.toFixed(2)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                      Short Tagline:
                    </span>
                    <p className="text-xs text-zinc-200 italic mt-0.5">&ldquo;{generatedProduct.short_description}&rdquo;</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                    <div>
                      <span className="text-zinc-500 block">Subcategory:</span>
                      <span className="text-zinc-200 font-medium">
                        {generatedProduct.subcategory_name || 'Standard'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Genres:</span>
                      <span className="text-zinc-200">
                        {generatedProduct.category_slugs.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Apply Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={applied}
                      className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                      {applied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Applied to Product Form!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Apply to Product Form (1-Click Auto-Fill)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Brainstorming Mode (Zero Ideas) */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-zinc-400">
                  Select any concept below to have Prody automatically generate its full product listing:
                </span>
                <button
                  type="button"
                  onClick={handleBrainstorm}
                  disabled={brainstorming}
                  className="btn-secondary px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3 h-3 ${brainstorming ? 'animate-spin' : ''}`} />
                  <span>Refresh Concepts</span>
                </button>
              </div>

              {brainstorming ? (
                <div className="p-10 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Prody is analyzing audio market trends & brainstorming concepts...</span>
                </div>
              ) : ideas.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  Click &ldquo;Refresh Concepts&rdquo; to generate 3 commercial audio product concepts for {brandName}.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ideas.map((idea, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#161616] border border-[#282828] hover:border-zinc-500 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">{idea.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                            {idea.category === 'plugin' ? 'Plugin' : 'Sample Library'} • {idea.subcategory}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-white">
                          ${idea.suggested_price}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-relaxed">{idea.tagline}</p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-zinc-500">
                          Tags: {idea.genres.join(', ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePickIdea(idea)}
                          className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Build This Product</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
