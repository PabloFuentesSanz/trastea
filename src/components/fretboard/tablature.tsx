import type { TabBar } from "@/lib/music/tab";
import { STRINGS } from "@/lib/music/tab";
import { cn } from "@/lib/utils";
import { beamGroups, beatTicks, layoutColumns, type PlacedColumn } from "./tab-layout";

const STRING_GAP = 18;
const COL_W = 26;
const CHORD_COL_W = 34;
const PAD_X = 34;
const PAD_TOP = 26;
const PAD_BOTTOM = 22;
const BAR_GAP = 14;
/** alto de la fila de plicas y barras que va debajo de la pauta */
const RHYTHM_H = 22;
const STEM_H = 9;
const BEAM_GAP = 3;

type Placed = PlacedColumn;

function layout(bars: TabBar[]): { placed: Placed[]; width: number } {
  return layoutColumns(bars, COL_W, CHORD_COL_W, PAD_X, BAR_GAP);
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
  /** columna que suena ahora, para seguir la tab mientras se reproduce */
  currentColumn?: number | null;
  lefty?: boolean;
  className?: string;
}

/**
 * Pauta de tablatura en SVG. Misma convención que el mástil: la 1ª cuerda
 * arriba. Con `currentColumn` resalta la columna que suena, para poder
 * seguirla mientras se reproduce.
 */
export function Tablature({
  bars,
  title,
  subdivision,
  currentColumn = null,
  lefty = false,
  className,
}: TablatureProps) {
  const { placed, width } = layout(bars);
  const runs = palmMuteRuns(placed);
  const ticks = beatTicks(placed);
  const beams = beamGroups(placed);
  // el corchete de P.M. va bajo la pauta: sin este hueco recorta la figuración
  const height =
    PAD_TOP +
    (STRINGS - 1) * STRING_GAP +
    PAD_BOTTOM +
    RHYTHM_H +
    (runs.length > 0 ? 12 : 0);
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

      {currentColumn !== null && placed[currentColumn] && (
        <rect
          x={mirror(placed[currentColumn].x) - placed[currentColumn].width / 2}
          y={staffTop - 4}
          width={placed[currentColumn].width}
          height={staffBottom - staffTop + 8}
          rx={3}
          fill="var(--primary)"
          opacity={0.18}
        />
      )}

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

      {/* La figuración, debajo de la pauta: plica por columna y barras
          agrupadas por pulso, como en papel. Sin esto un compás de
          semicorcheas se lee igual que uno de corcheas y la figura mezclada
          es invisible. Las marcas de pulso dicen dónde cae el tiempo. */}
      <g aria-hidden>
        {ticks.map((tick) => (
          <line
            key={`t-${tick.beat}`}
            x1={mirror(tick.x)}
            x2={mirror(tick.x)}
            y1={staffBottom + 4}
            y2={staffBottom + 10}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            opacity={0.45}
          />
        ))}

        {placed.map((item, i) => (
          <line
            key={`s-${i}`}
            data-stem=""
            x1={mirror(item.x)}
            x2={mirror(item.x)}
            y1={staffBottom + 8}
            y2={staffBottom + 8 + STEM_H}
            stroke={i === currentColumn ? "var(--primary)" : "var(--muted-foreground)"}
            strokeWidth={i === currentColumn ? 2 : 1.2}
            strokeDasharray={item.column.rest ? "2 2" : undefined}
            opacity={item.column.rest ? 0.5 : 0.9}
          />
        ))}

        {beams.map((group, i) => (
          <g key={`b-${i}`}>
            {Array.from({ length: group.beams }, (_, n) => (
              <line
                key={n}
                data-beam=""
                x1={mirror(group.from === group.to ? group.from - 4 : group.from)}
                x2={mirror(group.to)}
                y1={staffBottom + 8 + STEM_H - n * BEAM_GAP}
                y2={staffBottom + 8 + STEM_H - n * BEAM_GAP}
                stroke="var(--muted-foreground)"
                strokeWidth={1.6}
                strokeLinecap="butt"
                opacity={0.9}
              />
            ))}
            {group.triplet && (
              <text
                data-triplet=""
                x={mirror((group.from + group.to) / 2)}
                y={staffBottom + 8 + STEM_H + 9}
                textAnchor="middle"
                fontSize={8}
                fontStyle="italic"
                fill="var(--muted-foreground)"
              >
                3
              </text>
            )}
          </g>
        ))}
      </g>

      {runs.map((run, i) => (
        <g key={`pm-${i}`}>
          <text
            x={mirror(run.from)}
            y={staffBottom + 14 + RHYTHM_H}
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
              y1={staffBottom + 11 + RHYTHM_H}
              y2={staffBottom + 11 + RHYTHM_H}
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
          y={staffBottom + RHYTHM_H + (runs.length > 0 ? 24 : 14)}
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
