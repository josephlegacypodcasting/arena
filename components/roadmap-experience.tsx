"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Landing } from "@/components/landing";
import { LeadGate } from "@/components/lead-gate";
import { Quiz } from "@/components/quiz";
import { ReadingPanel, StickyRead } from "@/components/step-rail";
import { Result } from "@/components/result";
import { ScoringScreen } from "@/components/scoring-screen";
import { GATE_MODE, type GateMode } from "@/lib/config";
import { QUESTIONS, type Answers } from "@/lib/questions";
import { readAnswers } from "@/lib/scoring";
import type { AssessResponse, Lead } from "@/lib/schema";
import { clampStep } from "@/lib/steps";
import { clearSavedState, loadSavedState, saveState, type SavedPhase } from "@/lib/storage";

type Phase = "start" | "quiz" | "gate" | "scoring" | "result" | "error";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch {
      /* keep the default */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ref",
  "lead_source",
  "source_channel",
] as const;

/**
 * Campaign tracking off the landing URL, plus where the visitor arrived from.
 * Values are capped so a junk query string cannot bloat the CRM record.
 */
function collectTracking(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of TRACKED_PARAMS) {
    const value = params.get(key);
    if (value) out[key] = value.slice(0, 200);
  }
  out.page_url = window.location.href.slice(0, 500);
  if (document.referrer) out.referrer = document.referrer.slice(0, 500);
  return out;
}

