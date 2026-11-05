// Puts Exam 2 log entries into StudyBuddy's records and records how well each field fits.
// The rule (owner, November 5, 2026): never invent a value the log doesn't hold. A field the
// records require but the log lacks is reported, not filled in.
import {
  categorizeResult,
  findEvaluationProblems,
  makeId,
  parseIsoDateTime,
  type Evaluation,
  type OptionLabel,
  type Question,
  type Response,
  type StudyMode,
} from "@studybuddy/core";
import type { LogResult, LogSession } from "./exam2-log.ts";

/**
 * - fits: the log's value goes into a field as it is.
 * - fitsWithNote: it goes in, but something about it is lost or reinterpreted (see detail).
 * - optionalNotRecorded: the log lacks it and the records allow it to be missing.
 * - requiredNotRecorded: the log lacks it but the records require it. A gap.
 * - noPlaceToKeep: the log has it but no field can hold it. A gap.
 */
export type FitOutcome =
  "fits" | "fitsWithNote" | "optionalNotRecorded" | "requiredNotRecorded" | "noPlaceToKeep";

export interface FieldFinding {
  /** Which logged record, e.g. "s21-clear-red #X3". */
  readonly record: string;
  /** The StudyBuddy field, e.g. "AnswerEvent.timeTakenMs". */
  readonly field: string;
  readonly outcome: FitOutcome;
  readonly detail: string;
}

/** Recorded as the grader for answers imported from the log (owner, November 5, 2026). */
export const IMPORT_GRADER = { kind: "ai", version: "exam2-log-import" } as const;

const studyModes: Readonly<Record<string, StudyMode>> = {
  "Quick Review": "quickReview",
  "Focused Review": "focusedReview",
  "Exam Practice": "examPractice",
};

