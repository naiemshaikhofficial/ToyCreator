import React from "react"
import { cn } from "@/lib/utils"

export type Variant = "default" | "pink" | "light" | "secondary"
export type Size =
  | "default"
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xll"
  | "xxl"
  | "xxxl"
export type Weight = "default" | "thin" | "base" | "semi" | "bold" | "black"

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean
  variant?: Variant
  size?: Size
  weight?: Weight
  children: React.ReactNode
  className?: string
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default:
    "bg-gradient-to-t from-neutral-400 via-neutral-100 to-white dark:from-neutral-400 dark:via-neutral-100 dark:to-white",
  pink: "from-accent to-accent/90 bg-gradient-to-t dark:from-stone-200 dark:to-neutral-200",
  light: "bg-gradient-to-t from-neutral-200 to-neutral-300",
  secondary:
    "bg-gradient-to-t from-neutral-500 via-neutral-400 to-neutral-300 dark:from-zinc-500 dark:via-zinc-400 dark:to-zinc-200",
}

const SIZE_CLASSES: Record<Size, string> = {
  default: "text-2xl sm:text-3xl lg:text-4xl",
  xxs: "text-base sm:text-lg lg:text-lg",
  xs: "text-lg sm:text-xl lg:text-2xl",
  sm: "text-xl sm:text-2xl lg:text-3xl",
  md: "text-2xl sm:text-3xl lg:text-4xl",
  lg: "text-3xl sm:text-4xl lg:text-5xl",
  xl: "text-4xl sm:text-5xl lg:text-6xl",
  xll: "text-4xl sm:text-6xl lg:text-[5.4rem] lg:leading-[0.5rem]",
  xxl: "text-4xl sm:text-6xl lg:text-7xl",
  xxxl: "text-5xl sm:text-6xl lg:text-[8rem]",
}

const WEIGHT_CLASSES: Record<Weight, string> = {
  default: "font-black tracking-tight",
  thin: "font-thin",
  base: "font-normal",
  semi: "font-semibold",
  bold: "font-bold",
  black: "font-black",
}

export function headingVariants({
  variant = "default",
  size = "default",
  weight = "default",
}: {
  variant?: Variant
  size?: Size
  weight?: Weight
} = {}) {
  return cn(
    "bg-clip-text pb-2 tracking-tight text-transparent inline-block",
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.default,
    SIZE_CLASSES[size] || SIZE_CLASSES.default,
    WEIGHT_CLASSES[weight] || WEIGHT_CLASSES.default,
  )
}

const GradientHeading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ asChild, variant = "default", weight = "default", size = "default", className, children, ...props }, ref) => {
    return (
      <h3 ref={ref} {...props} className={cn("text-center", className)}>
        <span className={headingVariants({ variant, size, weight })}>
          {children}
        </span>
      </h3>
    )
  }
)

GradientHeading.displayName = "GradientHeading"

export { GradientHeading }
