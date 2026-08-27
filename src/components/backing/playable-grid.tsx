"use client";

import { Pause, Play, Repeat } from "lucide-react";
import { useBacking } from "@/hooks/use-backing";
import { BACKING_STYLES, STYLE_LABELS, type BackingStyle } from "@/lib/backing/groove";
import type { GridBar } from "@/lib/music/grid";
import { MAX_BPM, MIN_BPM } from "@/lib/metronome/pattern";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface PlayableGridProps {
  bars: GridBar[];
  columnas: number;
  bpm: number;
  estilo: BackingStyle;
  /** id estable para los `htmlFor` cuando hay varias rejillas en la página */
  id: string;
}

/**
 * La rejilla, y debajo los mandos para tocarla. El compás que suena se
 * resalta: sin eso hay que contar mentalmente y el ejercicio deja de ser
 * tocar encima para ser no perderse.
 */
export function PlayableGrid({ bars, columnas, bpm, estilo, id }: PlayableGridProps) {
  const backing = useBacking({ bars, initialBpm: bpm, initialStyle: estilo });

  return (
    <div>
      <ol
        className="grid gap-px overflow-hidden rounded-lg border bg-border"
        style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
      >
        {bars.map((bar, i) => (
          <li
            key={i}
            aria-current={backing.currentBar === i ? "true" : undefined}
            className={cn(
              "flex min-h-14 flex-col justify-between px-2 py-1.5 transition-colors",
              backing.currentBar === i ? "bg-accent" : "bg-card",
            )}
          >
            <span className="text-[10px] text-muted-foreground">{i + 1}</span>
            <span className="flex flex-wrap gap-x-2 text-sm font-medium">
              {bar.chords.length === 0 ? (
                <span
                  className="text-muted-foreground"
                  aria-label="repite el compás anterior"
                >
                  %
                </span>
              ) : (
                bar.chords.map((chord, j) => <span key={j}>{chord}</span>)
              )}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={backing.toggle}
          aria-label={backing.isRunning ? "Parar la base" : "Tocar la base"}
        >
          {backing.isRunning ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
          {backing.isRunning ? "Parar" : "Tocar"}
        </Button>

        <Select
          value={backing.style}
          onValueChange={(v) => backing.setStyle(v as BackingStyle)}
        >
          <SelectTrigger
            className="h-8 w-28"
            aria-label="Estilo de la base"
            id={`${id}-estilo`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BACKING_STYLES.map((s) => (
              <SelectItem key={s} value={s}>
                {STYLE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex min-w-40 flex-1 items-center gap-2">
          <span className="tabular-nums text-sm text-muted-foreground">
            {backing.bpm} bpm
          </span>
          <Slider
            value={[backing.bpm]}
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            onValueChange={([v]) => backing.setBpm(v)}
            aria-label="Tempo de la base en bpm"
            className="flex-1"
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant={backing.loop ? "default" : "outline"}
          onClick={() => backing.setLoop(!backing.loop)}
          aria-pressed={backing.loop}
          aria-label="Repetir en bucle"
        >
          <Repeat className="size-4" aria-hidden />
        </Button>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Un compás de claqueta antes de empezar.
      </p>
    </div>
  );
}
