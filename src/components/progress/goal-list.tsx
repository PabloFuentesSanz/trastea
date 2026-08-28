import Link from "next/link";
import { recortarMetas, type Meta } from "@/lib/progress/goals";
import { cn } from "@/lib/utils";

const ETIQUETA: Record<Meta["estado"], string> = {
  conseguida: "Conseguida",
  cerca: "A tiro",
  "en-marcha": "En marcha",
  parada: "Parada",
  "sin-empezar": "Sin empezar",
};

const COLOR: Record<Meta["estado"], string> = {
  conseguida: "bg-success",
  cerca: "bg-primary",
  "en-marcha": "bg-primary/60",
  parada: "bg-destructive/60",
  "sin-empezar": "bg-muted",
};

/**
 * Cada meta de bpm del curso con lo que llevas hecho. El número suelto no
 * dice nada; "104 de 110" sí, y además dice cuánto falta.
 */
export function GoalList({ metas }: { metas: Meta[] }) {
  const { visibles, ocultas } = recortarMetas(metas);

  if (metas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Los objetivos salen de los ejercicios del curso. Registra un bpm en cualquiera y
        aparece aquí.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y">
        {visibles.map((m) => {
          const porcentaje = Math.min(
            100,
            Math.round(((m.mejor ?? 0) / m.objetivo) * 100),
          );
          return (
            <li key={m.slug} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/ejercicios/${m.slug}`}
                  className="line-clamp-2 text-sm hover:text-primary"
                >
                  {m.titulo}
                </Link>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {m.mejor ?? "—"}
                  <span className="text-xs"> / {m.objetivo}</span>
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
                  role="img"
                  aria-label={`${porcentaje}% del objetivo`}
                >
                  <div
                    className={cn("h-full rounded-full", COLOR[m.estado])}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">
                  {m.estado === "conseguida"
                    ? ETIQUETA.conseguida
                    : m.estado === "sin-empezar"
                      ? ETIQUETA["sin-empezar"]
                      : `faltan ${m.faltan} bpm`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {ocultas > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Y {ocultas} objetivos más que aún no has empezado: aparecen en cuanto registres
          un bpm en su ejercicio.
        </p>
      )}
    </>
  );
}
