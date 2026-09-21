import { z } from "zod";

export const answersSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

export const leadSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
});

export const nextActionSchema = z.object({
  title: z.string(),
  detail: z.string(),
  effort: z.enum(["this week", "this month", "a real project"]),
});

export const opportunitySchema = z.object({
  title: z.string(),
  why: z.string(),
});

export const assessmentSchema = z.object({
  step: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("Which of the five roadmap steps this business is on right now."),
  confidence: z
    .enum(["clear", "borderline"])
    .describe("'borderline' when the answers straddle two steps, 'clear' otherwise."),
  headline: z
    .string()
    .describe("One sentence, under 20 words, naming where they are. Speak to the reader as 'you'."),
  whereYouAre: z
    .string()
    .describe("Two or three sentences on why they are on this step, citing their own answers. No jargon."),
  strengths: z
    .array(z.string())
    .min(2)
    .max(3)
    .describe("What they already have going for them, drawn from their answers."),
  gaps: z
    .array(z.string())
    .min(2)
    .max(3)
    .describe("What is missing before they can move up one step."),
  nextActions: z
    .array(nextActionSchema)
    .min(3)
    .max(3)
    .describe("Exactly three concrete moves that get them to the next step. Specific to their operation."),
  opportunities: z
    .array(opportunitySchema)
    .min(2)
    .max(3)
    .describe("Places AI would pay off in THEIR operation that they said they are not using today."),
  closingNote: z
    .string()
    .describe(
      "One or two sentences leading into a short call with Arena, about THIS business rather than about AI in general. Warm, no pressure, no sales language, and do not offer a document or a download."
    ),
});

export const assessRequestSchema = z.object({
  answers: answersSchema,
  lead: leadSchema.optional(),
});

export type Lead = z.infer<typeof leadSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type NextAction = z.infer<typeof nextActionSchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;

export type AssessResponse = {
  assessment: Assessment;
  source: "claude" | "mock";
};
