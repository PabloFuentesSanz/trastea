"use client";

import { useMemo } from "react";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { parseStrumPattern, strumNotes, type StrumDirection } from "@/lib/backing/strum";
import { MAX_BPM, MIN_BPM } from "@/lib/metronome/pattern";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChordChip } from "@/components/content/chord-chip";
import { cn } from "@/lib/utils";

export interface PlayableStrumProps {
  patron: string;
  acordes: string[];
  compases: number;
  bpm: number;
  /** solo el dibujo, sin mandos */
  tocable: boolean;
  id: string;
}

const FLECHA: Record<StrumDirection, string> = {
  abajo: "↓",
  arriba: "↑",
  apagado: "×",
};

const NOMBRE: Record<StrumDirection, string> = {
  abajo: "abajo",
  arriba: "arriba",
  apagado: "apagado",
};

const CUENTA = ["1", "y", "2", "y", "3", "y", "4", "y"];

/**
 * El patrón de rasgueo dibujado: ocho corcheas, la flecha de cada golpe y
 * la cuenta debajo. Al tocarlo, la corchea que suena se resalta y el acorde
 * cambia por compás: es la mano derecha vista desde fuera, a un tempo que
 * se puede bajar hasta que salga.
 */
export function PlayableStrum({
  patron,
  acordes,
  compases,
  bpm,
  tocable,
  id,
}: PlayableStrumProps) {
  const hits = useMemo(() => parseStrumPattern(patron), [patron]);
  const notes = useMemo(
    () => strumNotes(patron, acordes, { bars: compases }),
    [patron, acordes, compases],
  );
  const totalCompases = acordes.length > 1 ? acordes.length : compases;
  const length = totalCompases * 4;
  const player = usePlayer({ notes, length, initialBpm: bpm });

  const corcheaActual =
    player.currentBeat === null ? null : Math.floor((player.currentBeat % 4) * 2);
  const compasActual =
    player.currentBeat === null ? null : Math.floor(player.currentBeat / 4);

  const porCorchea = new Map(hits.map((h) => [Math.round(h.beat * 2), h.direction]));

  return (
    <div>
      <div
        role="img"
        aria-label={`Patrón de rasgueo: ${hits
          .map((h) => `${CUENTA[Math.round(h.beat * 2)]} ${NOMBRE[h.direction]}`)
          .join(", ")}`}
        className="grid grid-cols-8 gap-1"
      >
        {CUENTA.map((cuenta, i) => {
          const direccion = porCorchea.get(i);
          const pulso = i % 2 === 0;
          const suena = corcheaActual === i;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border py-2 transition-colors",
                pulso ? "bg-card" : "bg-background",
                suena && "border-primary bg-accent",
              )}
            >
              <span
                className={cn(
                  "text-2xl leading-none",
                  direccion ? "text-foreground" : "text-muted-foreground/40",
                  direccion === "apagado" && "text-muted-foreground",
                )}
                aria-hidden
              >
                {direccion ? FLECHA[direccion] : "·"}
              </span>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  pulso ? "font-medium" : "text-muted-foreground",
                )}
                aria-hidden
              >
                {cuenta}
              </span>
            </div>
          );
        })}
      </div>

      {acordes.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sobre</span>
          {acordes.map((chord, i) => (
            <span
              key={`${chord}-${i}`}
              aria-current={compasActual === i && acordes.length > 1 ? "true" : undefined}
              className={cn(
                "rounded-md px-1.5 py-0.5",
                compasActual === i && acordes.length > 1 && "bg-accent",
              )}
            >
              <ChordChip chord={chord} />
            </span>
          ))}
          {acordes.length === 1 && compases > 1 && (
            <span className="text-muted-foreground">· {compases} compases</span>
          )}
        </p>
      )}

      {tocable && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={player.toggle}
            aria-label={player.isRunning ? "Parar el rasgueo" : "Oír el rasgueo"}
          >
            {player.isRunning ? (
              <Pause className="size-4" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            {player.isRunning ? "Parar" : "Oír"}
          </Button>
          <div className="flex min-w-40 flex-1 items-center gap-2">
            <span className="tabular-nums text-sm text-muted-foreground">
              {player.bpm} bpm
            </span>
            <Slider
              value={[player.bpm]}
              min={MIN_BPM}
              max={MAX_BPM}
              step={1}
              onValueChange={([v]) => player.setBpm(v)}
              aria-label="Tempo del rasgueo en bpm"
              className="flex-1"
              id={`${id}-bpm`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
