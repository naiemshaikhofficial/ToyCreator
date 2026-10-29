"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { WheelPicker, type WheelColumn } from "@/components/kokonutui/wheel-picker";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductReleaseSchedulerProps {
  initialReleaseDate?: string | null;
  initialIsComingSoon?: boolean;
  initialIsActive?: boolean;
  onChange: (state: {
    releaseDate: string;
    isComingSoon: boolean;
    isActive: boolean;
    isScheduled: boolean;
  }) => void;
  className?: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const SCHEDULER_COLUMNS: WheelColumn[] = [
  {
    id: "month",
    label: "Month",
    loop: true,
    className: "w-14 sm:w-16",
    options: MONTH_NAMES.map((name, idx) => ({
      value: String(idx),
      label: name,
    })),
  },
  {
    id: "day",
    label: "Day",
    loop: true,
    className: "w-12 sm:w-14",
    options: Array.from({ length: 31 }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1).padStart(2, "0"),
    })),
  },
  {
    id: "year",
    label: "Year",
    loop: false,
    className: "w-16 sm:w-18",
    options: [2026, 2027, 2028].map((y) => ({
      value: String(y),
      label: String(y),
    })),
  },
  {
    id: "hour",
    label: "Hour",
    loop: true,
    className: "w-12 sm:w-14",
    options: Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1).padStart(2, "0"),
    })),
  },
  {
    id: "minute",
    label: "Minute",
    loop: true,
    className: "w-12 sm:w-14",
    options: Array.from({ length: 12 }, (_, i) => ({
      value: String(i * 5),
      label: String(i * 5).padStart(2, "0"),
    })),
  },
  {
    id: "period",
    label: "Period",
    loop: false,
    className: "w-14 sm:w-16",
    options: [
      { value: "am", label: "AM" },
      { value: "pm", label: "PM" },
    ],
  },
];

