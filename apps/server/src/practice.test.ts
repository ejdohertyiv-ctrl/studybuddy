import { makeId, type Question } from "@studybuddy/core";
import { sampleCourse } from "@studybuddy/fixtures";
import { describe, expect, it } from "vitest";
import { gradeOptionAnswer, toPracticeResult, toPublicQuestion } from "./practice.ts";

const question = sampleCourse.questions[0];
if (question === undefined) throw new Error("The sample course has no questions.");

const context = {
  ownerId: makeId("Learner", "owner"),
  sessionId: makeId("Session", "test"),
  answerId: "answer-1",
  submittedAt: "2026-11-04T12:00:00Z",
};

describe("toPublicQuestion", () => {
  it("shows the stem and options but never the key or which option is right", () => {
    const shown = JSON.stringify(toPublicQuestion(question));
    expect(shown).toContain(question.stem);
    expect(shown).not.toContain("isCorrect");
    expect(shown).not.toContain(question.answerKey);
    expect(shown).not.toContain("standsForConceptId");
  });
});

describe("gradeOptionAnswer", () => {
  it("gives full points for the right option and records it as graded by code", () => {
    const answer = gradeOptionAnswer(question, "A", context);
    expect(answer.evaluation).toMatchObject({ status: "graded", gradedBy: { kind: "code" } });
    expect(toPracticeResult(question, answer)).toMatchObject({
      correct: true,
      pickedLabel: "A",
      correctLabel: "A",
    });
  });

  it("gives zero points for a wrong option and still names the right one", () => {
    const answer = gradeOptionAnswer(question, "B", context);
    expect(toPracticeResult(question, answer)).toMatchObject({
      correct: false,
      pickedLabel: "B",
      correctLabel: "A",
    });
  });

  it("refuses an option the question doesn't have", () => {
    expect(() => gradeOptionAnswer(question, "E", context)).toThrow(/isn't one of/);
  });

  it("refuses a question with no single right option instead of guessing", () => {
    const broken: Question = {
      ...question,
      id: makeId("Question", "two-right"),
      options: question.options.map((option) => ({ ...option, isCorrect: true })),
    };
    expect(() => gradeOptionAnswer(broken, "A", context)).toThrow(/exactly one correct option/);
  });
});
