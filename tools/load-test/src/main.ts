// Step 1.3, the load test. Reads the owner's private materials folder, picks the sample, puts it
// into StudyBuddy's records and writes what fit and what didn't.
//
//   node tools/load-test/src/main.ts <materials folder>
//
// The sample and the detailed report contain real study data, so they're written only to
// data/private/load-test/, which Git never commits. The console gets counts only.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readExam2Log } from "./exam2-log.ts";
import { makeId, orderAnswers, type AnswerEvent } from "@studybuddy/core";
import { buildAnswer, mapAnswer, mapSession, type FieldFinding } from "./map-log.ts";
import { mapSlides, readDeck } from "./map-slides.ts";
import { selectSample } from "./select-sample.ts";
import { summarizeByField, summaryTable } from "./summarize.ts";

const DECK = "MGM301_10_Pricing - 1.pptx";
const SLIDE_COUNT = 10;

const materials = process.argv[2];
if (materials === undefined) {
  console.error("Give the materials folder, e.g. C:\\Users\\<you>\\dev\\studybuddy-materials");
  process.exit(1);
}

const log = readExam2Log(join(materials, "study-logs", "mgm301-exam2-log-export"));
const sample = selectSample(
  log.sessions,
  log.topics.map((topic) => topic.key),
);
const bundle = readFileSync(
  join(materials, "courses", "mgm301", "exam2", "MGM301_Exam2_Slides_AllText.txt"),
  "utf8",
);
const deck = readDeck(bundle, DECK);
const slides = deck.slice(0, SLIDE_COUNT);

const sampledSessions = [...new Set(sample.map((item) => item.session))];
const findings: FieldFinding[] = [
  ...sampledSessions.flatMap((session) => mapSession(session)),
  ...sample.flatMap((item) => mapAnswer(item.session, item.result)),
  ...mapSlides(DECK, deck.length, slides),
];

// Can the built answers be put in the order they were given, without made-up times?
const built = sample
  .map(({ session, result }) => buildAnswer(session, result))
  .filter((answer): answer is AnswerEvent => answer !== undefined);
try {
  const ordered = orderAnswers(
    built,
    sampledSessions.map((session) => ({
      id: makeId("Session", session.key),
      ownerId: makeId("Learner", "owner"),
      courseId: makeId("Course", "mgm-301"),
      mode: "focusedReview",
      startedAt: session.date,
      scope: { topicIds: [] },
    })),
  );
  findings.push({
    record: "all built answers",
    field: "Answer order (session start, then position)",
    outcome: "fits",
    detail: `${String(ordered.length)} answers ordered without made-up times.`,
  });
} catch (error) {
  findings.push({
    record: "all built answers",
    field: "Answer order (session start, then position)",
    outcome: "noPlaceToKeep",
    detail: error instanceof Error ? error.message : String(error),
  });
}

const outFolder = fileURLToPath(new URL("../../../data/private/load-test", import.meta.url));
mkdirSync(outFolder, { recursive: true });
writeFileSync(
  join(outFolder, "sample.json"),
  JSON.stringify(
    {
      answers: sample.map(({ session, result, reason }) => ({
        session: session.key,
        reason,
        result,
      })),
      deck: DECK,
      slides,
    },
    null,
    2,
  ),
);

const summary = summarizeByField(findings);
const details = findings
  .filter((finding) => finding.outcome !== "fits")
  .map(
    (finding) =>
      `- **${finding.record}**, ${finding.field} (${finding.outcome}): ${finding.detail}`,
  );
writeFileSync(
  join(outFolder, "report.md"),
  [
    "# Load test report (private)",
    "",
    `${String(sample.length)} answers from ${String(sampledSessions.length)} sessions, ${String(slides.length)} slides from ${DECK}.`,
    "",
    "## Picked answers",
    "",
    ...sample.map(
      ({ session, result, reason }) => `- ${session.key} #${String(result.q)}: ${reason}`,
    ),
    "",
    "## By field",
    "",
    summaryTable(summary),
    "",
    "## Everything that didn't simply fit",
    "",
    ...details,
    "",
  ].join("\n"),
);

const reasons = new Map<string, number>();
for (const item of sample) {
  reasons.set(item.reason, (reasons.get(item.reason) ?? 0) + 1);
}
console.log(
  `${String(sample.length)} answers from ${String(sampledSessions.length)} sessions; ${String(slides.length)} slides.`,
);
console.log([...reasons].map(([reason, count]) => `${reason}: ${String(count)}`).join("; "));
console.log(summaryTable(summary));
console.log(`Detailed report: ${join(outFolder, "report.md")}`);
