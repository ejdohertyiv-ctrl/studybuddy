// Every record's ID is text tagged with the kind of record it names, so a ConceptId
// can't be passed where a QuestionId is expected. The tag exists only for the type checker.

declare const idKind: unique symbol;

export type Id<Kind extends string> = string & { readonly [idKind]: Kind };

export type CourseId = Id<"Course">;
export type ExamId = Id<"Exam">;
export type SourceDocumentId = Id<"SourceDocument">;
export type TopicId = Id<"Topic">;
export type ConceptId = Id<"Concept">;
export type SiblingGroupId = Id<"SiblingGroup">;
export type QuestionId = Id<"Question">;
export type QuestionFamilyId = Id<"QuestionFamily">;
export type RubricComponentId = Id<"RubricComponent">;
export type LearnerId = Id<"Learner">;
export type SessionId = Id<"Session">;
export type AnswerEventId = Id<"AnswerEvent">;
export type GradingCorrectionId = Id<"GradingCorrection">;

function isIdOf<Kind extends string>(kind: Kind, value: string): value is Id<Kind> {
  return kind !== "" && value.trim() !== "";
}

/** Tags a non-empty string as an ID of the given kind, e.g. `makeId("Course", "bus-101")`. */
export function makeId<Kind extends string>(kind: Kind, value: string): Id<Kind> {
  if (!isIdOf(kind, value)) {
    throw new Error(`A ${kind} ID can't be empty.`);
  }
  return value;
}
