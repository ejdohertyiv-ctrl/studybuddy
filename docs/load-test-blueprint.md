# Load test blueprint (step 1.3)

**Status:** approved by the owner on November 5, 2026. Written by Claude. Copied from the shared planning home (`plan/load-test-blueprint.md`). Results are in [increment 001](../increments/001-data-model/README.md#step-13-findings).

**In one line:** put about 30 of your real Exam 2 answers and 10 real slides into StudyBuddy's storage setup (the foundation) and write down everything that doesn't fit. Nothing gets built on top until this is done.

## What gets tested

**30 answers from your Exam 2 log** (out of 243), picked to cover the awkward cases, not just the easy ones:

| Kind                                                      | How many         | Why                                                                                         |
| --------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| Misses with a note ("picked dropping, answer harvesting") | about 10         | The most useful records. Includes zone pricing, product life cycle stages and price changes |
| Right answers                                             | about 8          | The everyday case                                                                           |
| Answers marked as a guess                                 | both of them (2) | The only thing in the log close to an "unsure" mark                                         |
| "Torn between two" (logged as "c/d")                      | the one there is | StudyBuddy only takes one picked answer                                                     |
| Re-tests of an earlier miss                               | about 5          | They have to link back to the first try                                                     |
| Answers with no answer written down                       | about 3          | 16 in the log only say right or wrong                                                       |
| At least one from each of the 8 topics                    | —                | No topic left out                                                                           |

**10 slides from one deck:** "Pricing - 1" (lecture 10), because your pricing misses point back to it.

## What we already know won't fit cleanly

From a first look at the log:

- **No question text.** The log stores a question number (like "5" or "F1"), not the question itself, its options or its answer key. StudyBuddy expects every answer to point at a full question.
- **Mostly words, not letters.** 206 of the 243 answers are written out ("Persuasive"), 20 are a letter, 1 is "c/d" and 16 are blank.
- **No time taken** per answer, and only one time per session, not per answer.
- **Points.** The log says right or wrong, and StudyBuddy stores points.

The test will confirm these and find any others.

## How the missing parts get handled (your decision)

The rule is to never invent anything you didn't record.

| Missing       | Recommended handling                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Points        | Treat each logged question as **one part worth 1 point**: right = 1, wrong = 0. Multiple choice is all-or-nothing anyway, so this adds nothing new |
| "Unsure"      | Marked unsure **only** where you logged a guess (2 answers). Everything else is "not marked", which StudyBuddy already treats as no information    |
| Time taken    | Recorded as **unknown**. StudyBuddy currently requires a number, so this is a gap to fix, not a 0                                                  |
| Question text | The question record says **"not recorded"**. Where your note names the right answer, that's kept as a note, not as an answer key                   |
| Who graded it | Recorded as graded by Claude in chat, labeled as imported from the Exam 2 log                                                                      |

## What counts as passing

1. All 30 answers and 10 slides go into StudyBuddy's records, or each one that can't has a written reason.
2. StudyBuddy's existing checks run on them with no errors, or each error is explained.
3. Nothing is made up: every value either came from your log or slides, or is marked "unknown" or "not recorded".
4. A short list of changes the foundation needs (for example, allowing "time unknown"), each one labeled as fix now or fix in a later floor.
5. Your real answers stay in the private folder on your computer and never go to GitHub. Only the findings do.

## What you do

- Say OK to this plan, or change the handling table.
- Later, read a short summary of what didn't fit and approve the fix list.

## Not included

- Building the thermostat (the learner model) or any screens.
- Fixing the gaps it finds. Those become their own approved step.