export function ProductReleaseScheduler({
  initialReleaseDate,
  initialIsComingSoon = false,
  initialIsActive = true,
  onChange,
  className = "",
}: ProductReleaseSchedulerProps) {
  // Parse initial date or default to future date (e.g. 18th or 7 days from now)
  const initialDateObj = useMemo(() => {
    if (initialReleaseDate) {
      const parsed = new Date(initialReleaseDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(10, 0, 0, 0);
    return d;
  }, [initialReleaseDate]);

  const [isScheduled, setIsScheduled] = useState(() => {
    if (!initialReleaseDate) return false;
    const parsed = new Date(initialReleaseDate);
    return !isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
  });

  const [isComingSoon, setIsComingSoon] = useState(initialIsComingSoon);

  useEffect(() => {
    if (initialIsComingSoon !== undefined) {
      setIsComingSoon(Boolean(initialIsComingSoon));
    }
  }, [initialIsComingSoon]);

  useEffect(() => {
    if (initialReleaseDate !== undefined && initialReleaseDate) {
      const parsed = new Date(initialReleaseDate);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        setIsScheduled(true);
      }
    }
  }, [initialReleaseDate]);

  const [wheelValue, setWheelValue] = useState<Record<string, string>>(() => {
    const hours24 = initialDateObj.getHours();
    const isPm = hours24 >= 12;
    const hours12 = hours24 % 12 || 12;
    const minsRounded = Math.round(initialDateObj.getMinutes() / 5) * 5;

    return {
      month: String(initialDateObj.getMonth()),
      day: String(initialDateObj.getDate()),
      year: String(initialDateObj.getFullYear()),
      hour: String(hours12),
      minute: String(minsRounded >= 60 ? 55 : minsRounded),
      period: isPm ? "pm" : "am",
    };
  });

  // Calculate selected Date object from wheel columns
  const selectedDate = useMemo(() => {
    const year = parseInt(wheelValue.year || "2026", 10);
    const month = parseInt(wheelValue.month || "9", 10);
    const day = parseInt(wheelValue.day || "18", 10);
    let hour = parseInt(wheelValue.hour || "10", 10);
    const minute = parseInt(wheelValue.minute || "0", 10);
    const isPm = wheelValue.period === "pm";

    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;

    return new Date(year, month, day, hour, minute, 0);
  }, [wheelValue]);

  // Check if chosen time is in future
  const isFuture = selectedDate.getTime() > Date.now();

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const lastEmittedRef = useRef<string | null>(null);

  // Notify parent on change only when values actually change
  useEffect(() => {
    const payload = {
      releaseDate: isScheduled ? selectedDate.toISOString() : "",
      isComingSoon: Boolean(isComingSoon),
      isActive: true,
      isScheduled,
    };

    const signature = JSON.stringify(payload);
    if (lastEmittedRef.current === null) {
      // Initial mount: capture baseline without triggering redundant state loop
      lastEmittedRef.current = signature;
      return;
    }

    if (lastEmittedRef.current !== signature) {
      lastEmittedRef.current = signature;
      onChangeRef.current(payload);
    }
  }, [isScheduled, selectedDate, isComingSoon]);

  // Quick preset handlers
  const setQuickPreset = (daysAhead: number, specificDay?: number) => {
    const d = new Date();
    if (specificDay !== undefined) {
      // e.g. 18th of current or next month
      if (d.getDate() >= specificDay) {
        d.setMonth(d.getMonth() + 1);
      }
      d.setDate(specificDay);
    } else {
      d.setDate(d.getDate() + daysAhead);
    }
    d.setHours(10, 0, 0, 0);

    setWheelValue({
      month: String(d.getMonth()),
      day: String(d.getDate()),
      year: String(d.getFullYear()),
      hour: "10",
      minute: "0",
      period: "am",
    });
    setIsScheduled(true);
  };

  // Formatted human readable output
  const formattedString = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [selectedDate]);

  // Countdown text
  const countdownText = useMemo(() => {
    const diffMs = selectedDate.getTime() - Date.now();
    if (diffMs <= 0) return "Due for launch";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `in ${days} ${days === 1 ? "day" : "days"}, ${hours}h`;
    return `in ${hours} hours`;
  }, [selectedDate]);

  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-[#2a2a2a] bg-[#141414] space-y-5",
        className
      )}
    >
      {/* Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222222]">
        <div>
          <span className="text-xs font-bold text-white block">
            Launch Schedule & Availability
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Choose whether to release this audio product instantly or schedule a planned launch
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsScheduled(false)}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              !isScheduled
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Immediate Launch
          </button>
          <button
            type="button"
            onClick={() => setIsScheduled(true)}
            className={cn(
              "px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors",
              isScheduled
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled Launch</span>
          </button>
        </div>
      </div>

      {/* Scheduled Release Configuration */}
      {isScheduled ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">Quick Dates:</span>
            <button
              type="button"
              onClick={() => setQuickPreset(1)}
              className="px-2.5 py-1 rounded-md bg-[#1a1a1a] hover:bg-[#222222] border border-[#2e2e2e] text-zinc-300 hover:text-white transition-colors text-[11px]"
            >
              Tomorrow (10 AM)
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset(7)}
              className="px-2.5 py-1 rounded-md bg-[#1a1a1a] hover:bg-[#222222] border border-[#2e2e2e] text-zinc-300 hover:text-white transition-colors text-[11px]"
            >
              In 1 Week
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset(0, 18)}
              className="px-2.5 py-1 rounded-md bg-[#1f1f1f] hover:bg-[#282828] border border-white/20 text-white font-medium transition-colors text-[11px] flex items-center gap-1"
            >
              <Calendar className="w-3 h-3 text-zinc-300" />
              <span>18th of Month</span>
            </button>
          </div>

          {/* Kokonut UI 3D Wheel Picker Container */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="w-full max-w-lg bg-[#111111] border border-[#262626] rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase px-3 pb-2 border-b border-[#202020] mb-2">
                <span>Date & Month</span>
                <span>Time (12h)</span>
              </div>

              {/* The iOS-style 3D Drum Wheel Picker */}
              <WheelPicker
                columns={SCHEDULER_COLUMNS}
                value={wheelValue}
                onValueChange={setWheelValue}
                className="border-none bg-transparent shadow-none"
              />
            </div>
          </div>

          {/* Scheduled Status Confirmation Badge */}
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#282828] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {formattedString}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#222222] text-zinc-300 font-semibold">
                  {countdownText}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Product will be queued and made purchasable at this exact timestamp
              </p>
            </div>

            {/* Coming Soon Teaser Option */}
            <label className="flex items-center gap-2 cursor-pointer bg-[#1c1c1c] hover:bg-[#222222] px-3 py-2 rounded-lg border border-[#2a2a2a] transition-colors self-start sm:self-auto shrink-0">
              <input
                type="checkbox"
                checked={isComingSoon}
                onChange={(e) => setIsComingSoon(e.target.checked)}
                className="w-4 h-4 rounded bg-[#121212] border-[#383838] text-white focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 select-none">
                Show &quot;Coming Soon&quot; Teaser Badge
              </span>
            </label>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-400">
          Product goes live on the ProducerToy storefront immediately upon clicking Publish.
        </p>
      )}

      {/* Don't have a fixed date? Mark as Coming Soon */}
      <div className="pt-4 border-t border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">
              Don&apos;t have a fixed date? Mark as Coming Soon
            </span>
            {isComingSoon && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#202020] text-zinc-300 border border-zinc-700/60 font-medium">
                Coming Soon Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            Show &quot;Coming Soon&quot; on the storefront without setting a specific scheduled launch date.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsComingSoon(!isComingSoon)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-auto",
            isComingSoon ? "bg-white" : "bg-[#282828]"
          )}
          role="switch"
          aria-checked={isComingSoon}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transition duration-200 ease-in-out",
              isComingSoon ? "translate-x-5 bg-black" : "translate-x-0 bg-zinc-400"
            )}
          />
        </button>
      </div>
    </div>
  );
}

ProductReleaseScheduler.displayName = "ProductReleaseScheduler";
export default ProductReleaseScheduler;
