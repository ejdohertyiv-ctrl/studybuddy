import { describe, expect, it } from "vitest";
import type { Question } from "./course-content.ts";
import {
  categorizeResult,
  findCurrentEvaluation,
  sumPointsEarned,
  sumRubricPoints,
} from "./grading.ts";
import { makeId } from "./ids.ts";
import type { AnswerEvent, Evaluation, GradingCorrection } from "./study-history.ts";

const conceptId = makeId("Concept", "concept-1");
const setupPart = makeId("RubricComponent", "part-setup");
const reasonPart = makeId("RubricComponent", "part-reason");
const grader = { kind: "ai", version: "test-1" } as const;

const question: Question = {
  id: makeId("Question", "question-1"),
  courseId: makeId("Course", "course-1"),
  conceptIds: [conceptId],
  format: "scenario",
  angle: "scenario",
  stem: "A made-up scenario.",
  options: [],
  answerKey: "A made-up model answer.",
  rubric: [
    { id: setupPart, description: "Names the concept", points: 1, conceptId },
    { id: reasonPart, description: "Explains why", points: 2, conceptId },
  ],
  familyId: makeId("QuestionFamily", "family-1"),
  difficulty: { status: "unknown" },
  checkStatus: "checked",
  sources: [],
};

function graded(setup: number, reason: number): Evaluation {
  return {
    status: "graded",
    components: [
      { componentId: setupPart, pointsEarned: setup },
      { componentId: reasonPart, pointsEarned: reason },
    ],
    gradedBy: grader,
  };
}

describe("sumRubricPoints and sumPointsEarned", () => {
  it("adds up the rubric parts", () => {
    expect(sumRubricPoints(question)).toBe(3);
    expect(sumPointsEarned(graded(1, 1))).toBe(2);
    expect(sumPointsEarned({ status: "pending" })).toBe(0);
  });
});

describe("categorizeResult", () => {
  it("works out correct, partly correct and incorrect from the points", () => {
    expect(categorizeResult(graded(1, 2), question)).toBe("correct");
    expect(categorizeResult(graded(1, 0), question)).toBe("partlyCorrect");
    expect(categorizeResult(graded(0, 0), question)).toBe("incorrect");
  });

  it("never turns an ungraded or unreliable grade into a category", () => {
    expect(categorizeResult({ status: "pending" }, question)).toBe("pending");
    const unresolved: Evaluation = {
      status: "unresolved",
      reason: "Ambiguous wording",
      components: [{ componentId: setupPart, pointsEarned: 1 }],
      gradedBy: grader,
    };
    expect(categorizeResult(unresolved, question)).toBe("unresolved");
  });

  it("refuses a question with no rubric points", () => {
    expect(() => categorizeResult(graded(0, 0), { ...question, rubric: [] })).toThrow(
      "no rubric points",
    );
  });
});

describe("findCurrentEvaluation", () => {
  const answer: AnswerEvent = {
    id: makeId("AnswerEvent", "answer-1"),
    ownerId: makeId("Learner", "learner-1"),
    sessionId: makeId("Session", "session-1"),
    questionId: question.id,
    response: { kind: "text", text: "A made-up answer." },
    markedUnsure: false,
    assistance: "none",
    timeTakenMs: 30_000,
    submittedAt: "2026-10-30T15:00:00Z",
    evaluation: graded(1, 0),
  };

  function correction(id: string, correctedAt: string, evaluation: Evaluation): GradingCorrection {
    return {
      id: makeId("GradingCorrection", id),
      ownerId: answer.ownerId,
      answerEventId: answer.id,
      evaluation,
      reason: "Overlooked correct reasoning",
      correctedAt,
    };
  }

  it("keeps the original grade when there are no corrections", () => {
    expect(findCurrentEvaluation(answer, [])).toBe(answer.evaluation);
  });

  it("uses the latest correction, comparing real moments across time zones", () => {
    const earlier = correction("fix-1", "2026-10-30T16:00:00Z", graded(1, 1));
    // 12:30 in New York (UTC-4) is 16:30 UTC: later, even though "12" sorts before "16" as text.
    const later = correction("fix-2", "2026-10-30T12:30:00-04:00", graded(1, 2));
    expect(findCurrentEvaluation(answer, [later, earlier])).toBe(later.evaluation);
  });

  it("ignores corrections to other answers", () => {
    const forAnotherAnswer = {
      ...correction("fix-3", "2026-10-30T17:00:00Z", graded(1, 2)),
      answerEventId: makeId("AnswerEvent", "answer-2"),
    };
    expect(findCurrentEvaluation(answer, [forAnotherAnswer])).toBe(answer.evaluation);
  });
});
