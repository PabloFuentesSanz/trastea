import type { Voicing } from "@/lib/music/voicings";
import type { IntervalName, NoteName } from "@/lib/music/notes";
import { toSolfege } from "@/lib/music/notes";
import { cn } from "@/lib/utils";

/**
 * Diagrama de acorde vertical clásico (caja): cuerdas en vertical
 * (6ª a la izquierda, 1ª a la derecha), trastes en horizontal.
 * Misma paleta que <Fretboard />: raíz = cuadrado ámbar.
 */

const STRINGS = 6;
const ROWS = 4;
const CELL_W = 18;
const CELL_H = 22;
const TOP = 30;
const LEFT = 26;
const DOT_R = 7;

function colorForInterval(interval: IntervalName): string {
  if (interval === "1") return "var(--primary)";
  const degree = interval.replace(/[b#]/g, "");
  switch (degree) {
    case "3":
      return "var(--chart-2)";
    case "5":
      return "var(--chart-3)";
    case "7":
      return "var(--chart-4)";
    default:
      return "var(--muted-foreground)";
  }
}

export type ChordDiagramLabels = "interval" | "note" | "none";

export function ChordDiagram({
  voicing,
  /** nombre por intervalo ya deletreado (p. ej. {"1":"C","3":"E","5":"G"}) */
  noteByInterval,
  labels = "interval",
  title,
  className,
}: {
  voicing: Voicing;
  noteByInterval: Record<string, NoteName>;
  labels?: ChordDiagramLabels;
  title: string;
  className?: string;
}) {
  const width = LEFT + (STRINGS - 1) * CELL_W + 14;
  const height = TOP + ROWS * CELL_H + 18;

  // Fila 1 del diagrama = baseFret (o traste 1 si es forma abierta)
  const startFret = voicing.baseFret <= 1 ? 1 : voicing.baseFret;
  const showNut = startFret === 1;

  const stringX = (s: number) => LEFT + s * CELL_W;
  const rowY = (row: number) => TOP + row * CELL_H;

  const label = (interval: IntervalName): string => {
    if (labels === "none") return "";
    if (labels === "note") return noteByInterval[interval] ?? "";
    return interval;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
      className={cn("w-full", className)}
    >
      {/* cejuela o número de traste */}
      {showNut ? (
        <rect
          x={stringX(0) - 1.5}
          y={TOP - 4}
          width={(STRINGS - 1) * CELL_W + 3}
          height={4}
          rx={1}
          fill="var(--foreground)"
        />
      ) : (
        <text
          x={LEFT - 10}
          y={rowY(0) + CELL_H / 2 + 4}
          textAnchor="end"
          fontSize={11}
          fontWeight={600}
          fill="var(--muted-foreground)"
        >
          {startFret}º
        </text>
      )}

      {/* trastes */}
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <line
          key={r}
          x1={stringX(0)}
          x2={stringX(STRINGS - 1)}
          y1={rowY(r)}
          y2={rowY(r)}
          stroke="var(--border)"
          strokeWidth={r === 0 && showNut ? 0 : 1}
        />
      ))}

      {/* cuerdas */}
      {Array.from({ length: STRINGS }, (_, s) => (
        <line
          key={s}
          x1={stringX(s)}
          x2={stringX(s)}
          y1={TOP}
          y2={rowY(ROWS)}
          stroke="var(--muted-foreground)"
          strokeWidth={0.8}
          opacity={0.7}
        />
      ))}

      {/* X / O y puntos */}
      {voicing.frets.map((fret, s) => {
        const x = stringX(s);
        const interval = voicing.intervals[s];

        if (fret === null) {
          return (
            <text
              key={s}
              x={x}
              y={TOP - 10}
              textAnchor="middle"
              fontSize={10}
              fill="var(--muted-foreground)"
            >
              ✕
            </text>
          );
        }

        if (fret === 0) {
          // Cuerda al aire: anillo con el color de su grado (sin texto extra)
          return (
            <circle
              key={s}
              cx={x}
              cy={TOP - 13}
              r={4.5}
              fill="none"
              stroke={interval ? colorForInterval(interval) : "var(--foreground)"}
              strokeWidth={1.5}
            />
          );
        }

        const row = fret - startFret;
        const y = rowY(row) + CELL_H / 2;
        const fill = interval ? colorForInterval(interval) : "var(--foreground)";
        const isRoot = interval === "1";

        return (
          <g key={s}>
            {isRoot ? (
              <rect
                x={x - DOT_R}
                y={y - DOT_R}
                width={DOT_R * 2}
                height={DOT_R * 2}
                rx={3}
                fill={fill}
                stroke="var(--background)"
                strokeWidth={1.2}
              />
            ) : (
              <circle
                cx={x}
                cy={y}
                r={DOT_R}
                fill={fill}
                stroke="var(--background)"
                strokeWidth={1.2}
              />
            )}
            {interval && label(interval) && (
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fontSize={7.5}
                fontWeight={700}
                fill="var(--background)"
              >
                {label(interval)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function describeVoicing(
  voicing: Voicing,
  chordName: string,
  root: NoteName,
): string {
  const shape = voicing.frets.map((f) => (f === null ? "x" : String(f))).join(" ");
  const pos = voicing.baseFret <= 1 ? "posición abierta" : `traste ${voicing.baseFret}`;
  return `${toSolfege(root)} ${chordName}, ${pos}, digitación ${shape}`;
}
