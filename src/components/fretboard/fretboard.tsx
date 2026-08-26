import type { FretPosition } from "@/lib/music/fretboard";
import { toSolfege } from "@/lib/music/notes";
import { cn } from "@/lib/utils";
import { colorForInterval } from "./degree-colors";

export type FretboardLabels = "note" | "interval" | "solfege" | "none";

const NUT_W = 14;
const FRET_W = 56;
const STRING_GAP = 26;
const PAD_Y = 22;
const PAD_X = 8;
const MARKER_FRETS = [3, 5, 7, 9, 15];

function colorFor(position: FretPosition): string {
  return position.isRoot ? "var(--primary)" : colorForInterval(position.interval);
}

export interface FretboardProps {
  positions: FretPosition[];
  frets?: number;
  strings?: number;
  labels?: FretboardLabels;
  lefty?: boolean;
  /** descripción accesible, p. ej. "Escala de Fa mayor" */
  title: string;
  className?: string;
}

/**
 * Mástil SVG. Convención: la 1ª cuerda (aguda) arriba, como en una tab.
 * El cálculo de posiciones es puro (src/lib/music/fretboard.ts).
 */
export function Fretboard({
  positions,
  frets = 15,
  strings = 6,
  labels = "note",
  lefty = false,
  title,
  className,
}: FretboardProps) {
  const width = PAD_X * 2 + NUT_W + frets * FRET_W;
  const height = PAD_Y * 2 + (strings - 1) * STRING_GAP;

  const fretX = (fret: number) => {
    const x = fret === 0 ? PAD_X + NUT_W / 2 : PAD_X + NUT_W + (fret - 0.5) * FRET_W;
    return lefty ? width - x : x;
  };
  const fretLineX = (fret: number) => {
    const x = PAD_X + NUT_W + fret * FRET_W;
    return lefty ? width - x : x;
  };
  /** cuerda 0 = 6ª (grave) abajo; 1ª aguda arriba */
  const stringY = (string: number) => PAD_Y + (strings - 1 - string) * STRING_GAP;

  const label = (p: FretPosition): string => {
    switch (labels) {
      case "note":
        return p.note;
      case "solfege":
        return toSolfege(p.note);
      case "interval":
        return p.interval;
      case "none":
        return "";
    }
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
      className={cn("w-full min-w-[640px]", className)}
    >
      {/* cejuela */}
      <rect
        x={lefty ? width - PAD_X - NUT_W : PAD_X}
        y={PAD_Y - 6}
        width={NUT_W}
        height={(strings - 1) * STRING_GAP + 12}
        rx={2}
        fill="var(--border)"
      />
      {/* trastes */}
      {Array.from({ length: frets }, (_, i) => i + 1).map((fret) => (
        <line
          key={fret}
          x1={fretLineX(fret)}
          x2={fretLineX(fret)}
          y1={PAD_Y - 4}
          y2={height - PAD_Y + 4}
          stroke="var(--border)"
          strokeWidth={1.5}
        />
      ))}
      {/* marcadores */}
      {MARKER_FRETS.filter((f) => f <= frets).map((fret) => (
        <circle key={fret} cx={fretX(fret)} cy={height / 2} r={4} fill="var(--muted)" />
      ))}
      {frets >= 12 && (
        <>
          <circle cx={fretX(12)} cy={height / 2 - STRING_GAP} r={4} fill="var(--muted)" />
          <circle cx={fretX(12)} cy={height / 2 + STRING_GAP} r={4} fill="var(--muted)" />
        </>
      )}
      {/* cuerdas */}
      {Array.from({ length: strings }, (_, s) => (
        <line
          key={s}
          x1={PAD_X}
          x2={width - PAD_X}
          y1={stringY(s)}
          y2={stringY(s)}
          stroke="var(--muted-foreground)"
          strokeWidth={0.8 + (strings - 1 - s) * 0.25}
          opacity={0.7}
        />
      ))}
      {/* números de traste */}
      {MARKER_FRETS.concat(12)
        .filter((f) => f <= frets)
        .map((fret) => (
          <text
            key={fret}
            x={fretX(fret)}
            y={height - 4}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted-foreground)"
          >
            {fret}
          </text>
        ))}
      {/* posiciones */}
      {positions
        .filter((p) => p.fret <= frets && p.string < strings)
        .map((p) => {
          const x = fretX(p.fret);
          const y = stringY(p.string);
          const fill = colorFor(p);
          const text = label(p);
          const guitarString = 6 - p.string;
          return (
            <g key={`${p.string}-${p.fret}`}>
              <title>{`Cuerda ${guitarString}, traste ${p.fret}, ${toSolfege(p.note)} (${p.interval})`}</title>
              {p.isRoot ? (
                <rect
                  x={x - 9}
                  y={y - 9}
                  width={18}
                  height={18}
                  rx={4}
                  fill={fill}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                />
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={9}
                  fill={fill}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                />
              )}
              {text && (
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill="var(--background)"
                >
                  {text}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
