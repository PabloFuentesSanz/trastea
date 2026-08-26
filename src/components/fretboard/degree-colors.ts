import type { IntervalName } from "@/lib/music/notes";

/**
 * Color por función del grado, compartido por Fretboard, ChordDiagram y la
 * leyenda: raíz ámbar, 3ª verde, 5ª azul, 7ª rosa, resto neutro.
 */
export function colorForInterval(interval: IntervalName): string {
  if (interval === "1") return "var(--primary)";
  const degree = interval.replace(/[b#]/g, "");
  switch (degree) {
    case "3":
      return "var(--chart-2)";
    case "5":
      return "var(--chart-3)";
    case "7":
      return "var(--chart-4)";
    default:
      return "var(--muted-foreground)";
  }
}

/** Nombre hablado del grado para accesibilidad y tooltips. */
export function degreeLabel(interval: IntervalName): string {
  if (interval === "1") return "raíz";
  const match = /^(bb|b|##|#)?(\d{1,2})$/.exec(interval);
  if (!match) return interval;
  const prefix =
    match[1] === "b" ? "menor/bemol " : match[1] === "#" ? "aumentada/sostenida " : "";
  return `${match[2]}ª ${prefix}`.trim();
}
