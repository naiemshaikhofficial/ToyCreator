"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useRadar } from "./radar-context";

export interface RadarGridProps {
  showLabels?: boolean;
  className?: string;
  stroke?: string;
}

export function RadarGrid({
  showLabels = true,
  className = "",
  stroke = "rgba(255, 255, 255, 0.12)",
}: RadarGridProps) {
  const { metrics, center, radius, levels, getAngle } = useRadar();

  const levelValues = Array.from({ length: levels }, (_, i) => (i + 1) / levels);

  return (
    <g className={cn("radar-grid pointer-events-none select-none", className)}>
      {/* Concentric Polygons */}
      {levelValues.map((lvlRatio, lvlIdx) => {
        const currentR = radius * lvlRatio;
        const points = metrics
          .map((_, mIdx) => {
            const angle = getAngle(mIdx);
            const x = center + currentR * Math.cos(angle);
            const y = center + currentR * Math.sin(angle);
            return `${x},${y}`;
          })
          .join(" ");

        return (
          <polygon
            key={`grid-level-${lvlIdx}`}
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth={lvlIdx === levels - 1 ? 1.5 : 1}
            strokeDasharray={lvlIdx === levels - 1 ? "none" : "3 3"}
            className="transition-all duration-300"
          />
        );
      })}

      {/* Level Labels on the top axis */}
      {showLabels &&
        levelValues.map((lvlRatio, lvlIdx) => {
          const currentR = radius * lvlRatio;
          const val = Math.round(lvlRatio * 100);
          return (
            <text
              key={`grid-label-${lvlIdx}`}
              x={center + 6}
              y={center - currentR + 3}
              fill="#71717a"
              fontSize={9}
              className="font-mono select-none"
              textAnchor="start"
            >
              {val}
            </text>
          );
        })}
    </g>
  );
}

RadarGrid.displayName = "RadarGrid";
export default RadarGrid;
