// Turns field findings into a summary table that holds no study content, only counts.
import type { FieldFinding, FitOutcome } from "./map-log.ts";

export const OUTCOMES: readonly FitOutcome[] = [
  "fits",
  "fitsWithNote",
  "optionalNotRecorded",
  "requiredNotRecorded",
  "noPlaceToKeep",
];

export type FieldSummary = Readonly<Record<string, Readonly<Record<FitOutcome, number>>>>;

export function summarizeByField(findings: readonly FieldFinding[]): FieldSummary {
  const summary: Record<string, Record<FitOutcome, number>> = {};
  for (const finding of findings) {
    const row = (summary[finding.field] ??= {
      fits: 0,
      fitsWithNote: 0,
      optionalNotRecorded: 0,
      requiredNotRecorded: 0,
      noPlaceToKeep: 0,
    });
    row[finding.outcome] += 1;
  }
  return summary;
}

export function summaryTable(summary: FieldSummary): string {
  const header = `| Field | ${OUTCOMES.join(" | ")} |`;
  const divider = `| --- | ${OUTCOMES.map(() => "---").join(" | ")} |`;
  const rows = Object.entries(summary).map(
    ([field, counts]) =>
      `| ${field} | ${OUTCOMES.map((outcome) => String(counts[outcome])).join(" | ")} |`,
  );
  return [header, divider, ...rows].join("\n");
}
