# Working on StudyBuddy

Read this before every session. The owner is a student, not a professional engineer. Claude writes and tests the code; the owner reviews and approves every change. Explain what you're doing in plain English as you go.

Background: [docs/architecture.md](docs/architecture.md) (the original brief and what changed since), [docs/increment-plan.md](docs/increment-plan.md) (the roadmap), [increments/](increments/README.md) (each increment's status and review record) and [docs/decisions/](docs/decisions/README.md) (why things are the way they are). Product plans, user flows, screen designs and research live in the planning folder, `C:\Users\ejdoh\OneDrive\Desktop\Claude\StudyBuddy`. Read `plan/app-outline.md` there before product decisions.

## How work is organised

Planning and building both happen here. Keep the agreed technology stack and architecture. Your job includes making sure unclear requirements, weak evidence and wrong assumptions don't become code.

### Increments, one at a time

- **Every increment has a record in [`increments/`](increments/README.md):** `NNN-short-name/README.md`, numbered from `000`, never renumbered. Each record holds:
  - status
  - user outcome and scope
  - links to approved requirements and decisions
  - dependencies, assumptions and open questions
  - acceptance criteria with concrete examples
  - verification results, review findings and limitations

  `increments/README.md` indexes them. Records link to canonical documents rather than copying them; code stays in its usual folders.

- **Status runs** proposed → approved → in progress → under review → complete.
- **An increment is a collection of steps, numbered `N.1` to `N.9`.** For example, increment 1's steps are 1.1, 1.2, and so on.
  - Each step is one reviewable piece of related work with its own commit or commits. Its number goes in the commit body and the PR title (`1.2 — ...`).
  - The increment's record lists every step with its status.
  - By default each step gets its own pull request, and steps ship in order. Small steps the owner approves together may share one PR.
  - More than nine steps means the increment is too big: split it into two increments.
- **Ship one increment at a time.** Plan it, get the owner's approval, build it, open its PR, and wait until the owner approves and merges it before starting the next. Don't stack a new PR on an unmerged one.
- **Before building, define the increment:** outcome, what's included and excluded, dependencies, acceptance criteria, and examples including edge cases. Check that it fits the product flow and data model.
- **Keep increments small enough to review, but complete enough to show a usable outcome.**
- **Complete means done, not compiling.** Mark an increment complete only when its acceptance criteria are met, its review findings are resolved or explicitly deferred with the owner's agreement, and its docs match what was delivered.

### Source of truth

- Keep approved requirements, proposals, research findings, assumptions and open questions clearly apart.
- Record accepted decisions in their one canonical place, and update references instead of making competing copies.
- When instructions conflict, say which newer decision supersedes the older one.
- An unanswered question, placeholder, example, or permission to investigate is **never** an approved requirement.
- **The owner validates decisions step by step.** Present recommendations with the evidence behind them, ask, and record only what was approved. Agreement to one detail is not approval of a whole feature. Don't re-ask about work already authorised.

### Check inputs before building

- Trace each meaningful behaviour to an approved requirement.
- Check requirements for ambiguity, contradictions, missing cases and dependencies.
- Name assumptions explicitly, and don't invent consequential product behaviour to fill a gap.
- Distinguish verified facts, owner decisions, design judgements and unvalidated numbers.
- If an essential input is missing or unreliable, resolve it before building what depends on it. Carry on with independent work meanwhile.

### Organise code around responsibilities

- Give each module a clear purpose. Keep each business rule in one identifiable, authoritative place.
- Avoid duplicate state, scattered configuration, hidden coupling and catch-all files.
- Add an abstraction or dependency only for a demonstrated problem.
- Keep experiments, fixtures and real behaviour clearly separate.

### Review meaning, not just code

- Check the result satisfies the intended requirement, not merely that it runs.
- Review data definitions, units, defaults, validation, missing values and transformations.
- Trace representative inputs through the whole flow to what the learner sees, and check that saved state, calculations, labels and recommendations agree.
- Never let uncertainty, missing data or a processing failure pass as a valid result. Make failures recoverable and preserve the learner's work.
- **Independent checks where accuracy matters:**
  - Derive expected test results from requirements or hand-worked examples, never by copying the code's logic.
  - Cover normal, boundary, partial, invalid and failure cases.
  - Test components separately from whole flows.
  - Verify calculations, grading quality and learner-facing explanations separately.
  - Synthetic fixtures are development aids, not proof of real-world validity. Say what testing establishes and what remains unvalidated.
- **Close the loop:** before calling an increment complete, compare it with its acceptance criteria, record the review findings in its increment record, and report what changed, what was checked, and what's still uncertain.
- **Apply all this proportionately.** Light review for routine changes, deep review for consequential behaviour. No extra documents or approval steps without a clear purpose.

### Pull requests and commits

- **Every change is a pull request:** a short-lived branch (`feat/answer-log`, `chore/increment-1-data-model`), with the summary in [.github/pull_request_template.md](.github/pull_request_template.md). `main` only changes by merged PR, checks must pass, and the owner merges. Never push to `main`, force-push, or merge without the owner.
- **Run `pnpm check` before opening or updating a PR.** Nothing merges on a red build.
- **Commits follow Conventional Commits:** `feat(learner): re-test misses from a new angle`. Types: feat, fix, docs, test, refactor, chore, ci.

## Principles

1. **The core is pure.** The learner model and scheduler take data in and return decisions out. No database, network or clock inside; pass the current time in as an argument.
2. **One home for each idea.** Every record is defined once, in `packages/core`. Never redefine a record's shape elsewhere.
3. **Types are the contract.** Packages talk only through exported types, imported by package name (`@studybuddy/core`), never through another package's internal files.
4. **Small packages with one job each.**
5. **Tests live beside the code:** `name.test.ts` next to `name.ts`, using Vitest. New behaviour comes with tests.
6. **No secrets in the repo.** `.env.example` lists what's needed, with fake values. `.env` is git-ignored.
7. **Personal study data is never committed.** Real logs go in `data/private/` (git-ignored; `pnpm repo-checks` fails CI if one is committed). Tests and examples use made-up data in `data/fixtures/`. Never copy real course files or answers into code, tests, docs or commit messages.
8. **Every decision that would make someone ask "why?" gets a decision record** in `docs/decisions/`, using the template there.

## Conventions

- **Names:**
  - Files are kebab-case (`confusion-pairs.ts`); `pnpm repo-checks` enforces this.
  - Types are PascalCase (`AnswerEvent`).
  - Functions and variables are camelCase, and functions start with a verb (`scheduleRetest`). ESLint enforces the casing.
- **Types:** `strict` plus extra checks.
  - No `any`, no `value as Type` casts (`as const` is fine), no `!` non-null assertions.
  - Narrow `unknown` with checks instead.
  - No `enum`, `namespace` or constructor parameter properties; Node runs our `.ts` files directly, so only erasable syntax works. Use union types and plain objects.
  - Import local files with the `.ts` extension.
- **Formatting:** Prettier. Run `pnpm format` rather than formatting by hand.
- **Linting:** ESLint with typescript-eslint strict rules. Warnings fail the build. Don't disable a rule to get past it; fix the code, or ask.
- **Dependencies:**
  - Exact versions only; the lockfile is committed.
  - Add a dependency only when it clearly earns its place, pin a version at least about two weeks old, and say why in the PR.
  - pnpm refuses versions under 7 days old.
  - GitHub Actions are pinned to commit SHAs with the version in a comment.

## Repo layout

| Path                 | Job                                                                  |
| -------------------- | -------------------------------------------------------------------- |
| `apps/server`        | MCP server that Claude or ChatGPT connects to (from increment 3)     |
| `apps/screens`       | In-chat screens (MCP Apps) (from increment 3)                        |
| `packages/core`      | Shared types, the one home for every record                          |
| `packages/learner`   | Learner model and scheduler (pure functions)                         |
| `packages/questions` | Question specs and the checker for AI-written questions              |
| `packages/ingest`    | Course import: checks concepts the AI extracts from course materials |
| `tools/replay`       | Replays the real Exam 2 log through the learner model                |
| `tools/repo-checks`  | CI guard: no private data, kebab-case source file names              |
| `docs/`              | `architecture.md`, `increment-plan.md`, `decisions/NNNN-title.md`    |
| `increments/`        | One planning and review record per increment, plus the index         |
| `data/fixtures/`     | Small made-up sample data, committed                                 |
| `data/private/`      | Real study logs, git-ignored, never committed                        |
| `.github/workflows/` | CI: format, lint, type-check, tests, repo checks                     |

## Product rules the code must support

The full list with reasons is in [docs/architecture.md](docs/architecture.md). In short:

1. Record the wrong option picked on every miss.
2. Re-test misses from a new angle, right away and a day later.
3. Exam Practice follows the professor's format.
4. Many scenario questions.
5. Mock exams lean on never-drilled terms.
6. Logging is fully automatic.
7. An unsure right answer is not mastery.
8. Questions can be A–E, true/false, scenario or calculation.

The answer log is the single source of truth: ConfusionPair and ConceptState are derived from it, never typed in.

## Commands

`pnpm check` runs everything CI runs. The individual commands are `format`, `format:check`, `lint`, `typecheck`, `test` and `repo-checks`. This machine runs Windows PowerShell; Node is 26 and pnpm is 12.14.0.
