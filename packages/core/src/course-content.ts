// Course content: what there is to learn. One copy per class, shared by every learner in it.
import type {
  ConceptId,
  CourseId,
  ExamId,
  LearnerId,
  QuestionFamilyId,
  QuestionId,
  RubricComponentId,
  SiblingGroupId,
  SourceDocumentId,
  TopicId,
} from "./ids.ts";
import type { IsoDate } from "./time.ts";

export interface Course {
  readonly id: CourseId;
  /** e.g. "MGM 301" */
  readonly code: string;
  readonly name: string;
  /** e.g. "Fall 2026" */
  readonly term: string;
  readonly professor?: string;
}

export interface Exam {
  readonly id: ExamId;
  readonly courseId: CourseId;
  readonly name: string;
  readonly date?: IsoDate;
  /** e.g. "one page of notes", "calculator" */
  readonly allowedAids: readonly string[];
  readonly topicIds: readonly TopicId[];
  /** Present when the professor's practice exam was uploaded (product rule 3). */
  readonly formatTemplate?: ExamFormatTemplate;
}

export interface ExamFormatTemplate {
  /** The practice exam this template was read from. */
  readonly sourceDocumentId: SourceDocumentId;
  readonly questionCounts: Readonly<Partial<Record<QuestionFormat, number>>>;
  readonly topicWeights: readonly TopicWeight[];
}

export interface TopicWeight {
  readonly topicId: TopicId;
  /** Share of the exam, from 0 to 1. */
  readonly weight: number;
}

export type SourceDocumentKind =
  "slides" | "textbook" | "syllabus" | "practiceExam" | "studyGuide" | "notes";

/**
 * A description of a course file. The file itself stays private to whoever uploaded it;
 * only this description is shared with the class.
 */
export interface SourceDocument {
  readonly id: SourceDocumentId;
  readonly courseId: CourseId;
  readonly kind: SourceDocumentKind;
  readonly title: string;
  /** Pages, or slides for a deck. */
  readonly pageCount?: number;
  readonly uploadedBy: LearnerId;
}

/** A precise place in a source: a page, or a slide in a deck. */
export interface SourceLocation {
  readonly documentId: SourceDocumentId;
  /** Page or slide number, starting at 1. */
  readonly page: number;
  readonly excerpt?: string;
}

export interface Topic {
  readonly id: TopicId;
  readonly courseId: CourseId;
  readonly name: string;
  readonly chapters: readonly string[];
  readonly lecture?: string;
  /** Share of the exam, from 0 to 1, when known. */
  readonly examWeight?: number;
}

/** How a concept is likely tested (product rule 3). */
export type ConceptKind = "formula" | "process" | "lookAlike" | "rule";

export interface Concept {
  readonly id: ConceptId;
  readonly topicId: TopicId;
  /** e.g. "zone pricing" */
  readonly term: string;
  readonly definition: string;
  readonly kind: ConceptKind;
  /** Concepts sharing a sibling group are easily confused with each other (product rule 1). */
  readonly siblingGroupId?: SiblingGroupId;
  readonly prerequisiteIds: readonly ConceptId[];
  /** Where in the course materials this concept comes from. */
  readonly sources: readonly SourceLocation[];
}

/** Product rule 8. Multiple choice covers A–E; true/false uses options A (True) and B (False). */
export type QuestionFormat = "multipleChoice" | "trueFalse" | "scenario" | "calculation";

/**
 * How the question approaches its concept. A re-test uses a new angle (product rule 2);
 * "reverse" means the right answer is not the term itself.
 */
export type QuestionAngle =
  "definition" | "example" | "scenario" | "contrast" | "reverse" | "calculation";

export type OptionLabel = "A" | "B" | "C" | "D" | "E";

export interface QuestionOption {
  readonly label: OptionLabel;
  readonly text: string;
  readonly isCorrect: boolean;
  /** For a wrong option: the sibling concept it stands for, so a miss records the mix-up. */
  readonly standsForConceptId?: ConceptId;
}

/** One part of a question's points, tied to the concept that part tests. */
export interface RubricComponent {
  readonly id: RubricComponentId;
  readonly description: string;
  readonly points: number;
  readonly conceptId: ConceptId;
}

/** For calculation questions graded by code. */
export interface NumericAnswer {
  readonly value: number;
  /** Largest allowed difference from `value`. */
  readonly tolerance: number;
  readonly unit?: string;
}

/** Difficulty is never treated as certain because an AI guessed it. */
export type Difficulty =
  | { readonly status: "unknown" }
  | { readonly status: "provisional" | "calibrated"; readonly value: number };

/** Only checked questions count toward grades and the learner model. */
export type QuestionCheckStatus = "draft" | "checked" | "rejected";

export interface Question {
  readonly id: QuestionId;
  readonly courseId: CourseId;
  readonly conceptIds: readonly ConceptId[];
  readonly format: QuestionFormat;
  readonly angle: QuestionAngle;
  readonly stem: string;
  /** Empty for scenario and calculation questions answered in the learner's own words. */
  readonly options: readonly QuestionOption[];
  /** The model answer and explanation shown after grading. */
  readonly answerKey: string;
  readonly numericAnswer?: NumericAnswer;
  /** The question's points, split into parts. Points available = the sum of these. */
  readonly rubric: readonly RubricComponent[];
  /** Questions made from the same template share a family; a variant isn't fresh evidence. */
  readonly familyId: QuestionFamilyId;
  readonly variantOfId?: QuestionId;
  readonly difficulty: Difficulty;
  readonly checkStatus: QuestionCheckStatus;
  readonly sources: readonly SourceLocation[];
}
