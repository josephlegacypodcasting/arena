import { QUESTION_COUNT_WORD } from "./questions";

export type GateFraming = "unlock" | "verify";

export const GATE_COPY: Record<
  GateFraming,
  { eyebrow: string; heading: string; body: string; action: string; reassurance: string }
> = {
  unlock: {
    eyebrow: `Two minutes, ${QUESTION_COUNT_WORD} questions`,
    heading: "Where does your business stand with AI right now?",
    body: `Answer ${QUESTION_COUNT_WORD} short questions about how you operate and you will get your place on the roadmap, what is already working in your favor, and the next things to do. Nothing to download and nothing to install.`,
    action: "Start the assessment",
    reassurance:
      "We use your email to send you your result and the occasional note from Arena. You can unsubscribe in one click.",
  },
  verify: {
    eyebrow: "Your result is ready",
    heading: "Where should we send it?",
    body: "One last step before we show you your roadmap. We just need to check you are a real person, and it means you keep a copy rather than losing it when you close the tab.",
    action: "Show me my roadmap",
    reassurance:
      "Your result appears on this page straight away. We also email you a copy, and you can unsubscribe in one click.",
  },
};

export const FIND_OUT = [
  "Is any of this actually worth it for a business like mine?",
  "Where would it pay off in my operation, and where would it not?",
  "What do I need in place before I start anything?",
  "Who in my company should own it?",
];

export const YOU_GET = [
  {
    title: "Your place on the roadmap",
    body: "One of five steps, from curious to built in. Based on how you actually run the business, not on how much you have read about AI.",
  },
  {
    title: "What is already working in your favor",
    body: "Most owners are further along than they think. You get the honest read, including the parts you already have right and never counted.",
  },
  {
    title: "Three things to do next",
    body: "Specific to your operation and to the job you most want fixed, plus the places AI would pay off that you are not using today.",
  },
];

export const PROMISES = ["Free", "About two minutes", "Nothing to download"];

export const START_ANCHOR = "start";
