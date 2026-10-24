"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePie } from "./pie-context";

export interface PieCenterProps {
  defaultLabel?: string;
  prefix?: string;
  suffix?: string;
  formatValue?: (value: number) => string;
  className?: string;
  children?: (props: {
    value: number;
    label: string;
    isHovered: boolean;
    data: { label: string; value: number; color?: string };
  }) => ReactNode;
}

export function PieCenter({
  defaultLabel = "Total",
  prefix = "",
  suffix = "",
  formatValue,
  className,
  children,
}: PieCenterProps) {
  const { data, totalValue, innerRadius, hoveredIndex } = usePie();

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
  const displayValue = hoveredData ? hoveredData.value : totalValue;
  const displayLabel = hoveredData ? hoveredData.label : defaultLabel;
  const percentage =
    hoveredData && totalValue > 0
      ? Math.round((hoveredData.value / totalValue) * 100)
      : null;

  const centerHoleSize = innerRadius * 2 - 8;

  const formatted = formatValue
    ? formatValue(displayValue)
    : `${prefix}${displayValue.toLocaleString()}${suffix}`;

  if (children && hoveredData) {
    return (
      <foreignObject
        x={`calc(50% - ${centerHoleSize / 2}px)`}
        y={`calc(50% - ${centerHoleSize / 2}px)`}
        width={centerHoleSize}
        height={centerHoleSize}
        className="pointer-events-none"
      >
        <div className={cn("w-full h-full flex items-center justify-center text-center", className)}>
          {children({
            value: displayValue,
            label: displayLabel,
            isHovered: hoveredIndex !== null,
            data: hoveredData,
          })}
        </div>
      </foreignObject>
    );
  }

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
          "w-full h-full flex flex-col items-center justify-center text-center p-1 select-none",
          className
        )}
      >
        <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white tabular-nums leading-none">
          {formatted}
        </span>
        <span className="text-[10px] font-mono text-zinc-400 truncate max-w-full uppercase tracking-wider mt-1 leading-tight">
          {displayLabel}
        </span>
        {percentage !== null && (
          <span className="text-[9px] font-mono font-bold text-zinc-400 mt-0.5">
            {percentage}%
          </span>
        )}
      </div>
    </foreignObject>
  );
}

PieCenter.displayName = "PieCenter";
export default PieCenter;
