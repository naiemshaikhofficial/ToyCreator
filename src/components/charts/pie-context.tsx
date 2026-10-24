"use client";

import React, { createContext, useContext, useMemo, ReactNode } from "react";

export const monochromePiePalette = [
  "#ffffff", // pure white
  "#e4e4e7", // zinc-200
  "#a1a1aa", // zinc-400
  "#71717a", // zinc-500
  "#52525b", // zinc-600
];

export interface PieData {
  label: string;
  value: number;
  color?: string;
  subtitle?: string;
}

export interface PieArcData {
  data: PieData;
  index: number;
  startAngle: number;
  endAngle: number;
  value: number;
}

export interface PieContextValue {
  data: PieData[];
  arcs: PieArcData[];
  size: number;
  center: number;
  outerRadius: number;
  innerRadius: number;
  padAngle: number;
  hoverOffset: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  totalValue: number;
  getColor: (index: number) => string;
}

const PieContext = createContext<PieContextValue | null>(null);

export function PieProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PieContextValue;
}) {
  return <PieContext.Provider value={value}>{children}</PieContext.Provider>;
}

export function usePie(): PieContextValue {
  const context = useContext(PieContext);
  if (!context) {
    throw new Error("usePie must be used within a PieProvider / PieChart component.");
  }
  return context;
}
