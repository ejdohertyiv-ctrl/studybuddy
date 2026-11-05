// Puts lecture slides, as text pulled out of the deck, into StudyBuddy's course records.
import type { FieldFinding } from "./map-log.ts";

export interface SlideText {
  /** Slide number, starting at 1. */
  readonly number: number;
  /** The slide's text, one line per text box line. The first line is usually the title. */
  readonly lines: readonly string[];
}

/**
 * Reads one deck out of an all-text bundle, where each deck starts with a "=====" banner holding
 * its file name and each slide with "--- Slide N ---". Throws if the deck isn't in the bundle.
 */
export function readDeck(bundle: string, deckFileName: string): SlideText[] {
  const lines = bundle.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === deckFileName);
  if (start === -1) {
    throw new Error(`Deck "${deckFileName}" isn't in the text bundle.`);
  }
  const slides: SlideText[] = [];
  let current: { number: number; lines: string[] } | undefined;
  for (const line of lines.slice(start + 1)) {
    if (/^=+$/.test(line.trim()) && current !== undefined) {
      break;
    }
    const heading = /^--- Slide (\d+) ---$/.exec(line.trim());
    if (heading !== null) {
      current = { number: Number(heading[1]), lines: [] };
      slides.push(current);
    } else if (current !== undefined && line.trim() !== "") {
      current.lines.push(line.trim());
    }
  }
  return slides;
}

export function mapSlides(
  deckFileName: string,
  deckSlideCount: number,
  slides: readonly SlideText[],
): FieldFinding[] {
  const findings: FieldFinding[] = [
    {
      record: deckFileName,
      field: "SourceDocument (kind, title, pageCount)",
      outcome: "fits",
      detail: `slides, "${deckFileName}", ${String(deckSlideCount)} slides`,
    },
  ];
  for (const slide of slides) {
    const record = `${deckFileName} slide ${String(slide.number)}`;
    findings.push({
      record,
      field: "SourceLocation.page",
      outcome: "fits",
      detail: String(slide.number),
    });
    findings.push({
      record,
      field: "Slide text (SourceLocation.excerpt)",
      outcome: "fitsWithNote",
      detail:
        "Kept only as an excerpt on a place in the deck. No record holds a slide's title and text as a slide.",
    });
    if (slide.lines.length <= 1) {
      findings.push({
        record,
        field: "Slide content",
        outcome: "noPlaceToKeep",
        detail:
          "Only the title is text; the rest of the slide is a picture or chart, which text can't carry.",
      });
    }
  }
  return findings;
}
