// Small pure helpers for reading grades. They work things out from the records instead of
// storing them twice, and refuse inconsistent data rather than turning it into a result.
import type { QuestionId, RubricComponentId } from "./ids.ts";
import type { AnswerEvent, Evaluation, GradingCorrection } from "./study-history.ts";
import { parseIsoDateTime } from "./time.ts";

export type ResultCategory =
  | "correct"
  | "partlyCorrect"
  | "incorrect"
  /** Not graded yet. */
  | "pending"
  /** Couldn't be graded reliably. Evaluator uncertainty is not "partly correct". */
  | "unresolved";

/**
 * What grading needs from a question: its id and its rubric. Both full and imported questions
 * have these (decision 0004).
 */
export interface GradableQuestion {
  readonly id: QuestionId;
  readonly rubric: readonly { readonly id: RubricComponentId; readonly points: number }[];
}

// Points may be fractions (e.g. 0.5). Sums like 0.1 + 0.2 aren't exact in computer
// arithmetic, so point comparisons allow this much rounding error.
const pointTolerance = 1e-9;

/** Total points a question is worth: the sum of its rubric parts. */
export function sumRubricPoints(question: GradableQuestion): number {
  return question.rubric.reduce((total, component) => total + component.points, 0);
}

/** Total points earned across the graded rubric parts. */
export function sumPointsEarned(evaluation: Evaluation): number {
  if (evaluation.status === "pending") {
    return 0;
  }
  return evaluation.components.reduce((total, score) => total + score.pointsEarned, 0);
}

/**
 * Everything that makes a grade inconsistent with its question. Empty when the grade is usable.
 * Each scored part must belong to the question's rubric, be scored at most once, and earn between
 * 0 and that part's points. A "graded" result must score every part; an "unresolved" one may score
 * only the parts that could be graded.
 */
export function findEvaluationProblems(
  evaluation: Evaluation,
  question: GradableQuestion,
): string[] {
  if (evaluation.status === "pending") {
    return [];
  }
  const problems: string[] = [];
  const scoredPartIds = new Set<string>();
  for (const score of evaluation.components) {
    const part = question.rubric.find((component) => component.id === score.componentId);
    if (part === undefined) {
      problems.push(
        `Scores rubric part ${score.componentId}, which question ${question.id} lacks.`,
      );
      continue;
    }
    if (scoredPartIds.has(part.id)) {
      problems.push(`Scores rubric part ${part.id} more than once.`);
    }
    scoredPartIds.add(part.id);
    const earned = score.pointsEarned;
    if (!Number.isFinite(earned) || earned < 0 || earned > part.points + pointTolerance) {
      problems.push(
        `Gives ${String(earned)} points on rubric part ${part.id}, which is worth ${String(part.points)}.`,
      );
    }
  }
  if (evaluation.status === "graded") {
    for (const part of question.rubric) {
      if (!scoredPartIds.has(part.id)) {
        problems.push(`Leaves rubric part ${part.id} ungraded.`);
      }
    }
  }
  return problems;
}

/**
 * Correct, partly correct or incorrect, worked out from the points. Throws if the question has no
 * points or the grade is inconsistent with the question, rather than reporting a wrong result.
 */
export function categorizeResult(
  evaluation: Evaluation,
  question: GradableQuestion,
): ResultCategory {
  if (evaluation.status !== "graded") {
    return evaluation.status;
  }
  const available = sumRubricPoints(question);
  if (available <= 0) {
    throw new Error(`Question ${question.id} has no rubric points, so it can't be graded.`);
  }
  const problems = findEvaluationProblems(evaluation, question);
  if (problems.length > 0) {
    throw new Error(`Inconsistent grade for question ${question.id}: ${problems.join(" ")}`);
  }
  const earned = sumPointsEarned(evaluation);
  if (earned >= available - pointTolerance) {
    return "correct";
  }
  return earned > pointTolerance ? "partlyCorrect" : "incorrect";
}

/**
 * The grade that currently stands: the latest correction, or the original if there is none.
 * Throws if a correction's time is unreadable, or if two corrections share the latest moment,
 * because then it's impossible to tell which one stands.
 */
export function findCurrentEvaluation(
  answer: AnswerEvent,
  corrections: readonly GradingCorrection[],
): Evaluation {
  const timed = corrections
    .filter((correction) => correction.answerEventId === answer.id)
    .map((correction) => ({ correction, at: parseIsoDateTime(correction.correctedAt) }))
    .sort((first, second) => second.at - first.at);
  const [latest, runnerUp] = timed;
  if (latest === undefined) {
    return answer.evaluation;
  }
  if (runnerUp?.at === latest.at) {
    throw new Error(
      `Corrections ${latest.correction.id} and ${runnerUp.correction.id} to answer ${answer.id} ` +
        "have the same time, so it's unclear which grade stands.",
    );
  }
  return latest.correction.evaluation;
}
