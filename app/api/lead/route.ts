import { NextResponse } from "next/server";
import { z } from "zod";

import { buildLeadPayload } from "@/lib/lead-payload";
import { answersSchema, assessmentSchema, leadSchema } from "@/lib/schema";

export const runtime = "nodejs";

const trackingSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    gclid: z.string().max(200).optional(),
    fbclid: z.string().max(200).optional(),
    ref: z.string().max(200).optional(),
    lead_source: z.string().max(200).optional(),
    source_channel: z.string().max(200).optional(),
    page_url: z.string().max(500).optional(),
    referrer: z.string().max(500).optional(),
  })
  .optional()
  .default({});

const leadRequestSchema = z.object({
  lead: leadSchema,
  answers: answersSchema.optional().default({}),
  tracking: trackingSchema,
  gateMode: z.enum(["first", "last", "off"]).optional(),
  event: z.enum(["capture", "complete"]).optional().default("capture"),
  assessment: assessmentSchema.optional(),
  assessmentSource: z.enum(["claude", "mock"]).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "That request did not look right." }, { status: 400 });
  }

  const parsed = leadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That request did not look right." }, { status: 400 });
  }

  const payload = buildLeadPayload(parsed.data);

  const webhook = process.env.ARENA_LEAD_WEBHOOK_URL;
  if (!webhook) {
    console.log("[lead] captured (no ARENA_LEAD_WEBHOOK_URL set)", payload);
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Never let a slow CRM hold the visitor's browser open.
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error("[lead] webhook rejected the lead", response.status, await response.text());
      return NextResponse.json({ ok: true, delivered: false });
    }

    console.log(`[lead] delivered ${payload.event} for ${payload.email}`);
    return NextResponse.json({ ok: true, delivered: true });
  } catch (error) {
    // The visitor already has what they came for; a CRM failure is ours to fix,
    // not theirs to see.
    console.error("[lead] webhook call failed", error);
    return NextResponse.json({ ok: true, delivered: false });
  }
}
