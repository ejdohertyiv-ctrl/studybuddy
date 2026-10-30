// Dates are stored as ISO 8601 text. Nothing in core reads the clock; callers pass times in.

/** A calendar date, e.g. "2026-11-12". */
export type IsoDate = string;

/** A moment in time with its UTC offset, e.g. "2026-10-30T17:00:00Z". */
export type IsoDateTime = string;
