// Runs the repo checks against the files Git tracks. Exits with an error if any check fails.
import { execFileSync } from "node:child_process";
import { findBadlyNamedFiles, findPrivateDataFiles } from "./repo-checks.ts";

const trackedPaths = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter((line) => line !== "");

const problems = [
  ...findPrivateDataFiles(trackedPaths).map(
    (path) => `Personal study data must never be committed: ${path}`,
  ),
  ...findBadlyNamedFiles(trackedPaths).map(
    (path) => `Source file names must be kebab-case: ${path}`,
  ),
];

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(problem);
  }
  process.exitCode = 1;
} else {
  console.log(`Repo checks passed (${String(trackedPaths.length)} tracked files).`);
}
