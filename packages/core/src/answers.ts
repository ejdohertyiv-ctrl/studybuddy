// Checks on answer records, and their order in time. "Not recorded" values (decision 0004) are
// allowed only where they're honest, and never turned into a made-up number or time.
import { isImportedQuestion, type AnyQuestion } from "./course-content.ts";
import type { SessionId } from "./ids.ts";
import type { AnswerEvent, Session } from "./study-history.ts";
import { parseIsoDateTime } from "./time.ts";

/**
 * Everything wrong with one answer record. Empty when it's usable.
 *
 * Answers to StudyBuddy's own questions are given in StudyBuddy, so their hints, exact time and
 * time taken are always known (owner, November 5, 2026). "notRecorded" and "sessionOnly" are
 * refused for them; they are only for imported history.
 */
export function findAnswerProblems(answer: AnswerEvent, question: AnyQuestion): string[] {
  const problems: string[] = [];
  if (answer.questionId !== question.id) {
    problems.push(`Answer ${answer.id} is for question ${answer.questionId}, not ${question.id}.`);
  }

  if (answer.timeTaken.status === "measured") {
    const { ms } = answer.timeTaken;
    if (!Number.isFinite(ms) || ms < 0) {
      problems.push(`Answer ${answer.id} took ${String(ms)} ms, which isn't a real duration.`);
    }
  }

  if (answer.answeredAt.kind === "exact") {
    try {
      parseIsoDateTime(answer.answeredAt.at);
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
    }
  } else if (!Number.isInteger(answer.answeredAt.position) || answer.answeredAt.position < 1) {
    problems.push(
      `Answer ${answer.id} has position ${String(answer.answeredAt.position)}; positions start at 1.`,
    );
  }

  if (!isImportedQuestion(question)) {
    if (answer.assistance === "notRecorded") {
      problems.push(
        `Answer ${answer.id} was given in StudyBuddy, so its hints must be recorded, not "notRecorded".`,
      );
    }
    if (answer.timeTaken.status === "notRecorded") {
      problems.push(
        `Answer ${answer.id} was given in StudyBuddy, so its time taken must be measured.`,
      );
    }
    if (answer.answeredAt.kind === "sessionOnly") {
      problems.push(`Answer ${answer.id} was given in StudyBuddy, so it needs its exact time.`);
    }
  }
  return problems;
}

/**
 * Problems with the answers of one session as a set: a session uses either exact times or
 * positions, never both, and no two answers share a position.
 */
export function findSessionOrderProblems(answers: readonly AnswerEvent[]): string[] {
  const problems: string[] = [];
  const bySession = new Map<SessionId, AnswerEvent[]>();
  for (const answer of answers) {
    bySession.set(answer.sessionId, [...(bySession.get(answer.sessionId) ?? []), answer]);
  }
  for (const [sessionId, sessionAnswers] of bySession) {
    const kinds = new Set(sessionAnswers.map((answer) => answer.answeredAt.kind));
    if (kinds.size > 1) {
      problems.push(
        `Session ${sessionId} mixes exact times and positions, so its order is unclear.`,
      );
    }
    const seen = new Set<number>();
    for (const answer of sessionAnswers) {
      if (answer.answeredAt.kind !== "sessionOnly") {
        continue;
      }
      if (seen.has(answer.answeredAt.position)) {
        problems.push(
          `Session ${sessionId} has two answers at position ${String(answer.answeredAt.position)}.`,
        );
      }
      seen.add(answer.answeredAt.position);
    }
  }
  return problems;
}

/**
 * The answers in the order they were given: by session start, then by exact time or position.
 * Throws if an answer's session is missing or the order can't be told, rather than guessing.
 */
export function orderAnswers(
  answers: readonly AnswerEvent[],
  sessions: readonly Session[],
): AnswerEvent[] {
  const problems = findSessionOrderProblems(answers);
  if (problems.length > 0) {
    throw new Error(problems.join(" "));
  }
  const sessionStart = new Map(
    sessions.map((session) => [session.id, parseIsoDateTime(session.startedAt)]),
  );
  const keyed = answers.map((answer) => {
    const start = sessionStart.get(answer.sessionId);
    if (start === undefined) {
      throw new Error(
        `Answer ${answer.id} belongs to session ${answer.sessionId}, which is missing.`,
      );
    }
    const within =
      answer.answeredAt.kind === "exact"
        ? parseIsoDateTime(answer.answeredAt.at)
        : answer.answeredAt.position;
    return { answer, start, within };
  });
  return keyed
    .sort((first, second) => first.start - second.start || first.within - second.within)
    .map(({ answer }) => answer);
}
