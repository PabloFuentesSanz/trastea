import type { KeyboardEvent } from "react";
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
const MARKER_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_MARKER_FRETS = [12, 24];
/** Con la ventana así de corta cabe numerar todos los trastes. */
const NUMBER_EVERY_FRET_UP_TO = 7;

/** Flechas, inicio y fin: el recorrido del foco por las notas del dibujo. */
const MOVIMIENTOS: Record<string, number | "inicio" | "final"> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
  Home: "inicio",
  End: "final",
};

function colorFor(position: FretPosition): string {
  return position.isRoot ? "var(--primary)" : colorForInterval(position.interval);
}

export interface FretboardProps {
  positions: FretPosition[];
  /** último traste dibujado */
  frets?: number;
  /** primer traste dibujado; 0 incluye las cuerdas al aire */
  fromFret?: number;
  strings?: number;
  labels?: FretboardLabels;
  lefty?: boolean;
  /** descripción accesible, p. ej. "Escala de Fa mayor" */
  title: string;
  className?: string;
  /**
   * Si se pasa, cada nota deja de ser un dibujo y pasa a ser un botón: se
   * pulsa con el ratón o con el teclado y suena. El manejador lo pone un
   * componente cliente (ver `<MastilSonoro>`); el dibujo sigue siendo puro.
   */
  onPlayNote?: (position: FretPosition) => void;
}

/**
 * Mástil SVG. Convención: la 1ª cuerda (aguda) arriba, como en una tab.
 * El cálculo de posiciones es puro (src/lib/music/fretboard.ts).
 *
 * Con `fromFret` dibuja solo una ventana —una caja de escala, una zona
 * CAGED— numerando los trastes reales, no los de la ventana.
 */
export function Fretboard({
  positions,
  frets = 15,
  fromFret = 0,
  strings = 6,
  labels = "note",
  lefty = false,
  title,
  className,
  onPlayNote,
}: FretboardProps) {
  /** primera casilla dibujada; el traste 0 no es casilla, es la cejuela */
  const firstCell = Math.max(fromFret, 1);
  const lastFret = Math.max(frets, firstCell);
  const cells = lastFret - firstCell + 1;
  /** con la ventana pegada a la cejuela, se dibuja la cejuela */
  const showNut = fromFret <= 1;

  const width = PAD_X * 2 + NUT_W + cells * FRET_W;
  const height = PAD_Y * 2 + (strings - 1) * STRING_GAP;

  const mirror = (x: number) => (lefty ? width - x : x);
  /** centro de la casilla de un traste (o de la cejuela, para el aire) */
  const fretX = (fret: number) =>
    mirror(
      fret === 0 ? PAD_X + NUT_W / 2 : PAD_X + NUT_W + (fret - firstCell + 0.5) * FRET_W,
    );
  /** línea de traste: el borde derecho de su casilla */
  const fretLineX = (fret: number) =>
    mirror(PAD_X + NUT_W + (fret - firstCell + 1) * FRET_W);
  /** cuerda 0 = 6ª (grave) abajo; 1ª aguda arriba */
  const stringY = (string: number) => PAD_Y + (strings - 1 - string) * STRING_GAP;

  const inWindow = (fret: number) =>
    fret >= firstCell ? fret <= lastFret : fret === 0 && fromFret === 0;

  const numberedFrets =
    cells <= NUMBER_EVERY_FRET_UP_TO
      ? Array.from({ length: cells }, (_, i) => firstCell + i)
      : [...MARKER_FRETS, ...DOUBLE_MARKER_FRETS].filter(inWindow).sort((a, b) => a - b);

  /** las que de verdad se pintan, en el orden en que se recorren */
  const dibujadas = positions.filter((p) => inWindow(p.fret) && p.string < strings);

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
      role={onPlayNote ? "group" : "img"}
      aria-label={title}
      className={cn("w-full", cells > 7 && "min-w-[640px]", className)}
    >
      {/* cejuela, solo si la ventana empieza en el aire */}
      {showNut && (
        <rect
          x={lefty ? width - PAD_X - NUT_W : PAD_X}
          y={PAD_Y - 6}
          width={NUT_W}
          height={(strings - 1) * STRING_GAP + 12}
          rx={2}
          fill="var(--border)"
        />
      )}
      {/* trastes */}
      {Array.from({ length: cells }, (_, i) => firstCell + i).map((fret) => (
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
      {MARKER_FRETS.filter(inWindow).map((fret) => (
        <circle key={fret} cx={fretX(fret)} cy={height / 2} r={4} fill="var(--muted)" />
      ))}
      {DOUBLE_MARKER_FRETS.filter(inWindow).map((fret) => (
        <g key={fret}>
          <circle
            cx={fretX(fret)}
            cy={height / 2 - STRING_GAP}
            r={4}
            fill="var(--muted)"
          />
          <circle
            cx={fretX(fret)}
            cy={height / 2 + STRING_GAP}
            r={4}
            fill="var(--muted)"
          />
        </g>
      ))}
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
      {numberedFrets.map((fret) => (
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
      {dibujadas
        .map((p, indice) => {
          const x = fretX(p.fret);
          const y = stringY(p.string);
          const fill = colorFor(p);
          const text = label(p);
          const guitarString = 6 - p.string;
          const donde = `Cuerda ${guitarString}, traste ${p.fret}, ${toSolfege(p.note)}`;
          const interactiva = onPlayNote
            ? {
                role: "button",
                // foco itinerante: el mástil entero es una parada del
                // tabulador y las flechas recorren sus notas. Con 40 notas
                // por dibujo, un tabulador por nota hace la página
                // inservible con teclado.
                tabIndex: indice === 0 ? 0 : -1,
                "aria-label": donde,
                className:
                  "cursor-pointer focus:outline-none focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:2px]",
                onClick: () => onPlayNote(p),
                onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPlayNote(p);
                    return;
                  }
                  const salto = MOVIMIENTOS[e.key];
                  if (salto === undefined) return;
                  e.preventDefault();
                  const destino =
                    salto === "inicio"
                      ? 0
                      : salto === "final"
                        ? dibujadas.length - 1
                        : Math.min(Math.max(indice + salto, 0), dibujadas.length - 1);
                  const hermanas = e.currentTarget.parentElement?.querySelectorAll<
                    SVGGElement
                  >('[role="button"]');
                  hermanas?.[destino]?.focus();
                },
              }
            : {};
          return (
            <g key={`${p.string}-${p.fret}`} {...interactiva}>
              <title>{`${donde} (${p.interval})`}</title>
              {onPlayNote && (
                // diana generosa: en el móvil el círculo de 9 px se falla
                <circle cx={x} cy={y} r={14} fill="transparent" />
              )}
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
