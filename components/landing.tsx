"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LeadGate } from "@/components/lead-gate";
import { StepRail } from "@/components/step-rail";
import { FIND_OUT, GATE_COPY, PROMISES, START_ANCHOR, YOU_GET } from "@/lib/copy";
import { QUESTIONS, QUESTION_COUNT_WORD } from "@/lib/questions";
import type { GateMode } from "@/lib/config";
import type { Lead } from "@/lib/schema";
import type { SavedPhase } from "@/lib/storage";
import { STEPS } from "@/lib/steps";
import { cn } from "@/lib/utils";

function Section({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "arena-rule mt-14 grid gap-x-10 gap-y-5 pt-8 lg:grid-cols-[190px_minmax(0,1fr)] sm:mt-16 sm:pt-10",
        className
      )}
    >
      <p className="arena-eyebrow lg:pt-1.5">{label}</p>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ResumeStrip({
  resumable,
  resumeIndex,
  onResume,
}: {
  resumable: SavedPhase;
  resumeIndex: number;
  onResume: () => void;
}) {
  const done = resumable === "result";
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t border-[var(--rule)] pt-3">
      <p className="text-[0.875rem] leading-snug text-[var(--ink-faint)]">
        {done
          ? "You have already done this once."
          : `You were on question ${Math.min(resumeIndex + 1, QUESTIONS.length)} of ${QUESTIONS.length}.`}
      </p>
      <Button variant="secondary" size="sm" onClick={onResume}>
        <RotateCw className="h-3.5 w-3.5" aria-hidden />
        {done ? "See my result" : "Pick up where I left off"}
      </Button>
    </div>
  );
}

export function Landing({
  mode,
  submitting,
  onSubmit,
  onStart,
  resumable,
  resumeIndex,
  onResume,
}: {
  mode: GateMode;
  submitting: boolean;
  onSubmit: (lead: Lead) => void;
  onStart: () => void;
  resumable: SavedPhase | null;
  resumeIndex: number;
  onResume: () => void;
}) {
  const copy = GATE_COPY.unlock;
  const gateFirst = mode === "first";

  const startBlock = (
    <div id={START_ANCHOR} className="scroll-mt-8">
      {gateFirst ? (
        <LeadGate framing="unlock" submitting={submitting} onSubmit={onSubmit} showIntro={false} />
      ) : (
        <div className="rounded-[var(--radius-lg)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-[var(--rule)] ring-inset sm:p-6">
          <Button size="lg" onClick={onStart} className="w-full">
            Start the assessment
            <ArrowRight className="h-4.5 w-4.5" aria-hidden />
          </Button>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-faint)]">
            {QUESTIONS.length} questions, about two minutes. Your result appears on this page.
          </p>
        </div>
      )}
      {resumable && (
        <ResumeStrip resumable={resumable} resumeIndex={resumeIndex} onResume={onResume} />
      )}
    </div>
  );

  return (
    <motion.div
      className="mx-auto w-full max-w-5xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <section className="grid items-center gap-x-16 gap-y-12 lg:min-h-[76vh] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,440px)] xl:gap-x-24">
        <div className="min-w-0">
          <p className="arena-eyebrow">{copy.eyebrow}</p>
          <h1 className="arena-display mt-5 max-w-[17ch]">{copy.heading}</h1>
          <p className="arena-lede mt-6 max-w-[44ch]">{copy.body}</p>
          <ul className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2.5">
            {PROMISES.map((promise, i) => (
              <li
                key={promise}
                className="flex items-center gap-4 text-[0.9375rem] font-medium text-[var(--ink-soft)]"
              >
                {i > 0 && <span aria-hidden className="h-3.5 w-px bg-[var(--rule-strong)]" />}
                {promise}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full lg:justify-self-end">{startBlock}</div>
      </section>

      <Section label="What you will find out">
        <ul className="grid">
          {FIND_OUT.map((item, i) => (
            <li
              key={item}
              className={cn(
                "py-5 text-[1.25rem] leading-[1.3] font-medium tracking-[-0.02em] text-pretty text-[var(--ink)] sm:text-[1.5rem]",
                i > 0 && "border-t border-[var(--rule)]",
                i === 0 && "pt-0"
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section label="The five steps">
        <h2 className="arena-h2 max-w-[26ch]">
          Every business is on one of these. The point is knowing which.
        </h2>
        <p className="mt-4 max-w-[56ch] text-[1.0625rem] leading-relaxed text-pretty text-[var(--ink-soft)]">
          Your answers place you on one of them, and you watch the marker move as you go rather than
          waiting for a verdict at the end.
        </p>
        <StepRail className="mt-7" />
        <ol className="mt-8 grid">
          {STEPS.map((step, i) => (
            <li
              key={step.number}
              className={cn(
                "grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 py-3.5 sm:grid-cols-[1.75rem_minmax(0,1fr)]",
                i > 0 && "border-t border-[var(--rule)]",
                i === 0 && "pt-0"
              )}
            >
              <span
                aria-hidden
                className="text-[1.0625rem] leading-snug font-semibold tabular-nums text-[var(--ink-faint)]"
              >
                {step.number}
              </span>
              <div className="min-w-0">
                <h3 className="text-[1.125rem] leading-snug font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  {step.name}
                </h3>
                <p className="mt-1.5 max-w-[56ch] text-[1.0625rem] leading-relaxed text-pretty text-[var(--ink-soft)]">
                  {step.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="You get">
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-3">
          {YOU_GET.map((card) => (
            <div key={card.title} className="min-w-0 border-t border-[var(--rule-strong)] pt-4">
              <h3 className="text-[1.125rem] leading-snug font-semibold tracking-[-0.02em] text-[var(--ink)]">
                {card.title}
              </h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-pretty text-[var(--ink-soft)]">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <section className="arena-band no-print mt-14 rounded-[var(--radius-lg)] p-7 sm:mt-16 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="min-w-0">
            <h2 className="max-w-[18ch] text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[2.375rem]">
              {QUESTION_COUNT_WORD.charAt(0).toUpperCase() + QUESTION_COUNT_WORD.slice(1)} questions.
              About two minutes. No download.
            </h2>
            <p className="mt-4 max-w-[44ch] text-[1.0625rem] leading-relaxed text-pretty text-[var(--ink-onblue-soft)]">
              You will know where you stand and what to do next by the end of your coffee.
            </p>
          </div>
          <Button
            size="lg"
            variant="onBand"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => {
              const el = document.getElementById(START_ANCHOR);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
              el?.querySelector("input")?.focus({ preventScroll: true });
            }}
          >
            {gateFirst ? copy.action : "Start the assessment"}
            <ArrowRight className="h-4.5 w-4.5" aria-hidden />
          </Button>
        </div>
      </section>
    </motion.div>
  );
}
