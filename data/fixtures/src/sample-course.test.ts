import {
  categorizeResult,
  findCurrentEvaluation,
  findEvaluationProblems,
  parseIsoDateTime,
  type Question,
} from "@studybuddy/core";
import { describe, expect, it } from "vitest";
import { sampleCourse } from "./sample-course.ts";

const {
  course,
  exams,
  sourceDocuments,
  topics,
  concepts,
  questions,
  learner,
  sessions,
  answers,
  corrections,
  confusionPairs,
  conceptStates,
} = sampleCourse;

const documentIds = new Set<string>(sourceDocuments.map((document) => document.id));
const topicIds = new Set<string>(topics.map((topic) => topic.id));
const conceptIds = new Set<string>(concepts.map((concept) => concept.id));
const answerIds = new Set<string>(answers.map((answer) => answer.id));

function findQuestion(id: string): Question {
  const question = questions.find((candidate) => candidate.id === id);
  if (question === undefined) {
    throw new Error(`No question ${id}`);
  }
  return question;
}

function expectUnique(ids: readonly string[]): void {
  expect(new Set(ids).size).toBe(ids.length);
}

describe("sample course: every reference points at a real record", () => {
  it("has unique IDs in every collection", () => {
    expectUnique(exams.map((exam) => exam.id));
    expectUnique([...documentIds]);
    expectUnique(topics.map((topic) => topic.id));
    expectUnique(concepts.map((concept) => concept.id));
    expectUnique(questions.map((question) => question.id));
    expectUnique(answers.map((answer) => answer.id));
  });

  it("links course content together", () => {
    for (const exam of exams) {
      expect(exam.courseId).toBe(course.id);
      expect(exam.topicIds.every((id) => topicIds.has(id))).toBe(true);
      if (exam.formatTemplate !== undefined) {
        expect(documentIds.has(exam.formatTemplate.sourceDocumentId)).toBe(true);
      }
    }
    for (const concept of concepts) {
      expect(topicIds.has(concept.topicId)).toBe(true);
      expect(concept.prerequisiteIds.every((id) => conceptIds.has(id))).toBe(true);
      expect(concept.sources.every((source) => documentIds.has(source.documentId))).toBe(true);
    }
  });

  it("puts at least two concepts in every sibling group", () => {
    const groupSizes = new Map<string, number>();
    for (const concept of concepts) {
      if (concept.siblingGroupId !== undefined) {
        groupSizes.set(concept.siblingGroupId, (groupSizes.get(concept.siblingGroupId) ?? 0) + 1);
      }
    }
    expect([...groupSizes.values()].every((size) => size >= 2)).toBe(true);
  });

  it("links study history to the learner, questions and course", () => {
    for (const session of sessions) {
      expect(session.ownerId).toBe(learner.id);
      expect(session.courseId).toBe(course.id);
    }
    for (const answer of answers) {
      expect(answer.ownerId).toBe(learner.id);
      expect(sessions.some((session) => session.id === answer.sessionId)).toBe(true);
      expect(() => findQuestion(answer.questionId)).not.toThrow();
    }
    for (const correction of corrections) {
      expect(answerIds.has(correction.answerEventId)).toBe(true);
    }
    for (const pair of confusionPairs) {
      expect(pair.conceptIds.every((id) => conceptIds.has(id))).toBe(true);
    }
    for (const state of conceptStates) {
      expect(conceptIds.has(state.conceptId)).toBe(true);
      expect(state.evidenceAnswerIds.every((id) => answerIds.has(id))).toBe(true);
    }
  });
});

describe("sample course: questions are well-formed", () => {
  it("gives each choice question exactly one correct option, with unique labels", () => {
    for (const question of questions) {
      if (question.format === "multipleChoice" || question.format === "trueFalse") {
        expect(question.options.filter((option) => option.isCorrect)).toHaveLength(1);
        expectUnique(question.options.map((option) => option.label));
      } else {
        expect(question.options).toHaveLength(0);
      }
    }
  });

  it("tags only wrong options with the sibling concept they stand for", () => {
    for (const question of questions) {
      for (const option of question.options) {
        if (option.standsForConceptId !== undefined) {
          expect(option.isCorrect).toBe(false);
          expect(conceptIds.has(option.standsForConceptId)).toBe(true);
          expect(question.conceptIds).not.toContain(option.standsForConceptId);
        }
      }
    }
  });

  it("ties every rubric part to one of the question's own concepts", () => {
    for (const question of questions) {
      expect(question.rubric.length).toBeGreaterThan(0);
      for (const component of question.rubric) {
        expect(question.conceptIds).toContain(component.conceptId);
      }
    }
  });

  it("gives every original grade and correction a grade that fits its question", () => {
    for (const answer of answers) {
      const question = findQuestion(answer.questionId);
      expect(findEvaluationProblems(answer.evaluation, question)).toEqual([]);
      for (const correction of corrections.filter((fix) => fix.answerEventId === answer.id)) {
        expect(findEvaluationProblems(correction.evaluation, question)).toEqual([]);
      }
    }
  });

  it("writes every moment as a real ISO date-time with a time zone", () => {
    const moments = [
      ...sessions.flatMap((session) =>
        session.endedAt === undefined ? [session.startedAt] : [session.startedAt, session.endedAt],
      ),
      ...answers.map((answer) => answer.submittedAt),
      ...corrections.map((correction) => correction.correctedAt),
      ...confusionPairs.map((pair) => pair.lastConfusedAt),
      ...conceptStates.flatMap((state) =>
        state.nextRetestAt === undefined ? [] : [state.nextRetestAt],
      ),
    ];
    expect(moments.length).toBeGreaterThan(0);
    for (const moment of moments) {
      expect(() => parseIsoDateTime(moment)).not.toThrow();
    }
  });

  it("only lets option responses pick labels the question actually has", () => {
    for (const answer of answers) {
      if (answer.response.kind === "option") {
        const { label } = answer.response;
        const labels = findQuestion(answer.questionId).options.map((option) => option.label);
        expect(labels).toContain(label);
      }
    }
  });
});

describe("sample course: the story turns out as described", () => {
  it("grades the four answers: correct, wrong, unresolved then corrected, correct", () => {
    const results = answers.map((answer) =>
      categorizeResult(findCurrentEvaluation(answer, corrections), findQuestion(answer.questionId)),
    );
    expect(results).toEqual(["correct", "incorrect", "partlyCorrect", "correct"]);
  });

  it("keeps the original unresolved grade alongside its correction", () => {
    const corrected = answers[2];
    expect(corrected?.evaluation.status).toBe("unresolved");
  });

  it("records the mix-up through the wrong option's sibling tag", () => {
    const wrong = answers[1];
    if (wrong?.response.kind !== "option") {
      throw new Error("Expected answer-2 to pick an option");
    }
    const pickedLabel = wrong.response.label;
    const picked = findQuestion(wrong.questionId).options.find(
      (option) => option.label === pickedLabel,
    );
    expect(picked?.standsForConceptId).toBe("price-skimming");
    expect(confusionPairs[0]?.conceptIds).toContain("price-skimming");
  });
});
