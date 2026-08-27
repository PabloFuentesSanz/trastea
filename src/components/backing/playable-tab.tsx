"use client";

import { useMemo } from "react";
import { Pause, Play, Repeat } from "lucide-react";
import { Tablature } from "@/components/fretboard/tablature";
import { usePlayer } from "@/hooks/use-player";
import { tabLength, tabNotes } from "@/lib/backing/tab-notes";
import { columnStarts, type TabBar } from "@/lib/music/tab";
import { MAX_BPM, MIN_BPM } from "@/lib/metronome/pattern";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface PlayableTabProps {
  bars: TabBar[];
  title: string;
  subdivision?: string;
  bpm: number;
  swing: boolean;
}

/**
 * La tab, y debajo los mandos para oírla. La columna que suena se resalta:
 * eso convierte el dibujo en algo que se puede seguir a tempo lento y subir.
 */
export function PlayableTab({ bars, title, subdivision, bpm, swing }: PlayableTabProps) {
  const notes = useMemo(() => tabNotes(bars, { swing }), [bars, swing]);
  const length = useMemo(() => tabLength(bars), [bars]);
  const starts = useMemo(() => columnStarts(bars), [bars]);
  const player = usePlayer({ notes, length, initialBpm: bpm });

  // con figuras mezcladas no vale multiplicar por un paso fijo: se busca la
  // columna cuyo hueco contiene el pulso. La vuelta se redondea al compás, así
  // que al final sobran pulsos sin columna: ahí no se resalta nada, en vez de
  // clavar el resalte en la última
  const todas = bars.flatMap((bar) => bar.columns);
  let currentColumn: number | null = null;
  if (player.currentBeat !== null) {
    for (let i = todas.length - 1; i >= 0; i -= 1) {
      if (player.currentBeat >= starts[i] - 1e-9) {
        currentColumn = player.currentBeat < starts[i] + todas[i].beats - 1e-9 ? i : null;
        break;
      }
    }
  }

  return (
    <div>
      <Tablature
        bars={bars}
        title={title}
        subdivision={subdivision}
        currentColumn={currentColumn}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={player.toggle}
          aria-label={player.isRunning ? "Parar la tab" : "Oír la tab"}
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
            aria-label="Tempo de la tab en bpm"
            className="flex-1"
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant={player.loop ? "default" : "outline"}
          onClick={() => player.setLoop(!player.loop)}
          aria-pressed={player.loop}
          aria-label="Repetir en bucle"
        >
          <Repeat className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
