import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { sampleCourse } from "@studybuddy/fixtures";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AnswerStore } from "./answer-store.ts";
import { describeFile } from "./file-report.ts";
import { PRACTICE_CARD_URI, createStudyBuddyServer } from "./server.ts";

const firstQuestion = sampleCourse.questions[0];
if (firstQuestion === undefined) throw new Error("The sample course has no questions.");
const question = firstQuestion;

let folder: string;

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "studybuddy-test-"));
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

// Connects a test client, standing in for Claude Desktop, to a fresh server over a private link.
async function connect(store: AnswerStore): Promise<Client> {
  const server = createStudyBuddyServer({
    store,
    question,
    now: () => "2026-11-04T12:00:00Z",
    practiceCardHtml: () => "<p>card</p>",
  });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

function textOf(result: unknown): string {
  return JSON.stringify(result);
}

describe("the connection-test server", () => {
  it("offers the card tool with its screen, and keeps the answer tool for the screen only", async () => {
    const client = await connect(new AnswerStore(folder));
    const { tools } = await client.listTools();
    const show = tools.find((tool) => tool.name === "show_practice_question");
    const submit = tools.find((tool) => tool.name === "submit_practice_answer");
    expect(textOf(show?._meta)).toContain(PRACTICE_CARD_URI);
    expect(textOf(submit?._meta)).toContain('"visibility":["app"]');
  });

  it("serves the card page as an MCP Apps resource", async () => {
    const client = await connect(new AnswerStore(folder));
    const { contents } = await client.readResource({ uri: PRACTICE_CARD_URI });
    expect(textOf(contents)).toContain("text/html;profile=mcp-app");
  });

  it("shows the question without revealing the answer", async () => {
    const client = await connect(new AnswerStore(folder));
    const shown = textOf(await client.callTool({ name: "show_practice_question", arguments: {} }));
    expect(shown).toContain(question.stem);
    expect(shown).not.toContain(question.answerKey);
    expect(shown).not.toContain("isCorrect");
  });

  it("checks and saves an answer, and the saved result survives a restart", async () => {
    const first = await connect(new AnswerStore(folder));
    const reply = await first.callTool({
      name: "submit_practice_answer",
      arguments: { questionId: question.id, option: "B" },
    });
    expect(textOf(reply)).toContain('"correct":false');

    const afterRestart = await connect(new AnswerStore(folder));
    const shown = textOf(
      await afterRestart.callTool({ name: "show_practice_question", arguments: {} }),
    );
    expect(shown).toContain('"savedResult"');
    expect(shown).toContain('"pickedLabel":"B"');
  });

  it("refuses an answer to a question it doesn't know", async () => {
    const client = await connect(new AnswerStore(folder));
    const reply = await client.callTool({
      name: "submit_practice_answer",
      arguments: { questionId: "not-a-question", option: "A" },
    });
    expect(reply.isError).toBe(true);
  });

  it("records what form a file arrived in, but never its contents", async () => {
    const store = new AnswerStore(folder);
    const client = await connect(store);
    const reply = await client.callTool({
      name: "send_file_to_studybuddy",
      arguments: { fileName: "deck.pptx", text: "Slide 1: a secret line" },
    });
    expect(textOf(reply)).toContain("only text");
    const saved = readFileSync(join(folder, "connection-test.json"), "utf8");
    expect(saved).toContain('"arrivedAs": "text only"');
    expect(saved).not.toContain("a secret line");
  });
});

describe("describeFile", () => {
  it("fingerprints original bytes so they can be compared with the file on disk", () => {
    const report = describeFile(
      { fileName: "a.bin", base64: Buffer.from("hello").toString("base64") },
      "2026-11-04T12:00:00Z",
    );
    expect(report).toMatchObject({ arrivedAs: "original bytes", byteCount: 5 });
    expect(report.sha256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  it("says plainly when nothing but the name arrived", () => {
    expect(describeFile({ fileName: "a.pdf" }, "2026-11-04T12:00:00Z").arrivedAs).toBe("nothing");
  });
});
