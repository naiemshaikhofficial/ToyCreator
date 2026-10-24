"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendProgressProps {
  trackClassName?: string;
  indicatorClassName?: string;
  height?: string;
}

export function LegendProgress({
  trackClassName = "",
  indicatorClassName = "",
  height = "h-1.5",
}: LegendProgressProps) {
  const { item, percentage } = useLegendItem();

  if (item.maxValue === undefined) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-[#242424]",
        height,
        trackClassName
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          indicatorClassName
        )}
        style={{
          width: `${Math.min(100, Math.max(0, percentage))}%`,
          backgroundColor: item.color,
        }}
      />
    </div>
  );
}

LegendProgress.displayName = "LegendProgress";
