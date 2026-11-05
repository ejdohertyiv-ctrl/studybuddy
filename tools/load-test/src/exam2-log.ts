// The shape of the Exam 2 log as exported from the claude.ai "MGM 301 Exam 2 Log" page:
// one JSON file per record, in sessions/, topics/ and concepts/. These types describe that
// export as it is; they are not StudyBuddy records.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** One logged answer. Only `correct`, `q` and `topic` are always present. */
export interface LogResult {
  readonly correct: boolean;
  /** The question's number or label in that session, e.g. 5 or "F1". Not the question text. */
  readonly q: number | string;
  /** A topic file name, e.g. "t4". */
  readonly topic: string;
  /** What was answered: a letter ("c"), two letters ("c/d") or the option's words. */
  readonly answer?: string;
  /** True when the answer was logged as a guess. */
  readonly guess?: boolean;
  readonly note?: string;
  /** A short label for the concept being re-tested, e.g. "zone". */
  readonly retest?: string;
  /** The concept's name as written in the log, e.g. "FOB-origin pricing". */
  readonly term?: string;
  /** Where the question was drawn from, e.g. "slides+text". */
  readonly sourceTag?: string;
}

export interface LogSession {
  /** The export file's name without ".json", e.g. "s21-clear-red". */
  readonly key: string;
  readonly date: string;
  readonly mode: string;
  readonly title: string;
  readonly note: string;
  readonly source: string;
  readonly results?: readonly LogResult[];
  readonly score?: number;
  readonly total?: number;
}

export interface LogTopic {
  readonly key: string;
  readonly name: string;
  readonly chapters: string;
  readonly lecture?: string;
  readonly order: number;
}

export interface Exam2Log {
  readonly sessions: readonly LogSession[];
  readonly topics: readonly LogTopic[];
}

type Fields = Readonly<Record<string, unknown>>;

function isFields(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isOptional =
  <T>(check: (value: unknown) => value is T) =>
  (value: unknown): value is T | undefined =>
    value === undefined || check(value);

export function isLogResult(value: unknown): value is LogResult {
  return (
    isFields(value) &&
    typeof value["correct"] === "boolean" &&
    (isNumber(value["q"]) || isString(value["q"])) &&
    isString(value["topic"]) &&
    isOptional(isString)(value["answer"]) &&
    (value["guess"] === undefined || typeof value["guess"] === "boolean") &&
    isOptional(isString)(value["note"]) &&
    isOptional(isString)(value["retest"]) &&
    isOptional(isString)(value["term"]) &&
    isOptional(isString)(value["sourceTag"])
  );
}

export function isLogSession(value: unknown): value is Omit<LogSession, "key"> {
  return (
    isFields(value) &&
    isString(value["date"]) &&
    isString(value["mode"]) &&
    isString(value["title"]) &&
    isString(value["note"]) &&
    isString(value["source"]) &&
    (value["results"] === undefined ||
      (Array.isArray(value["results"]) && value["results"].every(isLogResult))) &&
    isOptional(isNumber)(value["score"]) &&
    isOptional(isNumber)(value["total"])
  );
}

export function isLogTopic(value: unknown): value is Omit<LogTopic, "key"> {
  return (
    isFields(value) &&
    isString(value["name"]) &&
    isString(value["chapters"]) &&
    isOptional(isString)(value["lecture"]) &&
    isNumber(value["order"])
  );
}

/**
 * Reads every JSON file in a folder and checks its shape. Throws, naming the file, if one isn't
 * valid JSON or doesn't have the expected fields, rather than skipping it.
 */
function readFolder<T>(
  folder: string,
  check: (value: unknown) => value is T,
): (T & { key: string })[] {
  return readdirSync(folder)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const parsed: unknown = JSON.parse(readFileSync(join(folder, name), "utf8"));
      if (!check(parsed)) {
        throw new Error(`${join(folder, name)} doesn't have the expected Exam 2 log fields.`);
      }
      return { ...parsed, key: name.slice(0, -".json".length) };
    });
}

export function readExam2Log(exportFolder: string): Exam2Log {
  return {
    sessions: readFolder(join(exportFolder, "sessions"), isLogSession),
    topics: readFolder(join(exportFolder, "topics"), isLogTopic),
  };
}
