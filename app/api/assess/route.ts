import { NextResponse } from "next/server";

import { buildMockAssessment } from "@/lib/mock-assessment";
import { optionLabel, QUESTIONS, QUESTION_COUNT_WORD, type Answers } from "@/lib/questions";
import { assessRequestSchema, assessmentSchema, type AssessResponse } from "@/lib/schema";
import { scoreAnswers } from "@/lib/scoring";
import { STEPS } from "@/lib/steps";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ARENA_MODEL || "claude-sonnet-5";

function renderAnswers(answers: Answers): string {
  return QUESTIONS.map((question) => {
    const value = answers[question.id];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      return `${question.prompt}\n  (not answered)`;
    }
    const rendered = Array.isArray(value)
      ? value.map((v) => optionLabel(question.id, v)).join(", ")
      : question.type === "text"
        ? value
        : optionLabel(question.id, value);
    return `${question.prompt}\n  ${rendered}`;
  }).join("\n\n");
}

function systemPrompt(): string {
  const ladder = STEPS.map(
    (s) => `Step ${s.number} — ${s.name}: ${s.summary}\n  Looks like: ${s.looksLike.join("; ")}\n  To move up: ${s.toMoveUp}`
  ).join("\n\n");

  return [
    "You are the reviewer behind Arena Strategic AI's AI Readiness Roadmap.",
    "",
    `A business owner has answered ${QUESTION_COUNT_WORD} questions about how their company operates.`,
    "Read all the answers together and place them on one of the five steps below.",
    "",
    "THE FIVE STEPS",
    ladder,
    "",
    "HOW TO WRITE",
    "- Speak to the reader as 'you'. Plain language, the way one business owner talks to another.",
    "- No jargon, no buzzwords, no 'leverage', 'synergy', 'transformation' or 'journey'.",
    "- Cite their own answers back to them. Be specific to their operation, never generic.",
    "- Be honest. Most owners are further along than they think, but do not flatter them.",
    "- Never offer a document, a download, a PDF or a report.",
    "- Do not use em dashes.",
    "",
    "The rubric's own read of these answers is given to you as a sanity check. Trust your reading",
    "of the whole picture, but if you land more than one step away from the rubric, prefer the rubric.",
  ].join("\n");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "That request did not look right." }, { status: 400 });
  }

  const parsed = assessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That request did not look right." }, { status: 400 });
  }

  const { answers } = parsed.data;
  const rubric = scoreAnswers(answers);

  // No key configured: score it locally with the roadmap's own rules.
  if (!process.env.ANTHROPIC_API_KEY) {
    const payload: AssessResponse = {
      assessment: buildMockAssessment(answers),
      source: "mock",
    };
    return NextResponse.json(payload);
  }

  try {
    const { generateObject } = await import("ai");
    const { anthropic } = await import("@ai-sdk/anthropic");

    const { object } = await generateObject({
      model: anthropic(MODEL),
      schema: assessmentSchema,
      system: systemPrompt(),
      prompt: [
        "THEIR ANSWERS",
        renderAnswers(answers),
        "",
        "THE RUBRIC'S READ",
        `Step ${rubric.step} (${rubric.confidence}).`,
        ...rubric.reasons.map((r) => `- ${r}`),
      ].join("\n"),
    });

    const payload: AssessResponse = { assessment: object, source: "claude" };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[assess] model call failed, falling back to the rubric", error);
    const payload: AssessResponse = {
      assessment: buildMockAssessment(answers),
      source: "mock",
    };
    return NextResponse.json(payload);
  }
}
