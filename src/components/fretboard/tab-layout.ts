/**
 * Dónde va cada columna de una tablatura.
 *
 * Aparte del componente porque es geometría, no dibujo: con figuras mezcladas
 * el ancho deja de ser constante y conviene poder comprobarlo sin renderizar
 * nada. La regla es que la corchea vale 1 — así las 72 tabs que ya existían,
 * todas regulares, se siguen dibujando exactamente igual que antes.
 */

import type { TabBar, TabColumn } from "@/lib/music/tab";

export interface PlacedColumn {
  column: TabColumn;
  /** centro de la columna */
  x: number;
  width: number;
  /** pulso en el que entra */
  start: number;
  /** hay barra de compás justo antes */
  barLineBefore: boolean;
  barNumber?: number;
}

const MIN_FACTOR = 0.8;
const MAX_FACTOR = 1.85;

/**
 * Cuánto más ancha se dibuja una columna según lo que dure. Crece con el
 * logaritmo, no con la duración: una redonda dura ocho veces más que una
 * corchea, pero dibujarla ocho veces más ancha deja la tab ilegible.
 */
export function columnWidthFactor(beats: number): number {
  const factor = 1 + Math.log2(beats / 0.5) / 3;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, factor));
}

export function layoutColumns(
  bars: readonly TabBar[],
  colWidth: number,
  chordColWidth: number,
  padX: number,
  barGap: number,
): { placed: PlacedColumn[]; width: number } {
  const placed: PlacedColumn[] = [];
  let x = padX;
  let beat = 0;
  bars.forEach((bar, barIndex) => {
    if (barIndex > 0) x += barGap;
    bar.columns.forEach((column, columnIndex) => {
      const base = column.events.length > 1 ? chordColWidth : colWidth;
      const width = base * columnWidthFactor(column.beats);
      placed.push({
        column,
        x: x + width / 2,
        width,
        start: beat,
        barLineBefore: columnIndex === 0 && barIndex > 0,
        barNumber: columnIndex === 0 && bars.length > 1 ? bar.number : undefined,
      });
      x += width;
      beat += column.beats;
    });
  });
  return { placed, width: x + padX };
}

export interface BeamGroup {
  /** x del centro de la primera columna del grupo */
  from: number;
  /** x del centro de la última */
  to: number;
  beams: number;
  triplet: boolean;
}

/**
 * Las barras de la plica, agrupadas como se agrupan en papel: columnas
 * seguidas de la misma figura que caen dentro del mismo pulso. Sin agrupar
 * por pulso, ocho semicorcheas serían una sola barra larga y dejaría de
 * verse dónde está el tiempo.
 */
export function beamGroups(placed: readonly PlacedColumn[]): BeamGroup[] {
  const groups: BeamGroup[] = [];
  let actual: (BeamGroup & { beat: number }) | null = null;

  for (const item of placed) {
    const { beams, triplet } = item.column.figure;
    if (beams === 0) {
      actual = null;
      continue;
    }
    // el pulso en el que vive esta columna: el grupo se corta al cambiar de
    // pulso aunque la figura siga siendo la misma
    const beat = Math.floor(item.start + 1e-9);
    if (
      actual !== null &&
      actual.beams === beams &&
      actual.triplet === triplet &&
      actual.beat === beat
    ) {
      actual.to = item.x;
      continue;
    }
    actual = { from: item.x, to: item.x, beams, triplet, beat };
    groups.push(actual);
  }

  return groups.map(({ from, to, beams, triplet }) => ({ from, to, beams, triplet }));
}

export interface BeatTick {
  beat: number;
  x: number;
}

/**
 * Los pulsos que se pueden marcar: solo aquellos en los que empieza una
 * columna. Si una blanca se come el pulso 2, ahí no hay nada que marcar —
 * dibujar la marca en mitad de la nota diría que ahí entra algo.
 */
export function beatTicks(placed: readonly PlacedColumn[]): BeatTick[] {
  const ticks: BeatTick[] = [];
  for (const item of placed) {
    const entero = Math.abs(item.start - Math.round(item.start)) < 1e-6;
    if (!entero) continue;
    ticks.push({ beat: Math.round(item.start), x: item.x - item.width / 2 });
  }
  return ticks;
}
