import { describe, expect, it } from "vitest";
import { findAnswerProblems, findSessionOrderProblems, orderAnswers } from "./answers.ts";
import {
  isCheckedQuestion,
  isImportedQuestion,
  type ImportedQuestion,
  type Question,
} from "./course-content.ts";
import { categorizeResult, findEvaluationProblems } from "./grading.ts";
import { makeId } from "./ids.ts";
import type { AnswerEvent, Session } from "./study-history.ts";

const courseId = makeId("Course", "made-up");
const partId = makeId("RubricComponent", "whole");

const ownQuestion: Question = {
  id: makeId("Question", "own"),
  courseId,
  conceptIds: [],
  format: "multipleChoice",
  angle: "definition",
  stem: "Made-up question?",
  options: [{ label: "A", text: "Yes", isCorrect: true }],
  answerKey: "Yes.",
  rubric: [{ id: partId, description: "Answer", points: 1, conceptId: makeId("Concept", "c") }],
  familyId: makeId("QuestionFamily", "f"),
  difficulty: { status: "unknown" },
  checkStatus: "checked",
  sources: [],
};

const imported: ImportedQuestion = {
  id: makeId("Question", "imported"),
  courseId,
  topicId: makeId("Topic", "t1"),
  label: "F1",
  importedFrom: "a made-up log",
  rubric: [{ id: partId, description: "Whole question", points: 1 }],
};

function answer(overrides: Partial<AnswerEvent> = {}): AnswerEvent {
  return {
    id: makeId("AnswerEvent", "a1"),
    ownerId: makeId("Learner", "owner"),
    sessionId: makeId("Session", "s1"),
    questionId: ownQuestion.id,
    response: { kind: "option", label: "A" },
    markedUnsure: false,
    assistance: "none",
    timeTaken: { status: "measured", ms: 5000 },
    answeredAt: { kind: "exact", at: "2026-11-05T15:00:00Z" },
    evaluation: {
      status: "graded",
      components: [{ componentId: partId, pointsEarned: 1 }],
      gradedBy: { kind: "code", version: "test" },
    },
    ...overrides,
  };
}

const importedAnswer = (id: string, position: number): AnswerEvent =>
  answer({
    id: makeId("AnswerEvent", id),
    questionId: imported.id,
    assistance: "notRecorded",
    timeTaken: { status: "notRecorded" },
    answeredAt: { kind: "sessionOnly", position },
  });

describe("findAnswerProblems", () => {
  it("accepts a fully recorded live answer", () => {
    expect(findAnswerProblems(answer(), ownQuestion)).toEqual([]);
  });

  it("accepts not-recorded hints, time taken and time for an imported question", () => {
    expect(findAnswerProblems(importedAnswer("i1", 1), imported)).toEqual([]);
  });

  it("refuses not-recorded values on an answer given in StudyBuddy", () => {
    const problems = findAnswerProblems(
      answer({
        assistance: "notRecorded",
        timeTaken: { status: "notRecorded" },
        answeredAt: { kind: "sessionOnly", position: 1 },
      }),
      ownQuestion,
    );
    expect(problems).toHaveLength(3);
  });

  it("refuses a time taken or position that isn't real", () => {
    expect(
      findAnswerProblems(answer({ timeTaken: { status: "measured", ms: -1 } }), ownQuestion),
    ).toHaveLength(1);
    expect(
      findAnswerProblems(
        answer({ questionId: imported.id, answeredAt: { kind: "sessionOnly", position: 0 } }),
        imported,
      ),
    ).toHaveLength(1);
    expect(
      findAnswerProblems(answer({ answeredAt: { kind: "exact", at: "yesterday" } }), ownQuestion),
    ).toHaveLength(1);
  });

  it("refuses an answer checked against the wrong question", () => {
    expect(findAnswerProblems(answer(), imported).join(" ")).toMatch(/is for question/);
  });
});

describe("imported questions", () => {
  it("are never checked questions", () => {
    expect(isImportedQuestion(imported)).toBe(true);
    expect(isCheckedQuestion(imported)).toBe(false);
    expect(isCheckedQuestion(ownQuestion)).toBe(true);
    expect(isCheckedQuestion({ ...ownQuestion, checkStatus: "draft" })).toBe(false);
  });

  it("can still be graded from their rubric", () => {
    const wrong = importedAnswer("i2", 1);
    const evaluation = {
      ...wrong.evaluation,
      components: [{ componentId: partId, pointsEarned: 0 }],
    };
    expect(findEvaluationProblems(evaluation, imported)).toEqual([]);
    expect(categorizeResult(evaluation, imported)).toBe("incorrect");
  });
});

describe("answer order", () => {
  const sessions: Session[] = [
    {
      id: makeId("Session", "s1"),
      ownerId: makeId("Learner", "owner"),
      courseId,
      mode: "quickReview",
      startedAt: "2026-10-26T14:00:00Z",
      scope: { topicIds: [] },
    },
    {
      id: makeId("Session", "s0"),
      ownerId: makeId("Learner", "owner"),
      courseId,
      mode: "quickReview",
      startedAt: "2026-10-25T14:00:00Z",
      scope: { topicIds: [] },
    },
  ];

  it("orders by session start, then position, without inventing times", () => {
    const later = importedAnswer("later", 2);
    const earlier = importedAnswer("earlier", 1);
    const otherSession = { ...importedAnswer("first", 1), sessionId: makeId("Session", "s0") };
    expect(orderAnswers([later, earlier, otherSession], sessions).map((a) => a.id)).toEqual([
      otherSession.id,
      earlier.id,
      later.id,
    ]);
  });

  it("refuses a session that mixes times and positions, or repeats a position", () => {
    expect(findSessionOrderProblems([answer(), importedAnswer("p", 1)])).toHaveLength(1);
    expect(findSessionOrderProblems([importedAnswer("x", 1), importedAnswer("y", 1)])).toHaveLength(
      1,
    );
    expect(() => orderAnswers([answer(), importedAnswer("p", 1)], sessions)).toThrow(/mixes/);
  });

  it("refuses an answer whose session is missing", () => {
    expect(() => orderAnswers([answer()], [])).toThrow(/missing/);
  });
});
