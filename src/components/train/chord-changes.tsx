"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowRight, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMetronome } from "@/hooks/use-metronome";
import { logChordChanges } from "@/app/actions/practice";
import {
  CAMBIOS_PARA_SUBIR,
  SEGUNDOS,
  cambiosPorMinuto,
  valorarCambios,
  type ParejaDeAcordes,
} from "@/lib/train/chord-changes";
import { formatClock } from "@/lib/train/practice";
import { cn } from "@/lib/utils";

type Fase = "lista" | "contando" | "hecho";

/**
 * El minuto de cambios: cronómetro, un botón grande por cada cambio limpio y
 * la valoración al acabar. Con la guitarra en la mano se pulsa con el pie o
 * con la barra espaciadora; el click a 60 es opcional y marca un cambio por
 * compás, que es el objetivo del principio.
 */
export function ChordChanges({
  pareja,
  siguiente,
  mejor,
  demo,
  diagramas,
}: {
  pareja: ParejaDeAcordes;
  siguiente: ParejaDeAcordes | undefined;
  /** mejor marca anterior, en cambios por minuto */
  mejor: number | null;
  demo: boolean;
  /** los dos diagramas, dibujados en el servidor */
  diagramas: ReactNode;
}) {
  const [fase, setFase] = useState<Fase>("lista");
  const [cambios, setCambios] = useState(0);
  const [restan, setRestan] = useState(SEGUNDOS);
  const [conClick, setConClick] = useState(false);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const metronome = useMetronome({ bpm: 60 });
  const fin = useRef(0);

  const cambiosRef = useRef(0);

  // al acabar se guarda solo: apuntar es lo que hace que la marca exista
  const parar = useCallback(() => {
    setFase("hecho");
    metronome.stop();
    const hechos = cambiosRef.current;
    const porMinuto = cambiosPorMinuto(hechos, SEGUNDOS);
    if (demo) {
      setGuardado("En modo demo no se guarda, pero así es como funciona.");
      return;
    }
    startTransition(async () => {
      const r = await logChordChanges({
        pair: pareja.id,
        changes: hechos,
        seconds: SEGUNDOS,
      });
      setGuardado(
        r.ok
          ? mejor !== null && porMinuto > mejor
            ? `Marca nueva: ${porMinuto} (antes ${mejor}).`
            : "Guardado."
          : `No se pudo guardar: ${r.error}`,
      );
    });
  }, [metronome, demo, pareja.id, mejor]);

  useEffect(() => {
    if (fase !== "contando") return;
    const id = window.setInterval(() => {
      const quedan = Math.max(0, Math.ceil((fin.current - Date.now()) / 1000));
      setRestan(quedan);
      if (quedan === 0) parar();
    }, 200);
    return () => window.clearInterval(id);
  }, [fase, parar]);

  const arrancar = async () => {
    cambiosRef.current = 0;
    setCambios(0);
    setRestan(SEGUNDOS);
    setGuardado(null);
    fin.current = Date.now() + SEGUNDOS * 1000;
    setFase("contando");
    if (conClick) await metronome.toggle();
  };

  const sumar = useCallback(() => {
    if (fase !== "contando") return;
    cambiosRef.current += 1;
    setCambios(cambiosRef.current);
  }, [fase]);

  // la barra espaciadora cuenta: con la guitarra en las manos no se apunta con el ratón
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      sumar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sumar]);

  const porMinuto = cambiosPorMinuto(cambios, SEGUNDOS);
  const valoracion = valorarCambios(porMinuto);

  return (
    <section aria-label="Un minuto de cambios" className="mt-6">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <div className="grid grid-cols-2 gap-3 sm:w-64">{diagramas}</div>

        <div className="rounded-lg border bg-card p-4">
          <p className="lbl">
            {pareja.acordes[0]} ↔ {pareja.acordes[1]}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{pareja.porQue}</p>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="lbl">Cambios</p>
              <p className="display-number text-6xl leading-none" aria-live="polite">
                {cambios}
              </p>
            </div>
            <div className="text-right">
              <p className="lbl">Quedan</p>
              <p
                className={cn(
                  "display-number text-4xl leading-none",
                  fase === "contando" && restan <= 10 && "text-primary",
                )}
                role="timer"
                aria-live="off"
              >
                {formatClock(restan)}
              </p>
            </div>
          </div>

          {fase === "lista" && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-12 px-6" onClick={() => void arrancar()}>
                <Play aria-hidden /> Arrancar el minuto
              </Button>
              <div className="flex items-center gap-2">
                <Switch id="con-click" checked={conClick} onCheckedChange={setConClick} />
                <Label htmlFor="con-click" className="text-sm">
                  Con click a 60: un cambio por compás
                </Label>
              </div>
            </div>
          )}

          {fase === "contando" && (
            <div className="mt-4 flex flex-col gap-3">
              <Button
                size="lg"
                className="h-20 text-xl"
                onClick={sumar}
                aria-label="Un cambio limpio más"
              >
                +1 cambio limpio
              </Button>
              <p className="text-xs text-muted-foreground">
                También cuenta la barra espaciadora. Solo cuentan los cambios en los que
                suenan todas las cuerdas.
              </p>
              <Button variant="outline" size="sm" onClick={parar} className="self-start">
                <Square aria-hidden /> Parar antes
              </Button>
            </div>
          )}

          {fase === "hecho" && (
            <div className="mt-4" aria-live="polite">
              <p className="text-lg font-medium">
                {porMinuto} cambios por minuto · {valoracion.etiqueta}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{valoracion.consejo}</p>
              {mejor !== null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu mejor marca con esta pareja: {mejor}.
                </p>
              )}
              {guardado && (
                <p className="mt-1 text-xs text-muted-foreground">{guardado}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void arrancar()}>
                  <RotateCcw aria-hidden /> Otro minuto
                </Button>
                {valoracion.listaParaSubir && siguiente && (
                  <Button asChild>
                    <Link href={`/entrenar/cambios-de-acorde?pareja=${siguiente.id}`}>
                      Siguiente pareja: {siguiente.acordes[0]} ↔ {siguiente.acordes[1]}{" "}
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                )}
              </div>
              {!valoracion.listaParaSubir && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Con {CAMBIOS_PARA_SUBIR} por minuto ya puedes pasar a la siguiente
                  pareja.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
