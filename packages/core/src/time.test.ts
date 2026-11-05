import { describe, expect, it } from "vitest";
import { parseIsoDateTime } from "./time.ts";

describe("parseIsoDateTime", () => {
  it("reads UTC and offset times as the same real moment", () => {
    // Worked by hand: one second after the 1970 epoch is 1000 ms.
    expect(parseIsoDateTime("1970-01-01T00:00:01Z")).toBe(1000);
    // 01:00 at UTC+1 is 00:00 UTC, the epoch itself.
    expect(parseIsoDateTime("1970-01-01T01:00:00+01:00")).toBe(0);
    // 12:30 in New York (UTC-4) equals 16:30 UTC.
    expect(parseIsoDateTime("2026-10-30T12:30:00-04:00")).toBe(
      parseIsoDateTime("2026-10-30T16:30:00Z"),
    );
  });

  it("accepts minutes-only and fractional seconds", () => {
    expect(parseIsoDateTime("1970-01-01T00:01Z")).toBe(60_000);
    expect(parseIsoDateTime("1970-01-01T00:00:00.250Z")).toBe(250);
  });

  it("refuses a time with no time zone, because it would depend on the computer", () => {
    expect(() => parseIsoDateTime("2026-10-30T12:00:00")).toThrow("time zone");
  });

  it("refuses text that isn't an ISO date-time", () => {
    expect(() => parseIsoDateTime("yesterday")).toThrow();
    expect(() => parseIsoDateTime("Oct 30 2026 12:00 UTC")).toThrow();
    expect(() => parseIsoDateTime("")).toThrow();
  });

  it("refuses impossible dates that look like ISO, instead of rolling them forward", () => {
    expect(() => parseIsoDateTime("2026-13-40T00:00:00Z")).toThrow();
    // JavaScript alone would quietly read these as 2 March, 1 March and 1 May.
    expect(() => parseIsoDateTime("2026-02-30T00:00:00Z")).toThrow();
    expect(() => parseIsoDateTime("2026-02-29T00:00:00Z")).toThrow(); // 2026 isn't a leap year
    expect(() => parseIsoDateTime("2026-04-31T00:00:00Z")).toThrow();
    // ...and this as midnight the next day.
    expect(() => parseIsoDateTime("2026-10-30T24:00:00Z")).toThrow();
  });

  it("accepts real edge-of-calendar dates", () => {
    // 2028 is a leap year, so 29 February exists.
    expect(parseIsoDateTime("2028-02-29T00:00:00Z")).toBe(
      parseIsoDateTime("2028-03-01T00:00:00Z") - 86_400_000,
    );
    expect(() => parseIsoDateTime("2026-12-31T23:59:59Z")).not.toThrow();
  });
});
