"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Volume2 } from "lucide-react";
import { ChordDiagram } from "@/components/fretboard/chord-diagram";
import { useFormulaPlayer } from "@/hooks/use-formula-player";
import { getTuning } from "@/data/tunings";
import { spellFormula, type NoteName } from "@/lib/music/notes";
import { parseFormulaSpec } from "@/lib/music/spec";
import { generateVoicings } from "@/lib/music/voicings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const HOVER_DELAY_MS = 180;

export interface ChordChipProps {
  chord: string;
  className?: string;
}

/**
 * Un cifrado mencionado en cualquier parte de la app. Al pasar el ratón —o
 * al enfocarlo con el teclado, o al tocarlo en el móvil— enseña cómo se
 * toca, qué notas lleva y deja oírlo.
 *
 * Es un popover y no un tooltip a propósito: el tooltip de Radix se cierra
 * solo al tocarlo, porque está pensado para no quedarse pegado en táctil.
 * Con el popover el ratón abre al pasar por encima, el dedo abre al tocar y
 * el teclado abre al enfocar, y la tarjeta va en un portal — si no, las
 * rejillas la recortarían por su `overflow-hidden`.
 */
export function ChordChip({ chord, className }: ChordChipProps) {
  const [open, setOpen] = useState(false);
  /**
   * Abierta a propósito (clic, toque o Enter): no se cierra al salir el ratón
   * y al cerrarse devuelve el foco. Va en una ref y no en estado porque la
   * leen los manejadores de Radix, y con estado llegaban a destiempo: el foco
   * no volvía al cifrado tras pulsar Escape.
   */
  const pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const card = useChordCard(chord, open);
  const { play } = useFormulaPlayer();

  const cancelTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const hoverIn = useCallback(() => {
    cancelTimer();
    timer.current = setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  }, [cancelTimer]);

  const hoverOut = useCallback(() => {
    cancelTimer();
    if (!pinned.current) setOpen(false);
  }, [cancelTimer]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) cancelTimer();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerEnter={(e) => e.pointerType === "mouse" && hoverIn()}
          onPointerLeave={(e) => e.pointerType === "mouse" && hoverOut()}
          // el teclado abre con Enter o espacio, que ya disparan el clic:
          // abrir solo al enfocar reabría la tarjeta al devolverle Radix el
          // foco tras cerrarla, y se quedaba en bucle
          onClick={() => {
            cancelTimer();
            pinned.current = true;
            setOpen(true);
          }}
          aria-label={`${chord}, ver cómo se toca`}
          className={cn(
            "cursor-help font-medium underline decoration-primary/40 decoration-dotted underline-offset-4",
            "hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            className,
          )}
        >
          {chord}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        // sin esto, abrir con el ratón robaría el foco al leer
        onOpenAutoFocus={(e) => !pinned.current && e.preventDefault()}
        // al cerrarse por salir el ratón, el foco no debe saltar al cifrado
        onCloseAutoFocus={(e) => {
          if (!pinned.current) e.preventDefault();
          pinned.current = false;
        }}
        onPointerEnter={cancelTimer}
        onPointerLeave={() => !pinned.current && setOpen(false)}
        className="not-prose w-auto"
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
      </PopoverContent>
    </Popover>
  );
}
