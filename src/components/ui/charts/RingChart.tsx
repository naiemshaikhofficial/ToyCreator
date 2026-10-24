"use client";

/**
 * Bklit UI - Ring Chart (Strict Monochrome Edition)
 * A composable multi-ring progress chart with animated arcs, hover interactions,
 * center stat display, and interactive synchronized legend.
 * Strictly adheres to black, white, charcoal, and zinc palette - zero colored accents.
 */

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface RingData {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  subtitle?: string;
}

export interface RingChartContextValue {
  data: RingData[];
  size: number;
  center: number;
  strokeWidth: number;
  ringGap: number;
  baseInnerRadius: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  totalValue: number;
  getColor: (index: number) => string;
}

const RingChartContext = createContext<RingChartContextValue | null>(null);

export function useRingChart() {
  const context = useContext(RingChartContext);
  if (!context) {
    throw new Error("useRingChart must be used within a RingChart component");
  }
  return context;
}

// Strict monochrome palette shades from white down to zinc
export const monochromeRingPalette = [
  "#ffffff", // Outermost - Pure bright white
  "#e4e4e7", // Zinc 200 - Soft white
  "#a1a1aa", // Zinc 400 - Medium zinc
  "#71717a", // Zinc 500 - Neutral charcoal
  "#52525b", // Zinc 600 - Deep zinc
];

export interface RingChartProps {
  data: RingData[];
  size?: number;
  strokeWidth?: number;
  ringGap?: number;
  baseInnerRadius?: number;
  hoveredIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
  className?: string;
  children?: ReactNode;
}

export function RingChart({
  data = [],
  size = 280,
  strokeWidth = 12,
  ringGap = 8,
  baseInnerRadius = 55,
  hoveredIndex: controlledHoveredIndex,
  onHoverChange,
  className,
  children,
}: RingChartProps) {
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);

  const isControlled = controlledHoveredIndex !== undefined;
  const hoveredIndex = isControlled ? controlledHoveredIndex : internalHoveredIndex;

  const setHoveredIndex = useCallback(
    (index: number | null) => {
      if (isControlled) {
        onHoverChange?.(index);
      } else {
        setInternalHoveredIndex(index);
      }
    },
    [isControlled, onHoverChange]
  );

  const center = size / 2;
  const totalValue = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const getColor = useCallback(
    (index: number) => {
      const item = data[index];
      if (item?.color) return item.color;
      return monochromeRingPalette[index % monochromeRingPalette.length];
    },
    [data]
  );

  const contextValue: RingChartContextValue = useMemo(
    () => ({
      data,
      size,
      center,
      strokeWidth,
      ringGap,
      baseInnerRadius,
      hoveredIndex,
      setHoveredIndex,
      totalValue,
      getColor,
    }),
    [
      data,
      size,
      center,
      strokeWidth,
      ringGap,
      baseInnerRadius,
      hoveredIndex,
      setHoveredIndex,
      totalValue,
      getColor,
    ]
  );

  return (
    <RingChartContext.Provider value={contextValue}>
      <div
        className={cn("relative flex items-center justify-center select-none", className)}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {children}
        </svg>
      </div>
    </RingChartContext.Provider>
  );
}

export interface RingProps {
  index: number;
  color?: string;
  lineCap?: "round" | "butt";
  animate?: boolean;
}

