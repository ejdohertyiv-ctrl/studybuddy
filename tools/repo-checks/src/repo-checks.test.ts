import { describe, expect, it } from "vitest";
import { findBadlyNamedFiles, findPrivateDataFiles } from "./repo-checks.ts";

describe("findPrivateDataFiles", () => {
  it("flags committed files in data/private but allows its README", () => {
    const tracked = [
      "README.md",
      "data/fixtures/sample-course.json",
      "data/private/README.md",
      "data/private/exam-2-log.json",
    ];
    expect(findPrivateDataFiles(tracked)).toEqual(["data/private/exam-2-log.json"]);
  });

  it("is not fooled by different capitalisation", () => {
    expect(findPrivateDataFiles(["Data/Private/log.csv"])).toEqual(["Data/Private/log.csv"]);
  });
});

describe("findBadlyNamedFiles", () => {
  it("accepts kebab-case source and test files", () => {
    const tracked = [
      "packages/learner/src/confusion-pairs.ts",
      "packages/learner/src/confusion-pairs.test.ts",
      "apps/screens/src/flashcard.tsx",
    ];
    expect(findBadlyNamedFiles(tracked)).toEqual([]);
  });

  it("flags camelCase, PascalCase and snake_case source files", () => {
    const tracked = [
      "packages/learner/src/confusionPairs.ts",
      "packages/core/src/AnswerEvent.ts",
      "tools/replay/src/load_log.ts",
    ];
    expect(findBadlyNamedFiles(tracked)).toEqual(tracked);
  });

  it("ignores files outside source folders and non-TypeScript files", () => {
    const tracked = ["vitest.config.ts", "docs/decisions/README.md", "packages/core/package.json"];
    expect(findBadlyNamedFiles(tracked)).toEqual([]);
  });
});
