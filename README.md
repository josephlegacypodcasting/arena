# Arena AI Readiness Roadmap

Local rebuild of <https://arena-ai-readiness-roadmap.vercel.app/>.

A one-page lead magnet for Arena Strategic AI: nine questions about how a business
operates, a running read that moves as you answer, and a written result placing the
business on one of five roadmap steps.

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need. Everything is optional —
with an empty file the app runs end to end.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_GATE_MODE` | `first` | Where the lead form sits: `first` (before the questions), `last` (after them), `off` (no gate). |
| `NEXT_PUBLIC_ARENA_CTA_URL` | Arena's Calendly | Booking link on the result page. |
| `ANTHROPIC_API_KEY` | _empty_ | When set, Claude writes the result (`source: "claude"`). When empty, the roadmap's own rules do (`source: "mock"`), and the result footer says so. |
| `ARENA_MODEL` | `claude-sonnet-5` | Model used for the written result. |
| `ARENA_LEAD_WEBHOOK_URL` | _empty_ | POST each captured lead to a GoHighLevel inbound webhook. Without it leads are only logged to the server console. |
| `ARENA_LEAD_SOURCE` | `AI Readiness Roadmap` | Fallback `lead_source` when the URL carries no `?lead_source=` and no `utm_source`. |
| `ARENA_SOURCE_CHANNEL` | `Website` | Fallback `source_channel` when the URL carries no `?source_channel=` and no `utm_medium`. |

## CRM delivery

`/api/lead` fires **twice** per visitor, both times to the same webhook:

| `event` | When | Carries |
| --- | --- | --- |
| `capture` | The moment the form is submitted | Name, email, source and campaign tracking |
| `complete` | When the roadmap finishes rendering | All of the above plus the answers and the written result |

Two pushes matter because in the default `first` gate mode the form is submitted
*before* a single question is answered. Without the second push the CRM would only ever
hold a name and an email. GoHighLevel upserts on `email`, so the second push enriches the
same contact rather than creating a duplicate.

The payload is deliberately **flat** — every value is a string, number or boolean.
GoHighLevel maps top-level keys onto contact fields cleanly and handles nested objects
badly, so the answers are flattened to `answer_industry`, `answer_stance` and so on, and
the list fields in the result are joined with ` | `.

Field reference:

- **Contact:** `first_name`, `last_name`, `name`, `email`, `Work_email`
- **Attribution:** `lead_source`, `source_channel`, `utm_source`, `utm_medium`,
  `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, `ref`, `page_url`,
  `referrer`
- **Meta:** `event`, `gate_mode`, `submitted_at`
- **Scoring:** `readiness_step` (1–5), `readiness_step_name`, `readiness_confidence`,
  `questions_answered`, `questions_total`
- **Answers:** `answer_<question id>` for each of the nine questions
- **Result** (on `complete` only): `result_headline`, `result_where_you_are`,
  `result_strengths`, `result_gaps`, `result_next_actions`, `result_opportunities`,
  `result_closing_note`, `result_source`

`lead_source` and `source_channel` resolve in this order: `?lead_source=` / 
`?source_channel=` on the landing URL, then `utm_source` / `utm_medium`, then the env
defaults. So a podcast link like

```
https://…/?utm_source=youtube_podcast&utm_medium=podcast&utm_campaign=podcast_name&lead_source=Podcast&source_channel=Podcast
```

arrives in the CRM tagged as Podcast on both fields.

A webhook failure never reaches the visitor: the route logs it and still returns `ok`,
and the request times out after 8 seconds so a slow CRM cannot hold the browser open.

## How it is put together

```
app/
  layout.tsx            page shell: header, footer, Work Sans, metadata
  page.tsx              renders the experience
  globals.css           design tokens (--ink, --accent, …) and the .arena-* type scale
  api/assess/route.ts   scores the answers, writes the result
  api/lead/route.ts     validates and forwards the lead
components/
  roadmap-experience.tsx  state machine: start → quiz → gate → scoring → result
  landing.tsx             hero, the five steps, "you get", closing band
  quiz.tsx                one question at a time, keyboard driven
  lead-gate.tsx           name + work email, used for both gate positions
  step-rail.tsx           the five-step rail, signal chips, live reading panel, sticky bar
  result.tsx              the written roadmap
  scoring-screen.tsx      the pause between the last answer and the result
lib/
  questions.ts          the nine questions and their options
  steps.ts              the five roadmap steps
  scoring.ts            the rubric and the running read
  mock-assessment.ts    rules-only result, used when there is no API key
  schema.ts             zod schemas shared by the client and the API
  storage.ts            resume-where-you-left-off, in localStorage
  config.ts / copy.ts   env-driven settings and page copy
```

### The rubric

`lib/scoring.ts` starts from how the business says it uses AI today (`stance`, worth 1–5)
and then adjusts:

- docks a step at 3+ when the information does not live in a queryable system
- docks a step at 3+ when nobody owns it
- docks a step at 4+ when AI is in use in only one part of the work
- lifts to step 2 when nothing has started but the data and an owner are already there
- lifts to step 3 when there is reachable data, a named owner and a named first job

Any adjustment marks the result `borderline`, which the result page calls out.

### Two result paths

`/api/assess` always runs the rubric. With `ANTHROPIC_API_KEY` set it hands the answers
plus the rubric's read to Claude, which writes the headline, the honest read, three next
actions and the opportunities against the schema in `lib/schema.ts`. Without a key — or
if the model call fails — it falls back to `lib/mock-assessment.ts`, which builds the
same shape from the rubric alone.

## Notes on the rebuild

The deployed site publishes no source maps, so this was rebuilt from the shipped bundle
and the rendered page. The questions, the five steps, all page copy, the rubric, the
design tokens and the component class names are transcribed from the original. The two
API routes are server-side and were not recoverable, so they are reimplementations
against the same request and response shapes the client expects.

Two things worth knowing:

- On the last question the `<h2>` takes focus ahead of the text field, so you have to
  click the field before typing. This matches the original's structure; it is an upstream
  quirk, not a local regression.
- The original's `<meta name="description">` says "Ten short questions" while the quiz has
  nine. Here the count is derived from `QUESTIONS.length`, so it reads "Nine".
