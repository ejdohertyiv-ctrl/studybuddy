# Data model

**Status: approved October 30, 2026 and built in increment 1** ([decision 0003](decisions/0003-data-model.md)). The real definitions live in `packages/core` (the one home for every record); this page is the plain-English explanation. Made-up sample data is in `data/fixtures`.

## The big idea

StudyBuddy keeps three kinds of records:

1. **Course content:** what there is to learn. One copy per class, **shared** by everyone in that class (product rule: build the question bank once, reuse it).
2. **Study history:** what one learner did. **Private** to that learner. The answer log is the single source of truth.
3. **Derived records:** what the learner model _concludes_ from the history. Never typed in; always recalculated.

Every record has an `id`. Every private record has an `ownerId`, so friends' data never mixes.

## 1. Course content (shared per class)

| Record             | What it is                                                  | Key fields                                                                                                                            |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Course**         | A class in a term                                           | code (`MGM 301`), name, term, professor                                                                                               |
| **Exam**           | One exam in that course                                     | name, date, allowed aids, optional format template from the professor's practice exam (how many of each question type, topic weights) |
| **SourceDocument** | A lecture deck, textbook chapter, syllabus or practice exam | kind, title, number of pages or slides. The original file stays private to whoever uploaded it; only its description is shared.       |
| **SourceLocation** | A precise place in a source                                 | document, page or slide number, optional short excerpt                                                                                |
| **Topic**          | A chunk of the course                                       | name, chapters, lecture, exam weight                                                                                                  |
| **Concept**        | One thing to learn, e.g. "zone pricing"                     | term, definition, kind (formula, process, look-alike, rule), sibling group, prerequisites, where it came from                         |
| **Question**       | One question                                                | concept(s), format, stem, options, answer key, rubric, angle, family, difficulty, check status, sources                               |

**Question details that matter:**

- **Formats:** A–E multiple choice, true/false, scenario, calculation (product rule 8).
- **Each wrong option is tagged with the concept it stands for.** If you pick "location-based pricing" when the answer is "zone pricing", StudyBuddy knows exactly which sibling you confused it with (product rule 1).
- **Angle:** how the question approaches the concept, for example definition, example, scenario, contrast, or _reverse_ (the right answer is not the term itself). Re-tests use a new angle (product rule 2).
- **Rubric:** the question's points split into parts, each part tied to the concept it tests (your approved grading rules).
- **Family:** questions made from the same template are related, so a number-swapped variant isn't counted as fresh evidence.
- **Difficulty:** stored with an honest label: _unknown_, _provisional_ or _calibrated_. Never treated as certain because an AI guessed it.
- **Check status:** _draft_, _checked_ or _rejected_. Only checked questions count toward grades and the learner model.

## 2. Study history (private to each learner)

| Record                | What it is                 | Key fields                                                                                                         |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Learner**           | A person using StudyBuddy  | display name (no email or sign-in details until the friends beta)                                                  |
| **Session**           | One sitting                | mode (Quick Review, Focused Review, Exam Practice), course, started, ended, what was in scope                      |
| **AnswerEvent**       | One answer to one question | details below                                                                                                      |
| **GradingCorrection** | A fix to an earlier grade  | which answer, the new grade, the reason, when. The original grade is kept, never overwritten (your approved rule). |

**An AnswerEvent records:**

- **The response:** the option picked, typed text, or a number. ("I don't know yet" as its own kind of response was proposed and deliberately left out; see decision 0003.)
- **Confidence, optional, as a single "unsure" flag:** marked or not marked. Not marked is **not** evidence of confidence either way (your approved rule).
- **Help used:** none, hint, or worked example.
- **Time taken and when it was submitted.** Time is stored but, per your plan, never used alone to judge ability.
- **The grade:**
  - _Status:_ graded, not graded yet, or couldn't be graded reliably.
  - _Points:_ earned out of available, plus points for each rubric part.
  - _Graded by:_ code (multiple choice, true/false, calculations) or AI (open answers), with a version, so grades can be audited later.

"Correct / Partly correct / Incorrect" isn't stored. It's worked out from the points, so it can never disagree with them.

## 3. Derived records (calculated, never typed in)

| Record            | What it is                            | Notes                                                                                |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| **ConfusionPair** | Two concepts a learner mixes up       | how often, last time, and "the tell" that separates them                             |
| **ConceptState**  | Where a learner stands on one concept | status (new, re-test, one more, mastered), next re-test date, the evidence behind it |

Increment 1 defines simple versions of these. Increment 2 (the learner model) finalises them, because how "mastered" is decided belongs there. Per your plan, mastery is never declared from a streak of right answers to the same question, and an unsure right answer doesn't count (product rule 7).

## Technical notes (no decision needed)

- IDs are text with a type attached, so a concept's ID can't be passed where a question's ID is expected.
- Dates and times are stored as ISO text, such as `2026-10-30T13:00:00Z`. The learner model never reads the clock itself; the time is passed in.
- Sample data in `data/fixtures/` is written in TypeScript and type-checked, so it can't drift from the records. It covers a made-up course, not MGM 301.
- Reading real exported logs, which needs checking at runtime, comes in increment 2 with the replay tool.

## Left for later (not in increment 1)

- Sign-in details, invites, sharing settings (friends beta).
- Grading-issue reports and the "Reviewed" mark on results (screens).
- Slide-walkthrough progress. SourceDocument and SourceLocation leave room for it; its own records come once the walkthrough is planned.
- Exact confidence wording on screen, difficulty scale, and learner-model formulas (increment 2 and later).