const optionLabels: Readonly<Record<string, OptionLabel>> = {
  a: "A",
  b: "B",
  c: "C",
  d: "D",
  e: "E",
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function answerKey(session: LogSession, result: LogResult): string {
  return `${session.key} #${String(result.q)}`;
}

export function mapSession(session: LogSession): FieldFinding[] {
  const record = session.key;
  const findings: FieldFinding[] = [];
  const add = (field: string, outcome: FitOutcome, detail: string): void => {
    findings.push({ record, field, outcome, detail });
  };

  const mode = studyModes[session.mode];
  if (mode === undefined) {
    add("Session.mode", "noPlaceToKeep", `"${session.mode}" isn't one of the three study modes.`);
  } else {
    add("Session.mode", "fits", mode);
  }

  try {
    parseIsoDateTime(session.date);
    add("Session.startedAt", "fits", session.date);
  } catch (error) {
    add("Session.startedAt", "requiredNotRecorded", errorMessage(error));
  }
  add("Session.endedAt", "optionalNotRecorded", "The log keeps one time per session.");
  add("Session title and note", "noPlaceToKeep", "Session has no title or note field.");

  const results = session.results ?? [];
  if (session.score !== undefined && session.total !== undefined) {
    const right = results.filter((result) => result.correct).length;
    const agrees = right === session.score && results.length === session.total;
    add(
      "Session score (worked out from answers)",
      agrees ? "fits" : "fitsWithNote",
      agrees
        ? `${String(right)}/${String(results.length)} matches the logged score.`
        : `Logged ${String(session.score)}/${String(session.total)}, but the answers add up to ${String(right)}/${String(results.length)}.`,
    );
  }
  return findings;
}

function mapResponse(answer: string | undefined): {
  response?: Response;
  outcome: FitOutcome;
  detail: string;
} {
  if (answer === undefined || answer.trim() === "") {
    return { outcome: "requiredNotRecorded", detail: "Only right or wrong was logged." };
  }
  const letter = /^([a-e])$/i.exec(answer.trim());
  if (letter !== null) {
    const label = optionLabels[(letter[1] ?? "").toLowerCase()];
    if (label === undefined) {
      return { outcome: "noPlaceToKeep", detail: `"${answer}" isn't an option letter.` };
    }
    return {
      response: { kind: "option", label },
      outcome: "fitsWithNote",
      detail: `Option ${label}, but the options it points to weren't recorded.`,
    };
  }
  if (/^[a-e]\s*\/\s*[a-e]$/i.test(answer.trim())) {
    return {
      outcome: "noPlaceToKeep",
      detail: `"${answer}": torn between two. A response holds one picked option.`,
    };
  }
  return {
    response: { kind: "text", text: answer },
    outcome: "fitsWithNote",
    detail: "The option's words, kept as a written answer; which letter it was isn't known.",
  };
}

/**
 * The grade check. Each logged question is one rubric part worth 1 point: right = 1, wrong = 0
 * (owner, November 5, 2026). The question here is a stand-in used only to run the existing
 * checks; it is not stored, because its text, options and key weren't recorded.
 */
export function checkGrade(
  key: string,
  result: LogResult,
): { evaluation: Evaluation; problems: string[]; category: string } {
  const questionId = makeId("Question", key);
  const partId = makeId("RubricComponent", `${key} whole`);
  const standIn: Question = {
    id: questionId,
    courseId: makeId("Course", "mgm-301"),
    conceptIds: [],
    format: "multipleChoice",
    angle: "definition",
    stem: "",
    options: [],
    answerKey: "",
    rubric: [
      {
        id: partId,
        description: "Whole question",
        points: 1,
        conceptId: makeId("Concept", "not linked"),
      },
    ],
    familyId: makeId("QuestionFamily", key),
    difficulty: { status: "unknown" },
    checkStatus: "checked",
    sources: [],
  };
  const evaluation: Evaluation = {
    status: "graded",
    components: [
      {
        componentId: partId,
        pointsEarned: result.correct ? 1 : 0,
        ...(result.note === undefined ? {} : { note: result.note }),
      },
    ],
    gradedBy: IMPORT_GRADER,
  };
  const problems = findEvaluationProblems(evaluation, standIn);
  let category: string;
  try {
    category = categorizeResult(evaluation, standIn);
  } catch (error) {
    category = `error: ${errorMessage(error)}`;
  }
  return { evaluation, problems, category };
}

export function mapAnswer(session: LogSession, result: LogResult): FieldFinding[] {
  const record = answerKey(session, result);
  const findings: FieldFinding[] = [];
  const add = (field: string, outcome: FitOutcome, detail: string): void => {
    findings.push({ record, field, outcome, detail });
  };

  add(
    "Question stem, options and answer key",
    "requiredNotRecorded",
    `The log keeps only the label "${String(result.q)}", not the question.`,
  );

  const response = mapResponse(result.answer);
  add("AnswerEvent.response", response.outcome, response.detail);

  add(
    "AnswerEvent.markedUnsure",
    "fits",
    result.guess === true ? "true (logged as a guess)" : "false (not marked)",
  );
  add("AnswerEvent.assistance", "requiredNotRecorded", "Hints weren't logged.");
  add(
    "AnswerEvent.timeTakenMs",
    "requiredNotRecorded",
    "Time per answer wasn't logged, and the field has no way to say unknown.",
  );
  add(
    "AnswerEvent.submittedAt",
    "requiredNotRecorded",
    "Only the session's time is logged, not each answer's.",
  );

  const expected = result.correct ? "correct" : "incorrect";
  const grade = checkGrade(record, result);
  if (grade.problems.length === 0 && grade.category === expected) {
    add(
      "AnswerEvent.evaluation",
      "fits",
      `${expected}: one part worth 1 point, earned ${result.correct ? "1" : "0"}.`,
    );
  } else {
    add(
      "AnswerEvent.evaluation",
      "noPlaceToKeep",
      `Expected ${expected}, the checks gave "${grade.category}". ${grade.problems.join(" ")}`,
    );
  }
  if (result.note !== undefined) {
    add("Grade note (ComponentScore.note)", "fitsWithNote", "Kept as a note on the grade.");
  }

  add(
    "Rubric part's concept",
    "requiredNotRecorded",
    result.term === undefined
      ? "No concept named."
      : `Named "${result.term}", but not linked to a concept record.`,
  );
  if (result.retest !== undefined) {
    add(
      "Re-test label",
      "noPlaceToKeep",
      `Re-tests "${result.retest}". No field links a re-test to the earlier try.`,
    );
  }
  if (result.sourceTag !== undefined) {
    add(
      "Question.sources",
      "noPlaceToKeep",
      `"${result.sourceTag}" names the kind of source, not a page or slide.`,
    );
  }
  add("Session.scope.topicIds", "fits", result.topic);
  return findings;
}
