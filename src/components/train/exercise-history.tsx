import { CalendarDays, Gauge, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { lineChartLayout, type ChartPoint } from "@/lib/chart/line";
import type { ExerciseHistory } from "@/lib/queries";

const BOX = {
  width: 640,
  height: 180,
  padding: { top: 12, right: 12, bottom: 26, left: 38 },
};

/** dd/mm desde el ISO, sin Intl ni new Date (ver bpm-chart). */
function diaMes(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

/**
 * Lo que llevas hecho con este ejercicio: cuántas veces, en cuántos días, la
 * mejor marca limpia y la curva de tempos.
 *
 * Los intentos sucios se dibujan huecos: subir el número a base de tocarlo mal
 * es la forma más rápida de dejar de mejorar, así que se ve la diferencia.
 */
export function ExerciseHistoryPanel({
  history,
  demo,
}: {
  history: ExerciseHistory;
  demo: boolean;
}) {
  if (demo) {
    return (
      <p className="text-muted-foreground mt-6 rounded-lg border p-4 text-sm">
        Con la sesión iniciada, aquí se guarda el historial: cuándo lo has hecho, a qué
        tempo y si salió limpio.
      </p>
    );
  }

  if (history.times === 0) {
    return (
      <p className="text-muted-foreground mt-6 rounded-lg border p-4 text-sm">
        Todavía no has registrado ningún intento. Cada vez que marques “limpio” o “con
        errores” arriba, se apunta aquí.
      </p>
    );
  }

  const puntos: ChartPoint[] = history.attempts.map((a) => ({
    label: diaMes(a.recordedAt),
    value: a.bpm,
  }));
  const layout = lineChartLayout(puntos, BOX);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Repeat} label="Veces" value={String(history.times)} />
        <Stat icon={CalendarDays} label="Días" value={String(history.days)} />
        <Stat
          icon={Gauge}
          label="Mejor limpio"
          value={history.bestClean === null ? "—" : `${history.bestClean}`}
          suffix={history.bestClean === null ? undefined : "bpm"}
        />
      </div>

      <div className="mt-4 rounded-xl border p-3">
        <svg
          viewBox={`0 0 ${BOX.width} ${BOX.height}`}
          className="h-44 w-full"
          role="img"
          aria-label={`Evolución del tempo en ${history.times} intentos${
            history.bestClean === null
              ? ""
              : `, con un máximo limpio de ${history.bestClean} bpm`
          }.`}
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

          {layout.points.map((p, i) => {
            const limpio = history.attempts[i]?.clean ?? true;
            return (
              <circle
                key={`p${i}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill={limpio ? "var(--primary)" : "var(--card)"}
                stroke="var(--primary)"
                strokeWidth={1.5}
              >
                <title>{`${p.label}: ${p.value} bpm${limpio ? " (limpio)" : " (con errores)"}`}</title>
              </circle>
            );
          })}
        </svg>
        <p className="text-muted-foreground mt-2 text-xs">
          Los puntos huecos son intentos con errores.
        </p>
      </div>

      {/* los datos en crudo, para quien no ve el dibujo */}
      <table className="sr-only">
        <caption>Historial de intentos</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Bpm</th>
            <th scope="col">Limpio</th>
          </tr>
        </thead>
        <tbody>
          {history.attempts.map((a, i) => (
            <tr key={i}>
              <th scope="row">{diaMes(a.recordedAt)}</th>
              <td>{a.bpm}</td>
              <td>{a.clean ? "sí" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Repeat;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Icon className="text-primary size-4" aria-hidden /> {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="display-number text-3xl">
          {value}
          {suffix && <span className="text-muted-foreground text-lg"> {suffix}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
