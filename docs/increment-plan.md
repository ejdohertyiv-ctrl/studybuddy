# Increment plan

**Status:** the direction was accepted on October 30, 2026 ([decision 0002](decisions/0002-run-inside-claude-and-chatgpt.md)). Each increment's contents are a proposal until the owner approves it. Each increment lands as one or more pull requests and ends with something the owner can check. This page is the roadmap; each increment's current status and review record live in [increments/](../increments/README.md).

## Phases

| Phase                | Who uses it                    | Where it runs                                                | Cost                |
| -------------------- | ------------------------------ | ------------------------------------------------------------ | ------------------- |
| 1. Just me           | The owner                      | Laptop; Claude Desktop connects to a local StudyBuddy server | $0                  |
| 2. Friends beta      | The owner plus invited friends | Free-tier hosting, invite-only sign-in                       | $0                  |
| 3. Public or revenue | Anyone                         | Paid tiers as triggered; app-directory listing               | Paid when triggered |

## Phase 1: just me (local, $0, no accounts)

0. **Repo setup** ([record](../increments/000-repo-setup/README.md)). A TypeScript pnpm monorepo outside OneDrive, with formatting, linting, type-checking, tests, repo checks and CI; docs and decision records 0001–0002.
1. **Data model** in `packages/core` ([record](../increments/001-data-model/README.md), [explanation](data-model.md)). Every record has an owner ID. Shared course content (course, topic, concept, question) is kept apart from personal records (session, answer event, confusion pair, concept state). Done when every record has a type and made-up fixture data.
2. **Learner model and scheduler** in `packages/learner`, replayed on the Exam 2 log through `tools/replay`. Done when it flags the same weak spots the real prep found: zone pricing, PLC stages and divisibility.
3. **Connection test.** A minimal local server with one tool and one screen, connected to Claude Desktop. It answers decision 0002's open questions:
   - Can uploaded slide files reach the server?
   - Do screens render from a local server?
   - Do Claude and ChatGPT behave differently? ChatGPT needs a public address, so this part may wait for Phase 2.

   This can run any time after increment 0, and should come before increment 5.

4. **Question specs and checker** in `packages/questions`. The server writes a spec: concept, angle, format, which answer is correct, and which sibling terms to use as wrong options. It then checks what the AI returns. Tried on one MGM 301 chapter.
5. **Course import through the chat** in `packages/ingest`. The learner uploads slides; the AI extracts concepts and calls a save tool; the server checks the result; the learner reviews it. The design depends on increment 3's file-upload finding.
6. **One Quick Review session start to finish** in Claude Desktop. Answers and confidence are submitted through a screen and logged automatically. Phase 1 is done when the owner studies a real exam with it.

## Phase 2: friends beta (hosted, still $0)

7. **Go online.** The server goes on a free host, with Postgres and file storage on free tiers. Sign-in uses OAuth with an **invite list**, so only invited emails get in.
8. **Before inviting anyone:**
   - A short privacy note.
   - "Export my data" and "Delete my data".
   - Spending caps and alerts on every account.
   - A free scheduled backup to private storage (never Git).
   - A one-page "how to join" guide.
9. **Shared course banks.** Friends in the same class reuse that class's checked questions. Each person's answer log stays private.

Proposed: support Claude first, since its Free plan allows one custom connector. Third-party guides say ChatGPT custom connectors need a paid plan.

## Phase 3: public or revenue (later)

App-directory submission (review plus privacy policy), paid tiers as triggered, startup credits once StudyBuddy is a registered business.

## Proposed, not scheduled

### Slide walkthrough (requested October 30, 2026; not yet planned or approved)

The learner adds a lecture slide deck and walks through it slowly, one slide or idea at a time, learning as they go. This is a first capture of the idea only; it gets planned and approved step by step before it is scheduled.

Early notes:

- It fits the in-chat design well. The learner's AI explains each slide; a StudyBuddy screen shows where they are in the deck and asks short check questions; answers are logged automatically like everywhere else.
- It depends on the same open question as import: whether the slide file itself reaches the server (increment 3).
- It may overlap with Focused Review's guided teaching and with course import (a walkthrough could double as the review step for extracted concepts). How they relate is an open design question.
- Increment 1's data model should leave room for slides as a source: a source document with ordered slides, and concepts linked to the slide they came from.

## Where money is and isn't needed

**$0 through Phase 2**

| Item                                    | Why it's free                          |
| --------------------------------------- | -------------------------------------- |
| AI processing                           | Learners' own Claude or ChatGPT        |
| Development                             | Local                                  |
| Repo and CI                             | Private GitHub repo and GitHub Actions |
| Server, database, file storage, sign-in | Free tiers at friends scale            |
| Web address                             | Free subdomain                         |
| Backups                                 | A script                               |
| Privacy note                            | Written by us                          |

**Spending triggers**

| Trigger                                                                      | Likely cost                                                                       | How to delay it                     |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| Free database pauses after 1 week of inactivity, or automatic backups wanted | Supabase Pro, $25/month                                                           | Regular use; backup script          |
| StudyBuddy charges money                                                     | Vercel Pro, $20/month (Hobby is non-commercial only), or another host's paid plan | Stay free during the beta           |
| StudyBuddy's own server calls AI                                             | Pay per use                                                                       | Build banks inside a learner's chat |
| Growth past free-tier limits                                                 | Varies                                                                            | Revenue or credits first            |
| Custom domain (optional)                                                     | About $10–15/year                                                                 | Use the free subdomain              |

**Learners' cost:** Claude Free works, with message limits. ChatGPT likely needs a paid plan (about $20/month); not confirmed by OpenAI.

## Open decisions

- Beta host and sign-in provider. Choose at increment 7; the sign-in provider must support MCP's OAuth sign-in. Re-check free-tier terms then.
- Reminder channel for day-later re-tests (email or calendar export).
- Whether the dashboard and calendar live as in-chat screens or a small separate website.
- When ChatGPT support is added.
- How the slide walkthrough relates to Focused Review and import.

## Sources (consulted October 30, 2026)

- [Supabase pricing](https://supabase.com/pricing): Free includes 500 MB database and 1 GB storage, pauses after 1 week of inactivity, no backups; Pro is $25/month.
- [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines): Hobby is non-commercial only. [Vercel pricing](https://vercel.com/pricing): Pro is $20/month.
- [Railway pricing](https://railway.com/pricing) and [Railway plans](https://docs.railway.com/reference/pricing/plans): Free has $1/month credit; Hobby is $5/month. No longer needed under decision 0002.
- [Render free tier](https://render.com/docs/free): free Postgres expires after 30 days. Not suitable.
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): free plan has 10 ms CPU per request; R2 has 10 GB free storage. A possible beta host now that parsing moves to the AI.
- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous): merging into an existing account is manual. Supports dropping the anonymous preview for now.
- Platform sources are listed in [decision 0002](decisions/0002-run-inside-claude-and-chatgpt.md).
