/**
 * Fires a representative lead through the real /api/lead route so the CRM
 * receives every field it needs to build a field mapping.
 *
 *   npm run dev            # in one terminal
 *   npm run test:webhook   # in another
 *
 * This sends to whatever ARENA_LEAD_WEBHOOK_URL the dev server was started
 * with, and creates a real contact there. Override the target app with
 * APP_URL=... if the dev server is not on port 3000.
 */

const APP_URL = process.env.APP_URL || "http://localhost:3000";

const lead = {
  firstName: process.env.TEST_FIRST_NAME || "peptest07",
  lastName: process.env.TEST_LAST_NAME || "test07",
  email: process.env.TEST_EMAIL || "peptest07@test07.com",
};

// One answer for every question, so no field is missing from the mapping.
const answers = {
  industry: "manufacturing",
  headcount: "25_75",
  role: "owner",
  stance: "regular",
  uses: ["writing", "quoting"],
  data: ["accounting", "spreadsheets"],
  owner: "ops_person",
  blockers: ["where_to_start", "messy_data"],
  priority: "Quoting takes us three days and we lose jobs over it",
};

const tracking = {
  utm_source: "youtube_podcast",
  utm_medium: "podcast",
  utm_campaign: "podcast_name",
  lead_source: "Podcast",
  source_channel: "Podcast",
  page_url: `${APP_URL}/?utm_source=youtube_podcast&utm_medium=podcast&utm_campaign=podcast_name`,
  referrer: "https://www.youtube.com/",
};

const assessment = {
  step: 3,
  confidence: "clear",
  headline: "You are at step 3: ready.",
  whereYouAre:
    "Your numbers live in systems you can query, someone would own this, and you have named the job you want fixed first.",
  strengths: ["Information is reachable", "An operations lead would own it"],
  gaps: ["No agreed measure of a win", "Only one part of the work uses AI"],
  nextActions: [
    { title: "Price the quoting delay", detail: "Put a number on what three days costs you.", effort: "this week" },
    { title: "Brief the owner", detail: "The job, the number to beat, and what a win looks like.", effort: "this month" },
    { title: "Build the first one", detail: "Prove it on your own numbers.", effort: "a real project" },
  ],
  opportunities: [
    { title: "Quoting and estimating", why: "Repetitive, rules-driven and already written down." },
    { title: "Forecasting demand or inventory", why: "You are not using it here today." },
  ],
  closingNote: "Worth half an hour on the quoting problem specifically.",
};

async function send(event, extra = {}) {
  const response = await fetch(`${APP_URL}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead, answers, tracking, gateMode: "first", event, ...extra }),
  });
  const body = await response.json().catch(() => ({}));
  const delivered = body?.delivered === true;
  console.log(
    `${event.padEnd(9)} HTTP ${response.status}  delivered=${delivered}` +
      (delivered ? "" : "  <- check the dev server console for the reason")
  );
  return delivered;
}

console.log(`Sending to ${APP_URL}/api/lead as ${lead.email}\n`);

const captured = await send("capture");
const completed = await send("complete", { assessment, assessmentSource: "mock" });

console.log(
  captured && completed
    ? "\nBoth events delivered. The contact should now be in the CRM with every field populated."
    : "\nAt least one event was not delivered. The dev server console has the detail."
);
process.exit(captured && completed ? 0 : 1);
