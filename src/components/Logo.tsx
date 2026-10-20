'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
  href?: string;
}

export function Logo({
  size = 36,
  className = '',
  showText = true,
  subtitle = 'BY PRODUCERTOY',
  href,
}: LogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Brand Icon (Toy Creator Emblem) */}
      <picture className="flex-shrink-0">
        <source srcSet="/logo.webp" type="image/webp" />
        <img
          src="/logo.png"
          alt="Toy Creator Emblem"
          style={{ height: `${size}px`, width: 'auto' }}
          className="object-contain filter drop-shadow-sm flex-shrink-0"
        />
      </picture>

      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-base uppercase tracking-tight leading-none">
            <span className="text-white">TOY</span>{' '}
            <span className="text-[#a0a0a0]">CREATOR</span>
          </span>
          <span className="text-[9px] font-bold text-[#808080] tracking-widest uppercase leading-none mt-1">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function LogoIcon({ size = 36, className = '' }: Omit<LogoProps, 'showText' | 'subtitle'>) {
  return (
    <picture className={`flex-shrink-0 ${className}`}>
      <source srcSet="/logo.webp" type="image/webp" />
      <img
        src="/logo.png"
        alt="Toy Creator Emblem"
        style={{ height: `${size}px`, width: 'auto' }}
        className="object-contain filter drop-shadow-sm flex-shrink-0"
      />
    </picture>
  );
}
