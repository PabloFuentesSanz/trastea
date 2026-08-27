/**
 * Resumen del estado del esquema desplegado.
 *
 * Aparte de la ruta y sin saber de Supabase: recibe una función que dice si
 * una tabla responde, para poder comprobarlo sin base de datos. Existe porque
 * el fallo típico en producción no es "no hay Supabase", es que el código va
 * por delante de las migraciones — y eso, desde fuera, se ve como una app que
 * funciona y no guarda nada.
 */

/** Las tablas de las que el código lee o a las que escribe. */
export const TABLAS_USADAS = [
  "profiles",
  "practice_sessions",
  "lesson_progress",
  "srs_cards",
  "exercise_records",
  "assessments",
  "recordings",
] as const;

export type TablaUsada = (typeof TABLAS_USADAS)[number];

export interface SchemaSummary {
  ok: boolean;
  /** por tabla: "ok" o el error que devolvió la base de datos */
  tablas: Record<string, string>;
  faltan: string[];
}

/**
 * @param comprobar devuelve `null` si la tabla responde, o el mensaje de error
 */
export async function schemaSummary(
  comprobar: (tabla: string) => Promise<string | null>,
  tablas: readonly string[] = TABLAS_USADAS,
): Promise<SchemaSummary> {
  const filas = await Promise.all(
    tablas.map(async (tabla) => [tabla, (await comprobar(tabla)) ?? "ok"] as const),
  );
  const faltan = filas.filter(([, estado]) => estado !== "ok").map(([tabla]) => tabla);
  return { ok: faltan.length === 0, tablas: Object.fromEntries(filas), faltan };
}
