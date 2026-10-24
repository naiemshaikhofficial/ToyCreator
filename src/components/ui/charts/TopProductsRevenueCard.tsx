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
  "#38bdf8", // 1. Sky Blue
  "#a855f7", // 2. Vibrant Purple
  "#10b981", // 3. Vibrant Emerald
  "#f59e0b", // 4. Vibrant Amber
  "#ec4899", // 5. Vibrant Pink
];

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
          label: "No Products Listed",
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

      // In the chart, slice value is revenue (or unit share if total revenue is 0)
      const sliceVal = sumRevenue > 0 ? rev : units > 0 ? units : 1;

      return {
        label: p.name,
        value: sliceVal,
        color,
        subtitle: `${units} ${units === 1 ? "unit" : "units"} sold · $${rev.toFixed(2)}`,
        actualRevenue: rev,
        unitsSold: units,
      };
    });
  }, [topProducts, sumRevenue]);

  return (
    <div
      className={cn(
        "toy-card p-6 sm:p-7 border border-[#242424] bg-[#141414]/90 backdrop-blur-md rounded-xl space-y-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#242424]">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Top Products Revenue
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real sales and unit volume across your catalog
          </p>
        </div>

        <div className="flex items-center gap-4 text-right font-mono">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block">Total Revenue</span>
            <span className="text-base font-bold text-white">
              ${totalGrossRevenue.toFixed(2)}
            </span>
          </div>
          <div className="pl-4 border-l border-[#242424]">
            <span className="text-[10px] text-zinc-500 uppercase block">Total Orders</span>
            <span className="text-base font-bold text-white">
              {totalUnits} Units
            </span>
          </div>
        </div>
      </div>

      {/* Main Container: Donut on Left, Clean List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Donut Chart Display (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[240px]">
          <div className="aspect-square w-56 sm:w-60 flex items-center justify-center">
            <PieChart
              data={chartData}
              hoveredIndex={hoveredIndex}
              innerRadius={68}
              size={230}
              onHoverChange={setHoveredIndex}
            >
              {chartData.map((item, index) => (
                <PieSlice hoverEffect="grow" index={index} key={item.label} />
              ))}
              <PieCenter
                defaultLabel="Top Sales"
                formatValue={(v) =>
                  hoveredIndex !== null && chartData[hoveredIndex]
                    ? `$${chartData[hoveredIndex].actualRevenue?.toFixed(2) ?? "0.00"}`
                    : `$${sumRevenue.toFixed(2)}`
                }
              />
            </PieChart>
          </div>
        </div>

        {/* Clean Interactive List (7 cols) */}
        <div className="lg:col-span-7">
          <div className="w-full space-y-2">
            {chartData.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              const isDimmed = hoveredIndex !== null && !isHovered;

              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                    isHovered
                      ? "bg-[#181818] border-[#383838] shadow-md translate-x-1"
                      : isDimmed
                      ? "bg-[#121212]/40 border-[#1f1f1f] opacity-40"
                      : "bg-[#141414] border-[#222222] hover:border-[#2e2e2e]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Product rank badge */}
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                        style={{
                          backgroundColor: `${item.color}25`,
                          color: item.color,
                          border: `1px solid ${item.color}50`,
                        }}
                      >
                        #{idx + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {item.unitsSold} sold
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div
                        className="text-xs font-bold"
                        style={{ color: item.color }}
                      >
                        ${item.actualRevenue !== undefined ? item.actualRevenue.toFixed(2) : "0.00"}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {sumRevenue > 0 && item.actualRevenue
                          ? `${Math.round((item.actualRevenue / sumRevenue) * 100)}% share`
                          : totalUnits > 0 && item.unitsSold
                          ? `${Math.round((item.unitsSold / totalUnits) * 100)}% share`
                          : "0% share"}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar with product's unique vibrant color */}
                  <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          sumRevenue > 0 && item.actualRevenue
                            ? Math.round((item.actualRevenue / sumRevenue) * 100)
                            : totalUnits > 0 && item.unitsSold
                            ? Math.round((item.unitsSold / totalUnits) * 100)
                            : 0
                        }%`,
                        backgroundColor: item.color,
                        opacity: isHovered ? 1 : 0.75,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

TopProductsRevenueCard.displayName = "TopProductsRevenueCard";
export default TopProductsRevenueCard;
