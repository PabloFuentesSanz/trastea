"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Volume2 } from "lucide-react";
import { ChordDiagram } from "@/components/fretboard/chord-diagram";
import { useFormulaPlayer } from "@/hooks/use-formula-player";
import { getTuning } from "@/data/tunings";
import { spellFormula, type NoteName } from "@/lib/music/notes";
import { parseFormulaSpec } from "@/lib/music/spec";
import { generateVoicings } from "@/lib/music/voicings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const STANDARD = getTuning("standard").midi;

/** Lo que enseña la tarjeta, calculado solo cuando se abre. */
function useChordCard(symbol: string, open: boolean) {
  return useMemo(() => {
    if (!open) return null;
    try {
      const spec = parseFormulaSpec(symbol, "chord");
      const names = spellFormula(spec.root, spec.intervals);
      const noteByInterval: Record<string, NoteName> = {};
      spec.intervals.forEach((interval, i) => {
        noteByInterval[interval] = names[i];
      });
      const voicing = generateVoicings({
        root: spec.root,
        intervals: spec.intervals,
        tuningMidi: STANDARD,
      })[0];
      if (!voicing) return null;
      return { spec, names, noteByInterval, voicing };
    } catch {
      return null;
    }
  }, [symbol, open]);
}

export interface ChordChipProps {
  chord: string;
  className?: string;
}

/**
 * Un cifrado mencionado en cualquier parte de la app. Al pasar el ratón —o
 * al enfocarlo con el teclado, o al tocarlo en el móvil— enseña cómo se
 * toca, qué notas lleva y deja oírlo.
 *
 * Se usa un tooltip y no una tarjeta flotante para no meter otra dependencia
 * de Radix: el contenido es libre igualmente, y el tooltip ya trae el foco
 * de teclado resuelto.
 */
export function ChordChip({ chord, className }: ChordChipProps) {
  const [open, setOpen] = useState(false);
  const card = useChordCard(chord, open);
  const { play } = useFormulaPlayer();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            // en el móvil no hay hover: el toque abre la tarjeta
            onClick={() => setOpen((v) => !v)}
            aria-label={`${chord}, ver cómo se toca`}
            className={cn(
              "cursor-help font-medium underline decoration-primary/40 decoration-dotted underline-offset-4",
              "hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              className,
            )}
          >
            {chord}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="not-prose w-auto border bg-popover p-3 text-popover-foreground"
        >
          {card === null ? (
            <span className="text-sm">{chord}</span>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="text-center">
                <div className="text-sm font-semibold">{chord}</div>
                <div className="text-xs text-muted-foreground">{card.spec.label}</div>
              </div>

              <ChordDiagram
                voicing={card.voicing}
                noteByInterval={card.noteByInterval}
                labels="note"
                title={`${card.spec.label}, traste ${card.voicing.baseFret}`}
              />

              <div className="text-center text-xs text-muted-foreground">
                {card.names.join(" · ")}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => play(card.voicing.midis, "chord")}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                >
                  <Volume2 className="size-3.5" aria-hidden />
                  Oír
                </button>
                <Link
                  href={`/acordes?root=${encodeURIComponent(card.spec.root)}&type=${card.spec.id}`}
                  className="rounded-md border px-2 py-1 text-xs no-underline hover:bg-accent"
                >
                  Más formas
                </Link>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
