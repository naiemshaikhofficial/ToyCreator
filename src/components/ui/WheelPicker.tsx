"use client";

/**
 * ProducerToy Monochrome Date Wheel Picker
 * Adapted from Kokonut UI (Dorian Baffier) for strict monochrome dark theme.
 * Configured specifically for Date Sorting: Month - Date - Year.
 * Strictly adheres to black, white, charcoal, and zinc palette - zero colored accents.
 */

import React, {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type AnimationPlaybackControls,
  animate,
  type MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface WheelOption {
  value: string;
  label: string;
}

export interface WheelColumn {
  id: string;
  label: string;
  options: WheelOption[];
  loop?: boolean;
  className?: string;
}

const MONTHS: WheelOption[] = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const DAYS: WheelOption[] = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, "0");
  return { value: d, label: d };
});

const YEARS: WheelOption[] = [
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
];

export const DEFAULT_DATE_COLUMNS: WheelColumn[] = [
  {
    id: "month",
    label: "Month",
    loop: true,
    className: "w-20",
    options: MONTHS,
  },
  {
    id: "day",
    label: "Day",
    loop: true,
    className: "w-16",
    options: DAYS,
  },
  {
    id: "year",
    label: "Year",
    loop: false,
    className: "w-20",
    options: YEARS,
  },
];

const now = new Date();
export const DEFAULT_DATE_VALUE: Record<string, string> = {
  month: String(now.getMonth() + 1).padStart(2, "0"),
  day: String(now.getDate()).padStart(2, "0"),
  year: String(now.getFullYear()),
};

const ITEM_HEIGHT = 36;
const ITEM_ANGLE = 20;
const RADIUS =
  Math.round(
    (ITEM_HEIGHT / 2 / Math.tan((ITEM_ANGLE / 2) * (Math.PI / 180))) * 100
  ) / 100;
const WINDOW = Math.ceil(90 / ITEM_ANGLE);
const VIEW_HEIGHT = Math.round(RADIUS * 2) + ITEM_HEIGHT / 2;
const MAX_OVERSCROLL = 1.2;
const VELOCITY_WINDOW_MS = 80;
const TAP_SLOP = 4;
const COAST = 0.32;

const mod = (n: number, m: number) => ((n % m) + m) % m;

function damp(distance: number, max: number) {
  return max * (1 - Math.exp(-distance / max));
}

function hapticTick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(1);
    } catch {}
  }
}

export interface WheelPickerProps {
  columns?: WheelColumn[];
  value?: Record<string, string>;
  defaultValue?: Record<string, string>;
  onValueChange?: (value: Record<string, string>) => void;
  label?: string;
  className?: string;
}

