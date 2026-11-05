// Picks the load test's answers from the log, following the approved blueprint (November 5,
// 2026): the awkward cases first, then enough right answers to cover every topic. The pick is
// fixed by the rules below, so running it again gives the same sample.
import type { LogResult, LogSession } from "./exam2-log.ts";

export interface PickedAnswer {
  readonly session: LogSession;
  readonly result: LogResult;
  /** Why it was picked, e.g. "guess". */
  readonly reason: string;
}

// The rarest cases go first so a broader group can't claim them. 30 in all when the log has
// enough of each kind.
export const SAMPLE_PLAN = [
  { reason: "guess", count: Number.POSITIVE_INFINITY },
  { reason: "torn between two", count: Number.POSITIVE_INFINITY },
  { reason: "miss with a note on a key concept", count: 6 },
  { reason: "miss with a note", count: 4 },
  { reason: "re-test", count: 5 },
  { reason: "no answer written", count: 3 },
  { reason: "right answer", count: 10 },
] as const;

const keyConcept = /zone|maturity|decline|growth|introduction|divisib/i;

function matches(reason: string, result: LogResult): boolean {
  switch (reason) {
    case "miss with a note on a key concept":
      return !result.correct && keyConcept.test(`${result.note ?? ""} ${result.term ?? ""}`);
    case "miss with a note":
      return !result.correct && result.note !== undefined;
    case "guess":
      return result.guess === true;
    case "torn between two":
      return result.answer !== undefined && /^[a-e]\s*\/\s*[a-e]$/i.test(result.answer.trim());
    case "re-test":
      return result.retest !== undefined;
    case "no answer written":
      return result.answer === undefined;
    case "right answer":
      return result.correct && result.answer !== undefined;
    default:
      return false;
  }
}

export function selectSample(
  sessions: readonly LogSession[],
  topicKeys: readonly string[],
): PickedAnswer[] {
  const all = sessions.flatMap((session) =>
    (session.results ?? []).map((result) => ({ session, result })),
  );
  const picked: PickedAnswer[] = [];
  const taken = new Set<LogResult>();
  const coveredTopics = (): Set<string> => new Set(picked.map((item) => item.result.topic));

  for (const { reason, count } of SAMPLE_PLAN) {
    for (let added = 0; added < count; added += 1) {
      const candidates = all.filter(({ result }) => !taken.has(result) && matches(reason, result));
      // Prefer an answer from a topic not yet covered; otherwise keep log order.
      const covered = coveredTopics();
      const next = candidates.find(({ result }) => !covered.has(result.topic)) ?? candidates[0];
      if (next === undefined) {
        break;
      }
      picked.push({ ...next, reason });
      taken.add(next.result);
    }
  }
  const missing = topicKeys.filter((topic) => !coveredTopics().has(topic));
  if (missing.length > 0) {
    throw new Error(`The sample leaves out topics ${missing.join(", ")}.`);
  }
  return picked;
}
