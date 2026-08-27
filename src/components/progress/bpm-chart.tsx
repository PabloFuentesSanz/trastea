"use client";

import { useMemo, useState } from "react";
import { lineChartLayout, type ChartPoint } from "@/lib/chart/line";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BpmPoint {
  exercise_slug: string;
  bpm: number;
  recorded_at: string;
}

/** coordenadas del viewBox; el SVG escala solo al ancho del contenedor */
const BOX = {
  width: 640,
  height: 240,
  padding: { top: 12, right: 12, bottom: 28, left: 40 },
};

/**
 * dd/mm a partir del ISO, sin `Intl` y sin `new Date`: el formato de Intl
 * cambia según el ICU del entorno, y construir una fecha desplaza el día
 * según la zona horaria del navegador —que es como se rompe la hidratación—.
 */
function diaMes(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

export function BpmChart({
  records,
  titles,
}: {
  records: BpmPoint[];
  titles: Record<string, string>;
}) {
  const exercises = useMemo(
    () => [...new Set(records.map((r) => r.exercise_slug))],
    [records],
  );
  const [selected, setSelected] = useState<string | undefined>(exercises[0]);
  const [active, setActive] = useState<number | null>(null);

  const data = useMemo<ChartPoint[]>(
    () =>
      records
        .filter((r) => r.exercise_slug === selected)
        .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
        .map((r) => ({ label: diaMes(r.recorded_at), value: r.bpm })),
    [records, selected],
  );

  const layout = useMemo(() => lineChartLayout(data, BOX), [data]);

  if (exercises.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavía no hay registros de bpm. Salen solos al practicar: en los bloques de
        técnica apuntas el bpm alcanzado y aquí aparece la curva.
      </p>
    );
  }

  const nombre = selected ? (titles[selected] ?? selected) : "";
  const primero = data[0]?.value;
  const ultimo = data[data.length - 1]?.value;
  const resumen =
    data.length === 0
      ? `Sin registros de ${nombre}.`
      : data.length === 1
        ? `${nombre}: un solo registro, ${primero} bpm.`
        : `${nombre}: de ${primero} a ${ultimo} bpm en ${data.length} registros.`;

  const punto = active === null ? null : layout.points[active];

  return (
    <div>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-full max-w-xs" aria-label="Ejercicio">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((slug) => (
            <SelectItem key={slug} value={slug}>
              {titles[slug] ?? slug}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${BOX.width} ${BOX.height}`}
          className="h-56 w-full"
          role="img"
          aria-label={resumen}
          onMouseLeave={() => setActive(null)}
        >
          {layout.ticks.map((t) => (
            <g key={t.value}>
              <line
                x1={layout.plot.x}
                x2={layout.plot.x + layout.plot.width}
                y1={t.y}
                y2={t.y}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <text
                x={layout.plot.x - 8}
                y={t.y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--muted-foreground)"
              >
                {t.value}
              </text>
            </g>
          ))}

          {layout.points.map((p, i) =>
            p.showLabel ? (
              <text
                key={`x${i}`}
                x={p.x}
                y={BOX.height - 8}
                textAnchor={
                  i === 0 ? "start" : i === layout.points.length - 1 ? "end" : "middle"
                }
                fontSize={11}
                fill="var(--muted-foreground)"
              >
                {p.label}
              </text>
            ) : null,
          )}

          {layout.path && (
            <path
              d={layout.path}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {layout.points.map((p, i) => (
            <g key={`p${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={active === i ? 5 : 3}
                fill="var(--primary)"
                className="motion-safe:transition-[r]"
              />
              {/* diana generosa para el dedo y el ratón: el punto pintado es
                  de 3 px, pero se apunta a una zona de 24 */}
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${p.label}: ${p.value} bpm`}
                className="focus-visible:outline-ring cursor-pointer focus-visible:outline-2"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          ))}
        </svg>

        {punto && (
          <div
            className="bg-popover text-popover-foreground pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border px-2 py-1 text-xs shadow-sm"
            style={{
              left: `${(punto.x / BOX.width) * 100}%`,
              top: `${(punto.y / BOX.height) * 100}%`,
            }}
          >
            <span className="tabular-nums">{punto.value} bpm</span>
            <span className="text-muted-foreground"> · {punto.label}</span>
          </div>
        )}
      </div>

      {/* los datos en crudo, para quien no ve el dibujo */}
      <table className="sr-only">
        <caption>{resumen}</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Bpm</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={i}>
              <th scope="row">{p.label}</th>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
