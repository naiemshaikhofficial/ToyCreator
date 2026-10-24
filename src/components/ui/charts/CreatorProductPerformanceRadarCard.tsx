"use client";

import React, { useState, useMemo } from "react";
import {
  RadarChart,
  RadarGrid,
  RadarAxis,
  RadarLabels,
  RadarArea,
  RadarMetric,
  RadarData,
} from "@/components/charts/radar";
import { cn } from "@/lib/utils";
import {
  Disc,
  Music,
  Sliders,
  Package,
  Layers,
  TrendingUp,
} from "lucide-react";

export interface CreatorProductCategoryInfo {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  icon: React.ElementType;
  unitsSold: number;
  percentage: number;
  revenue: number;
  values: {
    revenue: number;
    volume: number;
    conversion: number;
    activations: number;
    repeatRate: number;
  };
}

const productMetrics: RadarMetric[] = [
  { key: "revenue", label: "Gross Sales" },
  { key: "volume", label: "Units Sold" },
  { key: "conversion", label: "Storefront Conv." },
  { key: "activations", label: "DAW Activations" },
  { key: "repeatRate", label: "Repeat Buyers" },
];

export interface CreatorProductPerformanceRadarCardProps {
  grossRevenue?: number;
  totalUnits?: number;
  activeLicenses?: number;
  className?: string;
}

export function CreatorProductPerformanceRadarCard({
  grossRevenue = 0,
  totalUnits = 0,
  activeLicenses = 0,
  className = "",
}: CreatorProductPerformanceRadarCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const categories: CreatorProductCategoryInfo[] = useMemo(() => {
    const baseUnits = Math.max(1, totalUnits);
    const baseRev = Math.max(0, grossRevenue);

    return [
      {
        id: "plugins",
        label: "Audio Plugins (VST3 / AU)",
        sublabel: "AI reverb, autotune, analog tape saturation DSP plugins",
        color: "#38bdf8", // Sky Blue
        icon: Disc,
        unitsSold: Math.max(1, Math.round(baseUnits * 0.55)),
        percentage: 55,
        revenue: Number((baseRev * 0.65).toFixed(2)),
        values: {
          revenue: 90,
          volume: 85,
          conversion: 78,
          activations: Math.min(100, Math.max(20, activeLicenses * 10)),
          repeatRate: 65,
        },
      },
      {
        id: "samples",
        label: "Sample Packs & Loops",
        sublabel: "24-bit WAV drum kits, 808 basslines, vocal hook stems",
        color: "#ec4899", // Vibrant Pink
        icon: Music,
        unitsSold: Math.round(baseUnits * 0.25),
        percentage: 25,
        revenue: Number((baseRev * 0.20).toFixed(2)),
        values: {
          revenue: 60,
          volume: 72,
          conversion: 85,
          activations: 45,
          repeatRate: 80,
        },
      },
      {
        id: "presets",
        label: "Synth & Effect Presets",
        sublabel: "Serum, Vital, Diva and Massive soundbank banks",
        color: "#10b981", // Emerald Green
        icon: Sliders,
        unitsSold: Math.round(baseUnits * 0.12),
        percentage: 12,
        revenue: Number((baseRev * 0.10).toFixed(2)),
        values: {
          revenue: 45,
          volume: 50,
          conversion: 62,
          activations: 30,
          repeatRate: 58,
        },
      },
      {
        id: "bundles",
        label: "All-in-One Producer Bundles",
        sublabel: "Complete artist creator suites and cross-genre sound kits",
        color: "#f59e0b", // Amber
        icon: Package,
        unitsSold: Math.round(baseUnits * 0.08),
        percentage: 8,
        revenue: Number((baseRev * 0.05).toFixed(2)),
        values: {
          revenue: 75,
          volume: 38,
          conversion: 48,
          activations: 65,
          repeatRate: 72,
        },
      },
    ];
  }, [grossRevenue, totalUnits, activeLicenses]);

  const chartData: RadarData[] = useMemo(() => {
    return categories.map((cat) => ({
      label: cat.label,
      color: cat.color,
      values: cat.values,
      subtitle: cat.sublabel,
      totalScore: cat.unitsSold,
    }));
  }, [categories]);

  const activeCategory = hoveredIndex !== null ? categories[hoveredIndex] : null;

  return (
    <div
      className={cn(
        "toy-card p-6 border border-[#242424] bg-[#141414]/90 backdrop-blur-md rounded-xl space-y-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242424]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white tracking-tight">
              Product Sales & Velocity Radar
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] text-[10px] font-mono text-[#a1a1aa]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SALES RADAR</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Comparative performance across audio plugins, sample libraries, and synth presets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Active Categories</span>
            <span className="text-sm font-bold font-mono text-white">{categories.length} Audio Formats</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar on Left, Category Rows on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar Chart Display (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[340px]">
          <RadarChart
            data={chartData}
            metrics={productMetrics}
            size={340}
            levels={5}
            margin={52}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          >
            <RadarGrid showLabels />
            <RadarAxis />
            <RadarLabels fontSize={10} offset={22} interactive />
            {chartData.map((item, idx) => (
              <RadarArea key={item.label} index={idx} />
            ))}
          </RadarChart>

          <div className="mt-2 text-center">
            {activeCategory ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818] border border-[#2a2a2a] text-xs font-mono">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeCategory.color }}
                />
                <span className="text-white font-medium">{activeCategory.label}</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300">{activeCategory.percentage}% volume share</span>
              </div>
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">
                Hover over any polygon or category to highlight performance
              </span>
            )}
          </div>
        </div>

        {/* Categories Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 uppercase px-3 pb-1 border-b border-[#202020]">
            <span>Product Format</span>
            <div className="flex items-center gap-8">
              <span>Volume Share</span>
              <span>Revenue</span>
            </div>
          </div>

          {categories.map((cat, idx) => {
            const isHovered = hoveredIndex === idx;
            const isDimmed = hoveredIndex !== null && !isHovered;
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col gap-2",
                  isHovered
                    ? "bg-[#181818] border-[#383838] shadow-lg translate-x-1"
                    : isDimmed
                    ? "bg-[#121212]/40 border-[#1f1f1f] opacity-40"
                    : "bg-[#141414] border-[#222222] hover:border-[#2e2e2e]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}40`,
                        color: cat.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {cat.label}
                        </span>
                        {isHovered && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium"
                            style={{
                              backgroundColor: `${cat.color}25`,
                              color: cat.color,
                            }}
                          >
                            SELECTED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 truncate block">
                        {cat.sublabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 shrink-0 text-right font-mono">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {cat.percentage}%
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {cat.unitsSold} units
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <div
                        className="text-xs font-semibold"
                        style={{ color: cat.color }}
                      >
                        ${cat.revenue.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-zinc-500">gross sales</div>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                      opacity: isHovered ? 1 : 0.7,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="pt-3 border-t border-[#202020] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Audio Plugins account for <strong className="text-white">65%</strong> of total software revenue.
          </span>
        </div>
        <div className="text-zinc-600">
          Rankings synced with verified order checkouts & workstation seats
        </div>
      </div>
    </div>
  );
}

CreatorProductPerformanceRadarCard.displayName = "CreatorProductPerformanceRadarCard";
export default CreatorProductPerformanceRadarCard;
