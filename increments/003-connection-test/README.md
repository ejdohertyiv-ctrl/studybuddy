# 003 — Connection test

**Status:** In progress. The owner approved the blueprint on November 4, 2026, with a made-up question and a made-up slide deck. Step 3.1 is built and its pull request is open. Steps 3.2 and 3.3 need the owner in Claude Desktop.

## Outcome and scope

**User outcome:** a StudyBuddy practice card appears inside the owner's Claude chat, served by a program on their own computer. The test also answers decision 0002's open questions about screens and files.

**Included:**

- `apps/server`: a local MCP server with three tools:
  - `show_practice_question`: shows the card
  - `submit_practice_answer`: only the card can call it; it checks and saves the answer
  - `send_file_to_studybuddy`: the file test
- `apps/screens`: the practice card page, with the MCP Apps library written in, so nothing loads from the internet.
- The made-up sample course's first question. Answers are saved in `data/private/connection-test/`, which Git never commits.

**Excluded:**

- Real study data or real course files in the repo.
- Grading written answers, the learner model, and timing answers. Time taken is saved as 0.
- ChatGPT: it needs a public address, so it waits for Phase 2.
- Hosting, sign-in, and more than one learner.

## Steps

| Step | What                                                                                                               | Status                   |
| ---- | ------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| 3.1  | Server, practice card, file-test tool, tests                                                                       | Built; pull request open |
| 3.2  | Connect to Claude Desktop; the owner opens the card, answers, restarts Claude and checks the answer is still there | Waiting for the owner    |
| 3.3  | File test: drop a made-up slide deck into the chat, send it to StudyBuddy, record what arrived                     | Waiting for the owner    |

Steps 3.2 and 3.3 produce findings, not much code. They are recorded below in a follow-up pull request.

## Acceptance criteria

1. The card appears in a Claude Desktop chat (screenshot kept as evidence), **or** the reason it doesn't is recorded.
2. Picking an option saves it, and the result matches the answer key held on the server.
3. The chat never receives the answer key or the right option before an answer. Tested: `show_practice_question` returns no key, and the answer tool is app-only.
4. After restarting Claude Desktop, the card shows the saved answer. Tested across a server restart.
5. The file question is answered with evidence: original bytes, text only, or nothing. Sizes and a SHA-256 fingerprint are compared with the file on disk; contents are never stored.
6. `pnpm check` passes, and no private file is committed.

## How to connect (step 3.2)

Claude Desktop from the Microsoft Store keeps its settings at `%LOCALAPPDATA%\Claude-Data\claude_pzs8sxrjxfjjc\claude_desktop_config.json` (found November 4, 2026; the `Packages\...\Roaming\Claude` folder is not used). Keep the existing settings and add:

```json
{
  "mcpServers": {
    "studybuddy": {
      "command": "C:/Program Files/nodejs/node.exe",
      "args": ["C:/Users/ejdoh/dev/studybuddy/apps/server/src/main.ts"]
    }
  }
}
```

Then fully quit and reopen Claude Desktop, and ask: "Show me a StudyBuddy practice question."

## Data-quality gate

| Critical input    | Likely failure                      | Check                                                                | On failure                             |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| The picked option | Unknown label, wrong question       | `gradeOptionAnswer` refuses; the tool returns an error (tested)      | Error shown on the card; nothing saved |
| The question      | No single right option              | Refused instead of guessed (tested)                                  | Error                                  |
| The answer key    | Leaked to the chat before answering | Public view strips it; answer tool is app-only (tested)              | Test fails                             |
| Saved answers     | Half-written file after a crash     | Write to a temp file, then rename                                    | Old file kept                          |
| A sent file       | Contents invented or partly sent    | Only sizes and fingerprints are recorded; compared with the original | Recorded as the finding                |

Real data: none, by the owner's choice. This increment tests plumbing, not learning data.

**Can later increments build on it?** Increment 005 (course import) waits for the step 3.3 file finding. Increment 006 (a full study session) builds on the server and screen pattern once step 3.2 shows the card renders.

## Checks run

- November 4, 2026: `pnpm check` passed with 60 tests in 8 files, including 12 new ones for the server, card and file test.
- A real start-up over stdio: three tools listed, the card served as `text/html;profile=mcp-app` (512 KB, library included), the question shown, and a clean shutdown.

## Findings

To be filled in by steps 3.2 and 3.3.
