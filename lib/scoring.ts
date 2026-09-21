import { clampStep } from "./steps";
import { optionLabel, type Answers } from "./questions";

export type SignalTone = "good" | "watch" | "plain";

export type Signal = {
  id: string;
  label: string;
  tone: SignalTone;
};

export type Rubric = {
  step: number;
  confidence: "clear" | "borderline";
  reasons: string[];
  signals: {
    stance: number;
    data: number;
    ownership: number;
    breadth: number;
    hasPriority: boolean;
  };
};

export type RunningRead = {
  step: number;
  grounded: boolean;
  signals: Signal[];
};

const STANCE_SCORE: Record<string, number> = {
  nothing: 1,
  informal: 2,
  regular: 3,
  built: 4,
  embedded: 5,
};

const OWNER_SCORE: Record<string, number> = {
  nobody: 0,
  me: 1,
  next_gen: 1,
  ops_person: 2,
  it: 2,
  team: 2,
};

/** Data homes that count as a real, queryable system. */
const REAL_SYSTEMS = new Set(["accounting", "crm", "operational"]);

/** Data homes that cannot be queried at all. */
const SOFT_SYSTEMS = new Set(["paper", "heads", "unsure"]);

function first(answers: Answers, id: string): string {
  const value = answers[id];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function many(answers: Answers, id: string): string[] {
  const value = answers[id];
  return Array.isArray(value) ? value : value ? [value] : [];
}

/**
 * The roadmap's own rules. Starts from how the business says it uses AI today,
 * then docks or lifts the step where the supporting answers contradict it.
 */
export function scoreAnswers(answers: Answers): Rubric {
  const data = many(answers, "data");
  const systemCount = data.filter((d) => REAL_SYSTEMS.has(d)).length;
  const allSoft = data.length > 0 && data.every((d) => SOFT_SYSTEMS.has(d));
  const spreadsheetCredit = data.includes("spreadsheets") ? 0.5 : 0;
  const dataScore = allSoft ? 0 : Math.min(3, systemCount + spreadsheetCredit);

  const activeUses = many(answers, "uses").filter((u) => u !== "none");

  const signals = {
    stance: STANCE_SCORE[first(answers, "stance")] ?? 1,
    data: dataScore,
    ownership: OWNER_SCORE[first(answers, "owner")] ?? 0,
    breadth: activeUses.length,
    hasPriority: first(answers, "priority").trim().length > 3,
  };

  const reasons: string[] = [];
  let step = signals.stance;
  let adjusted = false;

  if (step >= 3 && signals.data < 1) {
    step -= 1;
    adjusted = true;
    reasons.push(
      "The information the business runs on is still mostly in people's heads, on paper or in spreadsheets, which caps how far any AI work can get."
    );
  }

  if (step >= 3 && signals.ownership === 0) {
    step -= 1;
    adjusted = true;
    reasons.push(
      "Nobody owns this yet, so what is working today depends on individuals rather than on the company."
    );
  }

  if (step >= 4 && signals.breadth < 2) {
    step -= 1;
    adjusted = true;
    reasons.push(
      "It is in use, but in one place only, so there is no second example to build on."
    );
  }

  if (signals.stance <= 1 && signals.ownership >= 1 && signals.data >= 2) {
    step = Math.max(step, 2);
    adjusted = true;
    reasons.push(
      "Nothing has started, but your information is already in systems and you know who would take this on, which is further along than it feels."
    );
  }

  if (signals.stance <= 2 && signals.ownership >= 2 && signals.data >= 2 && signals.hasPriority) {
    step = Math.max(step, 3);
    adjusted = true;
    reasons.push(
      "You have the three things step three needs: reachable information, a named owner and a specific job worth doing first."
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "Your answers line up cleanly: what you are doing with AI, where your information sits and who would own it all point to the same place."
    );
  }

  return {
    step: clampStep(step),
    confidence: adjusted ? "borderline" : "clear",
    reasons,
    signals,
  };
}

const STANCE_SIGNAL: Record<string, Signal> = {
  nothing: { id: "stance", label: "Nothing started yet", tone: "watch" },
  informal: { id: "stance", label: "A few people use it alone", tone: "plain" },
  regular: { id: "stance", label: "In use for regular tasks", tone: "good" },
  built: { id: "stance", label: "Built for your own work", tone: "good" },
  embedded: { id: "stance", label: "Running across the business", tone: "good" },
};

const OWNER_SIGNAL: Record<string, Signal> = {
  nobody: { id: "owner", label: "No owner named yet", tone: "watch" },
  me: { id: "owner", label: "You would own it", tone: "good" },
  ops_person: { id: "owner", label: "An operations lead would own it", tone: "good" },
  it: { id: "owner", label: "IT would own it", tone: "good" },
  next_gen: { id: "owner", label: "Next generation would own it", tone: "good" },
  team: { id: "owner", label: "A group already meets on it", tone: "good" },
};

const BLOCKER_LABEL: Record<string, string> = {
  where_to_start: "Not sure where to start",
  cost: "Cost is unclear",
  messy_data: "Information is scattered",
  team: "Team is not sold yet",
  security: "Security is a concern",
  time: "No time to run a project",
  trust: "Trust in the output is low",
};

/**
 * The running read shown while the quiz is being answered: the current step plus
 * the chips that explain where it is coming from.
 */
export function readAnswers(answers: Answers): RunningRead {
  const rubric = scoreAnswers(answers);
  const signals: Signal[] = [];

  const industry = first(answers, "industry");
  if (industry) {
    signals.push({ id: "industry", label: optionLabel("industry", industry), tone: "plain" });
  }

  const stance = first(answers, "stance");
  if (stance && STANCE_SIGNAL[stance]) signals.push(STANCE_SIGNAL[stance]);

  const uses = many(answers, "uses");
  if (uses.length > 0) {
    const active = uses.filter((u) => u !== "none");
    signals.push(
      active.length === 0
        ? { id: "uses", label: "No AI in use today", tone: "watch" }
        : {
            id: "uses",
            label:
              active.length === 1
                ? `Used for ${optionLabel("uses", active[0]).toLowerCase()}`
                : `Used in ${active.length} parts of the work`,
            tone: "good",
          }
    );
  }

  const data = many(answers, "data");
  const dataSignal: Signal | null =
    data.length === 0
      ? null
      : data.includes("unsure")
        ? { id: "data", label: "Not sure where the data lives", tone: "watch" }
        : data.filter((d) => REAL_SYSTEMS.has(d)).length > 0
          ? { id: "data", label: "Numbers live in real systems", tone: "good" }
          : data.includes("spreadsheets")
            ? { id: "data", label: "Spreadsheets carry the business", tone: "plain" }
            : data.includes("paper")
              ? { id: "data", label: "Records still on paper", tone: "watch" }
              : { id: "data", label: "Knowledge lives in people's heads", tone: "watch" };
  if (dataSignal) signals.push(dataSignal);

  const owner = first(answers, "owner");
  if (owner && OWNER_SIGNAL[owner]) signals.push(OWNER_SIGNAL[owner]);

  const blocker = many(answers, "blockers").find((b) => b in BLOCKER_LABEL);
  if (blocker) signals.push({ id: "blocker", label: BLOCKER_LABEL[blocker], tone: "watch" });

  if (first(answers, "priority").trim().length > 3) {
    signals.push({ id: "priority", label: "First job named", tone: "good" });
  }

  return {
    step: rubric.step,
    grounded: !!stance && data.length > 0 && !!owner,
    signals,
  };
}

export { first as firstAnswer, many as manyAnswers };
