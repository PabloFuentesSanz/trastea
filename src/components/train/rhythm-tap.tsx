"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetronome } from "@/hooks/use-metronome";
import { audioNow } from "@/lib/audio/context";
import { desvioMs, resumenDeRitmo, VENTANA_MS } from "@/lib/train/timing";
import { cn } from "@/lib/utils";

/** golpes que se miden por tanda: cuatro compases de 4/4 */
const GOLPES = 16;
/** el primer compás es de entrada y no cuenta */
const ENTRADA = 4;

/**
 * El click suena y tú marcas cada pulso con la barra espaciadora o con el
 * botón. Cada golpe se compara con el click más cercano del reloj de audio,
 * no con el reloj del navegador: es la única forma de medir milisegundos.
 */
export function RhythmTap({ bpm }: { bpm: number }) {
  const metronome = useMetronome({ bpm, subdivision: 1 });
  const [desvios, setDesvios] = useState<number[]>([]);
  const [fase, setFase] = useState<"lista" | "contando" | "hecho">("lista");
  const golpes = useRef(0);
  const ultimoTick = useRef<{ time: number; bpm: number } | null>(null);

  useEffect(() => {
    if (metronome.lastTick) {
      ultimoTick.current = { time: metronome.lastTick.time, bpm: metronome.lastTick.bpm };
    }
  }, [metronome.lastTick]);

  const parar = useCallback(() => {
    metronome.stop();
    setFase("hecho");
  }, [metronome]);

  const golpe = useCallback(() => {
    if (fase !== "contando" || !ultimoTick.current) return;
    const ahora = audioNow();
    const spb = 60 / ultimoTick.current.bpm;
    golpes.current += 1;
    if (golpes.current <= ENTRADA) return;
    const d = desvioMs(ahora, ultimoTick.current.time, spb);
    setDesvios((prev) => {
      const next = [...prev, d];
      if (next.length >= GOLPES) parar();
      return next;
    });
  }, [fase, parar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      golpe();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [golpe]);

  const arrancar = async () => {
    setDesvios([]);
    golpes.current = 0;
    ultimoTick.current = null;
    setFase("contando");
    await metronome.toggle();
  };

  const resumen = resumenDeRitmo(desvios);
  const ultimo = desvios[desvios.length - 1];

  return (
    <section aria-label="Ritmo a golpe" className="mt-6 rounded-lg border bg-card p-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="lbl">Golpes medidos</p>
          <p className="display-number text-5xl leading-none" aria-live="polite">
            {desvios.length}
            <span className="text-muted-foreground text-xl">/{GOLPES}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="lbl">Último</p>
          <p
            className={cn(
              "display-number text-3xl leading-none",
              ultimo !== undefined && Math.abs(ultimo) <= VENTANA_MS
                ? "text-success"
                : "text-foreground",
            )}
            aria-live="off"
          >
            {ultimo === undefined ? "—" : `${ultimo > 0 ? "+" : ""}${ultimo} ms`}
          </p>
        </div>
      </div>

      {fase === "lista" && (
        <div className="mt-4">
          <Button size="lg" className="h-12 px-6" onClick={() => void arrancar()}>
            <Play aria-hidden /> Arrancar a {bpm} bpm
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            El primer compás es de entrada. Después, marca cada click con la barra
            espaciadora o con el botón: se miden {GOLPES} golpes.
          </p>
        </div>
      )}

      {fase === "contando" && (
        <div className="mt-4 flex flex-col gap-3">
          <Button
            size="lg"
            className="h-20 text-xl"
            onClick={golpe}
            aria-label="Marcar el pulso"
          >
            Golpe
          </Button>
          <Button variant="outline" size="sm" onClick={parar} className="self-start">
            <Square aria-hidden /> Parar antes
          </Button>
        </div>
      )}

      {fase === "hecho" && (
        <div className="mt-4" aria-live="polite">
          <p className="text-lg font-medium">{resumen.etiqueta}</p>
          <p className="mt-1 text-sm text-muted-foreground">{resumen.consejo}</p>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="lbl">Dentro de ±{VENTANA_MS} ms</dt>
              <dd className="display-number text-2xl">
                {Math.round(resumen.dentro * 100)}%
              </dd>
            </div>
            <div>
              <dt className="lbl">Media</dt>
              <dd className="display-number text-2xl">
                {resumen.medioMs > 0 ? "+" : ""}
                {resumen.medioMs} ms
              </dd>
            </div>
            <div>
              <dt className="lbl">Baile</dt>
              <dd className="display-number text-2xl">±{resumen.dispersionMs} ms</dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-4" onClick={() => void arrancar()}>
            <RotateCcw aria-hidden /> Otra tanda
          </Button>
        </div>
      )}
    </section>
  );
}
