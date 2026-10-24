"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DollarSign, Percent, ShoppingBag, ShieldCheck } from "lucide-react";

export interface SalesEconomicsCardProps {
  grossRevenue: number;
  netRoyalty70?: number;
  purchases?: any[];
  activeLicenses?: number;
  className?: string;
}

export function SalesEconomicsCard({
  grossRevenue = 0,
  netRoyalty70,
  purchases = [],
  activeLicenses = 0,
  className = "",
}: SalesEconomicsCardProps) {
  const totalUnits = purchases.length;

  const paidPurchases = useMemo(() => {
    return purchases.filter((p) => parseFloat(p.amount_paid || 0) > 0);
  }, [purchases]);

  const paidCount = paidPurchases.length;
  const freeCount = Math.max(0, totalUnits - paidCount);

  // Exact 70/30 split calculation
  const creatorShare =
    netRoyalty70 !== undefined && netRoyalty70 > 0
      ? netRoyalty70
      : Number((grossRevenue * 0.7).toFixed(2));

  const platformShare = Number((grossRevenue * 0.3).toFixed(2));

  // Average order value
  const aov =
    paidCount > 0
      ? Number((grossRevenue / paidCount).toFixed(2))
      : totalUnits > 0
      ? Number((grossRevenue / totalUnits).toFixed(2))
      : 0;

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
            Sales Economics & Settlement
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Royalty distribution, average order size, and fulfillment status
          </p>
        </div>

        <div className="flex items-center gap-4 text-right font-mono">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block">Gross Volume</span>
            <span className="text-base font-bold text-white">
              ${grossRevenue.toFixed(2)}
            </span>
          </div>
          <div className="pl-4 border-l border-[#242424]">
            <span className="text-[10px] text-zinc-500 uppercase block">Net Royalty (70%)</span>
            <span className="text-base font-bold text-emerald-400">
              ${creatorShare.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Minimalist Sales Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg bg-[#181818] border border-[#262626]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Average Order Value</span>
            <DollarSign className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            ${aov.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Per verified transaction
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#181818] border border-[#262626]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Publisher Royalty</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            70.0%
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
            ${creatorShare.toFixed(2)} net retain
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#181818] border border-[#262626]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Platform Fee</span>
            <ShoppingBag className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            30.0%
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
            ${platformShare.toFixed(2)} infrastructure
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#181818] border border-[#262626]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Fulfillment Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            100%
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Instant license delivery
          </div>
        </div>
      </div>

      {/* 70/30 Net Royalty Distribution Progress Bar */}
      <div className="p-4 rounded-lg bg-[#161616] border border-[#242424] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">70/30 Royalty Economics</span>
          <span className="font-mono text-zinc-400 text-[11px]">
            ${grossRevenue.toFixed(2)} Gross Sales
          </span>
        </div>

        <div className="w-full bg-[#202020] h-2.5 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
            style={{ width: "70%" }}
            title="70% Publisher Royalty"
          />
          <div
            className="h-full bg-zinc-600 rounded-r-full transition-all duration-300"
            style={{ width: "30%" }}
            title="30% Platform Infrastructure"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-300">Publisher 70%:</span>
            <span className="text-white font-bold">${creatorShare.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-zinc-400">Platform 30%:</span>
            <span className="text-zinc-200 font-bold">${platformShare.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Transaction & Order Channel Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Paid Checkouts</div>
            <div className="text-[11px] text-zinc-500">Commercial transactions</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-white">{paidCount}</div>
            <div className="text-[10px] text-zinc-500">${grossRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Promotional / Free</div>
            <div className="text-[11px] text-zinc-500">Claims & redemptions</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-white">{freeCount}</div>
            <div className="text-[10px] text-zinc-500">$0.00</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Active Studio Seats</div>
            <div className="text-[11px] text-zinc-500">Hardware authorizations</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-white">{activeLicenses}</div>
            <div className="text-[10px] text-zinc-500">Live rigs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

SalesEconomicsCard.displayName = "SalesEconomicsCard";
export default SalesEconomicsCard;
