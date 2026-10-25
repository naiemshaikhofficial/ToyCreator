'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  /** Completion percentage (0 - 100) */
  progress: number;
  /** Optional custom bar width in px (default 2) */
  barWidth?: number;
  /** Optional custom gap in px (default 2) */
  gap?: number;
  /** Optional height class (default h-[12px]) */
  heightClass?: string;
  /** Optional active bar color class (default bg-white) */
  activeColorClass?: string;
  /** Optional inactive bar color class (default bg-zinc-800) */
  inactiveColorClass?: string;
  /** Additional container classes */
  className?: string;
}

export default function Progress({
  progress,
  barWidth = 2,
  gap = 2,
  heightClass = 'h-[12px]',
  activeColorClass = 'bg-white group-hover/progress:bg-zinc-100',
  inactiveColorClass = 'bg-zinc-800/80 group-hover/progress:bg-zinc-800/40',
  className,
}: ProgressProps) {
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldUseValue, setShouldUseValue] = useState(false);

  // Measure and dynamically observe container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();

    // Use ResizeObserver for responsive recalculation
    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Delay trigger for smooth staggered initial entry
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldUseValue(true);
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  // Clamp progress to valid 0-100 range
  const clampedProgress = Math.max(0, Math.min(100, progress || 0));
  const bars = Math.max(0, Math.floor(width / (barWidth + gap)));

  return (
    <div
      ref={containerRef}
      role="progressbar"
      aria-valuenow={Math.round(clampedProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'group/progress relative flex w-full min-w-4 flex-wrap gap-[2px] overflow-hidden select-none',
        heightClass,
        className
      )}
    >
      {Array.from({ length: bars }).map((_, index) => {
        const highlight = shouldUseValue && bars > 0 ? index / bars < clampedProgress / 100 : false;
        return (
          <div
            key={`bar_${index}`}
            className={cn(
              'h-full w-[2px] rounded-[1px] transition-all',
              highlight
                ? cn(activeColorClass, 'duration-75 group-hover/progress:rounded')
                : cn(inactiveColorClass, 'duration-300 group-hover/progress:scale-75')
            )}
            style={{
              transitionDelay: highlight ? `${index * 5}ms` : '0ms',
            }}
          />
        );
      })}
    </div>
  );
}

export { Progress }
