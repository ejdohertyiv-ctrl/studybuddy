# 0002 — Run StudyBuddy inside the learner's Claude or ChatGPT

- **Status:** Accepted direction, October 30, 2026. Details marked _proposed_ or _to test_ below are not yet approved.
- **Supersedes:** the hosted route in the planning folder's `plan/technical/technical-stack-proposal.md` (Python/FastAPI backend, Railway, separate worker, anonymous preview). Also replaces two "leaning" choices in the [original brief](../architecture.md): Next.js as the web framework and the Claude API as the question writer.
- **Related:** [0001](0001-typescript-monorepo.md), [increment plan](../increment-plan.md).

## Context

- StudyBuddy needs strong AI work: reading slides, writing scenario and new-angle questions, and grading open answers. It must cost nothing before there is revenue.
- A ChatGPT or Claude subscription does not include API access; the API is billed separately. So StudyBuddy cannot call a user's subscription from its own website.
- Claude and ChatGPT can both connect to outside programs (MCP servers). Since January 26, 2026, the official **MCP Apps** extension lets those programs show interactive screens inside the chat. Claude (web and desktop) and ChatGPT support it.
- The earlier prototype's Python code was small: about 320 lines. The heaviest Python-specific need was OCR for image-only slides, and the chat AI can read those slides itself.
- The owner wants to use StudyBuddy personally, then share it with friends.

## Decision

1. **StudyBuddy is an MCP server with in-chat screens.** The learner's own Claude or ChatGPT does the AI work: reading materials, writing questions, explaining, and grading open answers. StudyBuddy pays for no AI.
2. **TypeScript only.** One language for the server, the screens and the shared types. No Python backend, no separate worker. See [0001](0001-typescript-monorepo.md).
3. **StudyBuddy's server stays in charge of learning decisions.** The pure learner model and scheduler choose what to test and when. The AI writes questions to a spec from the server, and the server checks every question before saving it.
4. **Answers go through StudyBuddy's screens, not the chat box.** The screen sends the picked option, confidence and time taken straight to the server. Logging never depends on the AI remembering to call a tool (product rules 1, 6, 7).
5. **Answer keys stay on the server.** Multiple choice, true/false and calculation answers are graded by code. The AI grades only open answers, against a rubric, and its reasoning and uncertainty are stored.
6. **Shared course question banks.** Checked concepts and questions for a class are built once and reused by every learner in it. Each learner's answer log stays private. Share derived questions, never the professor's original files.
7. **$0 until revenue.** Develop locally first. Then run a free-tier, invite-only friends beta. Spend money only when one of the triggers in the [increment plan](../increment-plan.md) occurs.

## Consequences

**Gains**

- No AI bill, API keys or prompt pipeline on StudyBuddy's side.
- One language, one test setup and one type system, in line with the "one home for each idea" principle.
- The OCR work and the background worker probably disappear.

**Costs and risks**

- **Hosting and sign-in come earlier.** Claude on the web and ChatGPT can only reach a server on the public internet. Each user's data needs OAuth sign-in. Claude Desktop can use a server running on your own computer, so solo development stays local and free.
- **Plan limits for learners.**
  - Claude: custom connectors work on all plans including Free, but Free allows only one and the feature is in beta.
  - ChatGPT: third-party guides say a paid plan is needed. Not confirmed on OpenAI's own pages.
  - Earlier evidence, found November 1, 2026: an October 25 pilot (a small MCP server with two sample questions, kept outside this repo in `OneDrive\Desktop\ChatGPT\StudyBuddy\plugin-test`) showed its in-chat card inside ChatGPT on a Plus account through a development tunnel. One screenshot is the only record, and the test hasn't been repeated. It shows a paid plan can work, not that a free one can't.
- **Long study sessions use the learner's own message allowance.**
- **StudyBuddy doesn't control the model,** so question quality can shift when Claude or ChatGPT update. The Exam 2 log becomes the standing accuracy test set.
- **Chat apps can't send reminders.** The "re-test a day later" rule (product rule 2) needs another channel, such as an email or a calendar export.
- **Claude and ChatGPT may not support MCP Apps features equally.**
- **Listing in a public app directory requires a review and a privacy policy.**

**To test early (unverified)**

1. Can a slide file uploaded in the chat reach the StudyBuddy server, or only the AI's summary of it?
2. Do the in-chat screens behave the same in Claude and ChatGPT?
3. Does a local server in Claude Desktop show MCP Apps screens?

## Sources (consulted October 30, 2026)

- [MCP Apps announcement, official MCP blog](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) — primary.
- [Claude custom connectors, Anthropic support](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) — primary.
- [OpenAI developer docs](https://developers.openai.com/apps-sdk) — primary. The page now describes plugins with MCP servers; it did not state plan eligibility.
- [ChatGPT Plus FAQ](https://help.openai.com/en/articles/6950777-what-is-chatgpt-faq) — primary. API usage is billed separately.
- [Alpic: MCP Apps in Claude and ChatGPT](https://alpic.ai/blog/mcp-apps-goes-official-claude-chatgpt-support) — secondary.
- [hjarni.com: MCP with ChatGPT](https://hjarni.com/blog/how-to-use-mcp-with-chatgpt) — secondary. Source for ChatGPT plan eligibility.
- Pricing pages for Supabase, Vercel, Railway, Render and Cloudflare — primary; cited in the [increment plan](../increment-plan.md).
