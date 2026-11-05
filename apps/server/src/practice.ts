// The connection test's one practice question: what the chat may see, and grading by code.
// The answer key never leaves the server before the learner answers (decision 0002).
import {
  categorizeResult,
  makeId,
  type AnswerEvent,
  type IsoDateTime,
  type LearnerId,
  type OptionLabel,
  type Question,
  type SessionId,
} from "@studybuddy/core";

/** What the chat and the screen are allowed to see before an answer: no key, no right option. */
export interface PublicQuestion {
  readonly questionId: string;
  readonly stem: string;
  readonly options: readonly { readonly label: OptionLabel; readonly text: string }[];
}

/** What the screen shows after an answer is checked. */
export interface PracticeResult {
  readonly correct: boolean;
  readonly pickedLabel: OptionLabel;
  readonly correctLabel: OptionLabel;
  readonly explanation: string;
}

export const CODE_GRADER = { kind: "code", version: "connection-test-1" } as const;

export function toPublicQuestion(question: Question): PublicQuestion {
  return {
    questionId: question.id,
    stem: question.stem,
    options: question.options.map(({ label, text }) => ({ label, text })),
  };
}

function correctOptionLabel(question: Question): OptionLabel {
  const correct = question.options.filter((option) => option.isCorrect);
  const only = correct[0];
  if (correct.length !== 1 || only === undefined) {
    throw new Error(`Question ${question.id} must have exactly one correct option.`);
  }
  return only.label;
}

export interface AnswerContext {
  readonly ownerId: LearnerId;
  readonly sessionId: SessionId;
  readonly answerId: string;
  readonly submittedAt: IsoDateTime;
}

/**
 * Grades a picked option by code and returns the answer record. Only single-part multiple-choice
 * questions are supported here; anything else is refused rather than guessed.
 */
export function gradeOptionAnswer(
  question: Question,
  picked: string,
  context: AnswerContext,
): AnswerEvent {
  const option = question.options.find((candidate) => candidate.label === picked);
  if (option === undefined) {
    throw new Error(`"${picked}" isn't one of this question's options.`);
  }
  const part = question.rubric[0];
  if (question.format !== "multipleChoice" || question.rubric.length !== 1 || part === undefined) {
    throw new Error(`Question ${question.id} isn't a one-part multiple-choice question.`);
  }
  correctOptionLabel(question);
  return {
    id: makeId("AnswerEvent", context.answerId),
    ownerId: context.ownerId,
    sessionId: context.sessionId,
    questionId: question.id,
    response: { kind: "option", label: option.label },
    markedUnsure: false,
    assistance: "none",
    // The connection test doesn't time answers yet.
    timeTakenMs: 0,
    submittedAt: context.submittedAt,
    evaluation: {
      status: "graded",
      components: [{ componentId: part.id, pointsEarned: option.isCorrect ? part.points : 0 }],
      gradedBy: CODE_GRADER,
    },
  };
}

/** The result to show for a saved answer. Uses the foundation's grade reader, never a copy. */
export function toPracticeResult(question: Question, answer: AnswerEvent): PracticeResult {
  if (answer.response.kind !== "option") {
    throw new Error(`Answer ${answer.id} isn't a picked option.`);
  }
  return {
    correct: categorizeResult(answer.evaluation, question) === "correct",
    pickedLabel: answer.response.label,
    correctLabel: correctOptionLabel(question),
    explanation: question.answerKey,
  };
}
