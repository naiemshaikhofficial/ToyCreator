"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendLabelProps {
  className?: string;
}

export function LegendLabel({ className = "text-xs font-medium" }: LegendLabelProps) {
  const { item } = useLegendItem();

  return (
    <span className={cn("text-zinc-200 truncate", className)}>
      {item.label}
    </span>
  );
}

LegendLabel.displayName = "LegendLabel";
