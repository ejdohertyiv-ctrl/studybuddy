# 0004 — "Not recorded" values for imported history

- **Status:** Accepted, November 5, 2026 (increment 1, step 1.4).
- **Related:** [0003](0003-data-model.md) (the data model this extends), [data-model.md](../data-model.md), [increment 001](../../increments/001-data-model/README.md#step-13-findings) (the load-test findings behind it), [load-test blueprint](../load-test-blueprint.md).

## Context

The load test (step 1.3) put 30 real Exam 2 answers into the records. The log never kept how long answers took, whether hints were used, when each answer was given (only one time per session), or the question itself. The records required all four, so the only way to store the log would have been to make values up. The owner's rule is never to invent a value that wasn't recorded.

## Decision

Approved by the owner on November 5, 2026 (shared planning home, `plan/step-1.4-blueprint.md`), plus one clarification the same day:

1. **Time taken** is either measured or "not recorded" (`timeTaken`).
2. **Hints used** can be "not recorded" (`Assistance`).
3. **When an answer was given** is either an exact time, or "during this session, at position N" (`answeredAt`). The order is kept and no time is made up. A session uses one or the other, never both, and positions don't repeat.
4. **Imported questions** (`ImportedQuestion`) hold only the source's label, the topic and the rubric, and may lack a concept until increment 002 links it. They have no check status, so they never count as checked questions and are never asked again. Grading helpers work on both kinds of question.
5. **"Not recorded" is only for imported history.** Answers given in StudyBuddy always record hints, exact time and time taken; the checks refuse otherwise. Clarification (owner, November 5, 2026): the practice card now measures time taken instead of saving "not recorded".

"Not recorded" never means 0, "no hint", fast or slow. Anything that learns from answers must skip it, not guess.

## Consequences

- The real Exam 2 log can be stored honestly, so increment 002 can replay it.
- The one answer saved by the connection test before this change (time saved as 0, never measured) is read as "not recorded".
- Increment 002 still has to link logged terms to concepts (F5) and re-tests to the earlier try (F6). Three logged answers say only right or wrong, with no answer written down, so they still can't become answer records.
