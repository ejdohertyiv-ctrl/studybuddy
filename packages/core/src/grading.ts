// Small pure helpers for reading grades. They work things out from the records instead of
// storing them twice.
import type { Question } from "./course-content.ts";
import type { AnswerEvent, Evaluation, GradingCorrection } from "./study-history.ts";

export type ResultCategory =
  | "correct"
  | "partlyCorrect"
  | "incorrect"
  /** Not graded yet. */
  | "pending"
  /** Couldn't be graded reliably. Evaluator uncertainty is not "partly correct". */
  | "unresolved";

/** Total points a question is worth: the sum of its rubric parts. */
export function sumRubricPoints(question: Question): number {
  return question.rubric.reduce((total, component) => total + component.points, 0);
}

/** Total points earned across the graded rubric parts. */
export function sumPointsEarned(evaluation: Evaluation): number {
  if (evaluation.status === "pending") {
    return 0;
  }
  return evaluation.components.reduce((total, score) => total + score.pointsEarned, 0);
}

/** Correct, partly correct or incorrect, worked out from the points. */
export function categorizeResult(evaluation: Evaluation, question: Question): ResultCategory {
  if (evaluation.status !== "graded") {
    return evaluation.status;
  }
  const available = sumRubricPoints(question);
  if (available <= 0) {
    throw new Error(`Question ${question.id} has no rubric points, so it can't be graded.`);
  }
  const earned = sumPointsEarned(evaluation);
  if (earned >= available) {
    return "correct";
  }
  return earned > 0 ? "partlyCorrect" : "incorrect";
}

/** The grade that currently stands: the latest correction, or the original if there is none. */
export function findCurrentEvaluation(
  answer: AnswerEvent,
  corrections: readonly GradingCorrection[],
): Evaluation {
  const latest = corrections
    .filter((correction) => correction.answerEventId === answer.id)
    .reduce<GradingCorrection | undefined>(
      (newest, correction) =>
        newest === undefined || Date.parse(correction.correctedAt) > Date.parse(newest.correctedAt)
          ? correction
          : newest,
      undefined,
    );
  return latest === undefined ? answer.evaluation : latest.evaluation;
}
