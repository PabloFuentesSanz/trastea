"use client";

import { useMemo, useState } from "react";
import { Check, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TUNINGS, getTuning } from "@/data/tunings";
import { playNotes } from "@/lib/audio/pluck";
import { useTuner } from "@/hooks/use-tuner";
import {
  AFINADA_CENTS,
  midiToHz,
  nearestNote,
  nearestString,
  stringLabel,
} from "@/lib/tuner/tuning";

/** Hasta dónde llega la aguja. Más allá ya no es afinar, es otra nota. */
const RANGO_CENTS = 50;
/**
 * Pasado esto, lo que suena no es esa cuerda desafinada: es otra nota. Decir
 * "300 cents baja, tensa" es mandar a alguien a romper una cuerda.
 */
const OTRA_NOTA_CENTS = 60;

export function TunerPanel({ initialTuning = "standard" }: { initialTuning?: string }) {
  const [tuningId, setTuningId] = useState(
    initialTuning in TUNINGS ? initialTuning : "standard",
  );
  const { state, reading, start, stop } = useTuner();
  const tuning = getTuning(tuningId);

  const lectura = useMemo(() => {
    if (!reading) return null;
    const cuerda = nearestString(reading.hz, tuning.midi);
    const nota = nearestNote(reading.hz);
    return { ...cuerda, nota, hz: reading.hz };
  }, [reading, tuning]);

  const afinada = lectura !== null && Math.abs(lectura.cents) <= AFINADA_CENTS;
  const lejos = lectura !== null && Math.abs(lectura.cents) > OTRA_NOTA_CENTS;
  const escuchando = state === "escuchando";

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-52 flex-col gap-1.5">
          <Label htmlFor="afinacion">Afinación</Label>
          <Select value={tuningId} onValueChange={setTuningId}>
            <SelectTrigger id="afinacion">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TUNINGS).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="lg"
          variant={escuchando ? "outline" : "default"}
          onClick={() => (escuchando ? stop() : void start())}
          aria-label={escuchando ? "Dejar de escuchar" : "Escuchar con el micrófono"}
        >
          {escuchando ? <MicOff aria-hidden /> : <Mic aria-hidden />}
          {escuchando ? "Parar" : "Afinar al oído del micro"}
        </Button>
      </div>

      {state === "denegado" && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive mt-4 rounded-lg border px-3 py-2 text-sm">
          No has dado permiso para el micrófono. Se pide en el candado de la barra de
          direcciones; mientras tanto puedes afinar de oído con las notas de abajo.
        </p>
      )}
      {state === "sin-micro" && (
        <p className="mt-4 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
          Este navegador no da acceso al micrófono. Afina de oído con las notas de abajo.
        </p>
      )}

      <div
        className="bg-card mt-4 rounded-xl border p-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {!escuchando ? (
          <p className="text-muted-foreground text-center text-sm">
            Dale a escuchar y toca una cuerda al aire. También puedes pulsar cualquier
            cuerda de abajo para oír cómo debería sonar.
          </p>
        ) : lectura === null ? (
          <p className="text-muted-foreground text-center text-sm">
            Escuchando… toca una cuerda al aire, sola y con ganas.
          </p>
        ) : (
          <>
            <p className="text-center">
              <span className="display-number text-6xl">
                {lectura.nota.name}
                <span className="text-muted-foreground text-3xl">
                  {lectura.nota.octave}
                </span>
              </span>
            </p>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              {lejos
                ? `${lectura.hz.toFixed(1)} Hz`
                : `${stringLabel(lectura.index)} cuerda · ${lectura.hz.toFixed(1)} Hz`}
            </p>

            {!lejos && <Aguja cents={lectura.cents} afinada={afinada} />}

            <p
              className={cn(
                "mt-2 text-center text-sm font-medium",
                afinada ? "text-success" : "text-muted-foreground",
                lejos && "mt-4",
              )}
            >
              {lejos ? (
                `Eso no es ninguna cuerda de ${tuning.name.replace(/\s*\(.*\)/, "")}. Lo más cerca queda la ${stringLabel(lectura.index)}, a ${Math.abs(Math.round(lectura.cents / 100))} semitonos.`
              ) : afinada ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-4" aria-hidden /> Afinada
                </span>
              ) : lectura.cents < 0 ? (
                `${Math.abs(Math.round(lectura.cents))} cents baja — tensa`
              ) : (
                `${Math.round(lectura.cents)} cents alta — afloja`
              )}
            </p>
          </>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {tuning.midi.map((midi, i) => {
          const activa = lectura?.index === i && !lejos;
          const nota = nearestNote(midiToHz(midi));
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => void playNotes([midi], { duration: 2.2 })}
                aria-label={`Oír la ${stringLabel(i)} cuerda: ${nota.name}${nota.octave}`}
                className={cn(
                  "hover:bg-accent flex w-full flex-col items-center gap-0.5 rounded-lg border px-2 py-3 transition-colors",
                  activa && afinada && "border-success bg-success/10",
                  activa && !afinada && "border-primary bg-primary/10",
                )}
              >
                <span className="text-muted-foreground text-xs">{stringLabel(i)}</span>
                <span className="text-lg font-semibold">{nota.name}</span>
                <Volume2 className="text-muted-foreground size-3.5" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * La aguja. Se dibuja con una escala de cents, no con un porcentaje: lo que
 * importa es cuánto te falta en unidades musicales, y la zona verde es la
 * tolerancia real de un afinador.
 */
function Aguja({ cents, afinada }: { cents: number; afinada: boolean }) {
  const acotado = Math.max(-RANGO_CENTS, Math.min(RANGO_CENTS, cents));
  const x = 50 + (acotado / RANGO_CENTS) * 50;
  const verde = (AFINADA_CENTS / RANGO_CENTS) * 50;

  return (
    <svg
      viewBox="0 0 100 34"
      className="mt-4 h-20 w-full"
      role="img"
      aria-label={
        afinada ? "Afinada" : `${Math.round(cents)} cents ${cents < 0 ? "baja" : "alta"}`
      }
    >
      <rect
        x={50 - verde}
        y={8}
        width={verde * 2}
        height={12}
        fill="var(--success)"
        opacity={0.18}
        rx={1}
      />
      {[-50, -25, 0, 25, 50].map((c) => (
        <line
          key={c}
          x1={50 + (c / RANGO_CENTS) * 50}
          x2={50 + (c / RANGO_CENTS) * 50}
          y1={c === 0 ? 4 : 8}
          y2={c === 0 ? 24 : 20}
          stroke="var(--border)"
          strokeWidth={c === 0 ? 0.8 : 0.4}
        />
      ))}
      <line
        x1={x}
        x2={x}
        y1={2}
        y2={26}
        stroke={afinada ? "var(--success)" : "var(--primary)"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <text x={2} y={33} fontSize={4} fill="var(--muted-foreground)">
        baja
      </text>
      <text x={98} y={33} fontSize={4} textAnchor="end" fill="var(--muted-foreground)">
        alta
      </text>
    </svg>
  );
}
