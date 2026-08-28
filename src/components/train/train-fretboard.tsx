"use client";

import { cn } from "@/lib/utils";
import { guitarStringNumber } from "@/lib/train/prompts";
import type { Position } from "@/lib/train/cards";

const NUT_W = 16;
const FRET_W = 52;
const STRING_GAP = 30;
const PAD_Y = 26;
/** hueco de abajo para los números de traste */
const PAD_BOTTOM = 20;
const PAD_X = 10;
const MARKERS = [3, 5, 7, 9, 15, 17];

export type MarkKind =
  | "ask"
  | "from"
  | "correct"
  | "wrong"
  | "hole"
  | "context"
  // el mapa de dominio: qué notas te salen solas y cuáles se te caen
  | "dominada"
  | "en-marcha"
  | "floja";

export interface FretMark {
  position: Position;
  kind: MarkKind;
  label?: string;
}

const FILL: Record<MarkKind, string> = {
  ask: "var(--primary)",
  from: "var(--muted-foreground)",
  correct: "var(--success)",
  wrong: "var(--destructive)",
  /** el hueco de la caja: se dibuja el sitio, no la nota */
  hole: "transparent",
  /** las notas que están de contexto y no se preguntan */
  context: "var(--muted)",
  dominada: "var(--success)",
  "en-marcha": "var(--primary)",
  floja: "var(--destructive)",
};

/**
 * Mástil de entrenamiento: marca las posiciones que haga falta y, si se le da
 * `onPick`, deja responder tocando cualquier casilla.
 *
 * Misma estética que <Fretboard />. La diana de clic es mucho más grande que
 * el punto pintado: en móvil se responde con el dedo.
 */
export function TrainFretboard({
  marks,
  frets = 12,
  onPick,
  disabled = false,
  ariaLabel,
  className,
}: {
  marks: readonly FretMark[];
  frets?: number;
  onPick?: (position: Position) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const width = PAD_X * 2 + NUT_W + frets * FRET_W;
  const height = PAD_Y * 2 + PAD_BOTTOM + 5 * STRING_GAP;

  const fretX = (fret: number) =>
    fret === 0 ? PAD_X + NUT_W / 2 : PAD_X + NUT_W + (fret - 0.5) * FRET_W;
  const fretLineX = (fret: number) => PAD_X + NUT_W + fret * FRET_W;
  const stringY = (string: number) => PAD_Y + (5 - string) * STRING_GAP;

  const clickable = Boolean(onPick) && !disabled;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role={clickable ? "group" : "img"}
      aria-label={ariaLabel}
      className={cn("w-full min-w-[560px]", className)}
    >
      <rect
        x={PAD_X}
        y={PAD_Y - 8}
        width={NUT_W}
        height={5 * STRING_GAP + 16}
        rx={2}
        className="fill-muted-foreground"
      />

      {Array.from({ length: frets }, (_, i) => i + 1).map((fret) => (
        <line
          key={`f${fret}`}
          x1={fretLineX(fret)}
          x2={fretLineX(fret)}
          y1={PAD_Y - 8}
          y2={PAD_Y + 5 * STRING_GAP + 8}
          className="stroke-border"
          strokeWidth={1}
        />
      ))}

      {MARKERS.filter((m) => m <= frets).map((fret) => (
        <circle
          key={`m${fret}`}
          cx={fretX(fret)}
          cy={PAD_Y + 2.5 * STRING_GAP}
          r={4}
          className="fill-border"
        />
      ))}
      {frets >= 12 && (
        <>
          <circle
            cx={fretX(12)}
            cy={PAD_Y + 1.5 * STRING_GAP}
            r={4}
            className="fill-border"
          />
          <circle
            cx={fretX(12)}
            cy={PAD_Y + 3.5 * STRING_GAP}
            r={4}
            className="fill-border"
          />
        </>
      )}

      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line
          key={`s${string}`}
          x1={PAD_X}
          x2={width - PAD_X}
          y1={stringY(string)}
          y2={stringY(string)}
          className="stroke-muted-foreground/60"
          strokeWidth={string <= 1 ? 1.8 : 1.1}
        />
      ))}

      {/* dianas de respuesta: invisibles, encima de todo lo dibujado */}
      {clickable &&
        [0, 1, 2, 3, 4, 5].flatMap((string) =>
          Array.from({ length: frets + 1 }, (_, fret) => (
            <rect
              key={`p${string}-${fret}`}
              x={fretX(fret) - FRET_W / 2}
              y={stringY(string) - STRING_GAP / 2}
              width={FRET_W}
              height={STRING_GAP}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`Cuerda ${guitarStringNumber(string)}, traste ${fret}`}
              className="focus-visible:outline-ring cursor-pointer focus-visible:outline-2"
              onClick={() => onPick?.({ string, fret })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick?.({ string, fret });
                }
              }}
            />
          )),
        )}

      {/* los números: sin ellos hay que contar trastes desde la cejuela */}
      {Array.from({ length: frets + 1 }, (_, fret) => fret).map((fret) => (
        <text
          key={`n${fret}`}
          x={fretX(fret)}
          y={PAD_Y + 5 * STRING_GAP + 22}
          textAnchor="middle"
          fontSize={10}
          className={cn(
            MARKERS.includes(fret) || fret === 12
              ? "fill-muted-foreground"
              : "fill-muted-foreground/50",
          )}
        >
          {fret}
        </text>
      ))}

      {marks.map((mark, i) => (
        <g key={`${mark.position.string}-${mark.position.fret}-${i}`}>
          <circle
            cx={fretX(mark.position.fret)}
            cy={stringY(mark.position.string)}
            r={11}
            fill={FILL[mark.kind]}
            stroke={
              mark.kind === "hole"
                ? "var(--primary)"
                : mark.kind === "context"
                  ? "var(--muted-foreground)"
                  : mark.kind === "from"
                    ? "var(--background)"
                    : "none"
            }
            strokeWidth={2}
            strokeDasharray={mark.kind === "hole" ? "4 3" : undefined}
          />
          {mark.label && (
            <text
              x={fretX(mark.position.fret)}
              y={stringY(mark.position.string)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fontWeight={600}
              fill={
                mark.kind === "context" || mark.kind === "hole"
                  ? "var(--muted-foreground)"
                  : "var(--background)"
              }
            >
              {mark.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
