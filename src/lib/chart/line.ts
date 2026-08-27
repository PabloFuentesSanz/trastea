/**
 * Geometría de un gráfico de línea. Pura y sin React: aquí se decide dónde
 * cae cada punto, y el componente sólo pinta el SVG que salga.
 *
 * Un mástil o una tablatura son más difíciles que esto y los dibujamos a
 * mano, así que la línea de bpm también.
 */

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartBox {
  width: number;
  height: number;
  padding: ChartPadding;
}

export interface PlacedPoint extends ChartPoint {
  x: number;
  y: number;
  /** si su etiqueta cabe en el eje X sin amontonarse */
  showLabel: boolean;
}

export interface ChartTick {
  value: number;
  y: number;
}

export interface ChartLayout {
  points: PlacedPoint[];
  /** camino SVG que une los puntos; vacío con menos de dos */
  path: string;
  ticks: ChartTick[];
  domain: [number, number];
  plot: { x: number; y: number; width: number; height: number };
}

/** cuántas etiquetas de X caben sin que se solapen */
const MAX_X_LABELS = 8;

/**
 * Marcas de eje en pasos redondos (1, 2, 5 y sus múltiplos de 10) que cubren
 * el rango entero. Así el eje dice 60-80-100 y no 62-87-112.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max === min) return [min];

  const rough = (max - min) / Math.max(1, count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;

  // las marcas tienen que *cubrir* el rango: si el máximo es 138 y el paso 20,
  // la última es 140, no 120, o el punto más alto se saldría del eje
  const first = Math.floor(min / step) * step;
  const last = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // el epsilon evita que la última se pierda por el error del coma flotante
  for (let v = first; v <= last + step * 1e-9; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

/** Reparte los puntos por el área de dibujo y calcula ejes y camino. */
export function lineChartLayout(
  points: readonly ChartPoint[],
  box: ChartBox,
  options: { ticks?: number } = {},
): ChartLayout {
  const { padding } = box;
  const plot = {
    x: padding.left,
    y: padding.top,
    width: Math.max(0, box.width - padding.left - padding.right),
    height: Math.max(0, box.height - padding.top - padding.bottom),
  };

  if (points.length === 0) {
    return { points: [], path: "", ticks: [], domain: [0, 0], plot };
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // con todo igual el dominio sería de ancho cero: se abre un poco para que
  // la recta caiga en medio en vez de dividir entre cero
  const flat = rawMax === rawMin;
  const ticks = flat ? [rawMin] : niceTicks(rawMin, rawMax, options.ticks ?? 5);
  const min = flat ? rawMin - 1 : Math.min(rawMin, ticks[0]);
  const max = flat ? rawMax + 1 : Math.max(rawMax, ticks[ticks.length - 1]);
  const span = max - min;

  const toY = (value: number) => plot.y + plot.height * (1 - (value - min) / span);
  const step = points.length > 1 ? plot.width / (points.length - 1) : 0;
  // -1 a los dos lados porque el índice 0 se muestra siempre y cuenta
  const every = Math.max(1, Math.ceil((points.length - 1) / (MAX_X_LABELS - 1)));

  const placed: PlacedPoint[] = points.map((p, i) => ({
    ...p,
    x: points.length > 1 ? plot.x + step * i : plot.x + plot.width / 2,
    y: toY(p.value),
    // el último siempre se ve; los demás cada `every` contando desde el final,
    // para que el hueco quede al principio y no justo antes de la fecha de hoy
    showLabel: i === 0 || (points.length - 1 - i) % every === 0,
  }));

  const path =
    placed.length > 1
      ? placed
          .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`)
          .join(" ")
      : "";

  return {
    points: placed,
    path,
    ticks: ticks.map((value) => ({ value, y: toY(value) })),
    domain: [min, max],
    plot,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