export function RoadmapExperience({ gateMode }: { gateMode?: GateMode }) {
  const mode = gateMode ?? GATE_MODE;

  const [phase, setPhase] = React.useState<Phase>("start");
  const [answers, setAnswers] = React.useState<Answers>({});
  const [quizIndex, setQuizIndex] = React.useState(0);
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [result, setResult] = React.useState<AssessResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [resumable, setResumable] = React.useState<SavedPhase | null>(null);

  const pushedHistory = React.useRef(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const read = React.useMemo(() => readAnswers(answers), [answers]);

  // Restore any saved progress before the first paint.
  React.useLayoutEffect(() => {
    const saved = loadSavedState();
    if (saved) {
      setAnswers(saved.answers);
      setQuizIndex(saved.quizIndex);
      setLead(saved.lead);
      setResult(saved.result);
      setResumable(saved.phase);
    }
    setHydrated(true);
  }, []);

  // Persist progress as it happens.
  React.useEffect(() => {
    if (!hydrated) return;
    const savedPhase: SavedPhase | null =
      phase === "result"
        ? "result"
        : phase === "gate"
          ? "gate"
          : phase === "quiz" || phase === "scoring" || phase === "error"
            ? "quiz"
            : null;
    const worthSaving = !!lead || !!result || Object.keys(answers).length > 0;
    if (savedPhase && worthSaving) {
      saveState({ phase: savedPhase, quizIndex, answers, lead, result });
    }
  }, [hydrated, phase, quizIndex, answers, lead, result]);

  const captureLead = React.useCallback(
    (nextLead: Lead, currentAnswers: Answers) => {
      setLead(nextLead);
      postJson("/api/lead", {
        lead: nextLead,
        answers: currentAnswers,
        gateMode: mode,
        event: "capture",
        tracking: collectTracking(),
      }).catch((e) => {
        console.error("[roadmap] lead capture failed", e);
      });
    },
    [mode]
  );

  /**
   * Second push once the roadmap exists. In "first" gate mode the capture above
   * fires before a single question is answered, so without this the CRM would
   * only ever hold a name and an email.
   */
  const completeLead = React.useCallback(
    (finalLead: Lead, currentAnswers: Answers, response: AssessResponse) => {
      postJson("/api/lead", {
        lead: finalLead,
        answers: currentAnswers,
        gateMode: mode,
        event: "complete",
        tracking: collectTracking(),
        assessment: response.assessment,
        assessmentSource: response.source,
      }).catch((e) => {
        console.error("[roadmap] lead completion failed", e);
      });
    },
    [mode]
  );

  const runAssessment = React.useCallback(
    async (currentAnswers: Answers, currentLead?: Lead | null) => {
      setPhase("scoring");
      setError(null);
      const startedAt = Date.now();
      try {
        const response = await postJson<AssessResponse>("/api/assess", {
          answers: currentAnswers,
          lead: currentLead ?? undefined,
        });
        // Let the scoring screen breathe even when the API is instant.
        const elapsed = Date.now() - startedAt;
        if (elapsed < 1100) await new Promise((r) => setTimeout(r, 1100 - elapsed));
        setResult(response);
        setPhase("result");
        if (currentLead) completeLead(currentLead, currentAnswers, response);
      } catch (e) {
        setError(e instanceof Error ? e.message : "We could not build your roadmap just now.");
        setPhase("error");
      }
    },
    [completeLead]
  );

  async function handleUnlock(nextLead: Lead) {
    setSubmitting(true);
    captureLead(nextLead, answers);
    setSubmitting(false);
    if (resumable) {
      clearSavedState();
      setAnswers({});
      setQuizIndex(0);
      setResult(null);
      setResumable(null);
    }
    setPhase("quiz");
  }

  function backToStart() {
    if (phase === "start") return;
    setResumable(result ? "result" : "quiz");
    setPhase("start");
  }

  async function handleVerify(nextLead: Lead) {
    setSubmitting(true);
    captureLead(nextLead, answers);
    setSubmitting(false);
    await runAssessment(answers, nextLead);
  }

  function startOver() {
    clearSavedState();
    setAnswers({});
    setQuizIndex(0);
    setResult(null);
    setError(null);
    setResumable(null);
    setPhase(mode === "first" ? "quiz" : "start");
  }

  // One history entry, so the browser Back button returns to the landing page
  // instead of leaving the site mid-assessment.
  React.useEffect(() => {
    if (phase === "start" || pushedHistory.current) return;
    pushedHistory.current = true;
    window.history.pushState({ magnet: "inside" }, "");
  }, [phase]);

  React.useEffect(() => {
    function onPopState() {
      pushedHistory.current = false;
      backToStart();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  });

  const position = result ? clampStep(result.assessment.step) : read.step;
  const inQuizFlow = phase === "quiz" || phase === "gate" || phase === "scoring";
  const progress = phase === "quiz" ? { answered: quizIndex + 1, total: QUESTIONS.length } : undefined;

  return (
    <MotionConfig reducedMotion="user">
      {phase === "start" && (
        <Landing
          mode={mode}
          submitting={submitting}
          onSubmit={handleUnlock}
          onStart={() => setPhase("quiz")}
          resumable={resumable}
          resumeIndex={quizIndex}
          onResume={() => {
            if (!resumable) return;
            pushedHistory.current = false;
            setPhase(resumable);
            setResumable(null);
          }}
        />
      )}

      {inQuizFlow && (
        <div className="mx-auto w-full max-w-2xl">
          <div ref={panelRef}>
            <ReadingPanel
              position={read.step}
              state={phase === "scoring" ? "working" : "reading"}
              signals={read.signals}
              progress={progress}
              dense
            />
          </div>
          <StickyRead
            position={read.step}
            state={phase === "scoring" ? "working" : "reading"}
            progress={progress}
            watch={panelRef}
          />

          <div className="mt-5 sm:mt-6">
            {phase === "quiz" && (
              <Quiz
                answers={answers}
                onChange={setAnswers}
                onComplete={() => {
                  if (mode === "last") setPhase("gate");
                  else void runAssessment(answers, lead);
                }}
                onBack={backToStart}
                onIndexChange={setQuizIndex}
                startIndex={quizIndex}
              />
            )}
            {phase === "gate" && (
              <LeadGate
                framing="verify"
                submitting={submitting}
                onSubmit={handleVerify}
                onBack={() => setPhase("quiz")}
              />
            )}
            {phase === "scoring" && <ScoringScreen />}
          </div>

          {(phase === "quiz" || phase === "gate") && Object.keys(answers).length > 0 && (
            <div className="mt-3 text-center">
              <Button variant="ghost" size="sm" onClick={startOver}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Start over
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "error" && (
        <div className="mx-auto w-full max-w-lg rounded-[var(--radius-lg)] bg-white p-7 text-center shadow-[var(--shadow-card)] ring-1 ring-[var(--rule)] ring-inset">
          <h2 className="arena-heading text-[1.375rem]">That did not go through</h2>
          <p className="mt-3 text-base text-[var(--ink-soft)]">
            {error} Your answers are still here, so it is one click to try again.
          </p>
          <Button className="mt-5" onClick={() => void runAssessment(answers, lead)}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </Button>
        </div>
      )}

      {phase === "result" && result && (
        <div className="mx-auto w-full max-w-4xl">
          <ReadingPanel position={position} state="settled" signals={read.signals} />
          <Result
            assessment={result.assessment}
            lead={lead}
            source={result.source}
            movedFrom={read.step !== position ? read.step : undefined}
          />
          <div className="no-print mt-10 text-center">
            <Button variant="ghost" size="sm" onClick={startOver}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Start over
            </Button>
          </div>
        </div>
      )}
    </MotionConfig>
  );
}
