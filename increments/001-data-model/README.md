# 001 — Data model

**Status:** Under review. [Pull request #2](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/2) is open and waits for increment 000 ([#1](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/1)) to merge first. Some review findings need the owner's agreement (see below).

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

Both steps share pull request #2. Step 1.2 fixes 1.1's review findings.

| Step | What                                                                                                                      | Status       |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1.1  | Records, grading helpers, sample course, data-model doc, decision 0003                                                    | Under review |
| 1.2  | Review fixes: grades must fit their question; times must be real and zoned; tied corrections refused; decimal-safe totals | Under review |

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
  - A "graded" result scores every rubric part (design judgment, R14).

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
| R6  | Question shape rules (exactly one right option, sibling tags only on wrong options, rubric parts tied to the question's concepts) exist only in the sample-data test, not as a reusable check.                   | **Deferred to increment 004** (question checker), per the roadmap. Owner to confirm.                                           |
| R7  | `SourceDocument.uploadedBy` is shared with the class, so classmates could see who uploaded a file.                                                                                                               | **Open for the friends beta** (privacy decision). Harmless while there's one user.                                             |
| R8  | Nothing yet says who may edit shared course content.                                                                                                                                                             | **Open for the friends beta.**                                                                                                 |
| R9  | Calculation units are free text ("%" vs "percent"), and whether 25% is stored as 25 or 0.25 isn't defined.                                                                                                       | **Open:** decide when calculation grading is built.                                                                            |
| R10 | Changes from the brief's first draft: the concept's source is a list of slide or page locations (not slides/text/both); "correct" is calculated, not stored; exam dates and allowed aids live on an Exam record. | Accepted as part of the approved proposal.                                                                                     |
| R11 | Exam dates (`IsoDate`) aren't checked yet, because nothing reads them.                                                                                                                                           | Add a strict reader when the first feature uses exam dates.                                                                    |
| R12 | Concept statuses (new, re-test, one more, mastered) come from the brief; what earns "mastered" isn't defined.                                                                                                    | **Increment 002.**                                                                                                             |
| R13 | Two corrections at the same latest moment are refused rather than one being picked.                                                                                                                              | Design judgment; no corrections exist yet.                                                                                     |
| R14 | A "graded" result must score every rubric part; an "unresolved" one may score only some.                                                                                                                         | Design judgment based on the approved part-by-part grading rule. Owner FYI.                                                    |

## Remaining limitations

- Real-world fit is unvalidated until increment 002 replays the real Exam 2 log.
- No validation library yet. Real logs will need runtime checks; that decision comes in 002.
