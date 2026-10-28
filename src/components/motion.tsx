"use client";

import { animate, motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/format";

// All animations use transform and opacity only, so they run on the GPU and never
// trigger layout. MotionConfig (in AppProviders) turns them off for visitors who
// prefer reduced motion.

const ease = [0.22, 1, 0.36, 1] as const; // smooth "ease-out-quint"

/** Every page fades in and rises slightly on navigation (used by app/template.tsx). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
      {children}
    </motion.div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

/**
 * A grid or list whose children cascade in when it scrolls into view.
 * The "show" state is set with `animate` (not `whileInView`) so items that mount
 * later — after a language switch or a refresh with new data — animate in too
 * instead of staying hidden.
 */
export function Stagger({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Comp = (as === "ul" ? motion.ul : as === "ol" ? motion.ol : motion.div) as typeof motion.div;
  return (
    <Comp
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" }) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp className={className} variants={item}>
      {children}
    </Comp>
  );
}

/** Fades and lifts a single block into view. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Counts from 0 up to `value` once visible (e.g. the overall score). The server
 * renders the final number, so it is correct without JavaScript; the count-up
 * writes straight to the DOM node instead of re-rendering React on every frame.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!inView || reduce || !el) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease,
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce]);
  return (
    <span ref={ref} className={cn("tabular", className)}>
      {value}
    </span>
  );
}

/** A progress bar that grows from the left when it scrolls into view. */
export function GrowBar({
  percent,
  className,
  trackClassName,
  size = "md",
}: {
  percent: number;
  className?: string;
  trackClassName?: string;
  size?: "sm" | "md";
}) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn(size === "sm" ? "h-1.5" : "h-2", "overflow-hidden rounded-full bg-mist", trackClassName)} aria-hidden>
      <motion.div
        className={cn("h-full origin-left rounded-full", className)}
        style={{ width: `${p}%` }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease, delay: 0.1 }}
      />
    </div>
  );
}
