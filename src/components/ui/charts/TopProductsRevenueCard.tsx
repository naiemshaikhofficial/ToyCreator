"use client";

import React, { useState, useMemo } from "react";
import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { cn } from "@/lib/utils";

export interface TopProductItem {
  id: string;
  name: string;
  unitsSold: number;
  totalRevenue: number;
  product_type?: string;
  price_usd?: string;
}

export interface TopProductsRevenueCardProps {
  products: TopProductItem[];
  totalGrossRevenue: number;
  className?: string;
}

const vibrantProductPalette = [
  "#38bdf8", // Sky Blue
  "#a855f7", // Vibrant Purple
  "#10b981", // Vibrant Emerald
  "#f59e0b", // Vibrant Amber
  "#ec4899", // Vibrant Pink
];

/** Extract short concise product name (e.g., 'ProVerb — AI...' -> 'ProVerb') */
function cleanProductName(name: string): string {
  if (!name) return "";
  const parts = name.split(/\s*[-—:|]\s*/);
  if (parts[0] && parts[0].trim().length > 0) {
    return parts[0].trim();
  }
  return name.trim();
}

export function TopProductsRevenueCard({
  products = [],
  totalGrossRevenue = 0,
  className = "",
}: TopProductsRevenueCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take top 5 products strictly from real verified catalog & purchase data
  const topProducts = useMemo(() => {
    return products.slice(0, 5);
  }, [products]);

  // Compute total sales across these top products
  const sumRevenue = useMemo(() => {
    return topProducts.reduce((acc, p) => acc + (p.totalRevenue || 0), 0);
  }, [topProducts]);

  const totalUnits = useMemo(() => {
    return topProducts.reduce((acc, p) => acc + (p.unitsSold || 0), 0);
  }, [topProducts]);

  // Format into Bklit UI PieData
  const chartData = useMemo(() => {
    if (topProducts.length === 0) {
      return [
        {
          label: "No Products",
          fullLabel: "No Products Listed",
          value: 1,
          color: "#38bdf8",
          subtitle: "0 sales recorded",
          actualRevenue: 0,
          unitsSold: 0,
        },
      ];
    }

    return topProducts.map((p, idx) => {
      const color = vibrantProductPalette[idx % vibrantProductPalette.length];
      const rev = Number((p.totalRevenue || 0).toFixed(2));
      const units = p.unitsSold || 0;
      const shortName = cleanProductName(p.name);

      // In the chart, slice value is revenue (or unit share if total revenue is 0)
      const sliceVal = sumRevenue > 0 ? rev : units > 0 ? units : 1;

      return {
        label: shortName,
        fullLabel: p.name,
        value: sliceVal,
        color,
        subtitle: `${units} sold · $${rev.toFixed(2)}`,
        actualRevenue: rev,
        unitsSold: units,
      };
    });
  }, [topProducts, sumRevenue]);

  return (
    <div
      className={cn(
        "toy-card p-5 sm:p-5.5 border border-[#242424] bg-[#141414]/90 backdrop-blur-md rounded-xl space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#242424]">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Top Products Revenue
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Catalog sales breakdown
          </p>
        </div>

        <div className="text-right font-mono">
          <span className="text-xs font-bold text-white block">
            ${totalGrossRevenue.toFixed(2)}
          </span>
          <span className="text-[10px] text-zinc-500">
            {totalUnits} {totalUnits === 1 ? "unit" : "units"}
          </span>
        </div>
      </div>

      {/* Main Container: Compact Donut + Clean List */}
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        {/* Compact Donut Display */}
        <div className="flex items-center justify-center shrink-0">
          <div className="w-[150px] h-[150px] flex items-center justify-center">
            <PieChart
              data={chartData}
              hoveredIndex={hoveredIndex}
              innerRadius={46}
              size={150}
              hoverOffset={5}
              onHoverChange={setHoveredIndex}
            >
              {chartData.map((item, index) => (
                <PieSlice hoverEffect="grow" index={index} key={item.label} />
              ))}
              <PieCenter
                defaultLabel="Sales"
                formatValue={() =>
                  hoveredIndex !== null && chartData[hoveredIndex]
                    ? `$${chartData[hoveredIndex].actualRevenue?.toFixed(2) ?? "0.00"}`
                    : `$${sumRevenue.toFixed(2)}`
                }
              />
            </PieChart>
          </div>
        </div>

        {/* Compact Clean List */}
        <div className="w-full space-y-1.5 flex-1 min-w-0">
          {chartData.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const isDimmed = hoveredIndex !== null && !isHovered;

            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "flex flex-col gap-1.5 p-2 rounded-lg border transition-all duration-150 cursor-pointer",
                  isHovered
                    ? "bg-[#181818] border-[#383838] shadow-xs translate-x-0.5"
                    : isDimmed
                    ? "bg-[#121212]/40 border-[#1f1f1f] opacity-40"
                    : "bg-[#131313] border-[#222222] hover:border-[#2a2a2a]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Compact Product rank badge */}
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-mono font-bold shrink-0"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                        border: `1px solid ${item.color}45`,
                      }}
                    >
                      #{idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate" title={item.fullLabel}>
                        {item.label}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">
                      {item.unitsSold} sold
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: item.color }}
                    >
                      ${item.actualRevenue !== undefined ? item.actualRevenue.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                {/* Micro progress bar */}
                <div className="w-full bg-[#1c1c1c] h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${
                        sumRevenue > 0 && item.actualRevenue
                          ? Math.round((item.actualRevenue / sumRevenue) * 100)
                          : totalUnits > 0 && item.unitsSold
                          ? Math.round((item.unitsSold / totalUnits) * 100)
                          : 0
                      }%`,
                      backgroundColor: item.color,
                      opacity: isHovered ? 1 : 0.8,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

TopProductsRevenueCard.displayName = "TopProductsRevenueCard";
export default TopProductsRevenueCard;