export function WheelPicker({
  columns = DEFAULT_DATE_COLUMNS,
  value: valueProp,
  defaultValue = DEFAULT_DATE_VALUE,
  onValueChange,
  label = "Date Filter",
  className,
}: WheelPickerProps) {
  const [internal, setInternal] = useState(defaultValue);
  const value = valueProp ?? internal;
  const latestValue = useRef(value);
  latestValue.current = value;

  const select = (columnId: string, optionValue: string) => {
    const current = latestValue.current;
    if (current[columnId] === optionValue) {
      return;
    }
    const next = { ...current, [columnId]: optionValue };
    latestValue.current = next;
    if (valueProp === undefined) {
      setInternal(next);
    }
    onValueChange?.(next);
  };

  return (
    <div
      aria-label={label}
      className={cn(
        "relative flex select-none justify-center rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 shadow-inner",
        className
      )}
      role="group"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-md bg-[#222222] border-y border-[#333333]"
        style={{ height: ITEM_HEIGHT }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1.5 h-px w-1.5 -translate-y-1/2 bg-zinc-600"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-1.5 h-px w-1.5 -translate-y-1/2 bg-zinc-600"
      />
      {columns.map((column) => (
        <WheelColumnView
          column={column}
          key={column.id}
          onSelect={(optionValue) => select(column.id, optionValue)}
          selected={value[column.id]}
        />
      ))}
    </div>
  );
}

function WheelColumnView({
  column,
  selected,
  onSelect,
}: {
  column: WheelColumn;
  selected: string | undefined;
  onSelect: (value: string) => void;
}) {
  const { options, loop = false } = column;
  const count = options.length;
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === selected),
    0
  );
  const reduceMotion = useReducedMotion();

  const position = useMotionValue(selectedIndex);
  const [center, setCenter] = useState(selectedIndex);
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const pointerType = useRef("mouse");
  const drag = useRef<{
    id: number;
    startY: number;
    startPosition: number;
    moved: boolean;
    samples: { t: number; v: number }[];
  } | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  const drum = useTransform(
    position,
    (p) => `translateZ(${-RADIUS}px) rotateX(${p * ITEM_ANGLE}deg)`
  );

  const optionAt = (index: number) => options[mod(index, count)];

  useMotionValueEvent(position, "change", (p) => {
    const rounded = Math.round(p);
    if (rounded !== center) {
      setCenter(rounded);
      if (pointerType.current === "touch") {
        hapticTick();
      }
    }
  });

  useEffect(() => {
    if (drag.current || animation.current) {
      return;
    }
    const current = mod(Math.round(position.get()), count);
    if (current === selectedIndex) {
      return;
    }
    let delta = selectedIndex - current;
    if (loop && Math.abs(delta) > count / 2) {
      delta -= Math.sign(delta) * count;
    }
    position.jump(Math.round(position.get()) + delta);
  }, [selectedIndex, count, loop, position]);

  useEffect(() => () => animation.current?.stop(), []);

  const settle = () => {
    animation.current = null;
    onSelect(optionAt(Math.round(position.get())).value);
  };

  const clampIndex = (index: number) =>
    loop ? index : Math.min(Math.max(index, 0), count - 1);

  const goTo = (target: number) => {
    animation.current?.stop();
    animation.current = null;
    if (reduceMotion) {
      position.jump(target);
      settle();
      return;
    }
    animation.current = animate(position, target, {
      type: "spring",
      duration: 0.4,
      bounce: 0.15,
      restDelta: 0.001,
      onComplete: settle,
    });
  };

  const withOverscroll = (raw: number) => {
    if (loop) {
      return raw;
    }
    if (raw < 0) {
      return -damp(-raw, MAX_OVERSCROLL);
    }
    if (raw > count - 1) {
      return count - 1 + damp(raw - (count - 1), MAX_OVERSCROLL);
    }
    return raw;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    animation.current?.stop();
    animation.current = null;
    pointerType.current = event.pointerType;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      startY: event.clientY,
      startPosition: position.get(),
      moved: false,
      samples: [{ t: event.timeStamp, v: position.get() }],
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) {
      return;
    }
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.abs(dy) < TAP_SLOP) {
      return;
    }
    current.moved = true;
    const raw = current.startPosition - dy / ITEM_HEIGHT;
    position.set(withOverscroll(raw));
    current.samples.push({ t: event.timeStamp, v: raw });
    while (
      current.samples.length > 2 &&
      event.timeStamp - current.samples[0].t > VELOCITY_WINDOW_MS
    ) {
      current.samples.shift();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) {
      return;
    }
    drag.current = null;

    if (!current.moved && event.type !== "pointerup") {
      goTo(clampIndex(Math.round(position.get())));
      return;
    }
    if (!current.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      const offsetY = event.clientY - (rect.top + rect.height / 2);
      const ratio = Math.max(-1, Math.min(1, offsetY / RADIUS));
      const rows = Math.round((Math.asin(ratio) * 180) / Math.PI / ITEM_ANGLE);
      goTo(clampIndex(Math.round(position.get()) + rows));
      return;
    }

    const first = current.samples[0];
    const last = current.samples.at(-1) ?? first;
    const elapsed = (last.t - first.t) / 1000;
    const paused = event.timeStamp - last.t > VELOCITY_WINDOW_MS;
    const velocity = elapsed > 0 && !paused ? (last.v - first.v) / elapsed : 0;
    const p = position.get();
    const outOfBounds = !loop && (p < 0 || p > count - 1);

    if (reduceMotion || outOfBounds || Math.abs(velocity) < 2) {
      goTo(clampIndex(Math.round(p)));
      return;
    }

    const target = clampIndex(Math.round(p + velocity * COAST));
    animation.current = animate(position, target, {
      type: "spring",
      velocity,
      stiffness: 140,
      damping: 24,
      restDelta: 0.005,
      onComplete: settle,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = Math.round(position.get());
    const moves: Record<string, number> = {
      ArrowUp: 1,
      ArrowDown: -1,
      PageUp: 5,
      PageDown: -5,
    };
    let target: number;
    if (event.key === "Home") {
      target = index - mod(index, count);
    } else if (event.key === "End") {
      target = index - mod(index, count) + count - 1;
    } else if (event.key in moves) {
      target = clampIndex(index + moves[event.key]);
    } else {
      return;
    }
    event.preventDefault();
    animation.current?.stop();
    pointerType.current = "keyboard";
    position.jump(target);
    settle();
  };

  const wheel = useRef({ loop, count, goTo, clampIndex });
  wheel.current = { loop, count, goTo, clampIndex };
  useEffect(() => {
    const node = columnRef.current;
    if (!node) {
      return;
    }
    let timer: number | undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const latest = wheel.current;
      animation.current?.stop();
      animation.current = null;
      pointerType.current = "mouse";
      const raw = position.get() + (event.deltaY / ITEM_HEIGHT) * 0.4;
      position.set(
        latest.loop
          ? raw
          : Math.min(Math.max(raw, -0.4), latest.count - 1 + 0.4)
      );
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const settled = wheel.current;
        settled.goTo(settled.clampIndex(Math.round(position.get())));
      }, 120);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, [position]);

  const rows: number[] = [];
  for (let i = center - WINDOW; i <= center + WINDOW; i++) {
    if (loop || (i >= 0 && i < count)) {
      rows.push(i);
    }
  }

  return (
    <div
      aria-label={column.label}
      aria-valuemax={count - 1}
      aria-valuemin={0}
      aria-valuenow={selectedIndex}
      aria-valuetext={options[selectedIndex]?.label}
      className={cn(
        "relative cursor-grab touch-none rounded-lg outline-none active:cursor-grabbing",
        "focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-inset",
        column.className ?? "w-16"
      )}
      onKeyDown={handleKeyDown}
      onLostPointerCapture={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={columnRef}
      role="spinbutton"
      style={{ height: VIEW_HEIGHT }}
      tabIndex={0}
    >
      <div
        className="absolute inset-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, #000 34%, #000 66%, transparent)",
        }}
      >
        <Drum
          drum={drum}
          optionAt={optionAt}
          rowClassName="text-zinc-500 font-mono text-sm"
          rows={rows}
        />
        <Drum
          clip
          drum={drum}
          optionAt={optionAt}
          rowClassName="font-bold text-white font-mono text-sm tracking-wide"
          rows={rows}
        />
      </div>
    </div>
  );
}

function Drum({
  drum,
  rows,
  optionAt,
  rowClassName,
  clip = false,
}: {
  drum: MotionValue<string>;
  rows: number[];
  optionAt: (index: number) => WheelOption;
  rowClassName: string;
  clip?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        perspective: 1000,
        clipPath: clip
          ? `inset(calc(50% - ${ITEM_HEIGHT / 2}px) 0 calc(50% - ${ITEM_HEIGHT / 2}px) 0)`
          : undefined,
      }}
    >
      <motion.div
        className="absolute inset-x-0 top-1/2"
        style={{ transform: drum, transformStyle: "preserve-3d" }}
      >
        {rows.map((index) => (
          <div
            className={cn(
              "absolute inset-x-0 flex items-center justify-center tabular-nums [backface-visibility:hidden]",
              rowClassName
            )}
            key={index}
            style={{
              top: -ITEM_HEIGHT / 2,
              height: ITEM_HEIGHT,
              transform: `rotateX(${-index * ITEM_ANGLE}deg) translateZ(${RADIUS}px)`,
            }}
          >
            {optionAt(index).label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default WheelPicker;
