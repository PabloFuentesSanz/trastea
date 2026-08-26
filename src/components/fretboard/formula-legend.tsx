"use client";

import { toSolfege, type IntervalName, type NoteName } from "@/lib/music/notes";
import { colorForInterval, degreeLabel } from "./degree-colors";

/**
 * Leyenda de la fórmula (grados + notas) con el mismo código visual que los
 * diagramas. Cada chip se puede pulsar para escuchar esa nota.
 */
export function FormulaLegend({
  intervals,
  spelled,
  midis,
  onPlayNote,
}: {
  intervals: readonly IntervalName[];
  spelled: readonly NoteName[];
  /** midi de cada grado (misma longitud que intervals) */
  midis: readonly number[];
  onPlayNote: (midi: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Notas de la fórmula">
      {intervals.map((interval, i) => {
        const color = colorForInterval(interval);
        const isRoot = interval === "1";
        return (
          <button
            key={interval}
            type="button"
            onClick={() => onPlayNote(midis[i])}
            aria-label={`Escuchar ${toSolfege(spelled[i])}, ${degreeLabel(interval)}`}
            className="flex items-center gap-1.5 rounded-full border bg-secondary py-1 pl-1.5 pr-2.5 text-sm transition-colors hover:border-primary/60 active:scale-95 motion-reduce:active:scale-100"
          >
            <span
              aria-hidden
              className="flex size-5 items-center justify-center text-[9px] font-bold text-background"
              style={{
                backgroundColor: color,
                borderRadius: isRoot ? "5px" : "9999px",
              }}
            >
              {interval}
            </span>
            {spelled[i]}
          </button>
        );
      })}
    </div>
  );
}
