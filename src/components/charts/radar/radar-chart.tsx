"use client";

import React, { useState, useCallback, useMemo, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  audienceStreamPalette,
  RadarContextValue,
  RadarData,
  RadarMetric,
  RadarProvider,
} from "./radar-context";

export interface RadarChartProps {
  data: RadarData[];
  metrics: RadarMetric[];
  size?: number;
  levels?: number;
  margin?: number;
  hoveredIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
  className?: string;
  children: ReactNode;
}

export function RadarChart({
  data = [],
  metrics = [],
  size = 360,
  levels = 5,
  margin = 55,
  hoveredIndex: controlledHoveredIndex,
  onHoverChange,
  className = "",
  children,
}: RadarChartProps) {
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
  const radius = Math.max(10, (size - margin * 2) / 2);

  const getAngle = useCallback(
    (metricIndex: number) => {
      if (metrics.length === 0) return 0;
      const step = (Math.PI * 2) / metrics.length;
      const angleOffset = -Math.PI / 2; // Metric 0 points straight up
      return metricIndex * step + angleOffset;
    },
    [metrics.length]
  );

  const getPointPosition = useCallback(
    (metricIndex: number, value: number) => {
      const angle = getAngle(metricIndex);
      const clampedValue = Math.min(100, Math.max(0, value));
      const r = (clampedValue / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    },
    [getAngle, radius, center]
  );

  const getColor = useCallback(
    (index: number) => {
      const item = data[index];
      if (item?.color) return item.color;
      return audienceStreamPalette[index % audienceStreamPalette.length];
    },
    [data]
  );

  const contextValue: RadarContextValue = useMemo(
    () => ({
      data,
      metrics,
      size,
      center,
      radius,
      levels,
      hoveredIndex,
      setHoveredIndex,
      getColor,
      getAngle,
      getPointPosition,
    }),
    [
      data,
      metrics,
      size,
      center,
      radius,
      levels,
      hoveredIndex,
      setHoveredIndex,
      getColor,
      getAngle,
      getPointPosition,
    ]
  );

  return (
    <RadarProvider value={contextValue}>
      <div
        className={cn("relative flex items-center justify-center select-none aspect-square", className)}
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
    </RadarProvider>
  );
}

RadarChart.displayName = "RadarChart";
export default RadarChart;
