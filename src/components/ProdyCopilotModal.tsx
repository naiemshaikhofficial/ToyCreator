'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  X,
  Loader2,
  Check,
  ArrowRight,
  Copy,
  CheckCheck,
  RotateCcw,
  Tag,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  Music,
  Cpu,
  Layers,
  Zap,
  Search,
  Globe,
} from 'lucide-react';
import {
  prodyChatAction,
  type ProdyGeneratedProduct,
  type ProdyChatMessage,
} from '@/actions/prodyActions';

export type ProdyApplyMode =
  | 'all'
  | 'title'
  | 'description'
  | 'category'
  | 'genres'
  | 'pricing'
  | 'specs';

export interface CurrentFormValues {
  name?: string;
  slug?: string;
  productType?: string;
  categorySlug?: string;
  subcategoryName?: string;
  selectedGenres?: string[];
  priceUsd?: string;
  originalPriceUsd?: string;
  shortDesc?: string;
  fullDesc?: string;
  vstFormat?: string;
}

interface ProdyCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string;
  currentFormValues?: CurrentFormValues;
  onApplyProduct: (product: ProdyGeneratedProduct, mode?: ProdyApplyMode) => void;
}

interface ChatItem {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  product?: ProdyGeneratedProduct | null;
  isThinking?: boolean;
}

/**
 * Render an interactive selectable option card with checkbox, hover effect, and "Other" support
 */
