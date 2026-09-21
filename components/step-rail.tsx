"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { STEPS, getStep } from "@/lib/steps";
import type { Signal } from "@/lib/scoring";

const SPRING = { type: "spring", stiffness: 260, damping: 28 } as const;

type RailSize = "xs" | "sm" | "md";

const SIZES: Record<RailSize, { bar: string; gap: string; num: string; label: string; show: string }> = {
  xs: {
    bar: "h-1.5",
    gap: "gap-1",
    num: "text-[0.625rem]",
    label: "text-[0.625rem]",
    show: "hidden",
  },
  sm: {
    bar: "h-2",
    gap: "gap-1.5",
    num: "text-[0.6875rem]",
    label: "text-[0.6875rem] sm:text-xs",
    show: "hidden sm:block",
  },
  md: {
    bar: "h-2.5",
    gap: "gap-2",
    num: "text-xs",
    label: "text-[0.6875rem] sm:text-[0.8125rem]",
    show: "block",
  },
};

export function StepRail({
  position,
  state = "idle",
  size = "md",
  showLabels = true,
  className,
}: {
  position?: number;
  state?: "idle" | "reading" | "settled";
  size?: RailSize;
  showLabels?: boolean;
  className?: string;
}) {
  const placed = position !== undefined;
  const s = SIZES[size];

  return (
    <div className={cn("relative", className)}>
      <ol className={cn("grid grid-cols-5", s.gap)}>
        {STEPS.map((step) => {
          const passed = placed && step.number < position;
          const current = placed && step.number === position;
          return (
            <li key={step.number} aria-current={current ? "step" : undefined} className="min-w-0">
              <motion.div
                className={cn(
                  "w-full rounded-full",
                  s.bar,
                  current
                    ? "bg-[var(--accent)]"
                    : passed
                      ? "bg-[var(--accent-light)]"
                      : placed
                        ? "bg-[var(--rule)]"
                        : "bg-[var(--accent-tint)]",
                  current && state === "reading" && "arena-halo"
                )}
                initial={false}
                animate={{ opacity: 1 }}
                transition={SPRING}
              />
              <span className="sr-only">
                Step {step.number}, {step.name}
                {current ? ", you are here" : ""}
              </span>
            </li>
          );
        })}
      </ol>

      <div className={cn("grid grid-cols-5", s.gap)}>
        {STEPS.map((step) => {
          const passed = placed && step.number < position;
          const current = placed && step.number === position;
          return (
            <div key={step.number} className="min-w-0 pt-2">
              <span
                aria-hidden
                className={cn(
                  "block font-semibold tabular-nums",
                  s.num,
                  current
                    ? "text-[var(--accent-deep)]"
                    : passed
                      ? "text-[var(--ink-soft)]"
                      : "text-[var(--ink-faint)]"
                )}
              >
                {step.number}
              </span>
              {showLabels && (
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 leading-tight",
                    s.show,
                    s.label,
                    current ? "font-semibold text-[var(--ink)]" : "font-medium text-[var(--ink-faint)]"
                  )}
                >
                  {step.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TONE_DOT: Record<Signal["tone"], string> = {
  good: "bg-[var(--good)]",
  watch: "bg-[var(--warn)]",
  plain: "bg-[var(--accent)]",
};

export function SignalRail({
  signals,
  wrap = false,
  className,
}: {
  signals: Signal[];
  wrap?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const rail = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (!wrap && rail.current) {
      rail.current.scrollTo({ left: rail.current.scrollWidth, behavior: reduced ? "auto" : "smooth" });
    }
  }, [signals.length, wrap, reduced]);

  return (
    <ul
      ref={rail}
      className={cn(
        "flex gap-2",
        wrap ? "flex-wrap" : "arena-rail flex-nowrap overflow-x-auto overflow-y-hidden pb-0.5",
        className
      )}
    >
      <AnimatePresence initial={false}>
        {signals.map((signal) => (
          <motion.li
            key={signal.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius)] bg-white py-1.5 pr-3 pl-2.5 text-[0.75rem] leading-tight font-medium whitespace-nowrap text-[var(--ink-soft)] ring-1 ring-[var(--rule-strong)] ring-inset sm:text-[0.8125rem]",
              wrap && "whitespace-normal"
            )}
          >
            <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[signal.tone])} />
            {signal.label}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export type ReadingState = "reading" | "working" | "settled";

export function ReadingPanel({
  position,
  state,
  signals,
  progress,
  dense = false,
  className,
}: {
  position: number;
  state: ReadingState;
  signals: Signal[];
  progress?: { answered: number; total: number };
  dense?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const step = getStep(position);
  const settled = state === "settled";

  return (
    <div className={className}>
      <div
        className={cn(
          "relative rounded-[var(--radius-lg)] bg-white ring-1 ring-[var(--rule)] ring-inset",
          dense ? "px-4 pt-3 pb-4 sm:px-5 sm:pt-3.5 sm:pb-4.5" : "px-5 py-5 sm:px-7 sm:py-6"
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="arena-eyebrow truncate">
            {settled
              ? "Your place on the roadmap"
              : state === "working"
                ? "Working out your result"
                : "Reading so far"}
          </p>
          {progress && (
            <p className="shrink-0 text-[0.75rem] font-medium tracking-[0.01em] text-[var(--ink-faint)] tabular-nums">
              Question {progress.answered} of {progress.total}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex flex-wrap items-baseline gap-x-3 gap-y-0.5",
            dense ? "mt-1 sm:hidden" : "mt-2"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.h2
              key={position}
              className={cn("arena-heading", dense ? "text-[1.0625rem]" : "text-[1.375rem] sm:text-[1.75rem]")}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {step.name}
            </motion.h2>
          </AnimatePresence>
          <p className="text-[0.8125rem] font-medium text-[var(--ink-faint)] tabular-nums">
            Step {position} of 5
          </p>
        </div>

        <StepRail
          position={position}
          state={settled ? "settled" : "reading"}
          size={dense ? "sm" : "md"}
          className={dense ? "mt-3" : "mt-5"}
        />

        {signals.length > 0 && (
          <SignalRail signals={signals} wrap={!dense} className={dense ? "mt-3.5" : "mt-5"} />
        )}

        {!settled && (
          <p className="mt-3 text-[0.8125rem] leading-snug text-[var(--ink-faint)]">
            {state === "working"
              ? "Reading all your answers together now. This is where the running read becomes your result."
              : "A running read that moves as you answer. The full result comes at the end."}
          </p>
        )}

        {progress && (
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden rounded-b-[var(--radius-lg)] bg-[var(--wash-deep)]"
          >
            <motion.span
              className="block h-full origin-left bg-[var(--accent)]"
              initial={false}
              animate={{ scaleX: progress.answered / progress.total }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
            />
          </span>
        )}
      </div>
    </div>
  );
}

/** Slides in from the top once the main reading panel scrolls out of view. */
export function StickyRead({
  position,
  state,
  progress,
  watch,
}: {
  position: number;
  state: ReadingState;
  progress?: { answered: number; total: number };
  watch: React.RefObject<HTMLDivElement | null>;
}) {
  const [stuck, setStuck] = React.useState(false);
  const step = getStep(position);

  React.useEffect(() => {
    const el = watch.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: "0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [watch]);

  return (
    <AnimatePresence>
      {stuck && (
        <motion.div
          className="fixed inset-x-0 top-0 z-40 border-b border-[var(--rule)] bg-[rgba(251,252,253,0.92)] backdrop-blur-md"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-2.5 sm:gap-6 sm:px-6">
            <StepRail
              position={position}
              state={state === "settled" ? "settled" : "reading"}
              size="xs"
              showLabels={false}
              className="min-w-0 flex-1 sm:max-w-[240px]"
            />
            <p className="min-w-0 shrink truncate text-[0.9375rem] font-semibold text-[var(--ink)]">
              {step.name}
              <span className="hidden font-medium text-[var(--ink-faint)] sm:inline">
                {" "}
                · step {position} of 5
              </span>
            </p>
            {progress && (
              <p className="ml-auto shrink-0 text-[0.8125rem] font-medium text-[var(--ink-faint)] tabular-nums">
                {progress.answered}/{progress.total}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
