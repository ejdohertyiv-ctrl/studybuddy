// A small, entirely made-up course used by tests and examples. Not real study data.
// It tells one short story: a learner answers four questions, mixes up two sibling pricing
// terms, has one answer that couldn't be graded reliably, and gets that grade corrected later.
import {
  makeId,
  type AnswerEvent,
  type Concept,
  type ConceptState,
  type ConfusionPair,
  type Course,
  type Exam,
  type GradingCorrection,
  type Learner,
  type Question,
  type Session,
  type SourceDocument,
  type Topic,
} from "@studybuddy/core";

export interface SampleData {
  readonly course: Course;
  readonly exams: readonly Exam[];
  readonly sourceDocuments: readonly SourceDocument[];
  readonly topics: readonly Topic[];
  readonly concepts: readonly Concept[];
  readonly questions: readonly Question[];
  readonly learner: Learner;
  readonly sessions: readonly Session[];
  readonly answers: readonly AnswerEvent[];
  readonly corrections: readonly GradingCorrection[];
  readonly confusionPairs: readonly ConfusionPair[];
  readonly conceptStates: readonly ConceptState[];
}

const courseId = makeId("Course", "mkt-100-fall-2026");
const learnerId = makeId("Learner", "sample-learner");

const slidesId = makeId("SourceDocument", "lecture-5-pricing-slides");
const practiceExamId = makeId("SourceDocument", "exam-2-practice");

const pricingTopicId = makeId("Topic", "pricing");
const segmentationTopicId = makeId("Topic", "segmentation");

const newProductPricing = makeId("SiblingGroup", "new-product-pricing");
const segmentationBases = makeId("SiblingGroup", "segmentation-bases");

const penetrationId = makeId("Concept", "penetration-pricing");
const skimmingId = makeId("Concept", "price-skimming");
const demographicId = makeId("Concept", "demographic-segmentation");
const psychographicId = makeId("Concept", "psychographic-segmentation");
const markupId = makeId("Concept", "markup-on-cost");

const skimmingQuestionId = makeId("Question", "skimming-definition-1");
const penetrationQuestionId = makeId("Question", "penetration-reverse-1");
const psychographicQuestionId = makeId("Question", "psychographic-scenario-1");
const markupQuestionId = makeId("Question", "markup-calculation-1");

const sessionId = makeId("Session", "session-1");
const codeGrader = { kind: "code", version: "sample-code-grader-1" } as const;
const aiGrader = { kind: "ai", version: "sample-ai-grader-1" } as const;

