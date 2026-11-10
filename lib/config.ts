/**
 * Where the lead form sits in the flow:
 *  - "first": before the questions (the deployed default)
 *  - "last":  after the questions, before the result
 *  - "off":   no gate at all
 */
export type GateMode = "first" | "last" | "off";

const rawGateMode = process.env.NEXT_PUBLIC_GATE_MODE;

export const GATE_MODE: GateMode =
  rawGateMode === "last" || rawGateMode === "off" ? rawGateMode : "first";

/** Calendly event, embedded inline on the result page. */
export const BOOKING_EMBED_URL =
  process.env.NEXT_PUBLIC_ARENA_BOOKING_URL || "https://calendly.com/ankita-arenastrategic/30min";

/** Plain link used when scripting or the iframe is unavailable. */
export const BOOKING_FALLBACK_URL = process.env.NEXT_PUBLIC_ARENA_CTA_URL || BOOKING_EMBED_URL;

export const CTA_MINUTES = 30;

export const BRAND = "Arena Strategic AI";

export const BRAND_URL = "https://arenastrategic.ai";
