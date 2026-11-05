// The file test: records what form a file arrived in when the chat sends one to StudyBuddy.
// Only sizes and a fingerprint are kept, never the file's contents.
import { createHash } from "node:crypto";

export interface FileInput {
  readonly fileName: string;
  readonly mimeType?: string | undefined;
  /** The file's text, if the chat extracted it. */
  readonly text?: string | undefined;
  /** The file's original bytes, base64-encoded, if the chat had them. */
  readonly base64?: string | undefined;
  /** Anything the chat says about what it could or couldn't send. */
  readonly note?: string | undefined;
}

export interface FileReport {
  readonly fileName: string;
  readonly mimeType: string | null;
  readonly receivedAt: string;
  /** "original bytes", "text only", or "nothing". */
  readonly arrivedAs: "original bytes" | "text only" | "nothing";
  readonly textCharacters: number;
  readonly byteCount: number;
  /** SHA-256 of the bytes, to compare with the original file on disk. */
  readonly sha256: string | null;
  readonly note: string | null;
}

export function describeFile(input: FileInput, receivedAt: string): FileReport {
  const bytes = input.base64 === undefined ? undefined : Buffer.from(input.base64, "base64");
  const hasBytes = bytes !== undefined && bytes.length > 0;
  const hasText = input.text !== undefined && input.text.length > 0;
  return {
    fileName: input.fileName,
    mimeType: input.mimeType ?? null,
    receivedAt,
    arrivedAs: hasBytes ? "original bytes" : hasText ? "text only" : "nothing",
    textCharacters: input.text?.length ?? 0,
    byteCount: bytes?.length ?? 0,
    sha256: hasBytes ? createHash("sha256").update(bytes).digest("hex") : null,
    note: input.note ?? null,
  };
}

/** One plain sentence for the chat to pass on. */
export function summarizeReport(report: FileReport): string {
  switch (report.arrivedAs) {
    case "original bytes":
      return `StudyBuddy received the original file "${report.fileName}" (${String(report.byteCount)} bytes).`;
    case "text only":
      return `StudyBuddy received only text from "${report.fileName}" (${String(report.textCharacters)} characters), not the original file.`;
    case "nothing":
      return `StudyBuddy received the name "${report.fileName}" but none of its contents.`;
  }
}
