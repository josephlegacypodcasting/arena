export type RoadmapStep = {
  number: number;
  name: string;
  summary: string;
  looksLike: string[];
  toMoveUp: string;
};

export const STEPS: RoadmapStep[] = [
  {
    number: 1,
    name: "Curious",
    summary: "AI is on your radar. Nothing has started.",
    looksLike: [
      "You keep hearing that you should be doing something with AI",
      "Nobody in the company is using it in their actual work",
      "There is no plan, and no obvious place to start",
    ],
    toMoveUp:
      "Get an honest read on the two or three places AI would actually pay off in your operation, and the places it would not.",
  },
  {
    number: 2,
    name: "Trying things",
    summary: "A few people use AI tools on their own. Nothing is official.",
    looksLike: [
      "Someone in the office uses it for emails or writing",
      "It is not written down, not shared, and not measured",
      "If that person left, nothing would carry on",
    ],
    toMoveUp:
      "Pick one job that costs you real money, find out whether the information behind it is reachable, and put one name against it.",
  },
  {
    number: 3,
    name: "Ready",
    summary:
      "The groundwork is done. You know where your numbers live, someone owns this, and you have picked the first job.",
    looksLike: [
      "Your information sits in systems you can get data out of, not only in heads and filing cabinets",
      "One person is accountable for making this work",
      "You have agreed what the first project is and what a win looks like",
    ],
    toMoveUp:
      "Build the first one and prove it on your own numbers, so the second one is an easy decision instead of an argument.",
  },
  {
    number: 4,
    name: "Proven",
    summary: "One thing is live, people use it, and it pays for itself.",
    looksLike: [
      "A real part of the work runs with AI in it every week",
      "You can point at what it saved or won you",
      "Your team trusts it enough to rely on it",
    ],
    toMoveUp:
      "Repeat it across the next two jobs and put simple rules around it, so growth does not create risk.",
  },
  {
    number: 5,
    name: "Built in",
    summary: "AI is part of how the company runs, with rules and someone accountable.",
    looksLike: [
      "Several parts of the business run on it",
      "There are written rules on what may and may not be used, and with what information",
      "Someone owns it internally and reviews it",
    ],
    toMoveUp:
      "Stay ahead of it: keep the rules current, keep measuring, and keep an eye on where the next advantage is.",
  },
];

/** Clamp any number into a valid 1-5 step. */
export function clampStep(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function getStep(number: number): RoadmapStep {
  const step = STEPS.find((s) => s.number === number);
  if (!step) throw new Error(`Unknown roadmap step: ${number}`);
  return step;
}
