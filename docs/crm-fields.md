# Custom fields to create in GoHighLevel

The webhook sends **42 keys, always the same 42**, on both the `capture` and the
`complete` event. Missing values arrive as empty strings rather than being dropped, so a
mapping built once keeps working.

Four of those keys map to fields GoHighLevel already has. The rest need custom fields.

## Do not create these — they are standard contact fields

| Payload key | Map to |
| --- | --- |
| `first_name` | First Name |
| `last_name` | Last Name |
| `email` | Email — this is what GoHighLevel matches contacts on |
| `name` | Full Name, or leave unmapped |

`lead_source` can also go to the built-in **Source** field instead of a custom one. Pick
one and stay consistent.

## Create these — 38 custom fields

### Identity (1)

| Field name | Key | Type |
| --- | --- | --- |
| Work Email | `Work_email` | Text |

Duplicates `email` on purpose, because the CRM side asked for it. Safe to skip if you are
happy matching on `email` alone.

### Attribution (12)

| Field name | Key | Type |
| --- | --- | --- |
| Lead Source | `lead_source` | Text (or built-in Source) |
| Source Channel | `source_channel` | Text |
| UTM Source | `utm_source` | Text |
| UTM Medium | `utm_medium` | Text |
| UTM Campaign | `utm_campaign` | Text |
| UTM Content | `utm_content` | Text |
| UTM Term | `utm_term` | Text |
| GCLID | `gclid` | Text |
| FBCLID | `fbclid` | Text |
| Referral Code | `ref` | Text |
| Landing Page URL | `page_url` | Text |
| Referrer | `referrer` | Text |

### Submission meta (3)

| Field name | Key | Type |
| --- | --- | --- |
| Roadmap Event | `event` | Text — `capture` or `complete` |
| Gate Mode | `gate_mode` | Text — `first`, `last` or `off` |
| Submitted At | `submitted_at` | **Text**, not Date |

`submitted_at` is a full ISO 8601 timestamp (`2026-09-25T07:20:50.123Z`). GoHighLevel date
fields expect a date, not a timestamp, and will either reject it or silently drop the
time. Store it as Text.

`event` does not strictly need a custom field — it is available in the workflow trigger
whether or not it is stored on the contact. Create it only if you want to see on the
record which stage they reached.

### Scoring (5)

| Field name | Key | Type |
| --- | --- | --- |
| Readiness Step | `readiness_step` | Number — 1 to 5 |
| Readiness Step Name | `readiness_step_name` | Text — Curious, Trying things, Ready, Proven, Built in |
| Readiness Confidence | `readiness_confidence` | Text — `clear` or `borderline` |
| Questions Answered | `questions_answered` | Number |
| Questions Total | `questions_total` | Number |

`readiness_step` is the field worth segmenting on. `readiness_step_name` is the same thing
in words, for use in emails.

### Answers (9)

| Field name | Key | Type |
| --- | --- | --- |
| Industry | `answer_industry` | Text |
| Headcount | `answer_headcount` | Text |
| Role | `answer_role` | Text |
| AI Stance | `answer_stance` | Text |
| AI Uses Today | `answer_uses` | Large Text — multi |
| Data Homes | `answer_data` | Large Text — multi |
| Would Own It | `answer_owner` | Text |
| Blockers | `answer_blockers` | Large Text — multi |
| Priority To Fix | `answer_priority` | Large Text — free text, up to 300 chars |

Values arrive as the **labels the visitor saw**, not internal codes: `Manufacturing`, not
`manufacturing`.

The three multi-select fields join their values with ` | `:

```
answer_uses = Writing, email and proposals | Quoting and estimating
```

The separator is a pipe rather than a comma because several option labels contain commas
of their own, which would make a comma-joined value impossible to split apart.

Single-answer fields can be Single Options instead of Text if you want them filterable,
but then the option list in GoHighLevel has to match `lib/questions.ts` exactly, and has
to be updated whenever a question changes. Text is the lower-maintenance choice.

### Result (8)

| Field name | Key | Type |
| --- | --- | --- |
| Result Headline | `result_headline` | Text |
| Where You Are | `result_where_you_are` | Large Text |
| Strengths | `result_strengths` | Large Text |
| Gaps | `result_gaps` | Large Text |
| Next Actions | `result_next_actions` | Large Text |
| Opportunities | `result_opportunities` | Large Text |
| Closing Note | `result_closing_note` | Large Text |
| Result Source | `result_source` | Text — `claude` or `mock` |

These are empty on the `capture` event and filled on `complete`.

`result_next_actions` and `result_opportunities` run long — 450 to 650 characters in
testing, and longer once Claude is writing them instead of the fallback scorer. Both must
be Large Text; a single-line Text field will truncate them.

## Mapping notes

**Map against a `complete` sample.** Both events now carry the same 42 keys, so either
works, but a `complete` sample has real values in the result fields, which makes the
mapping screen far easier to read.

**Filter the workflow on `event`.** The webhook fires twice per visitor. Put a condition
straight after the trigger — `event` is equal to `complete` — on any workflow that needs
the answers or the result. Otherwise every lead runs it twice, once with empty result
fields.

**Empty strings overwrite.** Because the schema is stable, a `capture` event carries empty
result fields. It always arrives before its `complete`, so the end state is correct, but
do not build anything that reads the result fields off the `capture` event.
