"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  className?: string;
}

export function PlaceholdersAndVanishInput({
  placeholders,
  value: controlledValue,
  onChange,
  onSubmit,
  disabled = false,
  className,
}: PlaceholdersAndVanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [internalValue, setInternalValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newDataRef = useRef<
    Array<{ x: number; y: number; r: number; color: string }>
  >([]);

  // Rotate placeholders every 3.5 seconds
  useEffect(() => {
    if (placeholders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Canvas text particle rasterization
  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 100;
    ctx.clearRect(0, 0, 800, 100);

    const computedStyles = getComputedStyle(inputRef.current);
    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size")) || 14;
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(value, 20, 60);

    const imageData = ctx.getImageData(0, 0, 800, 100);
    const pixelData = imageData.data;
    const newData: Array<{ x: number; y: number; r: number; color: string }> = [];

    // Step by 4 pixels to maintain 60fps performance on mobile
    for (let t = 0; t < 100; t += 3) {
      const i = 4 * t * 800;
      for (let n = 0; n < 800; n += 3) {
        const e = i + 4 * n;
        if (
          pixelData[e] > 50 ||
          pixelData[e + 1] > 50 ||
          pixelData[e + 2] > 50
        ) {
          newData.push({
            x: n / 2,
            y: t / 2,
            r: 1.2,
            color: "rgba(255, 255, 255, 0.85)",
          });
        }
      }
    }

    newDataRef.current = newData;
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animateVanish = (startPos: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pos = startPos;
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const remaining: typeof newDataRef.current = [];

      for (let i = 0; i < newDataRef.current.length; i++) {
        const p = newDataRef.current[i];
        if (p.x < pos) {
          remaining.push(p);
        } else {
          p.x += (Math.random() - 0.5) * 2;
          p.y += (Math.random() - 0.5) * 2;
          p.r -= 0.05 * Math.random();
          if (p.r > 0) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x * 2, p.y * 2, p.r * 2, 0, Math.PI * 2);
            ctx.fill();
            remaining.push(p);
          }
        }
      }

      newDataRef.current = remaining;
      pos += 8;

      if (newDataRef.current.length > 0 && pos < 500) {
        requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAnimating(false);
      }
    };

    requestAnimationFrame(step);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.SyntheticEvent) => {
    e.preventDefault();
    if (!value.trim() || animating || disabled) return;

    setAnimating(true);
    animateVanish(0);
    onSubmit(e as any);
    if (controlledValue === undefined) {
      setInternalValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!animating) {
      if (controlledValue === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    }
  };

  return (
    <div
      className={cn(
        "w-full relative max-w-2xl mx-auto bg-[#161616] h-12 rounded-xl overflow-hidden border border-[#2a2a2a] transition duration-200",
        value && "bg-[#181818]",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute pointer-events-none text-base transform scale-50 top-[10%] left-2 origin-top-left filter invert dark:invert-0 pr-20",
          !animating ? "opacity-0" : "opacity-100"
        )}
      />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        disabled={disabled || animating}
        className={cn(
          "w-full relative text-xs sm:text-sm z-10 border-none bg-transparent text-white h-full rounded-xl focus:outline-none focus:ring-0 pl-4 pr-12 font-sans placeholder-transparent",
          animating && "text-transparent"
        )}
      />

      {/* Submit Action Button */}
      <button
        disabled={!value.trim() || animating || disabled}
        type="button"
        onClick={handleSubmit}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-lg bg-white disabled:bg-[#282828] text-black disabled:text-zinc-500 transition duration-200 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-sm"
        aria-label="Send prompt to Prody"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Rotating Sliding Placeholders */}
      <div className="absolute inset-0 flex items-center rounded-xl pointer-events-none pl-4 pr-12">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              key={currentPlaceholder}
              className="text-xs sm:text-sm font-normal text-zinc-500 truncate"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default PlaceholdersAndVanishInput;
