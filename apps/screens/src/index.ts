// In-chat screens (MCP Apps). Each screen is one HTML file. The MCP Apps library is written into
// the page itself, so the chat app can show it without loading anything from the internet.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Where a screen's page puts the MCP Apps library. */
const LIBRARY_SLOT = "<!-- MCP_APPS_LIBRARY -->";

/** The global name the inlined library is published under, for the screen's own script. */
export const LIBRARY_GLOBAL = "StudyBuddyApps";

/**
 * Turns the library's bundled ES module into a plain script that publishes its exports on
 * `globalThis.StudyBuddyApps`, because an inline script can't be imported from. Refuses a bundle
 * it doesn't recognise rather than producing a page that silently fails.
 */
export function inlineAppLibrary(bundle: string): string {
  const match = /export\s*\{([^}]*)\}\s*;?\s*$/.exec(bundle);
  const exportList = match?.[1];
  if (match === null || exportList === undefined) {
    throw new Error("The MCP Apps library bundle doesn't end with a single export list.");
  }
  const entries = exportList.split(",").map((part) => {
    const [local, exported] = part.trim().split(/\s+as\s+/);
    if (local === undefined || local === "") {
      throw new Error(`Unexpected export entry "${part}" in the MCP Apps library bundle.`);
    }
    return `${JSON.stringify(exported ?? local)}: ${local}`;
  });
  const script = `${bundle.slice(0, match.index)}\nglobalThis.${LIBRARY_GLOBAL} = { ${entries.join(", ")} };\n`;
  // A literal "</script" inside the library would end the page's script tag early.
  return script.replaceAll("</script", "<\\/script");
}

function readLibraryBundle(): string {
  const path = fileURLToPath(import.meta.resolve("@modelcontextprotocol/ext-apps/app-with-deps"));
  return readFileSync(path, "utf8");
}

/** Builds a screen's complete page: its HTML with the MCP Apps library written in. */
export function buildScreen(fileName: string, libraryBundle: string = readLibraryBundle()): string {
  const page = readFileSync(new URL(fileName, import.meta.url), "utf8");
  if (!page.includes(LIBRARY_SLOT)) {
    throw new Error(`${fileName} has no ${LIBRARY_SLOT} placeholder.`);
  }
  const library = `<script type="module">\n${inlineAppLibrary(libraryBundle)}</script>`;
  return page.replace(LIBRARY_SLOT, () => library);
}

export const PRACTICE_CARD = "practice-card.html";
