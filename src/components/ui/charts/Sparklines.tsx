"use client";

/**
 * ProducerToy Monochrome Sparklines (AreaSparkline, LineSparkline, BarSparkline)
 * Adapted from Bklit UI for strict monochrome dark theme.
 * Zero external colors - strictly uses white, zinc, and charcoal shades.
 */

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineBaseProps {
  data: number[];
  width?: number | string;
  height?: number;
  className?: string;
}

export interface AreaSparklineProps extends SparklineBaseProps {
  strokeColor?: string;
  fillOpacity?: number;
  showDot?: boolean;
}

export interface LineSparklineProps extends SparklineBaseProps {
  strokeColor?: string;
  strokeWidth?: number;
  showDot?: boolean;
}

export interface BarSparklineProps extends SparklineBaseProps {
  barColor?: string;
  gap?: number;
}

function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

export function AreaSparkline({
  data = [12, 18, 15, 24, 22, 32, 28, 45, 42, 58],
  width = "100%",
  height = 36,
  strokeColor = "#ffffff",
  fillOpacity = 0.15,
  showDot = true,
  className,
}: AreaSparklineProps) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="opacity-20 bg-zinc-800 rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const viewWidth = 120;
  const viewHeight = height;

  const points = data.map((val, idx) => ({
    x: padding + (idx / (data.length - 1)) * (viewWidth - padding * 2),
    y: viewHeight - padding - ((val - min) / range) * (viewHeight - padding * 2),
  }));

  const linePath = getSmoothPath(points);
  const lastPoint = points[points.length - 1];
  const areaPath = `${linePath} L ${lastPoint.x} ${viewHeight} L ${points[0].x} ${viewHeight} Z`;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="none"
      className={cn("overflow-visible select-none pointer-events-none", className)}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showDot && (
        <g transform={`translate(${lastPoint.x}, ${lastPoint.y})`}>
          <circle r="3" fill="#ffffff" />
          <circle r="6" fill="#ffffff" opacity="0.25" className="animate-ping" />
        </g>
      )}
    </svg>
  );
}

export function LineSparkline({
  data = [10, 15, 12, 28, 20, 35, 42, 38],
  width = "100%",
  height = 32,
  strokeColor = "#ffffff",
  strokeWidth = 1.5,
  showDot = false,
  className,
}: LineSparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="opacity-20 bg-zinc-800 rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 3;
  const viewWidth = 100;
  const viewHeight = height;

  const points = data.map((val, idx) => ({
    x: padding + (idx / (data.length - 1)) * (viewWidth - padding * 2),
    y: viewHeight - padding - ((val - min) / range) * (viewHeight - padding * 2),
  }));

  const linePath = getSmoothPath(points);
  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="none"
      className={cn("overflow-visible select-none pointer-events-none", className)}
      style={{ width, height }}
    >
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill="#ffffff" />
      )}
    </svg>
  );
}

export function BarSparkline({
  data = [4, 8, 12, 10, 15, 22, 18, 25, 30, 28],
  width = "100%",
  height = 28,
  barColor = "#71717a",
  gap = 2,
  className,
}: BarSparklineProps) {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="opacity-20 bg-zinc-800 rounded" />;
  }

  const max = Math.max(...data) || 1;
  const count = data.length;
  const viewWidth = 100;
  const viewHeight = height;
  const totalGaps = (count - 1) * gap;
  const barWidth = Math.max(1, (viewWidth - totalGaps) / count);

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="none"
      className={cn("overflow-visible select-none pointer-events-none", className)}
      style={{ width, height }}
    >
      {data.map((val, idx) => {
        const barHeight = Math.max(2, (val / max) * (viewHeight - 4));
        const x = idx * (barWidth + gap);
        const y = viewHeight - barHeight;
        const isLast = idx === count - 1;

        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={1}
            fill={isLast ? "#ffffff" : barColor}
            className="transition-colors duration-150"
          />
        );
      })}
    </svg>
  );
}

export default AreaSparkline;
