'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

export function CreatorSpotlightBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div
      className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white flex flex-col sm:flex-row sm:items-center select-none shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-black/[0.08] sm:min-h-[440px] lg:min-h-[480px]"
      style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
    >
      {/* Background Mascot Looping Video (Centered on mobile, positioned right on desktop) */}
      <div className="relative w-full h-[240px] xs:h-[280px] sm:h-full sm:absolute sm:inset-0 z-0 overflow-hidden pointer-events-none select-none flex items-center justify-center">
        <video
          ref={videoRef}
          src="/videos/homepage-showcase.mp4"
          poster="/Charcoal Headphone Bear Mascot.webp"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="w-full h-full object-contain pointer-events-none sm:translate-x-[15%] lg:translate-x-[20%]"
          style={{
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Subtle Soft White Fade on Desktop Left to Guarantee 100% Crisp Black Text */}
      <div className="hidden sm:block absolute inset-y-0 left-0 w-[54%] lg:w-[56%] bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none z-10" />

      {/* Fainted Black Ambient Glow on Bottom for Subtle Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/[0.03] pointer-events-none z-10" />

      {/* Text & Action Block - Fully Centered & Proportioned */}
      <div className="relative z-20 w-full p-5 sm:p-8 lg:p-10 pl-5 sm:pl-[6%] lg:pl-[7%] sm:max-w-[500px] flex flex-col items-center text-center gap-3 sm:gap-4 pointer-events-auto my-auto">
        {/* Minimalist Editorial Heading */}
        <h1 className="text-[22px] xs:text-[26px] sm:text-[32px] lg:text-[36px] font-black text-black tracking-tight leading-[1.12] font-sans text-center">
          Sell your audio plugins &amp; sounds
          <span className="block text-zinc-500 font-extrabold mt-1 text-[17px] xs:text-[19px] sm:text-[22px] lg:text-[24px]">
            directly to music producers.
          </span>
        </h1>

        {/* Minimalist Subtitle */}
        <p className="text-[13px] sm:text-[14px] text-zinc-500 font-medium tracking-wide max-w-[420px] leading-relaxed text-center">
          Toy Creator is the premier publisher platform for VST developers, DSP engineers, and sample designers. Distribute digital audio software worldwide with machine licensing and automated payouts.
        </p>

        {/* Action Button: Developer Sign In */}
        <div className="pt-2 sm:pt-3 w-full flex flex-col items-center justify-center gap-2.5">
          <Link
            href="/login"
            prefetch={true}
            className="inline-flex items-center justify-center px-8 sm:px-9 h-[46px] sm:h-[48px] bg-black hover:bg-zinc-800 text-white font-bold text-[13px] sm:text-[14px] rounded-xl active:scale-95 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)] tracking-wider uppercase cursor-pointer gap-2"
          >
            <span>Developer Sign In</span>
            <span className="text-[16px]">&rarr;</span>
          </Link>

          <Link
            href="/signup"
            className="text-[11px] sm:text-[12px] font-semibold text-zinc-500 hover:text-black transition-colors"
          >
            Not a partner yet? Apply for access &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
