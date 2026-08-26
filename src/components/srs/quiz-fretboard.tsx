"use client";

import { cn } from "@/lib/utils";
import { guitarStringNumber, type FretboardNoteCard } from "@/lib/srs/deck";

const FRETS = 12;
const NUT_W = 16;
const FRET_W = 52;
const STRING_GAP = 30;
const PAD_Y = 26;
const PAD_X = 10;
const MARKERS = [3, 5, 7, 9];

export type QuizMark = "none" | "correct" | "wrong";

/**
 * Mástil de examen: marca UNA posición y espera respuesta.
 * Misma estética que <Fretboard />, pero con el punto sin etiqueta.
 */
export function QuizFretboard({
  card,
  mark = "none",
  answerLabel,
  className,
}: {
  card: FretboardNoteCard;
  mark?: QuizMark;
  answerLabel?: string;
  className?: string;
}) {
  const width = PAD_X * 2 + NUT_W + FRETS * FRET_W;
  const height = PAD_Y * 2 + 5 * STRING_GAP;

  const fretX = (fret: number) =>
    fret === 0 ? PAD_X + NUT_W / 2 : PAD_X + NUT_W + (fret - 0.5) * FRET_W;
  const fretLineX = (fret: number) => PAD_X + NUT_W + fret * FRET_W;
  const stringY = (string: number) => PAD_Y + (5 - string) * STRING_GAP;

  const x = fretX(card.fret);
  const y = stringY(card.string);
  const color =
    mark === "correct"
      ? "var(--success)"
      : mark === "wrong"
        ? "var(--destructive)"
        : "var(--primary)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`¿Qué nota es la cuerda ${guitarStringNumber(card.string)}, traste ${card.fret}?`}
      className={cn("w-full min-w-[560px]", className)}
    >
      <rect
        x={PAD_X}
        y={PAD_Y - 8}
        width={NUT_W}
        height={5 * STRING_GAP + 16}
        rx={2}
        fill="var(--border)"
      />
      {Array.from({ length: FRETS }, (_, i) => i + 1).map((fret) => (
        <line
          key={fret}
          x1={fretLineX(fret)}
          x2={fretLineX(fret)}
          y1={PAD_Y - 6}
          y2={height - PAD_Y + 6}
          stroke="var(--border)"
          strokeWidth={1.5}
        />
      ))}
      {MARKERS.map((fret) => (
        <circle key={fret} cx={fretX(fret)} cy={height / 2} r={5} fill="var(--muted)" />
      ))}
      <circle cx={fretX(12)} cy={height / 2 - STRING_GAP} r={5} fill="var(--muted)" />
      <circle cx={fretX(12)} cy={height / 2 + STRING_GAP} r={5} fill="var(--muted)" />

      {Array.from({ length: 6 }, (_, s) => (
        <line
          key={s}
          x1={PAD_X}
          x2={width - PAD_X}
          y1={stringY(s)}
          y2={stringY(s)}
          stroke="var(--muted-foreground)"
          strokeWidth={0.9 + (5 - s) * 0.28}
          opacity={0.7}
        />
      ))}

      {[...MARKERS, 12].map((fret) => (
        <text
          key={fret}
          x={fretX(fret)}
          y={height - 5}
          textAnchor="middle"
          fontSize={11}
          fill="var(--muted-foreground)"
        >
          {fret}
        </text>
      ))}

      <circle
        cx={x}
        cy={y}
        r={15}
        fill={color}
        opacity={0.25}
        className="motion-safe:animate-pulse"
      />
      <circle
        cx={x}
        cy={y}
        r={11}
        fill={color}
        stroke="var(--background)"
        strokeWidth={2}
      />
      {answerLabel && (
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="var(--background)"
        >
          {answerLabel}
        </text>
      )}
    </svg>
  );
}
