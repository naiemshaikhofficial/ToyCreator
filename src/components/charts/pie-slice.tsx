"use client";

import React, { memo } from "react";
import { usePie } from "./pie-context";

export type PieSliceHoverEffect = "translate" | "grow" | "none";

export interface PieSliceProps {
  index: number;
  color?: string;
  showGlow?: boolean;
  hoverEffect?: PieSliceHoverEffect;
  hoverOffset?: number;
  className?: string;
}

function generateAnnularArcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startA: number,
  endA: number
): string {
  if (endA <= startA) return "";

  // Guard against full 360 wrap edge cases
  const angleDiff = endA - startA;
  const isNearlyFullCircle = angleDiff >= 2 * Math.PI - 0.001;
  const actualEndA = isNearlyFullCircle ? startA + 2 * Math.PI - 0.0001 : endA;

  const largeArcFlag = actualEndA - startA > Math.PI ? 1 : 0;

  const x1 = cx + outerR * Math.cos(startA);
  const y1 = cy + outerR * Math.sin(startA);
  const x2 = cx + outerR * Math.cos(actualEndA);
  const y2 = cy + outerR * Math.sin(actualEndA);

  const x3 = cx + innerR * Math.cos(actualEndA);
  const y3 = cy + innerR * Math.sin(actualEndA);
  const x4 = cx + innerR * Math.cos(startA);
  const y4 = cy + innerR * Math.sin(startA);

  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
}

export const PieSlice = memo(function PieSlice({
  index,
  color: colorProp,
  showGlow = true,
  hoverEffect = "grow",
  hoverOffset: hoverOffsetProp,
}: PieSliceProps) {
  const {
    arcs,
    center,
    innerRadius,
    outerRadius,
    padAngle,
    hoverOffset: contextHoverOffset,
    hoveredIndex,
    setHoveredIndex,
    getColor,
  } = usePie();

  const arc = arcs[index];
  if (!arc) return null;

  const hoverOffset = hoverOffsetProp ?? contextHoverOffset;
  const isHovered = hoveredIndex === index;
  const isAnyHovered = hoveredIndex !== null;
  const isFaded = isAnyHovered && !isHovered;

  const color = colorProp || getColor(index);

  // Apply padding angle cleanly
  const halfPad = padAngle / 2;
  const totalArc = arc.endAngle - arc.startAngle;
  const safePad = totalArc > padAngle * 2 ? halfPad : 0;
  const startAngle = arc.startAngle + safePad;
  const endAngle = arc.endAngle - safePad;

  // Base path for hitbox
  const baseHitboxPath = generateAnnularArcPath(
    center,
    center,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle
  );

  // Render path with grow or translate
  const effectiveOuterR = isHovered && hoverEffect === "grow" ? outerRadius + hoverOffset : outerRadius;
  const effectiveInnerR = isHovered && hoverEffect === "grow" ? Math.max(10, innerRadius - 2) : innerRadius;

  const slicePath = generateAnnularArcPath(
    center,
    center,
    effectiveInnerR,
    effectiveOuterR,
    startAngle,
    endAngle
  );

  // Translation offset for translate mode
  let translateX = 0;
  let translateY = 0;
  if (isHovered && hoverEffect === "translate") {
    const midAngle = (startAngle + endAngle) / 2;
    translateX = Math.cos(midAngle) * hoverOffset;
    translateY = Math.sin(midAngle) * hoverOffset;
  }

  return (
    <g
      className="cursor-pointer transition-all duration-300"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        opacity: isFaded ? 0.35 : 1,
        filter: isHovered && showGlow ? `drop-shadow(0 0 10px rgba(255, 255, 255, 0.45))` : "none",
      }}
    >
      {/* Invisible hitbox */}
      <path
        d={baseHitboxPath}
        fill="transparent"
        className="pointer-events-auto"
      />

      {/* Visible slice */}
      <path
        d={slicePath}
        fill={color}
        stroke="#121212"
        strokeWidth={1}
        className="transition-all duration-300 pointer-events-none"
      />
    </g>
  );
});

PieSlice.displayName = "PieSlice";
export default PieSlice;