function renderOptionItem(
  key: string | number,
  optionContent: string,
  onOptionClick?: (optionText: string) => void,
  activeOtherKey?: string | number | null,
  otherCustomText?: string,
  onOtherChange?: (val: string) => void,
  onOtherSubmit?: () => void
) {
  const isOther =
    optionContent.toLowerCase().includes('other') ||
    optionContent.toLowerCase().includes('specify') ||
    optionContent.toLowerCase().includes('custom');
  const isOtherActive = isOther && activeOtherKey === key;

  return (
    <div key={key} className="space-y-2">
      <div
        onClick={() => onOptionClick && onOptionClick(isOther ? `__OTHER__:${key}` : optionContent)}
        className={`group flex items-start gap-2.5 p-2.5 rounded-xl transition-all cursor-pointer text-left select-none ${
          isOtherActive
            ? 'bg-[#1e1e24] border border-white/40 shadow-sm'
            : 'bg-[#18181c]/80 hover:bg-[#222228] border border-white/10 hover:border-white/30'
        }`}
      >
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
            isOtherActive ? 'border-white bg-white text-black' : 'border-white/30 group-hover:border-white bg-[#101014]'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-xs transition-colors ${
              isOtherActive ? 'bg-black' : 'bg-transparent group-hover:bg-white'
            }`}
          />
        </div>
        <div className="flex-1 text-zinc-300 group-hover:text-white text-xs sm:text-[13px] font-medium leading-relaxed">
          {parseInlineFormatting(optionContent)}
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white uppercase tracking-wider shrink-0 mt-0.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 group-hover:border-white/30">
          {isOther ? 'Custom' : 'Select'}
        </span>
      </div>

      {/* Inline Custom Text Box when Other is selected */}
      {isOtherActive && (
        <div className="pl-6 pt-1 animate-fadeIn">
          <div className="flex items-center gap-2 p-1.5 bg-[#121216] border border-white/20 rounded-xl focus-within:border-white/50 transition-all">
            <input
              type="text"
              autoFocus
              value={otherCustomText || ''}
              onChange={(e) => onOtherChange && onOtherChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onOtherSubmit && onOtherSubmit();
                }
              }}
              placeholder="Type your custom title, sound idea, or specification..."
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder:text-zinc-500 outline-none"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOtherSubmit && onOtherSubmit();
              }}
              disabled={!otherCustomText?.trim()}
              className="px-3 py-1 rounded-lg bg-white text-black text-[11px] font-bold hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Clean Minimalist Markdown Renderer with Interactive Options, Checkbox & Custom "Other" Text Box Support
 */
function renderFormattedMessage(
  text: string,
  onOptionClick?: (optionText: string) => void,
  activeOtherIndex?: number | string | null,
  otherCustomText?: string,
  onOtherChange?: (val: string) => void,
  onOtherSubmit?: () => void
) {
  if (!text) return null;

  const rawLines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentOptionBlock: { id: string | number; content: string }[] = [];

  const flushOptionBlock = () => {
    if (currentOptionBlock.length === 0) return;

    const hasOther = currentOptionBlock.some((opt) => {
      const lower = opt.content.toLowerCase();
      return lower.includes('other') || lower.includes('custom') || lower.includes('specify');
    });

    currentOptionBlock.forEach((opt) => {
      renderedElements.push(
        renderOptionItem(
          opt.id,
          opt.content,
          onOptionClick,
          activeOtherIndex,
          otherCustomText,
          onOtherChange,
          onOtherSubmit
        )
      );
    });

    // If no "Other" was included, automatically append an "Other (custom input)" card!
    if (!hasOther) {
      const autoOtherId = `auto-other-${currentOptionBlock[0].id}`;
      renderedElements.push(
        renderOptionItem(
          autoOtherId,
          'Other (custom input / tweak)',
          onOptionClick,
          activeOtherIndex,
          otherCustomText,
          onOtherChange,
          onOtherSubmit
        )
      );
    }

    currentOptionBlock = [];
  };

  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx];
    const trimmed = line.trim();

    if (!trimmed) {
      flushOptionBlock();
      renderedElements.push(<div key={`blank-${idx}`} className="h-1.5" />);
      continue;
    }

    // Horizontal rule: --- or ***
    if (trimmed === '---' || trimmed === '***') {
      flushOptionBlock();
      renderedElements.push(<hr key={`hr-${idx}`} className="border-white/10 my-2" />);
      continue;
    }

    // Heading 3 or 4: ### Heading
    if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
      flushOptionBlock();
      const headingText = trimmed.replace(/^#{3,4}\s+/, '');
      renderedElements.push(
        <h4 key={`h-${idx}`} className="text-sm sm:text-[15px] font-extrabold text-white tracking-tight pt-1">
          {parseInlineFormatting(headingText)}
        </h4>
      );
      continue;
    }

    // Step indicators (e.g. "✅ Step 1 - Title", "🛠️ Step 1: Title", "Step 1:")
    const stepMatch = trimmed.match(/^([✅🛠️🎛️⚡💡\s]*)?(Step\s+\d+[:\s–-]+.*)$/i);
    if (stepMatch) {
      flushOptionBlock();
      renderedElements.push(
        <div key={`step-${idx}`} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white font-bold text-xs tracking-wide my-1">
          <span>{stepMatch[2]}</span>
        </div>
      );
      continue;
    }

    // 1. Explicit Checkbox: - [ ] item, * [ ] item, • [ ] item, or ☐ item
    const checkboxMatch = trimmed.match(/^([-*•]\s*)?(\[[ xX]\]|☐|☑)\s+(.*)$/);
    if (checkboxMatch) {
      currentOptionBlock.push({ id: idx, content: checkboxMatch[3].trim() });
      continue;
    }

    // 2. Detect Bullet or Numbered item as selectable option
    // When previous lines introduce alternatives/options or line contains title format
    const bulletMatch = trimmed.match(/^([-*•]|\d+\.)\s+(.*)$/);
    const prevText = idx > 0 ? rawLines.slice(Math.max(0, idx - 3), idx).join(' ').toLowerCase() : '';
    const isUnderOptionContext =
      prevText.includes('alternative') ||
      prevText.includes('option') ||
      prevText.includes('choice') ||
      prevText.includes('pick') ||
      prevText.includes('select') ||
      prevText.includes('title') ||
      prevText.includes('suggest') ||
      prevText.includes('step 1') ||
      prevText.includes('step 2') ||
      prevText.includes('step 3') ||
      prevText.includes('here are');

    if (bulletMatch && (isUnderOptionContext || currentOptionBlock.length > 0)) {
      currentOptionBlock.push({ id: idx, content: bulletMatch[2].trim() });
      continue;
    }

    // If it was not an option line, flush any open option block
    flushOptionBlock();

    // Standard bullet point
    if (bulletMatch) {
      renderedElements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2 pl-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
          <div className="flex-1 text-zinc-300">{parseInlineFormatting(bulletMatch[2].trim())}</div>
        </div>
      );
      continue;
    }

    // Regular paragraph
    renderedElements.push(
      <p key={`p-${idx}`} className="text-zinc-300">
        {parseInlineFormatting(line)}
      </p>
    );
  }

  flushOptionBlock();
  return (
    <div className="space-y-2 text-[13px] sm:text-[14px] leading-relaxed text-zinc-300 font-sans">
      {renderedElements}
    </div>
  );
}

/**
 * Parses bold (**text**), italics (*text*), and code (`code`)
 */
function parseInlineFormatting(str: string): React.ReactNode[] {
  // Regex splitting by bold, code, italic
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-zinc-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts;
}

/**
 * Determine high-value contextual suggestion chips based on assistant response and form state
 */
function getContextualSuggestions(
  content: string,
  currentFormValues?: CurrentFormValues
): string[] {
  const lower = (content || '').toLowerCase();
  const currentTitle = currentFormValues?.name?.trim();

  // If discussing Step 1 / Titles:
  if (
    lower.includes('step 1') ||
    lower.includes('title') ||
    lower.includes('alternative') ||
    lower.includes('name') ||
    (lower.includes('proverb') && !lower.includes('step 2'))
  ) {
    const list: string[] = [];
    if (currentTitle) {
      list.push(`Keep "${currentTitle}" & Proceed to Step 2`);
    }
    list.push('Suggest 3 Optimized Titles', 'Customize My Title', '⚡ Build Full Listing');
    return list;
  }

  // If discussing Step 2 / DSP / Features:
  if (
    lower.includes('step 2') ||
    lower.includes('dsp') ||
    lower.includes('architecture') ||
    lower.includes('latency') ||
    lower.includes('algorithm') ||
    lower.includes('reverb engine')
  ) {
    return [
      'Confirm DSP Specs & Proceed to Step 3',
      'Zero-Latency & Low CPU Footprint',
      'Add Shimmer & Modulation Tail',
      '⚡ Build Full Listing',
    ];
  }

  // If discussing Step 3 / Pricing:
  if (
    lower.includes('step 3') ||
    lower.includes('pricing') ||
    lower.includes('price') ||
    lower.includes('tier') ||
    lower.includes('$')
  ) {
    return [
      'Confirm Recommended Price & Proceed',
      'Suggest $29 Launch Special',
      'Suggest $49 Standard Pro Tier',
      '⚡ Build Full Listing',
    ];
  }

  // Default / General
  return [
    '⚡ Build Full Google SEO Listing',
    'Suggest 3 High-CTR Title Angles',
    'Analyze Audio Features & DSP',
    'Suggest Best Pricing Strategy',
  ];
}

export default function ProdyCopilotModal({
  isOpen,
  onClose,
  brandName = 'Producer Toy',
  currentFormValues,
  onApplyProduct,
}: ProdyCopilotModalProps) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedModes, setAppliedModes] = useState<Record<string, string>>({});
  const [expandedDescId, setExpandedDescId] = useState<string | null>(null);
  const [activeOtherMap, setActiveOtherMap] = useState<Record<string, number | string | null>>({});
  const [otherTextMap, setOtherTextMap] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Build context-aware initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hasTitle = Boolean(currentFormValues?.name?.trim());
      const initialGreeting = hasTitle
        ? `Hey there! 🎧 I'm **Prody**, your AI Audio Architect & Google SEO Specialist for **${brandName}**.\n\nI noticed you're already configuring **${currentFormValues!.name}** (${currentFormValues?.subcategoryName || currentFormValues?.categorySlug || 'Audio Product'}).\n\nYour title is in place! Would you like to keep this title, or should I suggest 3 high-ranking commercial variations?`
        : `Hey there! 🎧 I'm **Prody**, your AI Audio Architect & Google SEO Specialist for **${brandName}**.\n\nTell me about your next sound release—what kind of plugin, sample pack, or preset bank are you envisioning? Let's turn your sound vision into a #1 Google-ranking release.`;

      setMessages([
        {
          id: 'greeting',
          sender: 'assistant',
          timestamp: formatCurrentTime(),
          content: initialGreeting,
        },
      ]);
    }
  }, [isOpen, brandName, currentFormValues, messages.length]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApply = (product: ProdyGeneratedProduct, mode: ProdyApplyMode = 'all', msgId: string) => {
    onApplyProduct(product, mode);
    setAppliedModes((prev) => ({ ...prev, [`${msgId}-${mode}`]: 'applied' }));
    setTimeout(() => {
      setAppliedModes((prev) => {
        const copy = { ...prev };
        delete copy[`${msgId}-${mode}`];
        return copy;
      });
    }, 3000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: ChatItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: formatCurrentTime(),
      content: text,
    };

    const thinkingMsg: ChatItem = {
      id: `asst-thinking-${Date.now()}`,
      sender: 'assistant',
      timestamp: formatCurrentTime(),
      content: '',
      isThinking: true,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const payload: ProdyChatMessage[] = [...messages, userMsg]
        .filter((m) => !m.isThinking && m.content)
        .map((m) => ({
          sender: m.sender,
          content: m.content,
        }));

      const res = await prodyChatAction({
        messages: payload,
        brandName,
        currentFormValues,
      });

      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingMsg.id
              ? {
                  id: `asst-${Date.now()}`,
                  sender: 'assistant',
                  timestamp: formatCurrentTime(),
                  content: res.content,
                  product: res.product || null,
                  isThinking: false,
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingMsg.id
              ? {
                  id: `asst-err-${Date.now()}`,
                  sender: 'assistant',
                  timestamp: formatCurrentTime(),
                  content: res.content || res.error || 'Prody had trouble processing that. Please try again!',
                  isThinking: false,
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingMsg.id
            ? {
                id: `asst-err-${Date.now()}`,
                sender: 'assistant',
                timestamp: formatCurrentTime(),
                content: 'Network connection error. Please try sending your message again.',
                isThinking: false,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    const hasTitle = Boolean(currentFormValues?.name?.trim());
    const initialGreeting = hasTitle
      ? `Hey there! 🎧 I'm **Prody**, your AI Audio Architect & Google SEO Specialist for **${brandName}**.\n\nI noticed you're already configuring **${currentFormValues!.name}** (${currentFormValues?.subcategoryName || currentFormValues?.categorySlug || 'Audio Product'}).\n\nYour title is in place! Would you like to keep this title, or should I suggest 3 high-ranking commercial variations?`
      : `Hey there! 🎧 I'm **Prody**, your AI Audio Architect & Google SEO Specialist for **${brandName}**.\n\nTell me about your next sound release—what kind of plugin, sample pack, or preset bank are you envisioning? Let's turn your sound vision into a #1 Google-ranking release.`;

    setMessages([
      {
        id: 'greeting',
        sender: 'assistant',
        timestamp: formatCurrentTime(),
        content: initialGreeting,
      },
    ]);
  };

  // Dynamic starter chips based on form state
  const hasExistingTitle = Boolean(currentFormValues?.name?.trim());
  const starterChips = hasExistingTitle
    ? [
        `Keep "${currentFormValues!.name}"`,
        'Suggest 3 Optimized Titles',
        'Analyze Audio Features & DSP',
        'Suggest Best Pricing Strategy',
        'Build Full Google SEO Listing',
      ]
    : [
        '🎛️ AI Reverb VST3 / AU Plugin',
        '🔊 Dark Drill 808 & Bass Synth',
        '🥁 Organic Tabla & Trap Pack',
        '🎹 Analog Synth Preset Bank',
        '🎤 Silky Vocal Hooks & Chops',
        '⚡ Tape Saturator & Warmth FX',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Container — Strict Producer Toy Monochrome Theme */}
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-[88vh] bg-[#0c0c0e] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">
        
        {/* Top Header — Mascot Bear Logo with Ambient Glow (No green, red, or blue) */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#121216] border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <Image
                src="/images/prody.webp"
                alt="Prody AI Mascot"
                fill
                sizes="44px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Prody • Audio Copilot
                </h2>
                <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                AI Studio Architect & #1 Google SEO Master for {brandName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              title="Reset conversation"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 bg-[#09090b]">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex flex-col items-end space-y-1.5 animate-fadeIn">
                  <div className="text-[11px] text-zinc-500 pr-1 flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-300">You</span>
                    <span>• {msg.timestamp}</span>
                  </div>
                  <div className="bg-gradient-to-r from-[#24252b] via-[#2d2f36] to-[#34363d] border border-white/10 text-white font-medium px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl rounded-tr-xs max-w-xl text-[13px] sm:text-[14px] leading-relaxed shadow-lg">
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Assistant Bubble
            return (
              <div key={msg.id} className="flex flex-col items-start space-y-2 animate-fadeIn w-full max-w-3xl">
                {/* Assistant Header with Avatar */}
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 pl-1">
                  <div className="relative w-5 h-5 shrink-0">
                    <Image
                      src="/images/prody.webp"
                      alt="Prody"
                      fill
                      sizes="20px"
                      className="object-contain"
                    />
                  </div>
                  <span className="font-bold text-zinc-200">Prody</span>
                  <span className="text-zinc-500">• {msg.timestamp}</span>
                </div>

                {msg.isThinking ? (
                  <div className="inline-flex items-center gap-3 bg-[#151518] border border-white/[0.12] text-zinc-300 rounded-2xl rounded-tl-xs px-4 py-3 shadow-md">
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin flex-shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="text-xs text-white font-medium flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-zinc-400" />
                        Analyzing Google search trends & competitor research...
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Synthesizing top-ranking queries & audio SEO benchmarks
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    {/* Clean Formatted Conversational Text with Interactive Checkbox, Options & Custom Other Box */}
                    {msg.content && (
                      <div className="bg-[#151518] border border-white/[0.08] text-zinc-200 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-md">
                        {renderFormattedMessage(
                          msg.content,
                          (opt) => {
                            if (opt.startsWith('__OTHER__:')) {
                              const otherKey = opt.replace('__OTHER__:', '');
                              setActiveOtherMap((prev) => ({
                                ...prev,
                                [msg.id]: prev[msg.id] === otherKey ? null : otherKey,
                              }));
                            } else {
                              handleSendMessage(opt);
                            }
                          },
                          activeOtherMap[msg.id],
                          otherTextMap[msg.id] || '',
                          (text) => setOtherTextMap((prev) => ({ ...prev, [msg.id]: text })),
                          () => {
                            const customVal = (otherTextMap[msg.id] || '').trim();
                            if (customVal) {
                              handleSendMessage(`Other: ${customVal}`);
                              setOtherTextMap((prev) => ({ ...prev, [msg.id]: '' }));
                              setActiveOtherMap((prev) => ({ ...prev, [msg.id]: null }));
                            }
                          }
                        )}
                      </div>
                    )}

                    {/* Dynamic Contextual Suggestions Directly Under Assistant Answer */}
                    {!msg.product && (
                      <div className="pt-1.5 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-white" />
                          Suggestions (Quick Actions):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {getContextualSuggestions(msg.content, currentFormValues).map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              disabled={isTyping}
                              onClick={() => handleSendMessage(chip)}
                              className="px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#232328] border border-white/10 hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all text-left cursor-pointer disabled:opacity-50"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Master Generated Product Card */}
                    {msg.product && (
                      <div className="w-full bg-[#121215] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                        
                        {/* Title, Badge & Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                                {msg.product.name}
                              </h3>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-black uppercase tracking-wider">
                                {msg.product.category_slug === 'plugin' ? 'Audio Plugin' : 'Sample Pack'}
                              </span>
                              {msg.product.subcategory_name && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202020] text-zinc-300 border border-white/10">
                                  {msg.product.subcategory_name}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                              Storefront Slug: <span className="text-zinc-200">/{msg.product.slug}</span>
                            </span>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="font-mono text-sm sm:text-base font-bold text-white">
                              ${msg.product.price_usd.toFixed(2)}
                            </span>
                            {msg.product.original_price_usd && (
                              <span className="text-zinc-500 line-through text-xs font-mono ml-2">
                                ${msg.product.original_price_usd.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Google Search SERP Live Preview & Meta Description */}
                        <div className="p-3.5 bg-[#141416] border border-white/10 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-bold">
                              <Globe className="w-3.5 h-3.5 text-white" />
                              <span>Google Search SERP Preview (#1 Ranking Target)</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202020] text-zinc-300 border border-white/10">
                                {msg.product.short_description.length} / 160 chars
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(msg.product!.short_description, `short-${msg.id}`)}
                                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedKey === `short-${msg.id}` ? (
                                  <CheckCheck className="w-3 h-3 text-white" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedKey === `short-${msg.id}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Live Google Search Result Box */}
                          <div className="p-3 bg-[#0d0d10] border border-white/[0.08] rounded-lg space-y-1 text-left font-sans">
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                              <span className="text-zinc-500">https://producertoy.com</span>
                              <span className="text-zinc-600">›</span>
                              <span className="text-zinc-300">catalog</span>
                              <span className="text-zinc-600">›</span>
                              <span className="text-white font-semibold">{msg.product.slug}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-white hover:underline cursor-pointer leading-snug">
                              {msg.product.name}
                            </h4>
                            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                              {msg.product.short_description}
                            </p>
                          </div>
                        </div>

                        {/* Curated Genres & Technical Specs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-[#18181c] border border-white/[0.06] rounded-xl space-y-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                              Target Genres:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {msg.product.category_slugs.map((genre) => (
                                <span
                                  key={genre}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-zinc-200"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-2.5 bg-[#18181c] border border-white/[0.06] rounded-xl space-y-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                              Format & Engine:
                            </span>
                            <span className="text-zinc-200 font-mono text-[11px] block truncate">
                              {msg.product.vst_format || '24-Bit WAV • Royalty-Free Commercial'}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Google SEO Full Description */}
                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#18181c]">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDescId(expandedDescId === msg.id ? null : msg.id)
                            }
                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-zinc-400" />
                              <span>View Full Google SEO Description</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {expandedDescId === msg.id ? 'Collapse' : 'Expand'}
                              </span>
                              {expandedDescId === msg.id ? (
                                <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                            </div>
                          </button>

                          {expandedDescId === msg.id && (
                            <div className="p-3.5 pt-1 border-t border-white/10 space-y-2">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(msg.product!.full_description, `full-${msg.id}`)}
                                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  {copiedKey === `full-${msg.id}` ? (
                                    <CheckCheck className="w-3 h-3 text-white" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedKey === `full-${msg.id}` ? 'Copied' : 'Copy Text'}</span>
                                </button>
                              </div>
                              <div className="p-3 bg-[#111114] border border-white/5 rounded-lg max-h-56 overflow-y-auto pr-1">
                                {renderFormattedMessage(msg.product.full_description)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* GRANULAR "TAKE WHAT YOU WANT" ACTION SECTION (Strict Monochrome) */}
                        <div className="pt-2 space-y-2">
                          {/* 1-Click Master Apply */}
                          <button
                            type="button"
                            onClick={() => handleApply(msg.product!, 'all', msg.id)}
                            className="w-full bg-white hover:bg-zinc-200 text-black py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] cursor-pointer"
                          >
                            {appliedModes[`${msg.id}-all`] ? (
                              <>
                                <Check className="w-4 h-4 text-black stroke-[3]" />
                                <span>Applied Everything to Form!</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                <span>Apply Everything to Form (1-Click Auto-Fill)</span>
                              </>
                            )}
                          </button>

                          {/* Granular Field Selectors */}
                          <div className="pt-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5 font-semibold">
                              Or Pick Only What You Need:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleApply(msg.product!, 'title', msg.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>🏷️ Title & Slug</span>
                                {appliedModes[`${msg.id}-title`] ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : null}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApply(msg.product!, 'description', msg.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>📝 SEO Descriptions</span>
                                {appliedModes[`${msg.id}-description`] ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : null}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApply(msg.product!, 'category', msg.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>📂 Category & Sub</span>
                                {appliedModes[`${msg.id}-category`] ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : null}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApply(msg.product!, 'genres', msg.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>🎵 Genres Only</span>
                                {appliedModes[`${msg.id}-genres`] ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : null}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApply(msg.product!, 'pricing', msg.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>💲 Pricing Only</span>
                                {appliedModes[`${msg.id}-pricing`] ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : null}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApply(msg.product!, 'specs', msg.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>🎛️ VST Specs & DAWs</span>
                                {appliedModes[`${msg.id}-specs`] ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : null}
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Fixed Chat Input Bar — Matching Producer Toy /support */}
        <div className="p-3 sm:p-4 bg-[#101014] border-t border-white/[0.08] flex-shrink-0">
          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTyping ? 'Prody is analyzing...' : 'Write your sound idea, tweak request, or question to Prody...'}
              disabled={isTyping}
              className="flex-1 bg-[#16161a] hover:bg-[#1a1a20] focus:bg-[#1a1a20] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs sm:text-[13px] text-white placeholder-zinc-500 focus:outline-none transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 active:scale-95 ${
                input.trim().length > 0 && !isTyping
                  ? 'bg-white hover:bg-zinc-200 text-black shadow-lg cursor-pointer'
                  : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              ) : (
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
