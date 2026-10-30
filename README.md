# StudyBuddy

A study app for any class with an exam. It has three modes:

- **Quick Review:** flashcards with adaptive re-tests.
- **Focused Review:** a short diagnostic, then guided teaching of weak topics.
- **Exam Practice:** mock exams in the professor's format.

StudyBuddy runs inside the learner's own Claude or ChatGPT ([why](docs/decisions/0002-run-inside-claude-and-chatgpt.md)).

**Status:** increment 0 (repo setup). Nothing usable yet; see the [increment plan](docs/increment-plan.md).

## Repo layout

| Folder               | What it holds                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/`              | The StudyBuddy server and in-chat screens (from increment 3)                                                                 |
| `packages/core`      | Shared types: the one home for every record                                                                                  |
| `packages/learner`   | Learner model and scheduler (pure functions)                                                                                 |
| `packages/questions` | Question specs and the checker for AI-written questions                                                                      |
| `packages/ingest`    | Course import: checks concepts extracted from slides, textbook and syllabus                                                  |
| `tools/replay`       | Replays a real study log through the learner model                                                                           |
| `tools/repo-checks`  | CI guard: no committed private data, kebab-case file names                                                                   |
| `data/fixtures/`     | Made-up sample data (committed)                                                                                              |
| `data/private/`      | Real study logs (**never committed**)                                                                                        |
| `docs/`              | [Architecture](docs/architecture.md), [increment plan](docs/increment-plan.md), [decision records](docs/decisions/README.md) |

## Setup

You need **Node 26 or later** and **pnpm 12.14.0**:

```bash
npm install -g pnpm@12.14.0
```

```bash
pnpm install
```

## Everyday commands

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm check`        | Everything CI runs, in order. Run this before every pull request. |
| `pnpm format`       | Rewrites files into the standard format                           |
| `pnpm format:check` | Reports files that aren't formatted                               |
| `pnpm lint`         | Code-quality rules; any warning fails                             |
| `pnpm typecheck`    | TypeScript type-checking                                          |
| `pnpm test`         | Runs all tests once                                               |
| `pnpm repo-checks`  | No private data committed; source file names are kebab-case       |

## How changes land

Every change goes on a short-lived branch, opens a pull request with a plain-English summary, passes CI, and is merged by the owner. Working rules for contributors, including Claude, are in [CLAUDE.md](CLAUDE.md).
