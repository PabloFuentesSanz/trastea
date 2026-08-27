"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { MetronomePanel } from "@/components/metronome/metronome-panel";
import { useMetronome } from "@/hooks/use-metronome";
import { logBpm } from "@/app/actions/practice";
import { cn } from "@/lib/utils";
import {
  formatClock,
  nextBpm,
  practiceSummary,
  type PracticeAttempt,
} from "@/lib/train/practice";

/**
 * Practicar un ejercicio con el instrumento en la mano: metrónomo, cronómetro
 * y un botón para apuntar cada intento.
 *
 * El cronómetro solo corre con el metrónomo en marcha. Contar el rato que
 * tienes la pestaña abierta no es practicar, y ese número acaba en el
 * calendario.
 */
export function PracticeRunner({
  exerciseSlug,
  bpmStart,
  bpmTarget,
  demo,
}: {
  exerciseSlug: string;
  bpmStart: number;
  bpmTarget: number;
  demo: boolean;
}) {
  const metronome = useMetronome({ bpm: bpmStart });
  const [seconds, setSeconds] = useState(0);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [guardando, startTransition] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  const corriendo = metronome.isRunning;

  // el reloj avanza solo mientras el metrónomo suena
  const desde = useRef<number | null>(null);
  useEffect(() => {
    if (!corriendo) {
      desde.current = null;
      return;
    }
    desde.current = Date.now();
    const id = window.setInterval(() => {
      if (desde.current === null) return;
      const delta = Math.round((Date.now() - desde.current) / 1000);
      desde.current = Date.now();
      setSeconds((s) => s + delta);
    }, 1000);
    return () => window.clearInterval(id);
  }, [corriendo]);

  const apuntar = useCallback(
    (clean: boolean) => {
      const bpm = metronome.config.bpm;
      setAttempts((prev) => [...prev, { bpm, clean }]);
      metronome.setBpm(nextBpm(bpm, clean, bpmTarget));
      setAviso(
        clean
          ? `${bpm} bpm limpio. Sube un escalón.`
          : `${bpm} bpm anotado. Baja y consolida antes de volver.`,
      );

      if (!demo) {
        startTransition(async () => {
          const r = await logBpm({ exerciseSlug, bpm, clean });
          if (!r.ok && r.error !== "demo") setAviso(`No se pudo guardar: ${r.error}`);
        });
      }
    },
    [metronome, bpmTarget, demo, exerciseSlug],
  );

  const resumen = practiceSummary({ seconds, attempts });

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
      <MetronomePanel metronome={metronome} embedded />

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Practicando</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="display-number text-5xl tabular-nums" aria-live="off">
              {formatClock(seconds)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {corriendo ? (
                <span className="inline-flex items-center gap-1">
                  <Play className="size-3" aria-hidden /> corriendo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Pause className="size-3" aria-hidden /> el reloj para con el metrónomo
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              ¿Cómo ha salido a {metronome.config.bpm} bpm?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              onClick={() => apuntar(true)}
              disabled={guardando}
              className="justify-start"
            >
              <Check aria-hidden /> Limpio
            </Button>
            <Button
              variant="outline"
              onClick={() => apuntar(false)}
              disabled={guardando}
              className="justify-start"
            >
              <X aria-hidden /> Con errores
            </Button>
            <p
              aria-live="polite"
              className={cn(
                "min-h-8 text-xs",
                aviso ? "text-muted-foreground" : "text-transparent",
              )}
            >
              {aviso ?? "."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Esta sesión</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{resumen.headline}</p>
            {attempts.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {attempts.map((a, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs tabular-nums",
                      a.clean
                        ? "border-success/40 text-success"
                        : "border-destructive/40 text-destructive",
                    )}
                  >
                    {a.bpm}
                  </li>
                ))}
              </ul>
            )}
            {attempts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setAttempts([]);
                  setSeconds(0);
                  setAviso(null);
                  metronome.setBpm(bpmStart);
                }}
              >
                <RotateCcw aria-hidden /> Empezar de cero
              </Button>
            )}
            {demo && (
              <p className="text-muted-foreground mt-3 text-xs">
                En modo demo los intentos no se guardan.
              </p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
