# 000 — Repo setup

**Status:** Complete. [Pull request #1](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/1) was merged into `main` on October 30, 2026 at the owner's request, with checks passing. All review findings are resolved or deferred by agreement; R1 (branch protection) is switched on once the owner has GitHub Pro.

## Outcome and scope

**User outcome:** an empty but fully wired workshop. Every future piece of StudyBuddy has a home, every change is checked automatically, and personal study data can't be committed by accident.

**Included:**

- The pnpm/TypeScript monorepo folders from the brief.
- Prettier, ESLint, Vitest.
- `tools/repo-checks` (private-data guard and kebab-case file names) with tests.
- GitHub Actions CI.
- README, CLAUDE.md, `docs/architecture.md` (the brief), the increment plan, decision records 0001 and 0002.

**Excluded:** any study feature, data model or app code (increment 001 onward).

## Steps

Both steps share [pull request #1](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/1). Step 0.2 adds the review records that 0.1 is checked against.

| Step | What                                                                                            | Status                   |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------ |
| 0.1  | Monorepo, tooling, repo checks, CI, README, CLAUDE.md, architecture, decision records 0001–0002 | Under review (CI passed) |
| 0.2  | `increments/` records and step numbering, the review rules in CLAUDE.md, this review            | Under review             |

## Requirements and decisions

- Brief, build order step 0: [docs/architecture.md](../../docs/architecture.md). Steps were renamed increments on October 30, 2026.
- The owner approved the step 0 plan ("yes start step 0", October 30, 2026), including the layout change from [decision 0002](../../docs/decisions/0002-run-inside-claude-and-chatgpt.md): `apps/web` → `apps/server` and `apps/screens`.
- [Decision 0001](../../docs/decisions/0001-typescript-monorepo.md): TypeScript monorepo, no build step, TypeScript 6.0.3.

## Dependencies and assumptions

- **Depends on:** nothing.
- **Assumes:**
  - Node 26 and pnpm 12.14.0 on the owner's laptop and in CI.
  - A free GitHub account.
  - The code lives at `C:\Users\ejdoh\dev\studybuddy`, outside OneDrive.

## Acceptance criteria

From the brief's step 0, checked October 30, 2026:

| Criterion                                                            | Result                                                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Folders for apps, packages, tools, docs, data and workflows          | Met                                                                                             |
| TypeScript `strict`, no `any`, no unchecked casts                    | Met: `tsconfig.base.json` plus ESLint rules; shown to fail on violations                        |
| Prettier; ESLint warnings fail the build                             | Met: `--max-warnings 0`                                                                         |
| Vitest with a passing test                                           | Met: 5 tests in `tools/repo-checks`                                                             |
| CI runs format, lint, type-check and tests                           | Met: plus repo checks                                                                           |
| README, CLAUDE.md, decision record 0001                              | Met                                                                                             |
| `data/private/` git-ignored and never committed                      | Met: `.gitignore` plus a CI check                                                               |
| Exact dependency versions, lockfile committed                        | Met                                                                                             |
| **Done when the test passes on GitHub**                              | **Met:** CI passed on PR #1 (run 41100627249) after a GitHub Actions outage delayed it          |
| `main` protected; merge by PR only, checks must pass, owner approves | **Agreed deferral:** enforced once the owner has GitHub Pro (R1); Merge counts as approval (R2) |

## Examples

- Committing `data/private/exam-2-log.json` makes CI fail with "Personal study data must never be committed: data/private/exam-2-log.json".
- Adding `packages/learner/src/confusionPairs.ts` makes CI fail with "Source file names must be kebab-case".
- Writing `const x: any = JSON.parse("1") as number` makes lint fail twice: once for `any`, once for the cast.
- `data/private/README.md` and `packages/learner/src/confusion-pairs.test.ts` pass.

## Verification

- `pnpm check` passed locally: format, lint, type-check, 5 tests, repo checks.
- **Deliberate-failure check:** an `any`, a cast, a camelCase file name and a force-committed private file were each caught, then removed.
- **CI passed on GitHub.**
- **What this does not establish:** the rules are enforced only by CI and by convention. GitHub itself does not yet block a direct push to `main` (R1).

## Review findings

| #   | Finding                                                                                                                                                                        | Resolution                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | The brief requires a protected `main`. On a free account, private repos can't have branch protection.                                                                          | **Deferral agreed (October 30, 2026):** the owner will get GitHub Pro through the Student Developer Pack; then Claude switches on protection for `main` (checks must pass, PR only). Until then, CLAUDE.md and CI are the protection. |
| R2  | "Owner approves" can't be enforced as a GitHub approval, because PRs are opened from the owner's own account. The owner's click on **Merge** is the approval.                  | **Resolved:** the owner agreed (October 30, 2026).                                                                                                                                                                                    |
| R3  | CI runs on pull requests and on `main`, not on every push to every branch as the brief says. The purpose (nothing merges on a red build) is met, and it avoids duplicate runs. | **Resolved:** the owner agreed (October 30, 2026). This supersedes the brief's "on every push".                                                                                                                                       |
| R4  | The kebab-case check only covers `.ts`/`.tsx` files under `apps/`, `packages/`, `tools/` (and `data/fixtures/` from 001). Docs and config files follow it by convention.       | Accepted limitation; documented here.                                                                                                                                                                                                 |
| R5  | TypeScript 7 isn't used, because the lint tool supports only up to 6.0.                                                                                                        | Resolved in decision 0001. Revisit when typescript-eslint supports 7.                                                                                                                                                                 |

## Remaining limitations

- `tools/repo-checks/src/main.ts`, which runs Git, has no automated test of its own. Its pure checks are tested, and it was verified by the deliberate-failure check.

## Data-quality gate

Applied after the fact on November 1, 2026. No rebuild needed.

| Critical input              | Likely failure                               | Check                                                         | On failure                  |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------- | --------------------------- |
| Files committed to the repo | A real study log or course file is committed | `pnpm repo-checks` in CI (tested; deliberate-failure checked) | CI fails and names the file |
| Source file names           | Not kebab-case                               | `pnpm repo-checks` (tested)                                   | CI fails and names the file |
| Code going into `main`      | Unchecked code merges                        | CI on every PR; the owner merges                              | Red build; nothing merges   |
| Direct pushes to `main`     | Someone skips the PR                         | **None enforced yet** (R1)                                    | Only convention prevents it |

**Real data:** not applicable. This increment handles no study data, and the private-data guard was tested with a realistic file name.

**Gate: passed, safe to build on.** Known gaps are R1 (no branch protection until GitHub Pro) and the untested `main.ts` wrapper. Neither one lets bad study data in.
