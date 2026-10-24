"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useRadar } from "./radar-context";

export interface RadarAxisProps {
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function RadarAxis({
  className = "",
  stroke = "rgba(255, 255, 255, 0.15)",
  strokeWidth = 1,
}: RadarAxisProps) {
  const { metrics, center, radius, getAngle } = useRadar();

  return (
    <g className={cn("radar-axis pointer-events-none select-none", className)}>
      {metrics.map((metric, i) => {
        const angle = getAngle(i);
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);

        return (
          <line
            key={metric.key || i}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray="2 2"
            className="transition-all duration-300"
          />
        );
      })}
    </g>
  );
}

RadarAxis.displayName = "RadarAxis";
export default RadarAxis;
