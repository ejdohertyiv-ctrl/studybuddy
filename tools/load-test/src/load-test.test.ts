// Made-up log entries only. The real Exam 2 log never enters the repo.
import { describe, expect, it } from "vitest";
import { isLogResult, isLogSession, type LogResult, type LogSession } from "./exam2-log.ts";
import { checkGrade, mapAnswer, mapSession, type FieldFinding } from "./map-log.ts";
import { mapSlides, readDeck } from "./map-slides.ts";
import { selectSample } from "./select-sample.ts";
import { summarizeByField } from "./summarize.ts";

function session(results: LogResult[], extra: Partial<LogSession> = {}): LogSession {
  return {
    key: "s01-made-up",
    date: "2026-10-26T20:48:00-04:00",
    mode: "Focused Review",
    title: "Made-up session",
    note: "Made up for tests.",
    source: "claude",
    results,
    score: results.filter((result) => result.correct).length,
    total: results.length,
    ...extra,
  };
}

function outcomeOf(findings: FieldFinding[], field: string): string | undefined {
  return findings.find((finding) => finding.field === field)?.outcome;
}

describe("mapAnswer", () => {
  it("never fills in time, hints or the question, and says so", () => {
    const result: LogResult = { correct: true, q: 1, topic: "t1", answer: "Widgets" };
    const findings = mapAnswer(session([result]), result);
    expect(outcomeOf(findings, "AnswerEvent.timeTakenMs")).toBe("requiredNotRecorded");
    expect(outcomeOf(findings, "AnswerEvent.assistance")).toBe("requiredNotRecorded");
    expect(outcomeOf(findings, "AnswerEvent.submittedAt")).toBe("requiredNotRecorded");
    expect(outcomeOf(findings, "Question stem, options and answer key")).toBe(
      "requiredNotRecorded",
    );
  });

  it("marks unsure only for a logged guess", () => {
    const guess: LogResult = { correct: false, q: 2, topic: "t1", answer: "b", guess: true };
    const plain: LogResult = { correct: false, q: 3, topic: "t1", answer: "b" };
    const detail = (result: LogResult): string | undefined =>
      mapAnswer(session([result]), result).find(
        (finding) => finding.field === "AnswerEvent.markedUnsure",
      )?.detail;
    expect(detail(guess)).toMatch(/^true/);
    expect(detail(plain)).toMatch(/^false/);
  });

  it("reads a letter as an option, words as a written answer, and refuses two letters", () => {
    const outcome = (answer: string | undefined): string | undefined => {
      const result: LogResult = {
        correct: false,
        q: 4,
        topic: "t1",
        ...(answer === undefined ? {} : { answer }),
      };
      return outcomeOf(mapAnswer(session([result]), result), "AnswerEvent.response");
    };
    expect(outcome("c")).toBe("fitsWithNote");
    expect(outcome("Penetration pricing")).toBe("fitsWithNote");
    expect(outcome("c/d")).toBe("noPlaceToKeep");
    expect(outcome(undefined)).toBe("requiredNotRecorded");
  });

  it("reports a re-test label and a source tag as having nowhere to go", () => {
    const result: LogResult = {
      correct: true,
      q: "X1",
      topic: "t1",
      answer: "Zone",
      retest: "zone",
      sourceTag: "slides",
    };
    const findings = mapAnswer(session([result]), result);
    expect(outcomeOf(findings, "Re-test label")).toBe("noPlaceToKeep");
    expect(outcomeOf(findings, "Question.sources")).toBe("noPlaceToKeep");
  });
});

describe("checkGrade", () => {
  it("turns right and wrong into one 1-point part that the existing checks accept", () => {
    const right = checkGrade("x", { correct: true, q: 1, topic: "t1" });
    const wrong = checkGrade("y", { correct: false, q: 2, topic: "t1", note: "Picked B" });
    expect(right.problems).toEqual([]);
    expect(right.category).toBe("correct");
    expect(wrong.category).toBe("incorrect");
    expect(wrong.evaluation).toMatchObject({
      status: "graded",
      gradedBy: { kind: "ai", version: "exam2-log-import" },
      components: [{ pointsEarned: 0, note: "Picked B" }],
    });
  });
});

