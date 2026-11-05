import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AnswerStore, upgradeSavedAnswer } from "./answer-store.ts";

// A made-up answer in the shape saved before decision 0004.
const oldAnswer = {
  id: "old-1",
  ownerId: "owner",
  sessionId: "connection-test",
  questionId: "skimming-definition-1",
  response: { kind: "option", label: "A" },
  markedUnsure: false,
  assistance: "none",
  timeTakenMs: 0,
  submittedAt: "2026-11-05T15:58:40.598Z",
  evaluation: { status: "graded", components: [], gradedBy: { kind: "code", version: "x" } },
};

describe("upgradeSavedAnswer", () => {
  it("turns the old unmeasured 0 into not recorded and keeps the exact time", () => {
    const upgraded = upgradeSavedAnswer(oldAnswer);
    expect(upgraded).toMatchObject({
      id: "old-1",
      timeTaken: { status: "notRecorded" },
      answeredAt: { kind: "exact", at: "2026-11-05T15:58:40.598Z" },
    });
    expect(upgraded).not.toHaveProperty("timeTakenMs");
    expect(upgraded).not.toHaveProperty("submittedAt");
  });

  it("leaves an answer already in the current shape alone", () => {
    const current = { id: "new", answeredAt: { kind: "exact", at: "2026-11-05T16:00:00Z" } };
    expect(upgradeSavedAnswer(current)).toBe(current);
  });
});

describe("AnswerStore reading an old file", () => {
  let folder = "";
  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it("still finds the saved answer after the upgrade", () => {
    folder = mkdtempSync(join(tmpdir(), "studybuddy-store-"));
    writeFileSync(
      join(folder, "connection-test.json"),
      JSON.stringify({ answers: [oldAnswer], fileReports: [] }),
    );
    const saved = new AnswerStore(folder).latestAnswer("skimming-definition-1");
    expect(saved?.response).toEqual({ kind: "option", label: "A" });
    expect(saved?.timeTaken).toEqual({ status: "notRecorded" });
  });
});
