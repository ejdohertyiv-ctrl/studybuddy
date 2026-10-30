# 0001 — One TypeScript monorepo with pnpm, no build step

- **Status:** Accepted, October 30, 2026 (increment 0).
- **Related:** [architecture.md](../architecture.md), [0002](0002-run-inside-claude-and-chatgpt.md).

## Context

- StudyBuddy has several small parts that share one data model: core types, the learner model, question specs, import, a replay tool, and later a server and in-chat screens.
- One person reviews every change, so the setup has to stay simple to read and hard to break.
- The earlier prototype used a Python backend with a TypeScript frontend. That meant two languages, two dependency systems, and data shapes defined twice. [Decision 0002](0002-run-inside-claude-and-chatgpt.md) moves the heavy AI work into the learner's own Claude or ChatGPT, so the main reason for Python (document and OCR libraries) mostly goes away.

## Decision

1. **One repo, TypeScript everywhere, pnpm workspaces.** Each folder under `packages/`, `tools/` and `apps/` is a small package with one job.
2. **Strict types.** `strict` is on, plus extra checks:
   - `noUncheckedIndexedAccess`: `list[5]` might be missing.
   - `exactOptionalPropertyTypes`.
   - `noPropertyAccessFromIndexSignature`.

   ESLint bans `any` and `value as Type` casts.

3. **No build step.** Packages export their `.ts` source directly, and Node 26 runs TypeScript files natively. TypeScript only _checks_ (`noEmit`). To make that work, code sticks to TypeScript features that can be erased without rewriting (`erasableSyntaxOnly`), and imports include the `.ts` extension.
4. **TypeScript 6.0.3, not 7.** TypeScript 7 (the new native compiler) is out, but typescript-eslint, which powers the type-aware lint rules, only supports TypeScript below 6.1. Revisit when typescript-eslint supports 7.
5. **Careful dependency versions.**
   - Every version is exact, and the lockfile is committed.
   - New dependencies are pinned to versions at least about two weeks old.
   - pnpm refuses anything published less than 7 days ago (`minimumReleaseAge`).
   - GitHub Actions are pinned to exact commits.
6. **Tooling:** Prettier (formatting), ESLint with typescript-eslint strict and stylistic type-checked rules (warnings fail), Vitest (tests beside the code), GitHub Actions CI on every pull request and on `main`.
7. **Repo checks** (`tools/repo-checks`) run in CI. They fail the build if a file in `data/private/` was committed or a source file name isn't kebab-case.

## Consequences

**Easier**

- One language, one install, one `pnpm check` command, and one set of types shared by every part.
- No build outputs to keep in sync.

**Harder**

- Node 26 or later is required.
- Some TypeScript features are off-limits: `enum`, `namespace`, and constructor parameter properties. Use union types and plain objects instead.
- TypeScript 7's speed is unavailable until the lint tooling catches up.

**Unknown**

- If increment 3 shows document processing needs something only Python does well, that would be a small, isolated tool and a new decision record. It would not mean a second backend.
