"use client";

import { useCallback, useEffect } from "react";
import { Minus, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MAX_BPM,
  MIN_BPM,
  type MetronomeConfig,
} from "@/lib/metronome/pattern";
import type { UseMetronome } from "@/hooks/use-metronome";

const SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"] as const;

const SUBDIVISIONS: { value: MetronomeConfig["subdivision"]; label: string }[] = [
  { value: 1, label: "Pulso" },
  { value: 2, label: "Corcheas" },
  { value: 3, label: "Tresillos" },
  { value: 4, label: "Semicorcheas" },
];

export interface MetronomePanelProps {
  metronome: UseMetronome;
  /** compacto para embeber en el player de lección */
  embedded?: boolean;
  /** capturar atajos de teclado globales (solo en la página standalone) */
  globalShortcuts?: boolean;
  onConfigChange?: (config: MetronomeConfig) => void;
}

export function MetronomePanel({
  metronome,
  embedded = false,
  globalShortcuts = false,
  onConfigChange,
}: MetronomePanelProps) {
  const {
    config,
    isRunning,
    lastTick,
    effectiveBpm,
    toggle,
    setBpm,
    nudgeBpm,
    update,
    toggleAccent,
    tap,
  } = metronome;

  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        void toggle();
      } else if (e.key === "+" || e.key === "ArrowUp") {
        e.preventDefault();
        nudgeBpm(e.shiftKey ? 5 : 1);
      } else if (e.key === "-" || e.key === "ArrowDown") {
        e.preventDefault();
        nudgeBpm(e.shiftKey ? -5 : -1);
      } else if (e.key.toLowerCase() === "t") {
        tap();
      }
    },
    [toggle, nudgeBpm, tap],
  );

  useEffect(() => {
    if (!globalShortcuts) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [globalShortcuts, handleKey]);

  const beatActive = isRunning && lastTick ? lastTick.beat : -1;

  return (
    <div
      role="group"
      aria-label="Metrónomo"
      className={cn("flex flex-col items-center gap-4", embedded ? "py-2" : "py-6")}
    >
      {/* BPM display */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-full"
          aria-label="Bajar 1 bpm (mantén Shift para 5)"
          onClick={(e) => nudgeBpm(e.shiftKey ? -5 : -1)}
        >
          <Minus aria-hidden />
        </Button>
        <div className="text-center">
          <div
            className={cn(
              "display-number leading-none text-foreground transition-transform",
              embedded ? "text-6xl" : "text-8xl md:text-9xl",
              isRunning && lastTick?.kind === "accent" && "text-primary",
            )}
            aria-live="off"
          >
            {effectiveBpm}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">bpm</div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-full"
          aria-label="Subir 1 bpm (mantén Shift para 5)"
          onClick={(e) => nudgeBpm(e.shiftKey ? 5 : 1)}
        >
          <Plus aria-hidden />
        </Button>
      </div>

      {/* Beat dots — pulso visual + editor de acentos */}
      <div className="flex items-center gap-2" aria-label="Pulsos del compás">
        {Array.from({ length: config.signature.beats }, (_, beat) => {
          const accented = config.accents.includes(beat);
          const silent = config.only24 && beat % 2 === 0;
          return (
            <button
              key={beat}
              type="button"
              aria-label={`Pulso ${beat + 1}${accented ? ", acentuado" : ""}${silent ? ", silenciado" : ""}`}
              aria-pressed={accented}
              onClick={() => toggleAccent(beat)}
              className={cn(
                "size-5 rounded-full border-2 transition-colors motion-reduce:transition-none",
                accented ? "border-primary" : "border-border",
                silent && "opacity-30",
                beat === beatActive
                  ? accented
                    ? "bg-primary"
                    : "bg-foreground"
                  : "bg-transparent",
              )}
            />
          );
        })}
      </div>

      <Slider
        value={[config.bpm]}
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        onValueChange={([v]) => setBpm(v)}
        aria-label="Tempo en bpm"
        className="w-full max-w-sm"
      />

      {/* Transporte */}
      <div className="flex items-center gap-3">
        <Button
          size="lg"
          className="h-14 min-w-36 text-lg"
          onClick={() => void toggle()}
          aria-label={isRunning ? "Parar metrónomo" : "Arrancar metrónomo"}
        >
          {isRunning ? <Pause aria-hidden /> : <Play aria-hidden />}
          {isRunning ? "Parar" : "Arrancar"}
        </Button>
        <Button variant="secondary" size="lg" className="h-14" onClick={tap}>
          Tap
        </Button>
      </div>

      {/* Configuración */}
      <div
        className={cn(
          "grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-3",
          embedded && "max-w-sm",
        )}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="met-sig">Compás</Label>
          <Select
            value={`${config.signature.beats}/${config.signature.unit}`}
            onValueChange={(v) => {
              const [beats, unit] = v.split("/").map(Number);
              update({
                signature: { beats, unit: unit as 4 | 8 },
                accents: [0],
              });
            }}
          >
            <SelectTrigger id="met-sig" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIGNATURES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="met-sub">Subdivisión</Label>
          <Select
            value={String(config.subdivision)}
            onValueChange={(v) =>
              update({ subdivision: Number(v) as MetronomeConfig["subdivision"] })
            }
          >
            <SelectTrigger id="met-sub" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBDIVISIONS.map((s) => (
                <SelectItem key={s.value} value={String(s.value)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex items-center justify-between rounded-lg border px-3 py-2">
          <Label htmlFor="met-only24" className="cursor-pointer">
            Solo 2 y 4 <span className="text-muted-foreground">(swing)</span>
          </Label>
          <Switch
            id="met-only24"
            checked={config.only24}
            onCheckedChange={(only24) => update({ only24 })}
          />
        </div>

        <div className="col-span-2 rounded-lg border px-3 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="met-auto" className="cursor-pointer">
              Incremento automático
            </Label>
            <Switch
              id="met-auto"
              checked={config.autoIncrement.enabled}
              onCheckedChange={(enabled) =>
                update({ autoIncrement: { ...config.autoIncrement, enabled } })
              }
            />
          </div>
          {config.autoIncrement.enabled && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="met-inc" className="text-xs text-muted-foreground">
                  +bpm
                </Label>
                <Input
                  id="met-inc"
                  type="number"
                  min={1}
                  max={20}
                  value={config.autoIncrement.addBpm}
                  onChange={(e) =>
                    update({
                      autoIncrement: {
                        ...config.autoIncrement,
                        addBpm: Number(e.target.value) || 1,
                      },
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="met-every" className="text-xs text-muted-foreground">
                  cada compases
                </Label>
                <Input
                  id="met-every"
                  type="number"
                  min={1}
                  max={64}
                  value={config.autoIncrement.everyMeasures}
                  onChange={(e) =>
                    update({
                      autoIncrement: {
                        ...config.autoIncrement,
                        everyMeasures: Number(e.target.value) || 1,
                      },
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="met-max" className="text-xs text-muted-foreground">
                  hasta bpm
                </Label>
                <Input
                  id="met-max"
                  type="number"
                  min={MIN_BPM}
                  max={MAX_BPM}
                  value={config.autoIncrement.maxBpm}
                  onChange={(e) =>
                    update({
                      autoIncrement: {
                        ...config.autoIncrement,
                        maxBpm: Number(e.target.value) || MAX_BPM,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!embedded && (
        <p className="text-sm text-muted-foreground">
          <kbd className="rounded border px-1">Espacio</kbd> arranca/para ·{" "}
          <kbd className="rounded border px-1">↑↓</kbd> ±1 bpm (Shift ±5) ·{" "}
          <kbd className="rounded border px-1">T</kbd> tap tempo
        </p>
      )}
    </div>
  );
}
