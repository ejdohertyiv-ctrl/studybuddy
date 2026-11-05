import { describe, expect, it } from "vitest";
import { makeId } from "./ids.ts";

describe("makeId", () => {
  it("keeps the text as the ID", () => {
    expect(makeId("Course", "bus-101")).toBe("bus-101");
  });

  it("refuses an empty or blank ID", () => {
    expect(() => makeId("Concept", "")).toThrow("A Concept ID can't be empty.");
    expect(() => makeId("Concept", "   ")).toThrow("A Concept ID can't be empty.");
  });
});
