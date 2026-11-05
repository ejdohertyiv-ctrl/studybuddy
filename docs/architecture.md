# StudyBuddy architecture

This is the original engineering brief, kept whole. Later decisions that change it are listed in [Changes since the brief](#changes-since-the-brief) at the end; where they conflict, the later decision wins.

## What StudyBuddy is

A study app with three modes:

- **Quick Review:** flashcards plus adaptive re-tests.
- **Focused Review:** a short diagnostic, then guided teaching of weak topics.
- **Exam Practice:** mock exams in the professor's format.

A dashboard and calendar come later. It works for any class with an exam.

The method (not this code, which didn't exist yet) was tried for real on MGM 301 (marketing) Exam 2 prep: one learner, run by hand in a Claude chat and logged to a page, over 46 sessions, 243 graded answers and 41 observations. Scores went from 6/16 on a diagnostic to 18/20 on the professor's practice exam, which allowed unlimited retakes. The real exam score was 90 (reported by the owner on November 4, 2026). That is one learner, and it can't separate the method from the extra study hours.

## Product rules the code must support (from that test)

1. Record which wrong answer was picked on every miss. Almost all misses were mix-ups between sibling terms (e.g. zone vs. location-based pricing). This drives contrast cards and wrong options built from sibling terms.
2. Re-test a missed concept from a NEW angle, right away and again a day later. The right answer must not always be the term that was missed, so a re-test can't be passed from memory.
3. Exam Practice uses the professor's practice exam as the format and weighting template when one is uploaded. Otherwise, tune question types to how each concept is likely tested (formula → calculation, process/cause-effect → scenario, look-alike terms → multiple choice, rules → true/false).
4. Many more scenario questions. These were the real-test surprise.
5. Mock exams draw heavily from never-drilled terms. All misses on one mock were undrilled terms.
6. Logging is fully automatic. The learner never types in scores.
7. A right answer the learner was unsure of is not mastery (confidence matters).
8. Questions support A–E multiple choice, true/false, scenario and calculation.

## Engineering decisions (settled)

- One private GitHub repo: this one.
- TypeScript everywhere, `strict` on, no `any`, no unchecked casts.
- pnpm workspaces monorepo.
- Claude builds; the owner reviews every change as a pull request with a plain-English summary.
- Data model and learner model first, app last.

## Repo layout

- `apps/web`: the app people use (built last, step 5; empty for now)
- `packages/core`: shared types, the one home for every record
- `packages/learner`: learner model and scheduler (pure functions)
- `packages/questions`: question generator
- `packages/ingest`: turns slides, textbook and syllabus into concepts
- `tools/replay`: replays the Exam 2 log through the learner model
- `docs/architecture.md` and `docs/decisions/` (one record per decision: `NNNN-title.md` with context, decision, consequences)
- `data/fixtures/`: small made-up sample data, committed
- `data/private/`: real study logs, git-ignored, NEVER committed
- `.github/workflows/`: format, lint, type-check and tests on every push

## Principles

1. **The core is pure.** The learner model and scheduler take data in and return decisions out. No database, network or clock inside.
2. **One home for each idea.** Every record is defined once, in `packages/core`.
3. **Types are the contract.** Packages talk only through exported types.
4. **Small packages with one job each.**
5. **Tests live beside the code** (`name.test.ts` next to `name.ts`), using Vitest.
6. **No secrets in the repo.** A `.env.example` lists what's needed, with fake values.
7. **Personal study data is never committed.**
8. **Every decision that would make someone ask "why?" gets a decision record.**

## Conventions

- Files kebab-case (`confusion-pairs.ts`); types PascalCase (`AnswerEvent`); functions and variables camelCase, functions verb-first (`scheduleRetest`).
- Prettier formatting; ESLint with TypeScript rules; warnings fail the build.
- Conventional Commits: `feat(learner): re-test misses from a new angle`.
- `main` is protected; short-lived branches (`feat/answer-log`); merge by PR only, checks must pass, the owner approves.
- Exact dependency versions, lockfile committed. Nothing merges on a red build.

## Data model (first draft, refined in increment 1)

- **Course:** name, term, exam dates, allowed aids
- **Topic:** course, name, chapters, lecture, exam weight
- **Concept:** topic, term, definition, source (slides/text/both), kind (formula/process/look-alike/rule), sibling group
- **Question:** concept, format (A–E, scenario, true/false, calculation), stem, options, answer, angle
- **AnswerEvent:** question, session, picked option, correct, confidence, time taken, timestamp
- **Session:** mode, started, ended, course
- **ConfusionPair:** concept A, concept B, times confused, the tell that separates them
- **ConceptState:** concept, status (new/re-test/one more/mastered), next re-test date

ConfusionPair and ConceptState are derived by the learner model from AnswerEvents, never typed in. The answer log is the single source of truth.

## Build order (as originally written)

Each step is one or more PRs and ends with something the owner can check.

0. Repo setup: folders, TypeScript, Prettier, ESLint, Vitest with one passing test, CI workflow, README, CLAUDE.md, decision record 0001 (TypeScript monorepo). Done when the test passes on GitHub.
1. Data model in `packages/core`. Done when every record has a type and sample fixture data.
2. Learner model in `packages/learner`, replayed on the Exam 2 log via `tools/replay`. Done when it flags the same weak spots the real prep found (zone pricing, PLC stages, divisibility). The owner exports the real log into `data/private`.
3. Question generator in `packages/questions`, tried on one MGM 301 chapter.
4. Course import in `packages/ingest`, PDF slides first (many are image-only).
5. Thin web app in `apps/web`; one Quick Review session start to finish.

Open questions in the original brief, not blocking steps 0–2: web framework (leaning Next.js), database and hosting (leaning Postgres with a free student tier), which AI model writes questions (leaning Claude API), and accounts (not needed until someone besides the owner uses it).

## Changes since the brief

- **"Steps" are now "increments".** Increment 0 is this repo setup. The current order is in [increment-plan.md](increment-plan.md).
- **StudyBuddy runs inside the learner's own Claude or ChatGPT** ([decision 0002](decisions/0002-run-inside-claude-and-chatgpt.md)):
  - `apps/web` becomes `apps/server` (an MCP server) and `apps/screens` (in-chat screens).
  - The learner's Claude or ChatGPT writes questions, so "Claude API" and "Next.js" are no longer the leanings.
  - `packages/questions` becomes question specs and a checker.
  - Hosting stays at $0 until revenue.
- **TypeScript 6, not 7, and no build step** ([decision 0001](decisions/0001-typescript-monorepo.md)).
- **Every record gets an owner ID from increment 1,** so personal data stays separable when friends join.
- **The shared planning home** (`OneDrive\Documents\ChatGPT\Brainstorm_Bot\StudyBuddy`, since November 1, 2026) is the home for product plans, user flows, screen designs and research. It replaced `OneDrive\Desktop\Claude\StudyBuddy`, which is kept as history. This repo is the home for technical docs and code.
