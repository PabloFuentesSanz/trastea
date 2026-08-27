import type { TabBar, TabColumn } from "@/lib/music/tab";
import { STRINGS } from "@/lib/music/tab";
import { cn } from "@/lib/utils";

const STRING_GAP = 18;
const COL_W = 26;
const CHORD_COL_W = 34;
const PAD_X = 34;
const PAD_TOP = 26;
const PAD_BOTTOM = 22;
const BAR_GAP = 14;

/** Una columna con varias notas necesita más aire para no chocar. */
function columnWidth(column: TabColumn): number {
  return column.events.length > 1 ? CHORD_COL_W : COL_W;
}

interface Placed {
  column: TabColumn;
  x: number;
  width: number;
  /** hay barra de compás justo antes */
  barLineBefore: boolean;
  barNumber?: number;
}

function layout(bars: TabBar[]): { placed: Placed[]; width: number } {
  const placed: Placed[] = [];
  let x = PAD_X;
  bars.forEach((bar, barIndex) => {
    if (barIndex > 0) x += BAR_GAP;
    bar.columns.forEach((column, columnIndex) => {
      const width = columnWidth(column);
      placed.push({
        column,
        x: x + width / 2,
        width,
        barLineBefore: columnIndex === 0 && barIndex > 0,
        barNumber: columnIndex === 0 && bars.length > 1 ? bar.number : undefined,
      });
      x += width;
    });
  });
  return { placed, width: x + PAD_X };
}

/** Tramos seguidos de palm mute: se marcan una vez con un corchete, como en papel. */
function palmMuteRuns(placed: Placed[]): { from: number; to: number }[] {
  const runs: { from: number; to: number }[] = [];
  for (const item of placed) {
    if (!item.column.palmMute) continue;
    const from = item.x - item.width / 2;
    const to = item.x + item.width / 2;
    const last = runs[runs.length - 1];
    if (last && Math.abs(last.to - from) < 2) last.to = to;
    else runs.push({ from, to });
  }
  return runs;
}

const LINK_LABEL: Record<string, string> = { h: "h", p: "p", s: "s" };

/** Cuánto sube el bend, como se escribe en papel. */
const BEND_LABEL: Record<number, string> = {
  0: "\u2191",
  1: "\u2191\u00bd",
  2: "\u21911",
  3: "\u2191\u00b9\u00bd",
  4: "\u21912",
};

export interface TablatureProps {
  bars: TabBar[];
  /** descripción accesible, p. ej. "Cromático 1-2-3-4 en la 6ª cuerda" */
  title: string;
  /** texto bajo la pauta: "corcheas", "negras con swing"… */
  subdivision?: string;
  lefty?: boolean;
  className?: string;
}

/**
 * Pauta de tablatura estática en SVG. Misma convención que el mástil: la 1ª
 * cuerda arriba. No suena ni se reproduce —eso es AlphaTab, más adelante—:
 * esto es para *ver* un ejercicio sin tener que leer un párrafo que lo narre.
 */
export function Tablature({
  bars,
  title,
  subdivision,
  lefty = false,
  className,
}: TablatureProps) {
  const { placed, width } = layout(bars);
  const runs = palmMuteRuns(placed);
  // el corchete de P.M. va bajo la pauta: sin este hueco recorta la figuración
  const height =
    PAD_TOP + (STRINGS - 1) * STRING_GAP + PAD_BOTTOM + (runs.length > 0 ? 12 : 0);
  const staffTop = PAD_TOP;
  const staffBottom = PAD_TOP + (STRINGS - 1) * STRING_GAP;

  const mirror = (x: number) => (lefty ? width - x : x);
  /** cuerda 1 (aguda) arriba, como en cualquier tab impresa */
  const stringY = (string: number) => PAD_TOP + (string - 1) * STRING_GAP;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={title}
      className={cn("max-w-full", className)}
    >
      <title>{title}</title>

      {Array.from({ length: STRINGS }, (_, i) => (
        <line
          key={i}
          x1={mirror(PAD_X - 10)}
          x2={mirror(width - PAD_X + 10)}
          y1={stringY(i + 1)}
          y2={stringY(i + 1)}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}

      {["T", "A", "B"].map((letter, i) => (
        <text
          key={letter}
          x={mirror(PAD_X - 17)}
          y={stringY(2) + i * STRING_GAP + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="var(--muted-foreground)"
        >
          {letter}
        </text>
      ))}

      {placed.map((item, i) =>
        item.barLineBefore ? (
          <line
            key={`bar-${i}`}
            x1={mirror(item.x - item.width / 2 - BAR_GAP / 2)}
            x2={mirror(item.x - item.width / 2 - BAR_GAP / 2)}
            y1={staffTop}
            y2={staffBottom}
            stroke="var(--border)"
            strokeWidth={1.5}
          />
        ) : null,
      )}

      {placed.map((item, i) =>
        item.barNumber ? (
          <text
            key={`n-${i}`}
            x={mirror(item.x - item.width / 2 + 2)}
            y={staffTop - 16}
            textAnchor={lefty ? "end" : "start"}
            fontSize={9}
            fill="var(--muted-foreground)"
          >
            {item.barNumber}
          </text>
        ) : null,
      )}

      {placed.map((item, i) => {
        const { column } = item;
        return (
          <g key={`c-${i}`}>
            {column.rest && (
              <rect
                x={mirror(item.x) - 3}
                y={(staffTop + staffBottom) / 2 - 5}
                width={6}
                height={10}
                rx={1}
                fill="var(--muted-foreground)"
                opacity={0.55}
              />
            )}

            {column.events.map((event) => (
              <g key={event.string}>
                <rect
                  x={mirror(item.x) - 8}
                  y={stringY(event.string) - 7}
                  width={16}
                  height={14}
                  fill="var(--card)"
                />
                <text
                  x={mirror(item.x)}
                  y={stringY(event.string) + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill="var(--foreground)"
                >
                  {event.fret}
                  {column.bend ? BEND_LABEL[column.bendSemitones ?? 0] : ""}
                </text>
              </g>
            ))}

            {column.accent && (
              <text
                x={mirror(item.x)}
                y={staffTop - 5}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="var(--primary)"
              >
                &gt;
              </text>
            )}

            {column.link && placed[i + 1] && (
              <text
                x={mirror((item.x + placed[i + 1].x) / 2)}
                y={
                  Math.min(...column.events.map((e) => stringY(e.string)), staffBottom) -
                  8
                }
                textAnchor="middle"
                fontSize={9}
                fontStyle="italic"
                fill="var(--primary)"
              >
                {LINK_LABEL[column.link]}
              </text>
            )}
          </g>
        );
      })}

      {runs.map((run, i) => (
        <g key={`pm-${i}`}>
          <text
            x={mirror(run.from)}
            y={staffBottom + 14}
            textAnchor={lefty ? "end" : "start"}
            fontSize={8}
            fill="var(--muted-foreground)"
          >
            P.M.
          </text>
          {run.to > run.from + 12 && (
            <line
              x1={mirror(run.from + 24)}
              x2={mirror(run.to)}
              y1={staffBottom + 11}
              y2={staffBottom + 11}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
        </g>
      ))}

      {subdivision && (
        <text
          x={mirror(PAD_X - 10)}
          y={staffBottom + (runs.length > 0 ? 24 : 14)}
          textAnchor={lefty ? "end" : "start"}
          fontSize={9}
          fill="var(--muted-foreground)"
        >
          {subdivision}
        </text>
      )}
    </svg>
  );
}
