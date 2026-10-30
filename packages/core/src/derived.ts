// Derived records: what the learner model concludes from the answer log. Never typed in;
// always recalculated. These are simple first versions; increment 2 finalises them.
import type { AnswerEventId, ConceptId, LearnerId } from "./ids.ts";
import type { IsoDateTime } from "./time.ts";

/** Two concepts a learner mixes up (product rule 1). */
export interface ConfusionPair {
  readonly ownerId: LearnerId;
  readonly conceptIds: readonly [ConceptId, ConceptId];
  readonly timesConfused: number;
  readonly lastConfusedAt: IsoDateTime;
  /** The tell that separates the two, for contrast cards. */
  readonly tell?: string;
}

/** "oneMore" means one more successful re-test is needed before mastery. */
export type ConceptStatus = "new" | "retest" | "oneMore" | "mastered";

/** Where a learner stands on one concept. */
export interface ConceptState {
  readonly ownerId: LearnerId;
  readonly conceptId: ConceptId;
  readonly status: ConceptStatus;
  readonly nextRetestAt?: IsoDateTime;
  /** The answers this status was worked out from. */
  readonly evidenceAnswerIds: readonly AnswerEventId[];
}