export const sampleCourse: SampleData = {
  course: {
    id: courseId,
    code: "MKT 100",
    name: "Principles of Marketing (made-up sample)",
    term: "Fall 2026",
    professor: "Prof. Example",
  },

  exams: [
    {
      id: makeId("Exam", "exam-2"),
      courseId,
      name: "Exam 2",
      date: "2026-11-19",
      allowedAids: ["calculator"],
      topicIds: [pricingTopicId, segmentationTopicId],
      formatTemplate: {
        sourceDocumentId: practiceExamId,
        questionCounts: { multipleChoice: 12, trueFalse: 4, scenario: 3, calculation: 1 },
        topicWeights: [
          { topicId: pricingTopicId, weight: 0.6 },
          { topicId: segmentationTopicId, weight: 0.4 },
        ],
      },
    },
  ],

  sourceDocuments: [
    {
      id: slidesId,
      courseId,
      kind: "slides",
      title: "Lecture 5: Pricing",
      pageCount: 24,
      uploadedBy: learnerId,
    },
    {
      id: practiceExamId,
      courseId,
      kind: "practiceExam",
      title: "Exam 2 practice exam",
      pageCount: 6,
      uploadedBy: learnerId,
    },
  ],

  topics: [
    {
      id: pricingTopicId,
      courseId,
      name: "Pricing",
      chapters: ["10"],
      lecture: "Lecture 5",
      examWeight: 0.6,
    },
    {
      id: segmentationTopicId,
      courseId,
      name: "Segmentation",
      chapters: ["7"],
      lecture: "Lecture 3",
      examWeight: 0.4,
    },
  ],

  concepts: [
    {
      id: penetrationId,
      topicId: pricingTopicId,
      term: "penetration pricing",
      definition: "Launching at a low price to win market share quickly.",
      kind: "lookAlike",
      siblingGroupId: newProductPricing,
      prerequisiteIds: [],
      sources: [{ documentId: slidesId, page: 7 }],
    },
    {
      id: skimmingId,
      topicId: pricingTopicId,
      term: "price skimming",
      definition: "Launching at a high price, then lowering it over time.",
      kind: "lookAlike",
      siblingGroupId: newProductPricing,
      prerequisiteIds: [],
      sources: [{ documentId: slidesId, page: 8, excerpt: "Start high, then lower" }],
    },
    {
      id: demographicId,
      topicId: segmentationTopicId,
      term: "demographic segmentation",
      definition: "Dividing a market by age, income, education and similar traits.",
      kind: "lookAlike",
      siblingGroupId: segmentationBases,
      prerequisiteIds: [],
      sources: [],
    },
    {
      id: psychographicId,
      topicId: segmentationTopicId,
      term: "psychographic segmentation",
      definition: "Dividing a market by lifestyle, values and personality.",
      kind: "lookAlike",
      siblingGroupId: segmentationBases,
      prerequisiteIds: [demographicId],
      sources: [],
    },
    {
      id: markupId,
      topicId: pricingTopicId,
      term: "markup on cost",
      definition: "(Price − cost) ÷ cost, as a percentage.",
      kind: "formula",
      prerequisiteIds: [],
      sources: [{ documentId: slidesId, page: 15 }],
    },
  ],

  questions: [
    {
      id: skimmingQuestionId,
      courseId,
      conceptIds: [skimmingId],
      format: "multipleChoice",
      angle: "definition",
      stem: "Which strategy launches at a high price and lowers it over time?",
      options: [
        { label: "A", text: "Price skimming", isCorrect: true },
        {
          label: "B",
          text: "Penetration pricing",
          isCorrect: false,
          standsForConceptId: penetrationId,
        },
        {
          label: "C",
          text: "Demographic segmentation",
          isCorrect: false,
          standsForConceptId: demographicId,
        },
        { label: "D", text: "Cost-plus pricing", isCorrect: false },
      ],
      answerKey: "Price skimming starts high to capture early buyers, then lowers the price.",
      rubric: [
        {
          id: makeId("RubricComponent", "skimming-definition-1-answer"),
          description: "Picks price skimming",
          points: 1,
          conceptId: skimmingId,
        },
      ],
      familyId: makeId("QuestionFamily", "skimming-definition"),
      difficulty: { status: "unknown" },
      checkStatus: "checked",
      sources: [{ documentId: slidesId, page: 8 }],
    },
    {
      id: penetrationQuestionId,
      courseId,
      conceptIds: [penetrationId],
      format: "trueFalse",
      // Reverse angle: the right answer is not "penetration pricing", so it can't be passed
      // from memory of the term alone (product rule 2).
      angle: "reverse",
      stem: "A company that launches at a low price to win share quickly is using price skimming.",
      options: [
        { label: "A", text: "True", isCorrect: false, standsForConceptId: skimmingId },
        { label: "B", text: "False", isCorrect: true },
      ],
      answerKey: "False: that's penetration pricing. Skimming starts high.",
      rubric: [
        {
          id: makeId("RubricComponent", "penetration-reverse-1-answer"),
          description: "Recognises the description as penetration pricing",
          points: 1,
          conceptId: penetrationId,
        },
      ],
      familyId: makeId("QuestionFamily", "penetration-reverse"),
      difficulty: { status: "provisional", value: 0.5 },
      checkStatus: "checked",
      sources: [{ documentId: slidesId, page: 7 }],
    },
    {
      id: psychographicQuestionId,
      courseId,
      conceptIds: [psychographicId],
      format: "scenario",
      angle: "scenario",
      stem:
        "A gym chain targets people who value adventure and outdoor challenges, regardless of " +
        "age or income. Which segmentation base is it using, and why?",
      options: [],
      answerKey:
        "Psychographic segmentation: it targets lifestyle and values, not age or income " +
        "(which would be demographic).",
      rubric: [
        {
          id: makeId("RubricComponent", "psychographic-scenario-1-names"),
          description: "Names psychographic segmentation",
          points: 1,
          conceptId: psychographicId,
        },
        {
          id: makeId("RubricComponent", "psychographic-scenario-1-explains"),
          description: "Explains that it targets lifestyle or values rather than demographics",
          points: 2,
          conceptId: psychographicId,
        },
      ],
      familyId: makeId("QuestionFamily", "psychographic-scenario"),
      difficulty: { status: "unknown" },
      checkStatus: "checked",
      sources: [],
    },
    {
      id: markupQuestionId,
      courseId,
      conceptIds: [markupId],
      format: "calculation",
      angle: "calculation",
      stem: "A store buys a jacket for $40 and sells it for $50. What is the markup on cost?",
      options: [],
      answerKey: "(50 − 40) ÷ 40 = 0.25, so 25%.",
      numericAnswer: { value: 25, tolerance: 0.5, unit: "%" },
      rubric: [
        {
          id: makeId("RubricComponent", "markup-calculation-1-result"),
          description: "Correct markup percentage",
          points: 1,
          conceptId: markupId,
        },
      ],
      familyId: makeId("QuestionFamily", "markup-calculation"),
      difficulty: { status: "unknown" },
      checkStatus: "checked",
      sources: [{ documentId: slidesId, page: 15 }],
    },
  ],

  learner: { id: learnerId, displayName: "Sample Learner" },

  sessions: [
    {
      id: sessionId,
      ownerId: learnerId,
      courseId,
      mode: "quickReview",
      startedAt: "2026-10-30T14:00:00Z",
      endedAt: "2026-10-30T14:20:00Z",
      scope: { topicIds: [pricingTopicId, segmentationTopicId] },
    },
  ],

  answers: [
    {
      // Correct.
      id: makeId("AnswerEvent", "answer-1"),
      ownerId: learnerId,
      sessionId,
      questionId: skimmingQuestionId,
      response: { kind: "option", label: "A" },
      markedUnsure: false,
      assistance: "none",
      timeTakenMs: 12_000,
      submittedAt: "2026-10-30T14:02:00Z",
      evaluation: {
        status: "graded",
        components: [
          {
            componentId: makeId("RubricComponent", "skimming-definition-1-answer"),
            pointsEarned: 1,
          },
        ],
        gradedBy: codeGrader,
      },
    },
    {
      // Wrong, and unsure: picked "True", the option standing for price skimming.
      id: makeId("AnswerEvent", "answer-2"),
      ownerId: learnerId,
      sessionId,
      questionId: penetrationQuestionId,
      response: { kind: "option", label: "A" },
      markedUnsure: true,
      assistance: "none",
      timeTakenMs: 20_000,
      submittedAt: "2026-10-30T14:05:00Z",
      evaluation: {
        status: "graded",
        components: [
          {
            componentId: makeId("RubricComponent", "penetration-reverse-1-answer"),
            pointsEarned: 0,
          },
        ],
        gradedBy: codeGrader,
      },
    },
    {
      // Couldn't be graded reliably: the naming part was gradable, the explanation wasn't.
      id: makeId("AnswerEvent", "answer-3"),
      ownerId: learnerId,
      sessionId,
      questionId: psychographicQuestionId,
      response: {
        kind: "text",
        text: "Psychographic, because they go after people's vibe not their age.",
      },
      markedUnsure: false,
      assistance: "hint",
      timeTakenMs: 75_000,
      submittedAt: "2026-10-30T14:10:00Z",
      evaluation: {
        status: "unresolved",
        reason: 'Unclear whether "vibe" means lifestyle and values.',
        components: [
          {
            componentId: makeId("RubricComponent", "psychographic-scenario-1-names"),
            pointsEarned: 1,
          },
        ],
        gradedBy: aiGrader,
      },
    },
    {
      // Correct calculation, graded by code within the tolerance.
      id: makeId("AnswerEvent", "answer-4"),
      ownerId: learnerId,
      sessionId,
      questionId: markupQuestionId,
      response: { kind: "number", value: 25, unit: "%" },
      markedUnsure: false,
      assistance: "none",
      timeTakenMs: 40_000,
      submittedAt: "2026-10-30T14:15:00Z",
      evaluation: {
        status: "graded",
        components: [
          {
            componentId: makeId("RubricComponent", "markup-calculation-1-result"),
            pointsEarned: 1,
          },
        ],
        gradedBy: codeGrader,
      },
    },
  ],

  corrections: [
    {
      // The unresolved answer, reviewed later. The original grade on answer-3 is kept.
      id: makeId("GradingCorrection", "correction-1"),
      ownerId: learnerId,
      answerEventId: makeId("AnswerEvent", "answer-3"),
      evaluation: {
        status: "graded",
        components: [
          {
            componentId: makeId("RubricComponent", "psychographic-scenario-1-names"),
            pointsEarned: 1,
          },
          {
            componentId: makeId("RubricComponent", "psychographic-scenario-1-explains"),
            pointsEarned: 1,
            note: "Contrasts with age correctly, but doesn't say lifestyle or values.",
          },
        ],
        gradedBy: aiGrader,
      },
      reason: "Reviewed the ambiguous wording against the rubric.",
      correctedAt: "2026-10-30T16:00:00Z",
    },
  ],

  confusionPairs: [
    {
      ownerId: learnerId,
      conceptIds: [penetrationId, skimmingId],
      timesConfused: 1,
      lastConfusedAt: "2026-10-30T14:05:00Z",
      tell: "Penetration starts low to win share; skimming starts high and comes down.",
    },
  ],

  conceptStates: [
    {
      ownerId: learnerId,
      conceptId: penetrationId,
      status: "retest",
      nextRetestAt: "2026-10-31T14:05:00Z",
      evidenceAnswerIds: [makeId("AnswerEvent", "answer-2")],
    },
  ],
};
