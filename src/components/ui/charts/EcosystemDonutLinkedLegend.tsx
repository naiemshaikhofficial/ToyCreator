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
  formatValue?: (v: number | string) => string;
}

export function EcosystemDonutLinkedLegend({
  title = "Sales by Product Format",
  subtitle = "Revenue distribution across audio plugins, sample packs, and soundbanks",
  defaultLabel = "Total",
  data,
  className,
  formatValue,
}: EcosystemDonutLinkedLegendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("toy-card p-4 sm:p-5 space-y-3.5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#242424]">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            {title}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">{subtitle}</p>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 bg-[#202020] border border-[#333] text-zinc-400 rounded">
          Linked Legend
        </span>
      </div>

      {/* Main Container: Chart & Legend side-by-side (Compact) */}
      <div className="mx-auto flex w-full items-center justify-center gap-4 sm:gap-6">
        {/* Compact Donut Chart */}
        <div className="aspect-square w-28 shrink-0 sm:w-40 flex items-center justify-center">
          <PieChart
            data={data}
            hoveredIndex={hoveredIndex}
            innerRadius={38}
            size={140}
            onHoverChange={setHoveredIndex}
          >
            {data.map((item, index) => (
              <PieSlice hoverEffect="grow" index={index} key={item.label} />
            ))}
            <PieCenter defaultLabel={defaultLabel} formatValue={formatValue as any} />
          </PieChart>
        </div>

        {/* Legend side */}
        <Legend
          className="min-w-0 flex-1 space-y-1"
          hoveredIndex={hoveredIndex}
          items={data}
          onHoverChange={setHoveredIndex}
        >
          <LegendItem className="flex flex-col gap-1 py-0.5">
            <div className="flex items-center gap-2">
              <LegendMarker className="h-1.5 w-1.5" />
              <LegendLabel className="flex-1 text-[11px]" />
              <LegendValue
                className="text-[11px]"
                showPercentage
                formatValue={formatValue as any}
              />
            </div>
            <LegendProgress height="h-0.5" />
          </LegendItem>
        </Legend>
      </div>
    </div>
  );
}

EcosystemDonutLinkedLegend.displayName = "EcosystemDonutLinkedLegend";
export default EcosystemDonutLinkedLegend;
