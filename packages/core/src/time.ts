// Dates are stored as ISO 8601 text. Nothing in core reads the clock; callers pass times in.

/** A calendar date, e.g. "2026-11-12". */
export type IsoDate = string;

/** A moment in time with its UTC offset, e.g. "2026-10-30T17:00:00Z". */
export type IsoDateTime = string;

// The offset is required: "2026-10-30T12:00:00" without one would be read in whatever
// time zone the computer happens to be in.
const isoDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

// JavaScript quietly rolls impossible dates forward ("2026-02-30" becomes 2 March), so check
// that the written date and time exist before trusting the parsed moment.
function isRealDateAndTime(match: RegExpExecArray): boolean {
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const calendarDay = new Date(Date.UTC(year, month - 1, day));
  return (
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    calendarDay.getUTCFullYear() === year &&
    calendarDay.getUTCMonth() === month - 1 &&
    calendarDay.getUTCDate() === day
  );
}

/**
 * Converts an IsoDateTime to milliseconds since 1970 (UTC), for comparing moments.
 * Throws on anything that isn't a real ISO date-time with an offset, so a bad time is
 * never quietly treated as some other moment.
 */
export function parseIsoDateTime(value: IsoDateTime): number {
  const match = isoDateTimePattern.exec(value);
  const milliseconds = match !== null && isRealDateAndTime(match) ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(milliseconds)) {
    throw new Error(`"${value}" isn't a valid ISO date-time with a time zone.`);
  }
  return milliseconds;
}
