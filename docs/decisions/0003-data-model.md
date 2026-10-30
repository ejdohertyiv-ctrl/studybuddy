# 0003 — Increment 1 data model

- **Status:** Accepted, October 30, 2026 (increment 1).
- **Related:** [data-model.md](../data-model.md) (plain-English explanation), `packages/core` (the definitions), [0002](0002-run-inside-claude-and-chatgpt.md).

## Context

The brief's first-draft data model needed refining before the learner model (increment 2) could be built on it. The planning folder's approved decisions also had to be reflected:

- Grades are points per rubric part.
- An answer can be "not graded yet".
- Corrections never erase the original grade.
- Confidence is optional, and a missing rating isn't evidence of low confidence.
- Mastery is never declared from a streak.

The owner reviewed a written proposal and approved it item by item.

## Decision

Approved:

1. **Course content is shared per class; study history is private.** Every private record carries an `ownerId`.
2. **Each wrong option is tagged with the sibling concept it stands for,** so a miss records the exact mix-up (product rule 1).
3. **Grades are points per rubric part.** Each grade has a status (graded, pending, unresolved) and a grader (code or AI, with a version). Corrections are separate records; the original grade is never overwritten. Correct, partly correct and incorrect are calculated from the points, never stored.
4. **Concepts and questions record which slide or page they came from** (`SourceDocument`, `SourceLocation`). This also leaves room for the slide walkthrough.
5. **Confusion and progress records are defined simply now** and finalised in increment 2 with the learner model.
6. **Confidence is a single optional "unsure" flag** (`markedUnsure`). Not marked means no information, not confidence.

Not approved: **"I don't know yet" as its own kind of response.** The proposal included it, the owner left it unselected, and then confirmed leaving it out (October 30, 2026). The planning folder's screening plan mentions an "I don't know yet" control. How that screen records such a choice gets decided when the screen is built, without adding a new response kind here.

Technical choices:

- IDs are tagged strings (`makeId("Course", "...")`).
- Times are ISO text, compared as real moments.
- Sample data is TypeScript in the `@studybuddy/fixtures` package, checked by the type checker and by a test that every reference resolves.

## Consequences

- Increment 2 can read answers, rubric points, mix-ups and unsure flags without guessing.
- Changing a record now means changing `packages/core`. The type checker then points at every place that needs updating, including the fixtures.
- Reading real exported logs needs runtime checking. That comes in increment 2 with `tools/replay`, and may need a validation library, which would get its own decision.
- Open: how the screening screen records an "I don't know yet" choice, the exact on-screen confidence wording, the difficulty scale, and how "mastered" is decided (increment 2).
