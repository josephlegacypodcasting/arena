"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QUESTIONS, type Answers, type Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

/** Values that clear every other choice in a multi-select. */
const EXCLUSIVE = new Set(["none", "nothing"]);

function Choice({
  role,
  checked,
  label,
  hint,
  onSelect,
}: {
  role: "radio" | "checkbox";
  checked: boolean;
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "group relative flex h-full min-h-11 w-full items-start gap-3 rounded-[var(--radius)] px-3.5 py-3 text-left ring-1 ring-inset transition-colors duration-150",
        checked
          ? "bg-[var(--accent-soft)] ring-[var(--accent)]"
          : "bg-white ring-[var(--rule-strong)] hover:bg-[var(--wash)] hover:ring-[var(--line-strong)]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center ring-1 ring-inset transition-colors duration-150",
          role === "radio" ? "rounded-full" : "rounded-[3px]",
          checked
            ? "bg-[var(--accent)] text-white ring-[var(--accent)]"
            : "bg-white ring-[var(--line-strong)]"
        )}
      >
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-base leading-snug",
            checked ? "font-semibold text-[var(--accent-deep)]" : "font-normal text-[var(--ink)]"
          )}
        >
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-sm leading-snug text-[var(--ink-faint)]">{hint}</span>
        )}
      </span>
    </button>
  );
}

function QuestionBody({
  question,
  value,
  onChoose,
  onToggle,
  onSetText,
  onSubmitText,
  reduced,
}: {
  question: Question;
  value: string | string[] | undefined;
  onChoose: (value: string) => void;
  onToggle: (value: string) => void;
  onSetText: (value: string) => void;
  onSubmitText: () => void;
  reduced: boolean;
}) {
  if (question.type === "text") {
    return (
      <Input
        autoFocus
        value={typeof value === "string" ? value : ""}
        placeholder={question.placeholder}
        aria-label={question.prompt}
        maxLength={300}
        className="h-13 text-[1.0625rem]"
        onChange={(e) => onSetText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmitText();
          }
        }}
      />
    );
  }

  const options = question.options ?? [];
  const single = question.type === "single";
  const selected = single
    ? typeof value === "string"
      ? [value]
      : []
    : Array.isArray(value)
      ? value
      : [];
  const twoUp = options.length > 5 && options.every((o) => !o.hint);

  return (
    <div
      role={single ? "radiogroup" : "group"}
      aria-label={question.prompt}
      className={cn("grid gap-1.5", twoUp && "sm:grid-cols-2")}
    >
      {options.map((option, i) => (
        <motion.div
          key={option.value}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.28,
            delay: reduced ? 0 : 0.045 * Math.min(i, 8),
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Choice
            role={single ? "radio" : "checkbox"}
            checked={selected.includes(option.value)}
            label={option.label}
            hint={option.hint}
            onSelect={() => (single ? onChoose(option.value) : onToggle(option.value))}
          />
        </motion.div>
      ))}
    </div>
  );
}

export function Quiz({
  answers,
  onChange,
  onComplete,
  onBack,
  onIndexChange,
  startIndex = 0,
}: {
  answers: Answers;
  onChange: (answers: Answers) => void;
  onComplete: () => void;
  onBack?: () => void;
  onIndexChange?: (index: number) => void;
  startIndex?: number;
}) {
  const [index, setIndex] = React.useState(() =>
    Math.min(Math.max(0, startIndex), QUESTIONS.length - 1)
  );
  const [direction, setDirection] = React.useState(1);
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = !!useReducedMotion();

  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;

  React.useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  React.useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  const focusHeading = React.useCallback((el: HTMLHeadingElement | null) => {
    el?.focus({ preventScroll: true });
  }, []);

  const value = answers[question.id];
  const answered =
    question.type === "multi"
      ? Array.isArray(value) && value.length > 0
      : typeof value === "string" && value.trim().length > 0;
  const canContinue = answered || question.optional === true;

  function set(next: string | string[]) {
    onChange({ ...answers, [question.id]: next });
  }

  const goNext = React.useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDirection(1);
    if (isLast) onComplete();
    else setIndex((i) => i + 1);
  }, [isLast, onComplete]);

  const goBack = React.useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDirection(-1);
    if (index === 0) onBack?.();
    else setIndex((i) => i - 1);
  }, [index, onBack]);

  function choose(next: string) {
    set(next);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(goNext, reduced ? 0 : 260);
  }

  function toggle(next: string) {
    const current = Array.isArray(value) ? value : [];
    const has = current.includes(next);
    if (EXCLUSIVE.has(next)) {
      set(has ? [] : [next]);
      return;
    }
    const withoutExclusive = current.filter((v) => !EXCLUSIVE.has(v));
    set(has ? withoutExclusive.filter((v) => v !== next) : [...withoutExclusive, next]);
  }

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (event.target instanceof HTMLElement) event.target.blur();
        goBack();
        return;
      }
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "Enter" && canContinue) {
        event.preventDefault();
        goNext();
        return;
      }
      const digit = Number(event.key);
      const options = question.options;
      if (!options || !Number.isInteger(digit) || digit < 1 || digit > options.length) return;
      event.preventDefault();
      const option = options[digit - 1];
      if (question.type === "single") choose(option.value);
      else toggle(option.value);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const slide = reduced ? 0 : 44;

  return (
    <div className="mx-auto w-full max-w-3xl scroll-mt-24">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -(direction * slide) }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              ref={focusHeading}
              tabIndex={-1}
              className="arena-question text-[1.5rem] outline-none focus:outline-none focus-visible:outline-none sm:text-[2rem]"
            >
              {question.prompt}
            </h2>
            {question.help && (
              <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-pretty text-[var(--ink-soft)]">
                {question.help}
              </p>
            )}
            <div className="mt-7 sm:mt-8">
              <QuestionBody
                question={question}
                value={value}
                onChoose={choose}
                onToggle={toggle}
                onSetText={set}
                onSubmitText={goNext}
                reduced={reduced}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-9 flex items-center justify-between gap-4 border-t border-[var(--rule)] pt-4">
        <Button variant="ghost" size="sm" onClick={goBack} disabled={index === 0 && !onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {question.optional && !answered && (
            <span className="hidden text-sm text-[var(--ink-faint)] sm:inline">
              You can skip this
            </span>
          )}
          <Button onClick={goNext} disabled={!canContinue}>
            {isLast ? "See my result" : question.optional && !answered ? "Skip" : "Next"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <p className="mt-4 hidden text-[0.75rem] tracking-[0.01em] text-[var(--ink-faint)] lg:block">
        Keyboard:{" "}
        {question.options
          ? `press 1 to ${Math.min(9, question.options.length)} to choose, Enter to continue, Escape to go back.`
          : "Enter to continue, Escape to go back."}
      </p>
    </div>
  );
}
