"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  monochromePiePalette,
  PieArcData,
  PieContextValue,
  PieData,
  PieProvider,
} from "./pie-context";

export interface PieChartProps {
  data: PieData[];
  size?: number;
  innerRadius?: number;
  padAngle?: number;
  hoverOffset?: number;
  hoveredIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
  className?: string;
  children: ReactNode;
}

export function PieChart({
  data = [],
  size = 200,
  innerRadius = 50,
  padAngle = 0.03,
  hoverOffset = 8,
  hoveredIndex: controlledHoveredIndex,
  onHoverChange,
  className,
  children,
}: PieChartProps) {
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
  const outerRadius = center - hoverOffset - 4;
  const totalValue = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const getColor = useCallback(
    (index: number) => {
      const item = data[index];
      if (item?.color) return item.color;
      return monochromePiePalette[index % monochromePiePalette.length];
    },
    [data]
  );

  // Compute pie arcs
  const arcs = useMemo<PieArcData[]>(() => {
    let currentAngle = -Math.PI / 2;
    const effectiveTotal = totalValue > 0 ? totalValue : (data.length || 1);

    return data.map((d, index) => {
      const fraction = totalValue > 0 ? d.value / effectiveTotal : 1 / (data.length || 1);
      const angleSpan = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      return {
        data: d,
        index,
        startAngle,
        endAngle,
        value: d.value,
      };
    });
  }, [data, totalValue]);

  const contextValue: PieContextValue = useMemo(
    () => ({
      data,
      arcs,
      size,
      center,
      outerRadius,
      innerRadius,
      padAngle,
      hoverOffset,
      hoveredIndex,
      setHoveredIndex,
      totalValue,
      getColor,
    }),
    [
      data,
      arcs,
      size,
      center,
      outerRadius,
      innerRadius,
      padAngle,
      hoverOffset,
      hoveredIndex,
      setHoveredIndex,
      totalValue,
      getColor,
    ]
  );

  return (
    <PieProvider value={contextValue}>
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
    </PieProvider>
  );
}

PieChart.displayName = "PieChart";
export default PieChart;
