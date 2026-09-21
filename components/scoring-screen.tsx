"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const BEATS = [
  "Reading your answers",
  "Checking them against the five steps",
  "Working out what would move you up",
];

export function ScoringScreen() {
  const reduced = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 text-center sm:py-14" aria-live="polite">
      <div className="mx-auto flex h-4 items-center justify-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]"
            animate={reduced ? { opacity: 1 } : { opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: 0.13 * i, ease: "easeInOut" }}
          />
        ))}
      </div>

      <h2 className="arena-heading mt-6 text-[1.375rem] sm:text-[1.5625rem]">
        Settling your place on the roadmap
      </h2>

      <ul className="mx-auto mt-4 grid max-w-sm gap-2 text-left">
        <AnimatePresence initial={false}>
          {BEATS.map((beat, i) => (
            <motion.li
              key={beat}
              className="text-base text-[var(--ink-soft)]"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + 0.28 * i, duration: 0.3 }}
            >
              {beat}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
