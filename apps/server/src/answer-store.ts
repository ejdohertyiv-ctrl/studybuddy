// Saves the connection test's answers and file reports on this computer, in a folder Git ignores.
// Each save writes a whole new file and then swaps it in, so a crash can't leave half a file.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AnswerEvent } from "@studybuddy/core";
import type { FileReport } from "./file-report.ts";

interface StoredData {
  readonly answers: readonly AnswerEvent[];
  readonly fileReports: readonly FileReport[];
}

const EMPTY: StoredData = { answers: [], fileReports: [] };

function isStoredData(value: unknown): value is StoredData {
  return (
    typeof value === "object" &&
    value !== null &&
    "answers" in value &&
    Array.isArray(value.answers) &&
    "fileReports" in value &&
    Array.isArray(value.fileReports)
  );
}

export class AnswerStore {
  readonly #file: string;

  constructor(folder: string) {
    mkdirSync(folder, { recursive: true });
    this.#file = join(folder, "connection-test.json");
  }

  #read(): StoredData {
    if (!existsSync(this.#file)) {
      return EMPTY;
    }
    const parsed: unknown = JSON.parse(readFileSync(this.#file, "utf8"));
    if (!isStoredData(parsed)) {
      throw new Error(`${this.#file} isn't a StudyBuddy connection-test file.`);
    }
    return parsed;
  }

  #write(data: StoredData): void {
    const temporary = `${this.#file}.tmp`;
    writeFileSync(temporary, JSON.stringify(data, null, 2));
    renameSync(temporary, this.#file);
  }

  /** The most recent answer to a question, if any. */
  latestAnswer(questionId: string): AnswerEvent | undefined {
    return this.#read().answers.findLast((answer) => answer.questionId === questionId);
  }

  saveAnswer(answer: AnswerEvent): void {
    const data = this.#read();
    this.#write({ ...data, answers: [...data.answers, answer] });
  }

  saveFileReport(report: FileReport): void {
    const data = this.#read();
    this.#write({ ...data, fileReports: [...data.fileReports, report] });
  }

  fileReports(): readonly FileReport[] {
    return this.#read().fileReports;
  }
}
