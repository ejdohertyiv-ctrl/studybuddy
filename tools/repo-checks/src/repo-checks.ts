// Pure checks over the list of files Git tracks. main.ts feeds them the real list.

/** The only file inside data/private that may be committed. Everything else there is personal study data. */
const allowedPrivatePaths: ReadonlySet<string> = new Set(["data/private/readme.md"]);

const sourceRoots = ["apps/", "packages/", "tools/", "data/fixtures/"];
const kebabCaseSourceFile = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.test)?\.tsx?$/;

/** Returns tracked files under data/private that are not on the allow list. */
export function findPrivateDataFiles(trackedPaths: readonly string[]): string[] {
  return trackedPaths.filter((path) => {
    const normalized = path.toLowerCase();
    return normalized.startsWith("data/private/") && !allowedPrivatePaths.has(normalized);
  });
}

/** Returns TypeScript source files whose names are not kebab-case. */
export function findBadlyNamedFiles(trackedPaths: readonly string[]): string[] {
  return trackedPaths.filter((path) => {
    const isSource = sourceRoots.some((root) => path.startsWith(root)) && /\.tsx?$/.test(path);
    const fileName = path.slice(path.lastIndexOf("/") + 1);
    return isSource && !kebabCaseSourceFile.test(fileName);
  });
}
