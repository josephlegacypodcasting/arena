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

/** GoHighLevel booking widget, embedded on the result page. */
export const BOOKING_EMBED_URL =
  process.env.NEXT_PUBLIC_ARENA_BOOKING_URL ||
  "https://api.leadconnectorhq.com/widget/booking/vJSj6VX7HHYfmAeL6dUI";

/** form_embed.js targets the iframe by id to set its height. */
export const BOOKING_EMBED_ID = "Xzhls1JUajFXHeu70sKQ_1790021856079";

/** Plain link used when scripting or the iframe is unavailable. */
export const BOOKING_FALLBACK_URL = process.env.NEXT_PUBLIC_ARENA_CTA_URL || BOOKING_EMBED_URL;

export const CTA_MINUTES = 30;

export const BRAND = "Arena Strategic AI";

export const BRAND_URL = "https://arenastrategic.ai";
