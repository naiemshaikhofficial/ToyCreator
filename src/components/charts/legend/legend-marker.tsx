"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendMarkerProps {
  className?: string;
}

export function LegendMarker({ className = "h-2 w-2" }: LegendMarkerProps) {
  const { item } = useLegendItem();

  return (
    <div
      className={cn("shrink-0 rounded-full border border-white/20", className)}
      style={{ backgroundColor: item.color }}
    />
  );
}

LegendMarker.displayName = "LegendMarker";
