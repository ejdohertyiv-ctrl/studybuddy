import { describe, expect, it } from "vitest";
import type { Question } from "./course-content.ts";
import {
  categorizeResult,
  findCurrentEvaluation,
  findEvaluationProblems,
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

  it("refuses a correction with an unreadable or zone-less time", () => {
    expect(() =>
      findCurrentEvaluation(answer, [correction("fix-4", "yesterday", graded(1, 2))]),
    ).toThrow("isn't a valid ISO date-time");
    expect(() =>
      findCurrentEvaluation(answer, [correction("fix-5", "2026-10-30T16:00:00", graded(1, 2))]),
    ).toThrow("time zone");
  });

  it("refuses two corrections at the same latest moment, even written in different zones", () => {
    const first = correction("fix-6", "2026-10-30T16:00:00Z", graded(1, 1));
    const second = correction("fix-7", "2026-10-30T12:00:00-04:00", graded(1, 2));
    expect(() => findCurrentEvaluation(answer, [first, second])).toThrow("same time");
  });

  it("allows a tie between older corrections when a newer one decides", () => {
    const olderA = correction("fix-8", "2026-10-30T16:00:00Z", graded(0, 0));
    const olderB = correction("fix-9", "2026-10-30T16:00:00Z", graded(1, 0));
    const newest = correction("fix-10", "2026-10-30T18:00:00Z", graded(1, 2));
    expect(findCurrentEvaluation(answer, [olderA, newest, olderB])).toBe(newest.evaluation);
  });
});

describe("findEvaluationProblems: a grade must fit its question", () => {
  it("finds nothing wrong with a complete, in-range grade", () => {
    expect(findEvaluationProblems(graded(1, 2), question)).toEqual([]);
    expect(findEvaluationProblems({ status: "pending" }, question)).toEqual([]);
  });

  it("flags points above a part's maximum, negative points and non-numbers", () => {
    expect(findEvaluationProblems(graded(5, 0), question)).toHaveLength(1);
    expect(findEvaluationProblems(graded(-1, 0), question)).toHaveLength(1);
    expect(findEvaluationProblems(graded(Number.NaN, 0), question)).toHaveLength(1);
  });

  it("flags a part the question doesn't have, and a part scored twice", () => {
    const strayPart: Evaluation = {
      status: "graded",
      components: [
        { componentId: setupPart, pointsEarned: 1 },
        { componentId: reasonPart, pointsEarned: 2 },
        { componentId: makeId("RubricComponent", "not-in-this-question"), pointsEarned: 1 },
      ],
      gradedBy: grader,
    };
    expect(findEvaluationProblems(strayPart, question)).toEqual([
      "Scores rubric part not-in-this-question, which question question-1 lacks.",
    ]);
    const twice: Evaluation = {
      status: "graded",
      components: [
        { componentId: setupPart, pointsEarned: 1 },
        { componentId: setupPart, pointsEarned: 1 },
        { componentId: reasonPart, pointsEarned: 0 },
      ],
      gradedBy: grader,
    };
    expect(findEvaluationProblems(twice, question)).toEqual([
      "Scores rubric part part-setup more than once.",
    ]);
  });

  it("requires a graded result to score every part, but lets an unresolved one score some", () => {
    const missingPart: Evaluation = {
      status: "graded",
      components: [{ componentId: setupPart, pointsEarned: 1 }],
      gradedBy: grader,
    };
    expect(findEvaluationProblems(missingPart, question)).toEqual([
      "Leaves rubric part part-reason ungraded.",
    ]);
    const partlyGradable: Evaluation = { ...missingPart, status: "unresolved", reason: "Unclear" };
    expect(findEvaluationProblems(partlyGradable, question)).toEqual([]);
  });
});

describe("categorizeResult refuses inconsistent grades instead of reporting them", () => {
  it("throws rather than calling an over-scored answer correct", () => {
    // Without the check, 5 + 0 = 5 points would exceed the 3 available and read as "correct".
    expect(() => categorizeResult(graded(5, 0), question)).toThrow("Inconsistent grade");
  });

  it("throws rather than calling a half-graded answer partly correct", () => {
    const missingPart: Evaluation = {
      status: "graded",
      components: [{ componentId: setupPart, pointsEarned: 1 }],
      gradedBy: grader,
    };
    expect(() => categorizeResult(missingPart, question)).toThrow("ungraded");
  });

  it("calls full marks correct even when decimal points don't add up exactly", () => {
    // Worked by hand: parts of 0.1, 0.2 and 0.3 make 0.6 points. In computer arithmetic,
    // adding them in rubric order gives 0.6000000000000001, but adding the earned points in the
    // order graded (0.3, 0.2, 0.1) gives exactly 0.6, which an exact comparison would call
    // less than full marks.
    const thirdPart = makeId("RubricComponent", "part-apply");
    const decimalQuestion: Question = {
      ...question,
      rubric: [
        { id: setupPart, description: "Small part", points: 0.1, conceptId },
        { id: reasonPart, description: "Middle part", points: 0.2, conceptId },
        { id: thirdPart, description: "Large part", points: 0.3, conceptId },
      ],
    };
    expect(sumRubricPoints(decimalQuestion)).not.toBe(0.6);
    const fullMarks: Evaluation = {
      status: "graded",
      components: [
        { componentId: thirdPart, pointsEarned: 0.3 },
        { componentId: reasonPart, pointsEarned: 0.2 },
        { componentId: setupPart, pointsEarned: 0.1 },
      ],
      gradedBy: grader,
    };
    expect(sumPointsEarned(fullMarks)).toBe(0.6);
    expect(categorizeResult(fullMarks, decimalQuestion)).toBe("correct");
  });
});
