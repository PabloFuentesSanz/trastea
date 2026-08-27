"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pause, Play, Repeat } from "lucide-react";
import { useBacking } from "@/hooks/use-backing";
import { BACKING_STYLES, STYLE_LABELS, type BackingStyle } from "@/lib/backing/groove";
import { parseGrid } from "@/lib/music/grid";
import { transposeGrid } from "@/lib/music/transpose";
import { MAX_BPM, MIN_BPM } from "@/lib/metronome/pattern";
import { PRACTICAL_ROOTS, type NoteName } from "@/lib/music/notes";
import {
  FAMILY_LABELS,
  getProgression,
  PROGRESSIONS,
  type Progression,
} from "@/data/progressions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChordChip } from "@/components/content/chord-chip";
import { cn } from "@/lib/utils";

export interface BackingStudioProps {
  initialProgression: string;
  initialKey: NoteName;
  initialStyle: BackingStyle;
  initialBpm: number;
}

const FAMILIES = ["blues", "jazz", "modal", "pop", "ejercicio"] as const;

export function BackingStudio({
  initialProgression,
  initialKey,
  initialStyle,
  initialBpm,
}: BackingStudioProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [progressionId, setProgressionId] = useState(initialProgression);
  const [key, setKey] = useState<NoteName>(initialKey);

  const progression = getProgression(progressionId) ?? PROGRESSIONS[0];

  const grid = useMemo(
    () => transposeGrid(progression.grid, progression.key, key),
    [progression, key],
  );
  const bars = useMemo(() => parseGrid(grid), [grid]);

  const backing = useBacking({
    bars,
    initialBpm,
    initialStyle,
  });

  /** El estado vive en la URL para poder enlazar una base desde una lección. */
  const syncUrl = (next: {
    prog?: string;
    tono?: string;
    estilo?: string;
    bpm?: number;
  }) => {
    const params = new URLSearchParams({
      prog: next.prog ?? progressionId,
      tono: next.tono ?? key,
      estilo: next.estilo ?? backing.style,
      bpm: String(next.bpm ?? backing.bpm),
    });
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const elegir = (p: Progression) => {
    backing.stop();
    setProgressionId(p.id);
    setKey(p.key);
    backing.setStyle(p.style);
    backing.setBpm(p.bpm);
    syncUrl({ prog: p.id, tono: p.key, estilo: p.style, bpm: p.bpm });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-semibold">{progression.name}</h2>
          <span className="text-sm text-muted-foreground">
            en {key} · {bars.length} {bars.length === 1 ? "compás" : "compases"}
          </span>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{progression.summary}</p>

        <ol
          className="grid gap-px overflow-hidden rounded-lg border bg-border"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          {bars.map((bar, i) => (
            <li
              key={i}
              aria-current={backing.currentBar === i ? "true" : undefined}
              className={cn(
                "flex min-h-16 flex-col justify-between px-2 py-1.5 transition-colors",
                backing.currentBar === i ? "bg-accent" : "bg-card",
              )}
            >
              <span className="text-[10px] text-muted-foreground">{i + 1}</span>
              <span className="flex flex-wrap gap-x-2 font-medium">
                {bar.chords.length === 0 ? (
                  <span
                    className="text-muted-foreground"
                    aria-label="repite el compás anterior"
                  >
                    %
                  </span>
                ) : (
                  bar.chords.map((chord, j) => <ChordChip key={j} chord={chord} />)
                )}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={backing.toggle}
            aria-label={backing.isRunning ? "Parar la base" : "Tocar la base"}
          >
            {backing.isRunning ? (
              <Pause className="size-5" aria-hidden />
            ) : (
              <Play className="size-5" aria-hidden />
            )}
            {backing.isRunning ? "Parar" : "Tocar"}
          </Button>

          <div className="flex min-w-52 flex-1 items-center gap-3">
            <span className="w-20 tabular-nums text-sm text-muted-foreground">
              {backing.bpm} bpm
            </span>
            <Slider
              value={[backing.bpm]}
              min={MIN_BPM}
              max={MAX_BPM}
              step={1}
              onValueChange={([v]) => backing.setBpm(v)}
              onValueCommit={([v]) => syncUrl({ bpm: v })}
              aria-label="Tempo en bpm"
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="bases-bucle"
              checked={backing.loop}
              onCheckedChange={backing.setLoop}
            />
            <Label htmlFor="bases-bucle" className="cursor-pointer">
              <Repeat className="size-4" aria-hidden />
              <span className="sr-only">Repetir en bucle</span>
            </Label>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Un compás de claqueta antes de empezar. El compás que suena se resalta.
        </p>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bases-forma">Forma</Label>
          <Select
            value={progressionId}
            onValueChange={(v) => {
              const p = getProgression(v);
              if (p) elegir(p);
            }}
          >
            <SelectTrigger id="bases-forma">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FAMILIES.map((family) => (
                <SelectGroup key={family}>
                  <SelectLabel>{FAMILY_LABELS[family]}</SelectLabel>
                  {PROGRESSIONS.filter((p) => p.family === family).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bases-tono">Tono</Label>
          <Select
            value={key}
            onValueChange={(v) => {
              setKey(v);
              syncUrl({ tono: v });
            }}
          >
            <SelectTrigger id="bases-tono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRACTICAL_ROOTS.map((root) => (
                <SelectItem key={root} value={root}>
                  {root}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            La rejilla se reescribe como manda la tonalidad, no con enarmonías raras.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bases-estilo">Estilo</Label>
          <Select
            value={backing.style}
            onValueChange={(v) => {
              backing.setStyle(v as BackingStyle);
              syncUrl({ estilo: v });
            }}
          >
            <SelectTrigger id="bases-estilo">
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
        </div>
      </aside>
    </div>
  );
}
