/**
 * Las metas de bpm del curso, comparadas con lo que has registrado.
 *
 * El curso lleva 44 ejercicios con un `bpm_target` escrito; la app guardaba
 * los bpm y no los comparaba nunca con nada. Un número suelto no dice si vas
 * bien: "76 de 80" sí.
 */

export interface EjercicioConMeta {
  slug: string;
  titulo: string;
  objetivo?: number;
}

export interface RegistroBpm {
  exercise_slug: string;
  bpm: number;
  recorded_at: string;
}

export type EstadoMeta = "conseguida" | "cerca" | "en-marcha" | "parada" | "sin-empezar";

export interface Meta {
  slug: string;
  titulo: string;
  objetivo: number;
  /** el mejor bpm que has registrado nunca */
  mejor?: number;
  /** el último, que puede ser peor que el mejor */
  ultimo?: number;
  /** cuánto falta para el objetivo */
  faltan: number;
  diasSinTocar?: number;
  estado: EstadoMeta;
}

/** a partir de aquí, la meta está a tiro */
const CERCA = 8;
/** sin registrar en tres semanas: la meta se ha quedado parada */
const PARADA_DIAS = 21;

const ORDEN: Record<EstadoMeta, number> = {
  cerca: 0,
  "en-marcha": 1,
  parada: 2,
  "sin-empezar": 3,
  conseguida: 4,
};

export function metasDeBpm(
  ejercicios: readonly EjercicioConMeta[],
  registros: readonly RegistroBpm[],
  ahora: number,
): Meta[] {
  const metas = ejercicios
    .filter((e): e is EjercicioConMeta & { objetivo: number } => e.objetivo !== undefined)
    .map((e) => {
      const suyos = registros
        .filter((r) => r.exercise_slug === e.slug)
        .sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at));
      const ultimoRegistro = suyos[suyos.length - 1];
      const mejor = suyos.length > 0 ? Math.max(...suyos.map((r) => r.bpm)) : undefined;
      const diasSinTocar = ultimoRegistro
        ? Math.floor((ahora - Date.parse(ultimoRegistro.recorded_at)) / 86_400_000)
        : undefined;
      const faltan = Math.max(0, e.objetivo - (mejor ?? 0));

      const estado: EstadoMeta =
        mejor === undefined
          ? "sin-empezar"
          : faltan === 0
            ? "conseguida"
            : (diasSinTocar ?? 0) >= PARADA_DIAS
              ? "parada"
              : faltan <= CERCA
                ? "cerca"
                : "en-marcha";

      return {
        slug: e.slug,
        titulo: e.titulo,
        objetivo: e.objetivo,
        mejor,
        ultimo: ultimoRegistro?.bpm,
        faltan,
        diasSinTocar,
        estado,
      };
    });

  return metas.sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || a.faltan - b.faltan);
}

export function resumenDeMetas(metas: readonly Meta[]): {
  conseguidas: number;
  total: number;
} {
  return {
    conseguidas: metas.filter((m) => m.estado === "conseguida").length,
    total: metas.length,
  };
}

/**
 * Cuarenta y cuatro barras no se leen. Se enseñan todas las metas en juego y
 * solo unas pocas de las que ni has empezado, con la cuenta del resto.
 */
export function recortarMetas(
  metas: readonly Meta[],
  maxSinEmpezar = 6,
): { visibles: Meta[]; ocultas: number } {
  const enJuego = metas.filter((m) => m.estado !== "sin-empezar");
  const sinEmpezar = metas.filter((m) => m.estado === "sin-empezar");
  return {
    visibles: [...enJuego, ...sinEmpezar.slice(0, maxSinEmpezar)],
    ocultas: Math.max(0, sinEmpezar.length - maxSinEmpezar),
  };
}
