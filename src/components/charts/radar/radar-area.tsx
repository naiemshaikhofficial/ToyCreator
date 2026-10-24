"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { useRadar } from "./radar-context";

export interface RadarAreaProps {
  index: number;
  color?: string;
  showPoints?: boolean;
  showGlow?: boolean;
  className?: string;
}

export function RadarArea({
  index,
  color: customColor,
  showPoints = true,
  showGlow = true,
  className = "",
}: RadarAreaProps) {
  const {
    data,
    metrics,
    hoveredIndex,
    setHoveredIndex,
    getColor,
    getPointPosition,
  } = useRadar();

  const filterId = useId();
  const series = data[index];
  if (!series) return null;

  const color = customColor || series.color || getColor(index);
  const isHovered = hoveredIndex === index;
  const isDimmed = hoveredIndex !== null && !isHovered;

  // Compute vertices for this series
  const pointsData = metrics.map((metric, metricIdx) => {
    const val = series.values?.[metric.key] ?? 0;
    const pos = getPointPosition(metricIdx, val);
    return {
      metric,
      val,
      ...pos,
    };
  });

  const pointsString = pointsData.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <g
      className={cn(
        "radar-area transition-all duration-300 ease-out cursor-pointer",
        className
      )}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      tabIndex={0}
      role="button"
      aria-label={`${series.label} audience stream details`}
      onFocus={() => setHoveredIndex(index)}
      onBlur={() => setHoveredIndex(null)}
      style={{ outline: "none" }}
    >
      <defs>
        {showGlow && (
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="5"
              floodColor={color}
              floodOpacity={isHovered ? 0.65 : 0.25}
            />
          </filter>
        )}
      </defs>

      {/* Main Polygon Filled Shape */}
      <polygon
        points={pointsString}
        fill={color}
        fillOpacity={isHovered ? 0.35 : isDimmed ? 0.04 : 0.16}
        stroke={color}
        strokeWidth={isHovered ? 2.5 : isDimmed ? 1 : 1.75}
        strokeOpacity={isHovered ? 1 : isDimmed ? 0.2 : 0.85}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={showGlow && (isHovered || !isDimmed) ? `url(#${filterId})` : undefined}
        className="transition-all duration-300 ease-out"
      />

      {/* Point Markers at each spoke vertex */}
      {showPoints &&
        pointsData.map((pt, pIdx) => (
          <g key={pt.metric.key || pIdx} className="pointer-events-none">
            {/* Outer halo when hovered */}
            {isHovered && (
              <circle
                cx={pt.x}
                cy={pt.y}
                r={6}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.8}
                className="animate-ping"
                style={{ transformOrigin: `${pt.x}px ${pt.y}px`, animationDuration: "2s" }}
              />
            )}
            {/* Core point dot */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isHovered ? 4.5 : isDimmed ? 2 : 3}
              fill={isHovered ? "#ffffff" : color}
              stroke={color}
              strokeWidth={1.5}
              fillOpacity={isDimmed ? 0.3 : 1}
              strokeOpacity={isDimmed ? 0.3 : 1}
              className="transition-all duration-300 ease-out"
            />
          </g>
        ))}
    </g>
  );
}

RadarArea.displayName = "RadarArea";
export default RadarArea;
