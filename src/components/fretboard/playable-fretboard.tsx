"use client";

import { Volume2 } from "lucide-react";
import { Fretboard, type FretboardProps } from "./fretboard";
import { useFormulaPlayer } from "@/hooks/use-formula-player";

/**
 * El mástil de una lección, pero sonando.
 *
 * En las tres primeras semanas el trabajo es poner nombre a lo que hay en el
 * diapasón; si el dibujo no suena, el nombre nunca se ata al sonido. Cada
 * nota es un botón (ratón y teclado) y el botón de arriba toca el dibujo
 * entero: en orden de grave a agudo si es una escala, rasgueado si es un
 * acorde.
 */
export function PlayableFretboard({
  modo = "escala",
  ...props
}: Omit<FretboardProps, "onPlayNote"> & { modo?: "escala" | "acorde" }) {
  const { play, playing } = useFormulaPlayer();

  const midis = [...props.positions]
    .map((p) => p.midi)
    .sort((a, b) => a - b)
    .filter((midi, i, todos) => todos[i - 1] !== midi);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void play(midis, modo === "acorde" ? "chord" : "sequence")}
          disabled={playing || midis.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
        >
          <Volume2 className="size-3.5" aria-hidden /> Escuchar
        </button>
      </div>
      <Fretboard {...props} onPlayNote={(p) => void play([p.midi], "sequence")} />
    </div>
  );
}
