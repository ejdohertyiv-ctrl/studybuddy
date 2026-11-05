# 001 — Data model

**Status:** In progress. Steps 1.1 and 1.2 were merged on November 4, 2026 ([pull request #2](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/2)). Step 1.3, the real-data check (the load test), was run on November 5, 2026: 30 real Exam 2 answers and 10 real slides were put into these records. Every answer and slide either fit or has a written reason, and the existing checks found no errors. It also found [gaps](#step-13-findings) the records need fixed before increment 002 can replay the real log. The owner merged step 1.3 ([pull request #6](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/6)) and approved those fixes as step 1.4 on November 5, 2026 (plan: shared planning home, `plan/step-1.4-blueprint.md`).

## Outcome and scope

**User outcome:** every piece of information StudyBuddy will keep has one agreed shape, so the learner model (increment 002) can be built on records that already enforce the product rules.

**Included:**

- Record types in `packages/core`:
  - shared course content
  - private study history, with an `ownerId` on every record
  - simple derived records
- Small pure helpers that read grades and times.
- A made-up sample course in `data/fixtures`.
- `docs/data-model.md` and [decision 0003](../../docs/decisions/0003-data-model.md).

**Excluded:**

- How mastery is decided, re-test scheduling and confusion detection (002).
- Checking AI-written questions (004).
- Reading real exported logs (002).
- Screens, sign-in and sharing.
- "I don't know yet" as a response kind (deliberately left out by the owner).

## Steps

Steps 1.1 and 1.2 share pull request #2. Step 1.2 fixes 1.1's review findings. Step 1.3 was added on November 1, 2026 by the data-quality gate and will get its own pull request.

| Step | What                                                                                                                      | Status                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1.1  | Records, grading helpers, sample course, data-model doc, decision 0003                                                    | Merged November 4, 2026   |
| 1.2  | Review fixes: grades must fit their question; times must be real and zoned; tied corrections refused; decimal-safe totals | Merged November 4, 2026   |
| 1.3  | Real-data check: express a small real sample in these records, kept in `data/private/` (see the gate below)               | Merged November 5, 2026   |
| 1.4  | Fix the gaps step 1.3 found that block increment 002                                                                      | Approved November 5, 2026 |

## Requirements and decisions

- Brief, build order step 1: "Done when every record has a type and sample fixture data" ([architecture](../../docs/architecture.md)).
- The owner's approvals on October 30, 2026: proposal items 1, 2, 3, 5 and 6, plus confidence as a single "unsure" flag. Item 4 ("I don't know yet") was confirmed out. All recorded in [decision 0003](../../docs/decisions/0003-data-model.md).
- Approved planning rules this follows (planning folder, `plan/app-outline.md`):
  - points per rubric part
  - not-graded-yet and unresolved grades are never shown as a learning result
  - corrections kept alongside the original grade
  - optional confidence, where a missing rating means nothing
  - no mastery from a streak

## Dependencies and assumptions

- **Depends on:** 000 (repo setup).
- **Assumptions:**
  - Rubric points are finite, non-negative and may be fractions.
  - IDs are unique within their kind.
  - A "graded" result scores every rubric part (agreed by the owner, R14).

## Acceptance criteria

| Criterion                               | Result                                                                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every record has a type                 | Met: 14 record types plus their parts, in `packages/core/src/`                                                                                                                                                       |
| Every record has sample fixture data    | Met: course, exam (with format template), source document, source location, topic, concept, question (all four formats), learner, session, answer, correction, confusion pair, concept state                         |
| Approved items reflected in the records | Met: `ownerId` on private records (1), `standsForConceptId` on wrong options (2), rubric points, statuses and corrections (3), `SourceDocument` and `SourceLocation` (5), simple derived records (6), `markedUnsure` |
| No real study data committed            | Met: the sample course "MKT 100" is invented; repo checks pass                                                                                                                                                       |
| Bad data is refused, not misread        | Met after step 1.2 (R1–R4)                                                                                                                                                                                           |
| `pnpm check` passes                     | Met: 43 tests                                                                                                                                                                                                        |
| CI passes on GitHub                     | Checked on the PR                                                                                                                                                                                                    |

## Examples

Each one is covered by a test, and the expected results were worked out by hand:

- **The learner picks "Penetration pricing" on a price-skimming question.** That option is tagged with the penetration-pricing concept, so the mix-up is recorded as a pair of concepts, not just "wrong".
- **A 3-point question with parts worth 1 and 2:**
  - 1 + 2 earned → **correct**
  - 1 + 0 → **partly correct**
  - 0 + 0 → **incorrect**
  - an unresolved grade with 1 point on the gradable part → **unresolved**, never "partly correct"
- **A grader gives 5 points on a 1-point part.** That's an **error**, never "correct".
- **A correction at 12:30 New York time (16:30 UTC) beats one at 16:00 UTC,** even though "12" sorts before "16" as text.
- **Two corrections at the same latest moment** (16:00 UTC, and 12:00 at UTC−4) are an **error**, because it's unclear which grade stands.
- **`2026-02-30T00:00:00Z`, `2026-10-30T12:00:00` (no zone) and `yesterday`** are **errors**. `2028-02-29T00:00:00Z` is fine, because 2028 is a leap year.
- **Rubric parts of 0.1, 0.2 and 0.3 with full marks** are **correct**, despite computer rounding (0.6000000000000001 vs 0.6).

## Verification

- `pnpm check` passed locally: format, lint, type-check, 43 tests, repo checks.
- **Tests of components:**
  - `ids.test.ts`
  - `time.test.ts`
  - `grading.test.ts`, covering normal, boundary, partial, invalid and failure cases
- **Test of the sample as a whole** (`sample-course.test.ts`):
  - every reference resolves
  - every grade fits its question, using the one authoritative check
  - every time is real
  - the story grades as described
- **What this does not establish:**
  - The sample data is synthetic. It shows the records can express the product rules, not that they fit real course material or real study logs. Increment 002's replay of the real Exam 2 log is the first real-data test.
  - There's no learner-facing flow yet, so nothing can be traced to a visible result.

## Review findings

| #   | Finding                                                                                                                                                                                                          | Resolution                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| R1  | A missing or unreadable correction time was silently treated as "oldest", so a real correction could lose without anyone noticing.                                                                               | **Fixed in 1.2:** strict ISO date-times with a zone.                                                                           |
| R2  | JavaScript quietly rolls impossible dates forward (30 February → 2 March; 24:00 → the next day).                                                                                                                 | **Fixed in 1.2:** the date and time must exist.                                                                                |
| R3  | A grade inconsistent with its question (points over a part's maximum, a stray or duplicate part, an unscored part) was still turned into correct, partly correct or incorrect.                                   | **Fixed in 1.2:** `findEvaluationProblems` is the one authoritative check, and `categorizeResult` refuses inconsistent grades. |
| R4  | Decimal points could make full marks look like partly correct.                                                                                                                                                   | **Fixed in 1.2:** comparisons allow tiny rounding error.                                                                       |
| R5  | The sample-data test had its own copy of the points rule.                                                                                                                                                        | **Fixed in 1.2:** it now uses the authoritative check.                                                                         |
| R6  | Question shape rules (exactly one right option, sibling tags only on wrong options, rubric parts tied to the question's concepts) exist only in the sample-data test, not as a reusable check.                   | **Deferral agreed (October 30, 2026):** built in increment 004 (question checker).                                             |
| R7  | `SourceDocument.uploadedBy` is shared with the class, so classmates could see who uploaded a file.                                                                                                               | **Open for the friends beta** (privacy decision). Harmless while there's one user.                                             |
| R8  | Nothing yet says who may edit shared course content.                                                                                                                                                             | **Open for the friends beta.**                                                                                                 |
| R9  | Calculation units are free text ("%" vs "percent"), and whether 25% is stored as 25 or 0.25 isn't defined.                                                                                                       | **Open:** decide when calculation grading is built.                                                                            |
| R10 | Changes from the brief's first draft: the concept's source is a list of slide or page locations (not slides/text/both); "correct" is calculated, not stored; exam dates and allowed aids live on an Exam record. | Accepted as part of the approved proposal.                                                                                     |
| R11 | Exam dates (`IsoDate`) aren't checked yet, because nothing reads them.                                                                                                                                           | Add a strict reader when the first feature uses exam dates.                                                                    |
| R12 | Concept statuses (new, re-test, one more, mastered) come from the brief; what earns "mastered" isn't defined.                                                                                                    | **Increment 002.**                                                                                                             |
| R13 | Two corrections at the same latest moment are refused rather than one being picked.                                                                                                                              | Design judgment; no corrections exist yet.                                                                                     |
| R14 | A "graded" result must score every rubric part; an "unresolved" one may score only some.                                                                                                                         | **Resolved:** the owner agreed (October 30, 2026).                                                                             |

## Remaining limitations

- Real-world fit is unvalidated until step 1.3 passes. Under the data-quality gate, that check now comes before increment 002, not during it.
- No validation library yet. Real logs will need runtime checks; that decision comes in 002.

## Data-quality gate

Applied after the fact on November 1, 2026. These gaps are recorded, not rebuilt. Each one is assigned to the increment that needs it.

| Critical input                  | Likely failure                                         | Check today                                                                | On failure                                |
| ------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------- |
| Grades (points per rubric part) | Points over a part's maximum, stray or missing parts   | `findEvaluationProblems`; `categorizeResult` refuses (tested, hand-worked) | Error with a plain reason, never a result |
| Unresolved grades               | Shown as a learning result                             | `categorizeResult` returns "unresolved" (tested)                           | Kept apart, never "partly correct"        |
| Times                           | Impossible dates, missing zones, text like "yesterday" | Strict readers in `time.ts` (tested)                                       | Error                                     |
| Corrections                     | Two at the same moment                                 | Refused (tested)                                                           | Error                                     |
| AI-written questions            | Wrong key, ambiguous, unsupported                      | `checkStatus` is draft, checked or rejected; nothing enforces it yet       | **Gaps G2, G3**                           |
| AI-extracted concepts           | Made up, missing, or a distorted definition            | **None:** `Concept` has no check status                                    | **Gap G1**                                |
| Real exported logs and slides   | Don't fit the records                                  | **Not tested:** only the made-up "MKT 100" sample has been used            | **Gap G5**                                |

**Gaps:**

| #   | Gap                                                                                                                                                                                                                                                                                              | Blocks        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| G1  | `Concept` has no draft, checked or rejected status, so AI-extracted concepts can't be held as drafts.                                                                                                                                                                                            | Increment 005 |
| G2  | A draft or rejected `Question` has no reason field, so the learner can't see why it was held back.                                                                                                                                                                                               | Increment 004 |
| G3  | "Only checked questions count" is a comment on the type. No function enforces it yet; the learner model has to, with a test.                                                                                                                                                                     | Increment 002 |
| G4  | Nothing checks the shape of incoming data at runtime (already noted above).                                                                                                                                                                                                                      | Increment 002 |
| G5  | **Tested November 5, 2026 (step 1.3); fixes F1–F4 pending in step 1.4.** Was: real-data fit is untested. **Step 1.3** expresses about 30 real Exam 2 answers and about 10 real slides in these records, runs the existing checks on them, and records every field that can't hold the real data. | Increment 002 |

**What step 1.3 uses.** Both samples were found on November 1, 2026. An earlier note here said they were missing; that was wrong, because the search was cut short. They are kept outside the repo in the owner's private materials folder (`C:\Users\ejdoh\dev\studybuddy-materials`). Only the small samples step 1.3 uses get copied into `data/private/`.

1. **The Exam 2 log:** a read-only export of the database behind the owner's Exam 2 log page on claude.ai: 46 sessions and 243 graded answers. Step 1.3 uses about 30 of them, including the zone pricing, PLC stages and divisibility misses. The log records right or wrong, the answer, the wrong option picked, the topic and notes. It has **no rubric points and no "unsure" mark**, so step 1.3 must decide how answers logged before the app exist map onto `Evaluation` and `markedUnsure` without inventing either one.
2. **One real lecture deck:** `MGM301_10_Pricing - 1.pptx` (proposed, because it covers zone pricing), of which about 10 slides are used.

Nothing from these samples counts as validation until step 1.3 is done and reviewed. The sample course stays a development aid.

### Step 1.3 findings

Run on November 5, 2026 with `node tools/load-test/src/main.ts <materials folder>`, following the [blueprint the owner approved that day](../../docs/load-test-blueprint.md). The sample and the detailed report stay in `data/private/load-test/`. Only these counts are committed.

**Sample:** 30 answers from 15 sessions: both guesses (one of them the "c/d" answer), 6 misses on key concepts (zone pricing four times, the decline stage, divisibility), 4 other misses with notes, 5 re-tests, 3 with no answer written, and 10 right answers. All 8 topics are covered. Plus slides 1–10 of `MGM301_10_Pricing - 1.pptx`, as text.

**How the missing parts were handled (owner, November 5, 2026):** each logged question is one part worth 1 point (right = 1, wrong = 0), graded by `ai`, version `exam2-log-import`. Unsure is true only for a logged guess. Nothing else is filled in.

| Field                              | Fits                           | Fits, with a note                                           | Missing, allowed | Missing, required            | Nowhere to keep it                            |
| ---------------------------------- | ------------------------------ | ----------------------------------------------------------- | ---------------- | ---------------------------- | --------------------------------------------- |
| Session mode, start time, topics   | 15 sessions, 30 answers        |                                                             |                  |                              |                                               |
| Session end time                   |                                |                                                             | 15               |                              |                                               |
| Session title and note             |                                |                                                             |                  |                              | 15                                            |
| Session score vs. its answers      | 15 match                       |                                                             |                  |                              |                                               |
| Question text, options, answer key |                                |                                                             |                  | 30                           |                                               |
| Answer given                       |                                | 26 (14 as words, 12 as a letter whose options weren't kept) |                  | 3                            | 1 ("c/d")                                     |
| Unsure                             | 30                             |                                                             |                  |                              |                                               |
| Hints used                         |                                |                                                             |                  | 30                           |                                               |
| Time taken                         |                                |                                                             |                  | 30                           |                                               |
| When answered                      |                                |                                                             |                  | 30 (only the session's time) |                                               |
| Grade (points)                     | 30, all agree with right/wrong |                                                             |                  |                              |                                               |
| Grade note                         |                                | 11                                                          |                  |                              |                                               |
| Concept the answer tests           |                                |                                                             |                  | 30 (a name at best, no link) |                                               |
| Re-test of an earlier miss         |                                |                                                             |                  |                              | 5                                             |
| Question source tag                |                                |                                                             |                  |                              | 1                                             |
| Deck, slide numbers                | 1 deck, 10 slides              |                                                             |                  |                              |                                               |
| Slide text                         |                                | 10 (only as an excerpt)                                     |                  |                              |                                               |
| Slide pictures and charts          |                                |                                                             |                  |                              | 4 slides that are only a title plus a picture |

The log's shape was also checked as it was read: all 46 sessions and 8 topics passed.

**What it means:** grades fit fine. Everything about _what was asked_ and _when_ doesn't, because the log never kept it and the records have no way to say "not recorded". The thermostat (increment 002) needs at least the concept each answer tests and a way to hold "not recorded".

**Fix list (F1–F4 approved by the owner as step 1.4, November 5, 2026):**

| #   | Fix                                                                                                                                                 | When                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| F1  | Time taken can be "unknown"                                                                                                                         | Step 1.4, before 002                  |
| F2  | Hints used can be "unknown"                                                                                                                         | Step 1.4                              |
| F3  | An answer can carry only its session's time, marked as such                                                                                         | Step 1.4                              |
| F4  | An imported question can exist with only its label, topic and concept, marked "imported, text not recorded", and never counts as a checked question | Step 1.4                              |
| F5  | Link each logged term to a concept record (exact matches only, the rest listed for the owner)                                                       | Increment 002, when replaying the log |
| F6  | A re-test points back to the try it re-tests                                                                                                        | Increment 002                         |
| F7  | "Torn between two" as a response                                                                                                                    | Decide with the screens (006)         |
| F8  | A slide record that keeps a slide's title and text; pictures need a separate route (see increment 003's file test)                                  | Increment 005                         |
| F9  | Session titles and notes                                                                                                                            | Not needed; leave out                 |

**Gate: step 1.3 is done. Increment 002 stays blocked until step 1.4 (F1–F4) is merged.**
