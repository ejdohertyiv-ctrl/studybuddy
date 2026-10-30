# Decision records

One record per decision that would make someone ask "why?". Name each one `NNNN-title.md` (next free number, kebab-case title). Never renumber or delete a record; if a later decision replaces one, mark the old one **Superseded by NNNN**.

| #                                             | Decision                                              | Status                               |
| --------------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| [0001](0001-typescript-monorepo.md)           | One TypeScript monorepo with pnpm, no build step      | Accepted, October 30, 2026           |
| [0002](0002-run-inside-claude-and-chatgpt.md) | Run StudyBuddy inside the learner's Claude or ChatGPT | Accepted direction, October 30, 2026 |

## Template

```markdown
# NNNN — Title

- **Status:** Proposed | Accepted (date) | Superseded by NNNN
- **Related:** links

## Context

What problem or question made this decision necessary, and what was known.

## Decision

What we chose, stated plainly.

## Consequences

What gets easier, what gets harder, and what is still unknown.
```
