"use client";

/**
 * Bklit UI Linked Legend Recipe - Donut Chart
 * Restyled with strict monochrome palette, 100% real database data, and plain English labels.
 */

import React, { useState } from "react";
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
  LegendProgress,
} from "@/components/charts/legend";
import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { cn } from "@/lib/utils";

export interface DonutDatum {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  subtitle?: string;
}

export interface EcosystemDonutLinkedLegendProps {
  title?: string;
  subtitle?: string;
  defaultLabel?: string;
  data: DonutDatum[];
  className?: string;
  formatValue?: (v: number) => string;
}

export function EcosystemDonutLinkedLegend({
  title = "Platform Revenue & Royalty Split",
  subtitle = "70% creator payouts vs 30% platform retain share",
  defaultLabel = "Total",
  data,
  className,
  formatValue,
}: EcosystemDonutLinkedLegendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("epic-card p-6 space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a]">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            {title}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">{subtitle}</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#202020] border border-[#333] text-zinc-300 rounded">
          Linked Legend
        </span>
      </div>

      {/* Main Container: Chart & Legend side-by-side */}
      <div className="mx-auto flex w-full items-center justify-center gap-6 sm:gap-10">
        {/* Donut Chart with innerRadius 50 and grow effect */}
        <div className="aspect-square w-36 shrink-0 sm:w-56 flex items-center justify-center">
          <PieChart
            data={data}
            hoveredIndex={hoveredIndex}
            innerRadius={50}
            size={180}
            onHoverChange={setHoveredIndex}
          >
            {data.map((item, index) => (
              <PieSlice hoverEffect="grow" index={index} key={item.label} />
            ))}
            <PieCenter defaultLabel={defaultLabel} formatValue={formatValue} />
          </PieChart>
        </div>

        {/* Legend side */}
        <Legend
          className="min-w-0 flex-1 space-y-1.5"
          hoveredIndex={hoveredIndex}
          items={data}
          onHoverChange={setHoveredIndex}
        >
          <LegendItem className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <LegendMarker className="h-2 w-2" />
              <LegendLabel className="flex-1 text-xs" />
              <LegendValue
                className="text-xs"
                showPercentage
                formatValue={formatValue}
              />
            </div>
            <LegendProgress height="h-1" />
          </LegendItem>
        </Legend>
      </div>
    </div>
  );
}

export default EcosystemDonutLinkedLegend;
