import Link from "next/link";
import type { ResumenSemana } from "@/lib/progress/week";

const MOOD_CARA: Record<number, string> = { 1: "😤", 2: "😕", 3: "🙂", 4: "😃", 5: "🔥" };

function fechaCorta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${Number(dia)}/${Number(mes)}`;
}

/**
 * La semana cerrada: cuánto, qué subió, qué apuntaste.
 *
 * Un día suelto no dice nada; una semana sí. Y ver lo que subió al lado de lo
 * que escribiste ese día es lo que convierte una gráfica en una historia.
 */
export function WeekSummary({
  resumen,
  titulos,
}: {
  resumen: ResumenSemana;
  titulos: Record<string, string>;
}) {
  const vacia = resumen.sesiones === 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Del {fechaCorta(resumen.rango.desde)} al {fechaCorta(resumen.rango.hasta)}
      </p>

      {vacia ? (
        <p className="text-sm text-muted-foreground">
          Esta semana todavía no hay nada. Una sesión de 20 minutos ya cuenta.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border">
            <div className="bg-card px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Días
              </dt>
              <dd className="text-xl font-semibold tabular-nums">{resumen.dias}/7</dd>
            </div>
            <div className="bg-card px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Minutos
              </dt>
              <dd className="text-xl font-semibold tabular-nums">{resumen.minutos}</dd>
            </div>
            <div className="bg-card px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Lecciones
              </dt>
              <dd className="text-xl font-semibold tabular-nums">
                {resumen.lecciones.length}
                {resumen.animoMedio !== undefined && (
                  <span className="ml-2 text-base font-normal" aria-hidden>
                    {MOOD_CARA[Math.round(resumen.animoMedio)]}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {resumen.subidas.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Lo que ha subido</h3>
              <ul className="mt-1.5 flex flex-col gap-1">
                {resumen.subidas.map((s) => (
                  <li key={s.slug} className="flex items-baseline gap-2 text-sm">
                    <Link
                      href={`/ejercicios/${s.slug}`}
                      className="min-w-0 flex-1 truncate hover:text-primary"
                    >
                      {titulos[s.slug] ?? s.slug}
                    </Link>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {s.desde > 0 ? `${s.desde} → ` : ""}
                      <span className="font-medium text-success">{s.hasta}</span>
                      <span className="ml-1 text-xs">+{s.ganancia}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resumen.notas.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Lo que apuntaste</h3>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {resumen.notas.map((n) => (
                  <li key={`${n.date}-${n.texto}`} className="flex gap-2 text-sm">
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {fechaCorta(n.date)}
                    </span>
                    <span className="text-muted-foreground">{n.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
