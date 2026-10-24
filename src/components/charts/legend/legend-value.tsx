"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendValueProps {
  className?: string;
  showPercentage?: boolean;
  percentageClassName?: string;
  formatValue?: (value: number) => string;
  formatPercentage?: (percentage: number) => string;
}

export function LegendValue({
  className = "text-xs tabular-nums font-mono",
  showPercentage = false,
  percentageClassName = "text-[10px] tabular-nums font-mono text-zinc-400 w-9 text-right",
  formatValue = (v) => v.toLocaleString(),
  formatPercentage = (p) => `${Math.round(p)}%`,
}: LegendValueProps) {
  const { item, percentage } = useLegendItem();

  return (
    <span className={cn("flex items-center gap-2 text-zinc-300 font-mono", className)}>
      <span className="font-bold text-white">{formatValue(item.value)}</span>
      {showPercentage && item.maxValue !== undefined && (
        <span className={percentageClassName}>
          {formatPercentage(percentage)}
        </span>
      )}
    </span>
  );
}

LegendValue.displayName = "LegendValue";
