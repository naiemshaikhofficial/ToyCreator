"use client";

import React from "react";
import { Package, TrendingUp } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface ProductFormatStat {
  format: string;
  count: number;
}

export interface TotalProductsRadialChartCardProps {
  totalProducts: number;
  products?: Array<{
    id: string;
    name: string;
    product_type?: string;
    is_active?: boolean;
  }>;
  className?: string;
}

export function TotalProductsRadialChartCard({
  totalProducts = 0,
  products = [],
  className = "",
}: TotalProductsRadialChartCardProps) {
  // Real format distribution
  const pluginCount = products.filter(
    (p) => !p.product_type || p.product_type === "plugin"
  ).length;
  const samplePackCount = products.filter(
    (p) => p.product_type === "sample_pack"
  ).length;
  const presetCount = products.filter(
    (p) => p.product_type === "soundbank" || p.product_type === "preset"
  ).length;

  // Colorful radial chart data
  const chartData = [
    {
      name: "Products",
      count: totalProducts,
      fill: "url(#productGradient)",
    },
  ];

  // Calculate percentage toward catalog benchmark
  const targetCatalog = Math.max(10, totalProducts * 2);
  const endAngle = Math.min(360, Math.max(45, (totalProducts / targetCatalog) * 360));

  return (
    <div
      className={cn(
        "toy-card p-5 flex flex-col justify-between relative overflow-hidden",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between text-zinc-400 mb-1 z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Total Products
        </span>
        <div className="w-7 h-7 rounded-lg bg-[#242424] border border-zinc-700/50 flex items-center justify-center text-zinc-300">
          <Package className="w-4 h-4" />
        </div>
      </div>

      {/* Radial Chart Display */}
      <div className="relative w-full h-[150px] flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 - endAngle}
            innerRadius={50}
            outerRadius={70}
          >
            <defs>
              <linearGradient id="productGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="#262626"
              polarRadius={[58, 62]}
            />
            <RadialBar
              dataKey="count"
              background={{ fill: "#1a1a1a" }}
              cornerRadius={10}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 2}
                          className="fill-white text-2xl font-black font-mono"
                        >
                          {totalProducts}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                          className="fill-zinc-400 text-[9px] uppercase tracking-wider font-semibold"
                        >
                          Live
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Badges */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-[#202020] pt-2 mt-1">
        <span>Audio Plugins: <strong className="text-white font-mono">{pluginCount}</strong></span>
        {samplePackCount > 0 && (
          <span>Sample Packs: <strong className="text-white font-mono">{samplePackCount}</strong></span>
        )}
        <span className="text-[10px] text-zinc-400">Live in Store</span>
      </div>
    </div>
  );
}

export default TotalProductsRadialChartCard;
