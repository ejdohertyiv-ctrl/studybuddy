// Study history: what one learner did. Private to that learner (every record has an ownerId).
// The answer log is the single source of truth; derived records are calculated from it.
import type { OptionLabel } from "./course-content.ts";
import type {
  AnswerEventId,
  CourseId,
  ExamId,
  GradingCorrectionId,
  LearnerId,
  QuestionId,
  RubricComponentId,
  SessionId,
  TopicId,
} from "./ids.ts";
import type { IsoDateTime } from "./time.ts";

/** A person using StudyBuddy. Sign-in details arrive with the friends beta. */
export interface Learner {
  readonly id: LearnerId;
  readonly displayName: string;
}

export type StudyMode = "quickReview" | "focusedReview" | "examPractice";

export interface Session {
  readonly id: SessionId;
  readonly ownerId: LearnerId;
  readonly courseId: CourseId;
  readonly mode: StudyMode;
  readonly startedAt: IsoDateTime;
  readonly endedAt?: IsoDateTime;
  readonly scope: SessionScope;
}

export interface SessionScope {
  readonly topicIds: readonly TopicId[];
  readonly examId?: ExamId;
}

export type Response =
  | { readonly kind: "option"; readonly label: OptionLabel }
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "number"; readonly value: number; readonly unit?: string };

export type Assistance = "none" | "hint" | "workedExample";

export interface Grader {
  /** Code grades multiple choice, true/false and calculations; AI grades open answers. */
  readonly kind: "code" | "ai";
  /** Which version graded it, so grades can be audited later. */
  readonly version: string;
}

/** Points earned on one rubric part. */
export interface ComponentScore {
  readonly componentId: RubricComponentId;
  readonly pointsEarned: number;
  readonly note?: string;
}

/**
 * The grade. "Correct / partly correct / incorrect" is never stored; it's worked out from the
 * points (see grading.ts), so it can't disagree with them.
 */
export type Evaluation =
  | {
      readonly status: "graded";
      readonly components: readonly ComponentScore[];
      readonly gradedBy: Grader;
    }
  | {
      /** Not graded yet. */
      readonly status: "pending";
    }
  | {
      /**
       * Couldn't be graded reliably. Keeps any parts that could be graded; the rest must not
       * lower the learner's concept estimates.
       */
      readonly status: "unresolved";
      readonly reason: string;
      readonly components: readonly ComponentScore[];
      readonly gradedBy: Grader;
    };

export interface AnswerEvent {
  readonly id: AnswerEventId;
  readonly ownerId: LearnerId;
  readonly sessionId: SessionId;
  readonly questionId: QuestionId;
  readonly response: Response;
  /**
   * Confidence is optional: true only when the learner marked "unsure". false means not marked,
   * which is not evidence of confidence either way.
   */
  readonly markedUnsure: boolean;
  readonly assistance: Assistance;
  readonly timeTakenMs: number;
  readonly submittedAt: IsoDateTime;
  /** The original grade. Later fixes are GradingCorrections; this is never overwritten. */
  readonly evaluation: Evaluation;
}

/** A fix to an earlier grade, kept alongside the original. */
export interface GradingCorrection {
  readonly id: GradingCorrectionId;
  readonly ownerId: LearnerId;
  readonly answerEventId: AnswerEventId;
  readonly evaluation: Evaluation;
  readonly reason: string;
  readonly correctedAt: IsoDateTime;
}
