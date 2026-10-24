"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useRadar } from "./radar-context";

export interface RadarLabelsProps {
  offset?: number;
  fontSize?: number;
  interactive?: boolean;
  className?: string;
}

export function RadarLabels({
  offset = 24,
  fontSize = 11,
  interactive = false,
  className = "",
}: RadarLabelsProps) {
  const { metrics, center, radius, getAngle } = useRadar();

  return (
    <g className={cn("radar-labels select-none pointer-events-none", className)}>
      {metrics.map((metric, i) => {
        const angle = getAngle(i);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const x = center + (radius + offset) * cos;
        const y = center + (radius + offset) * sin;

        // Smart text alignment based on quadrant
        let textAnchor: "start" | "middle" | "end" = "middle";
        if (cos > 0.25) textAnchor = "start";
        else if (cos < -0.25) textAnchor = "end";

        let dominantBaseline: "auto" | "middle" | "hanging" = "middle";
        if (sin < -0.3) dominantBaseline = "auto";
        else if (sin > 0.3) dominantBaseline = "hanging";

        return (
          <text
            key={metric.key || i}
            x={x}
            y={y}
            textAnchor={textAnchor}
            dominantBaseline={dominantBaseline}
            fill="#a1a1aa"
            fontSize={fontSize}
            className={cn(
              "font-mono font-medium tracking-wider uppercase transition-colors duration-150",
              interactive && "pointer-events-auto cursor-pointer hover:fill-white"
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            {metric.label}
          </text>
        );
      })}
    </g>
  );
}

RadarLabels.displayName = "RadarLabels";
export default RadarLabels;
