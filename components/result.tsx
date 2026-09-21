"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { BookingEmbed } from "@/components/booking-embed";
import { BRAND, CTA_MINUTES } from "@/lib/config";
import { QUESTION_COUNT_WORD } from "@/lib/questions";
import type { Assessment, Lead } from "@/lib/schema";
import { clampStep, getStep } from "@/lib/steps";
import { cn } from "@/lib/utils";

function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

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
        "arena-rule mt-12 grid gap-x-10 gap-y-5 pt-8 lg:grid-cols-[150px_minmax(0,1fr)] sm:mt-14",
        className
      )}
    >
      <p className="arena-eyebrow lg:pt-1.5">{label}</p>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Result({
  assessment,
  lead,
  source,
  movedFrom,
}: {
  assessment: Assessment;
  lead?: Lead | null;
  source: "claude" | "mock";
  movedFrom?: number;
}) {
  const reduced = useReducedMotion();
  const firstName = lead?.firstName;
  const position = clampStep(assessment.step);
  const step = getStep(position);
  const nextStep = position < 5 ? getStep(clampStep(position + 1)) : null;

  return (
    <div className="w-full">
      <Reveal delay={0.05} className="mt-9 sm:mt-11">
        <p className="arena-eyebrow">
          {firstName ? `${firstName}, here is your roadmap` : "Your roadmap"}
        </p>
        <h1 className="arena-display mt-4 max-w-[20ch] text-[1.875rem] sm:text-[2.75rem]">
          {assessment.headline}
        </h1>
        <p className="arena-lede mt-5 max-w-[58ch]">{assessment.whereYouAre}</p>

        {(movedFrom || assessment.confidence === "borderline") && (
          <div className="mt-5 grid max-w-[58ch] gap-2 border-l-2 border-[var(--rule-strong)] pl-4">
            {movedFrom && (
              <p className="text-[0.9375rem] leading-relaxed text-[var(--ink-faint)]">
                The running read had you at step {movedFrom} while you were answering. Reading all{" "}
                {QUESTION_COUNT_WORD} answers together settled it on step {position}, which is the
                one that counts.
              </p>
            )}
            {assessment.confidence === "borderline" && (
              <p className="text-[0.9375rem] leading-relaxed text-[var(--ink-faint)]">
                Your answers sit between two steps, so treat this as the honest lower of the two. It
                usually means one thing is holding back a business that is otherwise ready.
              </p>
            )}
          </div>
        )}
      </Reveal>

      <Reveal delay={0.12} className="mt-10">
        <motion.section
          initial={reduced ? false : { opacity: 0, scaleY: 0.96 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 26, delay: reduced ? 0 : 0.18 }}
          style={{ transformOrigin: "top" }}
          className="rounded-[var(--radius-lg)] bg-[var(--wash)] p-6 ring-1 ring-[var(--rule)] ring-inset sm:p-8"
          aria-label={`What step ${position} looks like`}
        >
          <h2 className="arena-heading text-[1.1875rem] sm:text-[1.4375rem]">
            What step {position}, {step.name.toLowerCase()}, looks like
          </h2>
          <p className="mt-2.5 max-w-[60ch] text-base leading-relaxed text-pretty text-[var(--ink-soft)]">
            {step.summary}
          </p>
          <ul className="mt-6 grid gap-x-8 sm:grid-cols-3">
            {step.looksLike.map((item, i) => (
              <motion.li
                key={item}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.34,
                  delay: reduced ? 0 : 0.3 + 0.06 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "border-t border-[var(--rule-strong)] pt-3 text-[0.9375rem] leading-snug text-pretty text-[var(--ink-soft)]",
                  i > 0 && "mt-4 sm:mt-0"
                )}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </Reveal>

      <Section label="The honest read">
        <div className="grid gap-x-9 gap-y-8 md:grid-cols-2">
          <div className="min-w-0">
            <h2 className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--good)] uppercase">
              Working in your favor
            </h2>
            <ul className="mt-3.5 grid">
              {assessment.strengths.map((item, i) => (
                <li
                  key={i}
                  className={cn(
                    "py-3 text-[0.9375rem] leading-relaxed text-pretty text-[var(--ink-soft)]",
                    i > 0 && "border-t border-[var(--rule)]",
                    i === 0 && "pt-0"
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 md:border-l md:border-[var(--rule)] md:pl-9">
            <h2 className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--warn)] uppercase">
              What is missing
            </h2>
            <ul className="mt-3.5 grid">
              {assessment.gaps.map((item, i) => (
                <li
                  key={i}
                  className={cn(
                    "py-3 text-[0.9375rem] leading-relaxed text-pretty text-[var(--ink-soft)]",
                    i > 0 && "border-t border-[var(--rule)]",
                    i === 0 && "pt-0"
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section label="Do next">
        <Reveal delay={0.26}>
          <h2 className="arena-h2 max-w-[26ch]">
            {nextStep
              ? `What gets you to step ${nextStep.number}, ${nextStep.name.toLowerCase()}`
              : "What keeps you there"}
          </h2>
          <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-pretty text-[var(--ink-soft)]">
            {step.toMoveUp}
          </p>
        </Reveal>
        <ol className="mt-7 grid">
          {assessment.nextActions.map((action, i) => (
            <Reveal key={i} delay={0.32 + 0.06 * i}>
              <li
                className={cn(
                  "grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 py-5 sm:grid-cols-[2.25rem_minmax(0,1fr)]",
                  i > 0 && "border-t border-[var(--rule)]",
                  i === 0 && "pt-0"
                )}
              >
                <span
                  aria-hidden
                  className="text-[1.125rem] leading-snug font-semibold tabular-nums text-[var(--ink-faint)] sm:text-[1.375rem]"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                    <h3 className="text-[1.0625rem] leading-snug font-semibold tracking-[-0.02em] text-[var(--ink)]">
                      {action.title}
                    </h3>
                    <span className="shrink-0 text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--ink-faint)] uppercase">
                      {action.effort}
                    </span>
                  </div>
                  <p className="mt-2 max-w-[58ch] text-[0.9375rem] leading-relaxed text-pretty text-[var(--ink-soft)]">
                    {action.detail}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section label="Not using yet">
        <Reveal delay={0.5}>
          <h2 className="arena-h2 max-w-[26ch]">
            Where it would pay off that you are not using today
          </h2>
        </Reveal>
        <div
          className={cn(
            "mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2",
            assessment.opportunities.length === 3 && "lg:grid-cols-3"
          )}
        >
          {assessment.opportunities.map((opportunity, i) => (
            <Reveal key={i} delay={0.56 + 0.06 * i}>
              <div className="min-w-0 border-t border-[var(--rule-strong)] pt-4">
                <h3 className="text-[1.0625rem] leading-snug font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  {opportunity.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-pretty text-[var(--ink-soft)]">
                  {opportunity.why}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Reveal delay={0.66}>
        <section className="arena-band no-print mt-12 rounded-[var(--radius-lg)] p-7 sm:mt-14 sm:p-10">
          <h2 className="max-w-[22ch] text-[1.5rem] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[2rem]">
            Want a straight answer on where to start?
          </h2>
          <p className="mt-4 max-w-[58ch] text-[0.9375rem] leading-relaxed text-pretty text-[var(--ink-onblue-soft)] sm:text-base">
            {assessment.closingNote}
          </p>
          <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-relaxed text-pretty text-[var(--ink-onblue-soft)] sm:text-base">
            {CTA_MINUTES} minutes with {BRAND}, on your operation rather than on AI in general. Bring
            the one job you most want to run better and they will tell you honestly whether this is
            worth your time yet, and what it would take. There is nothing to buy on the call.
          </p>
          <div className="mt-7 overflow-hidden rounded-[var(--radius)] bg-white p-2 sm:p-3">
            <BookingEmbed lead={lead} />
          </div>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-[var(--ink-onblue-soft)]">
            Pick a time above. Your roadmap stays on this page.
          </p>
        </section>
      </Reveal>

      <footer className="mt-10 border-t border-[var(--rule)] pt-5 text-[0.8125rem] leading-relaxed text-[var(--ink-faint)]">
        <p className="max-w-[70ch]">
          Your result is based on the {QUESTION_COUNT_WORD} answers you gave, read against the five
          steps of the {BRAND} readiness roadmap.
        </p>
        {source === "mock" && (
          <p className="mt-2 max-w-[70ch]">
            This preview scored your answers with the roadmap&apos;s own rules rather than with
            Arena&apos;s AI reviewer.
          </p>
        )}
      </footer>
    </div>
  );
}