export function Ring({
  index,
  color: colorProp,
  lineCap = "round",
  animate = true,
}: RingProps) {
  const {
    data,
    center,
    strokeWidth,
    ringGap,
    baseInnerRadius,
    hoveredIndex,
    setHoveredIndex,
    getColor,
  } = useRingChart();

  const item = data[index];
  if (!item) return null;

  const radius = baseInnerRadius + index * (strokeWidth + ringGap) + strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = item.maxValue > 0 ? Math.min(1, Math.max(0, item.value / item.maxValue)) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const isHovered = hoveredIndex === index;
  const isAnyHovered = hoveredIndex !== null;
  const isFaded = isAnyHovered && !isHovered;

  const ringColor = colorProp || getColor(index);

  return (
    <g
      className="transition-all duration-300"
      style={{
        transformOrigin: `${center}px ${center}px`,
        transform: isHovered ? "scale(1.025)" : "scale(1)",
        opacity: isFaded ? 0.35 : 1,
        filter: isHovered ? `drop-shadow(0 0 10px rgba(255, 255, 255, 0.45))` : "none",
      }}
    >
      {/* Background Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#242424"
        strokeWidth={strokeWidth}
        className="transition-colors duration-200"
      />

      {/* Progress Arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeLinecap={lineCap}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{
          transition: animate
            ? "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.2s"
            : "none",
        }}
      />

      {/* Invisible Hover Hitbox Area */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="transparent"
        strokeWidth={strokeWidth + ringGap}
        className="cursor-pointer pointer-events-auto"
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      />
    </g>
  );
}

export interface RingCenterProps {
  defaultLabel?: string;
  prefix?: string;
  suffix?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function RingCenter({
  defaultLabel = "Total",
  prefix = "",
  suffix = "",
  formatValue,
  className,
}: RingCenterProps) {
  const { data, totalValue, baseInnerRadius, hoveredIndex } = useRingChart();

  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const displayValue = hoveredItem ? hoveredItem.value : totalValue;
  const displayLabel = hoveredItem ? hoveredItem.label : defaultLabel;
  const displayPercentage =
    hoveredItem && hoveredItem.maxValue > 0
      ? Math.round((hoveredItem.value / hoveredItem.maxValue) * 100)
      : null;

  const formatted = formatValue
    ? formatValue(displayValue)
    : `${prefix}${displayValue.toLocaleString()}${suffix}`;

  const centerHoleSize = baseInnerRadius * 2 - 12;

  return (
    <foreignObject
      x={`calc(50% - ${centerHoleSize / 2}px)`}
      y={`calc(50% - ${centerHoleSize / 2}px)`}
      width={centerHoleSize}
      height={centerHoleSize}
      className="pointer-events-none"
    >
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center text-center p-2",
          className
        )}
      >
        <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white tabular-nums transition-all duration-200">
          {formatted}
        </span>
        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-full uppercase tracking-wider mt-0.5">
          {displayLabel}
        </span>
        {displayPercentage !== null && (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#242424] text-zinc-300 mt-1 border border-[#333]">
            {displayPercentage}% of Target
          </span>
        )}
      </div>
    </foreignObject>
  );
}

export interface RingLegendProps {
  data: RingData[];
  hoveredIndex: number | null;
  onHoverIndex: (index: number | null) => void;
  className?: string;
  formatValue?: (value: number) => string;
}

export function RingLegend({
  data,
  hoveredIndex,
  onHoverIndex,
  className,
  formatValue,
}: RingLegendProps) {
  return (
    <div className={cn("space-y-2 w-full", className)}>
      <div className="text-[11px] font-mono uppercase text-zinc-500 pb-1.5 border-b border-[#242424] flex items-center justify-between">
        <span>Category / Channel</span>
        <span>Count & Share</span>
      </div>

      <div className="space-y-1.5">
        {data.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;
          const isFaded = isAnyHovered && !isHovered;
          const percentage =
            item.maxValue > 0 ? Math.round((item.value / item.maxValue) * 100) : 0;
          const color = item.color || monochromeRingPalette[index % monochromeRingPalette.length];

          return (
            <div
              key={item.label}
              onMouseEnter={() => onHoverIndex(index)}
              onMouseLeave={() => onHoverIndex(null)}
              className={cn(
                "p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs",
                isHovered
                  ? "bg-[#222222] border-white/40 shadow-sm"
                  : "bg-[#181818] border-[#262626] hover:border-[#383838]",
                isFaded && "opacity-40"
              )}
            >
              {/* Left indicator & label */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate text-xs">
                    {item.label}
                  </div>
                  {item.subtitle && (
                    <div className="text-[10px] text-zinc-500 font-mono truncate">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>

              {/* Right stats and progress bar */}
              <div className="flex items-center gap-3 shrink-0 font-mono">
                <span className="font-bold text-white text-xs">
                  {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
                </span>

                <div className="w-16 bg-[#2a2a2a] h-1.5 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                <span className="text-[10px] text-zinc-400 w-8 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface EcosystemRingCardProps {
  title?: string;
  subtitle?: string;
  data: RingData[];
  defaultCenterLabel?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function EcosystemRingCard({
  title = "Ecosystem Account Distribution",
  subtitle = "Breakdown of verified accounts, audio brands & active machines",
  data,
  defaultCenterLabel = "Total Accounts",
  formatValue,
  className,
}: EcosystemRingCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("epic-card p-6 space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a]">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            {title}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">{subtitle}</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#202020] border border-[#333] text-zinc-300 rounded">
          Live Breakdown
        </span>
      </div>

      {/* Main Grid: Left Ring Chart, Right Interactive Legend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Ring Chart Center */}
        <div className="md:col-span-5 flex items-center justify-center p-2">
          <RingChart
            data={data}
            size={240}
            strokeWidth={10}
            ringGap={7}
            baseInnerRadius={48}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          >
            {data.map((item, index) => (
              <Ring key={item.label} index={index} />
            ))}
            <RingCenter
              defaultLabel={defaultCenterLabel}
              formatValue={formatValue}
            />
          </RingChart>
        </div>

        {/* Legend List */}
        <div className="md:col-span-7">
          <RingLegend
            data={data}
            hoveredIndex={hoveredIndex}
            onHoverIndex={setHoveredIndex}
            formatValue={formatValue}
          />
        </div>
      </div>
    </div>
  );
}

export default RingChart;
