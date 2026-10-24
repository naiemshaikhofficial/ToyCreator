"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLegend, useLegendItem } from "./legend-context";

export interface LegendItemProps {
  className?: string;
  children: ReactNode;
}

export function LegendItem({ className = "", children }: LegendItemProps) {
  const { setHoveredIndex } = useLegend();
  const { index, isHovered, isFaded } = useLegendItem();

  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg px-2.5 py-1.5 transition-all duration-150 ease-out select-none",
        isHovered ? "bg-[#242424] text-white" : "hover:bg-[#1a1a1a] text-zinc-300",
        isFaded && "opacity-40",
        className
      )}
      data-hovered={isHovered ? "" : undefined}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {children}
    </div>
  );
}

LegendItem.displayName = "LegendItem";
