"use client";

import React, { createContext, useContext, ReactNode } from "react";

export interface RadarMetric {
  key: string;
  label: string;
}

export interface RadarData {
  label: string;
  color?: string;
  values: Record<string, number>;
  totalScore?: number;
  subtitle?: string;
}

export interface RadarContextValue {
  data: RadarData[];
  metrics: RadarMetric[];
  size: number;
  center: number;
  radius: number;
  levels: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  getColor: (index: number) => string;
  getAngle: (metricIndex: number) => number;
  getPointPosition: (metricIndex: number, value: number) => { x: number; y: number };
}

const RadarContext = createContext<RadarContextValue | null>(null);

// High-contrast vibrant palette for audience stream differentiation
export const audienceStreamPalette = [
  "#38bdf8", // Google & Search - Vibrant Sky Blue
  "#ec4899", // Social Media (YouTube/IG/TikTok) - Vibrant Pink
  "#10b981", // Telegram & Community - Vibrant Emerald
  "#f59e0b", // Direct Storefront Visits - Vibrant Amber
  "#a855f7", // Creator Referrals - Vibrant Purple
  "#ffffff", // Core Store Platform - Bright White
];

export function RadarProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: RadarContextValue;
}) {
  return <RadarContext.Provider value={value}>{children}</RadarContext.Provider>;
}

export function useRadar(): RadarContextValue {
  const context = useContext(RadarContext);
  if (!context) {
    throw new Error("useRadar must be used within a <RadarChart> component.");
  }
  return context;
}
