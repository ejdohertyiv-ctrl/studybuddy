# Increments

Every increment has a numbered folder here holding its planning and review record (`README.md`). Code lives in its usual folders. The longer-term roadmap, with future increments that aren't approved yet, is [docs/increment-plan.md](../docs/increment-plan.md). This index is the one place for each increment's **status**.

**Statuses:**

- **Proposed:** written down, not yet approved.
- **Approved:** the owner agreed the scope and acceptance criteria.
- **In progress:** being built.
- **Under review:** pull request open, waiting for checks and the owner.
- **Complete:** merged, acceptance criteria met, review findings resolved or deferral agreed.

One increment ships at a time. The next starts only after the previous one is merged.

**Steps:** each increment is a collection of related steps, numbered `N.1` to `N.9` (increment 1 â†’ steps 1.1, 1.2, â€¦).

- Each step is one reviewable piece with its own commits. By default each step gets its own pull request, and steps ship in order; small steps approved together can share one.
- Each increment's record lists its steps and their status.
- An increment that needs more than nine steps gets split.

| #   | Increment                     | Status       | Depends on | Pull request                                                |
| --- | ----------------------------- | ------------ | ---------- | ----------------------------------------------------------- |
| 000 | [Repo setup](000-repo-setup/) | Complete     | None       | [#1](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/1) |
| 001 | [Data model](001-data-model/) | Under review | 000        | [#2](https://github.com/ejdohertyiv-ctrl/studybuddy/pull/2) |
