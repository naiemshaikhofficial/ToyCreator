"use client";

/**
 * ProducerToy Monochrome Particle Button
 * Adapted from Kokonut UI (Dorian Baffier) for strict monochrome dark theme.
 * Strictly adheres to black, white, charcoal, and zinc palette - zero colored accents.
 */

import React, {
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AlertCircle } from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

export type ParticleButtonStatus = "idle" | "pending" | "success" | "error";

export interface ParticleButtonProps
  extends Omit<
    ComponentProps<"button">,
    | "onClick"
    | "children"
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onAnimationStart"
  > {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  status?: ParticleButtonStatus;
  successDuration?: number;
  errorDuration?: number;
  pendingLabel?: ReactNode;
  successLabel?: ReactNode;
  errorLabel?: ReactNode;
  icon?: ReactNode;
  particles?: boolean;
  variant?: "primary" | "charcoal" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const LABEL_TRANSITION = { duration: 0.2, ease: EASE_OUT };
const WIDTH_TRANSITION = { type: "spring", duration: 0.35, bounce: 0 } as const;
const SHAKE = { x: [0, -6, 6, -4, 4, -2, 2, 0] };

// --- Monochrome Particles ---------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  w: number;
  h: number;
  color: string;
}

const PARTICLE_COUNT = 22;
const GRAVITY = 0.0016; // px per ms²
const DRAG = 0.0022; // fraction of velocity lost per ms
const LIFETIME = 650;
const BLEED = 64; // room around the button the canvas can draw into

// ProducerToy signature monochrome particle palette
const MONOCHROME_PARTICLE_COLORS = [
  "#ffffff",
  "#f4f4f5",
  "#e4e4e7",
  "#d4d4d8",
  "#a1a1aa",
  "#71717a",
];

function createMonochromeParticles(originX: number, width: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const spread = (Math.random() - 0.5) * Math.min(width, 140);
    const x = Math.min(Math.max(originX + spread, 4), width - 4);
    const side = x < width / 2 ? -1 : 1;
    const speed = 0.2 + Math.random() * 0.25;
    const angle = -Math.PI / 2 + side * Math.random() * 0.85;
    const isChip = i % 3 === 0;
    const color =
      MONOCHROME_PARTICLE_COLORS[
        Math.floor(Math.random() * MONOCHROME_PARTICLE_COLORS.length)
      ];

    return {
      x,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.025,
      w: isChip ? 5 : 3,
      h: isChip ? 2 : 3,
      color,
    };
  });
}

function Burst({
  originX,
  onDone,
}: {
  originX: number;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const parent = canvas?.parentElement?.parentElement;
    if (!(canvas && ctx && parent)) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const width = parent.offsetWidth;
    const cssW = width + BLEED * 2;
    const cssH = parent.offsetHeight + BLEED * 2;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    const particles = createMonochromeParticles(originX, width);
    const start = performance.now();
    let last = start;
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 32);
      last = now;
      const t = (now - start) / LIFETIME;
      ctx.clearRect(0, 0, cssW, cssH);
      if (t >= 1) {
        onDoneRef.current();
        return;
      }

      ctx.globalAlpha = 1 - t * t;
      for (const p of particles) {
        p.vx *= 1 - DRAG * dt;
        p.vy = p.vy * (1 - DRAG * dt) + GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;

        ctx.save();
        ctx.translate(p.x + BLEED, p.y + BLEED);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [originX]);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        top: -BLEED,
        left: -BLEED,
        width: `calc(100% + ${BLEED * 2}px)`,
        height: `calc(100% + ${BLEED * 2}px)`,
      }}
    >
      <canvas className="block h-full w-full" ref={canvasRef} />
    </span>
  );
}

// --- Icons ------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="w-3.5 h-3.5 animate-spin [animation-duration:650ms]"
      fill="none"
      viewBox="0 0 16 16"
    >
      <circle
        cx="8"
        cy="8"
        opacity="0.25"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 16 16"
    >
      <motion.path
        animate={{ pathLength: 1 }}
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        initial={{ pathLength: 0 }}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        transition={{ duration: 0.28, delay: 0.05, ease: EASE_OUT }}
      />
    </svg>
  );
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

