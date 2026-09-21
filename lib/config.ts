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

export const CTA_URL =
  process.env.NEXT_PUBLIC_ARENA_CTA_URL || "https://calendly.com/ankita-arenastrategic/30min";

export const CTA_MINUTES = 30;

export const BRAND = "Arena Strategic AI";

export const BRAND_URL = "https://arenastrategic.ai";
