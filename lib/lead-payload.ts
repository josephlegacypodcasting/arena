import { optionLabel, QUESTIONS, type Answers } from "./questions";
import { scoreAnswers } from "./scoring";
import { getStep } from "./steps";
import type { Assessment, Lead } from "./schema";

/**
 * Tracking pulled off the landing URL, plus where the visitor came from.
 * Everything here is optional and best-effort.
 */
export type Tracking = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  ref?: string;
  lead_source?: string;
  source_channel?: string;
  page_url?: string;
  referrer?: string;
};

export type LeadEvent = "capture" | "complete";

/**
 * GoHighLevel maps flat top-level keys onto contact fields cleanly and handles
 * nested objects badly, so every value here is a string, number or boolean.
 */
export type LeadWebhookPayload = Record<string, string | number | boolean>;

const DEFAULT_LEAD_SOURCE = process.env.ARENA_LEAD_SOURCE || "AI Readiness Roadmap";
const DEFAULT_SOURCE_CHANNEL = process.env.ARENA_SOURCE_CHANNEL || "Website";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export function buildLeadPayload({
  lead,
  answers,
  tracking,
  event,
  gateMode,
  assessment,
  assessmentSource,
}: {
  lead: Lead;
  answers: Answers;
  tracking: Tracking;
  event: LeadEvent;
  gateMode?: string;
  assessment?: Assessment;
  assessmentSource?: "claude" | "mock";
}): LeadWebhookPayload {
  const rubric = scoreAnswers(answers);

  // The step that counts is the written one when we have it, the rubric's otherwise.
  const step = assessment?.step ?? rubric.step;

  const payload: LeadWebhookPayload = {
    first_name: lead.firstName,
    last_name: lead.lastName,
    name: `${lead.firstName} ${lead.lastName}`,

    // `email` is the field GoHighLevel matches contacts on; `Work_email` is the
    // custom field the CRM side already expects.
    email: lead.email,
    Work_email: lead.email,

    lead_source: clean(tracking.lead_source) || clean(tracking.utm_source) || DEFAULT_LEAD_SOURCE,
    source_channel:
      clean(tracking.source_channel) || clean(tracking.utm_medium) || DEFAULT_SOURCE_CHANNEL,

    event,
    gate_mode: gateMode ?? "",
    submitted_at: new Date().toISOString(),
  };

  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "fbclid",
    "ref",
    "page_url",
    "referrer",
  ] as const) {
    payload[key] = clean(tracking[key]);
  }

  const answered = QUESTIONS.filter((q) => {
    const value = answers[q.id];
    return Array.isArray(value) ? value.length > 0 : clean(value as string).length > 0;
  }).length;

  payload.readiness_step = answered > 0 ? step : "";
  payload.readiness_step_name = answered > 0 ? getStep(step).name : "";
  payload.readiness_confidence = answered > 0 ? (assessment?.confidence ?? rubric.confidence) : "";
  payload.questions_answered = answered;
  payload.questions_total = QUESTIONS.length;

  for (const question of QUESTIONS) {
    const value = answers[question.id];
    // " | " rather than ", ", because several option labels contain commas of
    // their own ("Writing, email and proposals") and would otherwise be
    // impossible to split back apart in the CRM.
    const rendered =
      value === undefined
        ? ""
        : Array.isArray(value)
          ? value.map((v) => optionLabel(question.id, v)).join(" | ")
          : question.type === "text"
            ? value
            : optionLabel(question.id, value);
    payload[`answer_${question.id}`] = rendered;
  }

  payload.result_headline = assessment?.headline ?? "";
  payload.result_where_you_are = assessment?.whereYouAre ?? "";
  payload.result_strengths = assessment?.strengths.join(" | ") ?? "";
  payload.result_gaps = assessment?.gaps.join(" | ") ?? "";
  payload.result_next_actions =
    assessment?.nextActions.map((a) => `${a.title} (${a.effort}): ${a.detail}`).join(" | ") ?? "";
  payload.result_opportunities =
    assessment?.opportunities.map((o) => `${o.title}: ${o.why}`).join(" | ") ?? "";
  payload.result_closing_note = assessment?.closingNote ?? "";
  payload.result_source = assessmentSource ?? "";

  return payload;
}