export function ParticleButton({
  children = "Save changes",
  onClick,
  onSuccess,
  onError,
  status: controlledStatus,
  successDuration = 1800,
  errorDuration = 2800,
  pendingLabel = "Saving...",
  successLabel = "Saved",
  errorLabel = "Try Again",
  icon,
  particles = true,
  variant = "primary",
  size = "md",
  className,
  disabled,
  type = "button",
  ...props
}: ParticleButtonProps) {
  const [internalStatus, setInternalStatus] =
    useState<ParticleButtonStatus>("idle");
  const status = controlledStatus ?? internalStatus;
  const [burst, setBurst] = useState<{
    id: number;
    originX: number;
  } | null>(null);
  const [width, setWidth] = useState<number | undefined>();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const pressXRef = useRef<number | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef(0);
  const previousStatusRef = useRef(status);
  const shake = useAnimationControls();
  const shouldReduceMotion = useReducedMotion();

  useEffect(
    () => () => {
      if (resetRef.current) {
        clearTimeout(resetRef.current);
      }
    },
    []
  );

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const content = contentRef.current;
    if (!(button && content)) {
      return;
    }
    const measure = () => {
      const labels = content.querySelectorAll<HTMLElement>(
        `[data-label="${status}"]`
      );
      const label = labels.item(labels.length - 1);
      if (!label) {
        return;
      }
      const style = getComputedStyle(button);
      const chrome =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight) +
        Number.parseFloat(style.borderLeftWidth) +
        Number.parseFloat(style.borderRightWidth);
      setWidth(Math.ceil(label.scrollWidth + chrome));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [status]);

  useEffect(() => {
    const previous = previousStatusRef.current;
    previousStatusRef.current = status;
    if (previous === status) {
      return;
    }
    const button = buttonRef.current;
    if (status === "success" && particles && !shouldReduceMotion && button) {
      const originX = pressXRef.current ?? button.offsetWidth / 2;
      setBurst({
        id: Date.now(),
        originX,
      });
    }
    if (status === "error" && !shouldReduceMotion) {
      shake.start(SHAKE, { duration: 0.35, ease: "easeOut" });
    }
  }, [status, particles, shouldReduceMotion, shake]);

  const settle = (next: "success" | "error") => {
    setInternalStatus(next);
    resetRef.current = setTimeout(
      () => {
        setInternalStatus("idle");
        resetRef.current = null;
      },
      next === "success" ? successDuration : errorDuration
    );
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (status === "pending" || disabled) {
      event.preventDefault();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    pressXRef.current =
      event.clientX === 0 && event.clientY === 0
        ? null
        : event.clientX - rect.left;

    if (resetRef.current) {
      clearTimeout(resetRef.current);
      resetRef.current = null;
    }

    const result = onClick?.(event);
    if (event.defaultPrevented || controlledStatus !== undefined) {
      return;
    }

    if (!isPromiseLike(result)) {
      if (type !== "submit") {
        settle("success");
        onSuccess?.();
      }
      return;
    }

    runRef.current += 1;
    const run = runRef.current;
    setInternalStatus("pending");
    Promise.resolve(result).then(
      () => {
        if (run === runRef.current) {
          settle("success");
          onSuccess?.();
        }
      },
      (error: unknown) => {
        if (run === runRef.current) {
          settle("error");
          onError?.(error);
        }
      }
    );
  };

  const label = (() => {
    switch (status) {
      case "pending":
        return (
          <>
            <Spinner />
            <span className="font-mono text-xs">{pendingLabel}</span>
          </>
        );
      case "success":
        return (
          <>
            <Check />
            <span className="font-mono text-xs uppercase tracking-wider">{successLabel}</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-wider">{errorLabel}</span>
          </>
        );
      default:
        return (
          <>
            {children}
            {icon}
          </>
        );
    }
  })();

  // Strict Monochrome Button Variants
  const variantStyles = {
    primary:
      "bg-white text-black hover:bg-zinc-200 border border-white shadow-[0_2px_10px_rgba(255,255,255,0.12)] font-bold uppercase tracking-wider",
    charcoal:
      "bg-[#34363d] text-white hover:bg-[#42454e] border border-[#484b55] font-semibold uppercase tracking-wider",
    outline:
      "bg-transparent text-white border border-[#2a2a2a] hover:bg-[#202020] hover:border-[#383838] font-semibold tracking-wider",
    ghost:
      "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent font-medium",
  }[variant];

  const sizeStyles = {
    sm: "h-8 px-3 text-[11px] gap-1.5 rounded",
    md: "h-9 px-4 text-xs gap-2 rounded-md",
    lg: "h-11 px-6 text-xs sm:text-sm gap-2.5 rounded-md",
  }[size];

  return (
    <MotionConfig reducedMotion="user">
      <span aria-live="polite" className="sr-only">
        {status === "pending" && pendingLabel}
        {status === "success" && successLabel}
        {status === "error" && errorLabel}
      </span>
      <motion.button
        animate={width === undefined ? undefined : { width }}
        aria-busy={status === "pending" || undefined}
        aria-disabled={status === "pending" || disabled || undefined}
        className={cn(
          "relative inline-flex items-center justify-center select-none cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          sizeStyles,
          variantStyles,
          status === "error" &&
            "bg-[#1c1c1e] text-zinc-200 border border-zinc-500 hover:bg-[#262628]",
          status === "success" &&
            "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.25)]",
          className
        )}
        data-status={status}
        disabled={disabled || status === "pending"}
        onClick={handleClick}
        ref={buttonRef}
        transition={shouldReduceMotion ? { duration: 0 } : WIDTH_TRANSITION}
        type={type}
        {...props}
      >
        {burst && (
          <Burst
            key={burst.id}
            onDone={() => setBurst(null)}
            originX={burst.originX}
          />
        )}
        <motion.span
          animate={shake}
          className="relative -my-2 flex items-center justify-center self-stretch overflow-hidden py-2"
          ref={contentRef}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap"
              data-label={status}
              exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
              initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
              key={status}
              transition={LABEL_TRANSITION}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </motion.button>
    </MotionConfig>
  );
}

export default ParticleButton;
