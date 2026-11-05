import { describe, expect, it } from "vitest";
import { LIBRARY_GLOBAL, PRACTICE_CARD, buildScreen, inlineAppLibrary } from "./index.ts";

describe("inlineAppLibrary", () => {
  it("publishes the bundle's exports on a global instead of exporting them", () => {
    const script = inlineAppLibrary("var a=1;var b=2;export{a as App,b};");
    expect(script).not.toContain("export{");
    expect(script).toContain(`globalThis.${LIBRARY_GLOBAL} = { "App": a, "b": b };`);
  });

  it("escapes anything that would end the page's script tag early", () => {
    expect(inlineAppLibrary('var a="</script>";export{a};')).not.toContain("</script");
  });

  it("refuses a bundle it doesn't recognise", () => {
    expect(() => inlineAppLibrary("var a=1;")).toThrow(/export list/);
  });
});

describe("buildScreen", () => {
  it("writes the real MCP Apps library into the practice card", () => {
    const page = buildScreen(PRACTICE_CARD);
    expect(page).not.toContain("<!-- MCP_APPS_LIBRARY -->");
    expect(page).toContain(`globalThis.${LIBRARY_GLOBAL} = {`);
    expect(page).toContain('"App":');
    expect(page).toContain("submit_practice_answer");
  });
});