describe("mapSession", () => {
  it("flags a logged score that disagrees with the answers", () => {
    const results: LogResult[] = [
      { correct: true, q: 1, topic: "t1" },
      { correct: false, q: 2, topic: "t1" },
    ];
    const findings = mapSession(session(results, { score: 2 }));
    expect(outcomeOf(findings, "Session score (worked out from answers)")).toBe("fitsWithNote");
  });

  it("doesn't force a non-study session into a study mode, or accept a time without a zone", () => {
    const findings = mapSession(session([], { mode: "Setup", date: "2026-10-26T20:48:00" }));
    expect(outcomeOf(findings, "Session.mode")).toBe("noPlaceToKeep");
    expect(outcomeOf(findings, "Session.startedAt")).toBe("requiredNotRecorded");
  });
});

describe("selectSample", () => {
  it("takes the rare cases first and covers every topic", () => {
    const results: LogResult[] = [
      { correct: false, q: 1, topic: "t1", answer: "c/d", guess: true, note: "Torn" },
      { correct: false, q: 2, topic: "t1", answer: "b", note: "Zone pricing" },
      { correct: true, q: 3, topic: "t2", answer: "a" },
    ];
    const picked = selectSample([session(results)], ["t1", "t2"]);
    expect(picked.map((item) => item.reason)).toEqual([
      "guess",
      "miss with a note on a key concept",
      "right answer",
    ]);
  });

  it("refuses a sample that leaves out a topic", () => {
    const results: LogResult[] = [{ correct: true, q: 1, topic: "t1", answer: "a" }];
    expect(() => selectSample([session(results)], ["t1", "t2"])).toThrow(/t2/);
  });
});

describe("slides", () => {
  const bundle = [
    "=====",
    "Made Up Deck.pptx",
    "=====",
    "--- Slide 1 ---",
    "Title only",
    "--- Slide 2 ---",
    "Pricing",
    "Price is what you pay.",
    "=====",
    "Other.pptx",
  ].join("\n");

  it("reads one deck and stops at the next", () => {
    expect(readDeck(bundle, "Made Up Deck.pptx")).toEqual([
      { number: 1, lines: ["Title only"] },
      { number: 2, lines: ["Pricing", "Price is what you pay."] },
    ]);
    expect(() => readDeck(bundle, "Missing.pptx")).toThrow(/Missing/);
  });

  it("flags a slide whose content isn't text", () => {
    const findings = mapSlides("Made Up Deck.pptx", 2, readDeck(bundle, "Made Up Deck.pptx"));
    const pictureOnly = findings.filter((finding) => finding.field === "Slide content");
    expect(pictureOnly.map((finding) => finding.record)).toEqual(["Made Up Deck.pptx slide 1"]);
  });
});

describe("summarizeByField", () => {
  it("counts outcomes per field", () => {
    const summary = summarizeByField([
      { record: "a", field: "F", outcome: "fits", detail: "" },
      { record: "b", field: "F", outcome: "noPlaceToKeep", detail: "" },
    ]);
    expect(summary["F"]).toMatchObject({ fits: 1, noPlaceToKeep: 1, fitsWithNote: 0 });
  });
});

describe("reading the log", () => {
  it("accepts a well-formed answer and refuses one with a missing or wrong field", () => {
    expect(isLogResult({ correct: true, q: "F1", topic: "t1", guess: true })).toBe(true);
    expect(isLogResult({ correct: "yes", q: 1, topic: "t1" })).toBe(false);
    expect(isLogResult({ correct: true, q: 1 })).toBe(false);
  });

  it("refuses a session whose answers aren't all well-formed", () => {
    const base = {
      date: "2026-10-26T20:48:00-04:00",
      mode: "Quick Review",
      title: "",
      note: "",
      source: "claude",
    };
    expect(isLogSession({ ...base, results: [{ correct: true, q: 1, topic: "t1" }] })).toBe(true);
    expect(isLogSession({ ...base, results: [{ q: 1, topic: "t1" }] })).toBe(false);
  });
});
