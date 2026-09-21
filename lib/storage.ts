import { z } from "zod";

import { GATE_MODE } from "./config";
import { QUESTIONS } from "./questions";
import { STEPS } from "./steps";
import { answersSchema, assessmentSchema, leadSchema } from "./schema";

const STORAGE_KEY = "arena.roadmap.state.v1";

export const phaseSchema = z.enum(["quiz", "gate", "result"]);
export type SavedPhase = z.infer<typeof phaseSchema>;

const savedStateSchema = z.object({
  version: z.literal(1),
  schema: z.string(),
  savedAt: z.string(),
  phase: phaseSchema,
  quizIndex: z.number().int().min(0),
  answers: answersSchema,
  lead: leadSchema.nullable(),
  result: z
    .object({
      assessment: assessmentSchema,
      source: z.enum(["claude", "mock"]),
    })
    .nullable(),
});

export type SavedState = z.infer<typeof savedStateSchema>;

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

/**
 * Fingerprint of the gate mode, the questions and the steps. Saved progress is
 * thrown away when any of them change, so a returning visitor never resumes
 * into a quiz that no longer matches.
 */
export const SCHEMA_SIGNATURE = hash(
  [
    `gate:${GATE_MODE}`,
    QUESTIONS.map((q) => `${q.id}:${q.type}:${(q.options ?? []).map((o) => o.value).join("+")}`).join("|"),
    STEPS.map((s) => `${s.number}:${s.name}`).join("|"),
  ].join("~")
);

/** localStorage, or null when it is unavailable or blocked. */
function safeStorage(): Storage | null {
  try {
    if (!window.localStorage) return null;
    const probe = "__arena_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function clearSavedState(): void {
  try {
    safeStorage()?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadSavedState(): SavedState | null {
  const storage = safeStorage();
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = savedStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.schema !== SCHEMA_SIGNATURE) {
      clearSavedState();
      return null;
    }

    const state = parsed.data;
    const lastIndex = QUESTIONS.length - 1;
    if (state.phase === "result" && !state.result) {
      clearSavedState();
      return null;
    }
    if (state.quizIndex > lastIndex) return { ...state, quizIndex: lastIndex };
    return state;
  } catch {
    clearSavedState();
    return null;
  }
}

export function saveState(state: Omit<SavedState, "version" | "schema" | "savedAt">): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    const payload: SavedState = {
      version: 1,
      schema: SCHEMA_SIGNATURE,
      savedAt: new Date().toISOString(),
      ...state,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}
