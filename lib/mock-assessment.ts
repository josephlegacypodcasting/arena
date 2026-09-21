import { optionLabel, type Answers } from "./questions";
import { firstAnswer, manyAnswers, scoreAnswers } from "./scoring";
import { getStep } from "./steps";
import type { Assessment, NextAction, Opportunity } from "./schema";

/**
 * Builds a result from the roadmap's own rules, with no model involved.
 * Used when ANTHROPIC_API_KEY is not configured, and surfaced to the reader as
 * source: "mock" so the footer can say so.
 */
export function buildMockAssessment(answers: Answers): Assessment {
  const rubric = scoreAnswers(answers);
  const step = getStep(rubric.step);
  const nextStep = rubric.step < 5 ? getStep(rubric.step + 1) : null;

  const industry = firstAnswer(answers, "industry");
  const industryLabel = industry ? optionLabel("industry", industry).toLowerCase() : "your business";
  const headcount = firstAnswer(answers, "headcount");
  const owner = firstAnswer(answers, "owner");
  const priority = firstAnswer(answers, "priority").trim();
  const data = manyAnswers(answers, "data");
  const uses = manyAnswers(answers, "uses").filter((u) => u !== "none");
  const blockers = manyAnswers(answers, "blockers").filter((b) => b !== "nothing");

  const strengths: string[] = [];
  if (rubric.signals.data >= 1) {
    strengths.push(
      `The information you run on is reachable: ${data
        .map((d) => optionLabel("data", d).toLowerCase())
        .slice(0, 3)
        .join(", ")}. That is the part most businesses have to fix first.`
    );
  }
  if (rubric.signals.ownership >= 1) {
    strengths.push(
      `You already know who would own this: ${optionLabel("owner", owner).toLowerCase()}. Work with a name against it moves; work without one stalls.`
    );
  }
  if (uses.length > 0) {
    strengths.push(
      `AI is already doing real work here, in ${uses
        .map((u) => optionLabel("uses", u).toLowerCase())
        .slice(0, 3)
        .join(" and ")}. You are past the talking stage.`
    );
  }
  if (rubric.signals.hasPriority) {
    strengths.push("You named the job you most want fixed, which is what makes a first project real rather than theoretical.");
  }
  while (strengths.length < 2) {
    strengths.push(
      "You are looking at this honestly rather than buying the first thing you were pitched, which is how this stays cheap."
    );
  }

  const gaps: string[] = [];
  if (rubric.signals.data < 1) {
    gaps.push(
      "The information the business runs on is not in a system anything can read yet, so any AI work would be guessing."
    );
  }
  if (rubric.signals.ownership === 0) {
    gaps.push("Nobody owns this. Until one name is against it, nothing will carry past the first burst of interest.");
  }
  if (rubric.signals.breadth < 2 && rubric.signals.stance >= 3) {
    gaps.push("It works in one place only, so you have no second example to argue from.");
  }
  if (!rubric.signals.hasPriority) {
    gaps.push("There is no agreed first job, so effort spreads thin across everything and lands nowhere.");
  }
  for (const blocker of blockers.slice(0, 2)) {
    if (gaps.length >= 3) break;
    gaps.push(`You named this yourself: ${optionLabel("blockers", blocker).toLowerCase()}.`);
  }
  while (gaps.length < 2) {
    gaps.push("There is no simple measure of what a win would look like, so you would not know if it worked.");
  }

  const nextActions: NextAction[] = [
    {
      title: priority ? `Write down what "${truncate(priority, 60)}" costs you today` : "Pick the one job worth fixing first",
      detail: priority
        ? "Put a number on it: hours, delays, jobs lost. That number is what any AI work has to beat, and it is what makes the decision obvious either way."
        : `Choose the single job in ${industryLabel} that costs you the most time or money today, and write down what it costs. Everything else waits.`,
      effort: "this week",
    },
    {
      title: rubric.signals.ownership === 0 ? "Put one name against this" : "Give the owner a clear first brief",
      detail:
        rubric.signals.ownership === 0
          ? "One person, named, with an hour a week. Not a committee. This is the single change that separates businesses that get somewhere from ones that keep talking."
          : `${capitalize(optionLabel("owner", owner))} needs a written brief: the job, the number it has to beat, and what a win looks like in 90 days.`,
      effort: "this month",
    },
    {
      title: nextStep ? `Build the smallest thing that proves step ${nextStep.number}` : "Keep the rules current",
      detail: step.toMoveUp,
      effort: "a real project",
    },
  ];

  const untouched = ["quoting", "scheduling", "paperwork", "forecasting", "customer", "maintenance"].filter(
    (u) => !uses.includes(u)
  );

  const opportunities: Opportunity[] = untouched.slice(0, 3).map((value) => ({
    title: optionLabel("uses", value),
    why: `You did not list this as somewhere AI is used today. In ${industryLabel} at ${
      headcount ? optionLabel("headcount", headcount).toLowerCase() : "your size"
    }, it is usually repetitive, rules-driven and already written down somewhere, which is exactly what pays off first.`,
  }));

  while (opportunities.length < 2) {
    opportunities.push({
      title: "Writing, email and proposals",
      why: "The lowest-risk place to start, because a person reads every output before it leaves the building.",
    });
  }

  return {
    step: rubric.step,
    confidence: rubric.confidence,
    headline: `You are at step ${rubric.step}: ${step.name.toLowerCase()}.`,
    whereYouAre: `${rubric.reasons[0]} ${step.summary}`,
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    nextActions,
    opportunities: opportunities.slice(0, 3),
    closingNote: priority
      ? `You said the thing you most want to run better is ${lowerFirst(truncate(priority, 90))}. That is a concrete enough starting point to be worth half an hour.`
      : `There is a version of this that pays for itself in ${industryLabel} and a version that wastes a year. Worth half an hour to work out which one you are looking at.`,
  };
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
