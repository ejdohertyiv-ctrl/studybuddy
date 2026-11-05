# 003 — Connection test

**Status:** In progress. The owner approved the blueprint on November 4, 2026, with a made-up question and a made-up slide deck. Step 3.1 is built and its pull request is open. Step 3.2 passed on November 5, 2026. Step 3.3 (the file test) needs the owner in Claude Desktop.

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
| 3.2  | Connect to Claude Desktop; the owner opens the card, answers, restarts Claude and checks the answer is still there | Passed November 5, 2026  |
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

Then fully quit and reopen Claude Desktop, and ask, in a regular chat (not the Code tab): "Use StudyBuddy to show me a practice question."

**Edit the file only while Claude Desktop is fully quit.** Found November 5, 2026: the app rewrites this file from memory when it quits, so an entry added while it is running is erased. A helper started from inside Claude is shut down with the app, so it can't do the edit either. What worked: quit the app, run a small script from File Explorer that adds the entry (the owner's copy is `Connect StudyBuddy.cmd` on their desktop, outside the repo), then reopen. Once the app has loaded the entry, it keeps it across restarts.

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

### Step 3.2 — passed November 5, 2026

| Criterion                                       | Result                                                                                                                                                                         | Evidence                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 1. Card appears in Claude Desktop               | **Yes.** It shows as a `studybuddy · show_practice_question` card in a regular chat                                                                                            | Owner's screenshot, kept in `data/private/connection-test/` (not committed)                            |
| 2. Picking saves it, graded by the server's key | **Yes.** The owner picked A; one answer was saved at 15:58:40 UTC, graded by code (`connection-test-1`), 1 point                                                               | `connection-test.json` in the private folder; `tools/call` in Claude's StudyBuddy log at the same time |
| 4. Answer survives a restart                    | **Yes.** Claude stopped the server at 15:59:44 UTC and restarted it 11 seconds later. The card came back with A picked (owner confirmed); still one saved answer, no duplicate | Claude's StudyBuddy log; private answer file                                                           |

Things we learned:

- **Claude Desktop erases a settings entry added while it is running** (see "How to connect"). Three tries failed before the entry was added with the app fully quit.
- **The Code tab doesn't load these servers.** Asking there gets an answer from Claude's general knowledge, not the card.
- **Without the server, Claude makes things up.** Before the connection worked, a regular chat answered "show me a StudyBuddy practice question" with its own text and then with a mockup drawn from the design files. So "a card appeared" isn't proof: check for the `studybuddy` tool label or a saved answer.

### Step 3.3

Not done yet.
