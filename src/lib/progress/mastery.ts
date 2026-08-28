import { parseCardId, type Position } from "@/lib/train/cards";

/**
 * El mástil que dominas, dibujado.
 *
 * El SRS ya sabía, nota por nota, cuál te sale sola y cuál se te cae: lo
 * guarda en el intervalo de repaso de cada tarjeta. Lo que no había era
 * manera de verlo. Un mástil pintado por dominio contesta de un vistazo a
 * "¿qué me sé de verdad?", que es la pregunta que no contestaba ni la racha
 * ni el número de lecciones.
 */

export type NivelDeDominio = "sin-ver" | "floja" | "en-marcha" | "dominada";

export interface EstadoDeTarjeta {
  reps: number;
  intervalDays: number;
  lapses: number;
}

/** A partir de aquí la nota vuelve dentro de tres semanas: eso es dominarla. */
const DOMINADA_DIAS = 21;
/** Caerse dos veces después de haberla consolidado deja marca. */
const CAIDAS_QUE_CUENTAN = 2;

export function nivelDeDominio({
  reps,
  intervalDays,
  lapses,
}: EstadoDeTarjeta): NivelDeDominio {
  if (reps === 0) return "sin-ver";
  if (lapses >= CAIDAS_QUE_CUENTAN || intervalDays < 1) return "floja";
  if (intervalDays >= DOMINADA_DIAS) return "dominada";
  return "en-marcha";
}

export interface NotaDelMapa {
  position: Position;
  nivel: NivelDeDominio;
}

/** Las notas del mástil que has estudiado, con lo bien que las llevas. */
export function mapaDelMastil(
  progreso: readonly (EstadoDeTarjeta & { cardId: string })[],
): NotaDelMapa[] {
  const salida: NotaDelMapa[] = [];
  for (const fila of progreso) {
    const card = parseCardId(fila.cardId);
    if (card?.type !== "fretboard_note") continue;
    salida.push({
      position: { string: card.string, fret: card.fret },
      nivel: nivelDeDominio(fila),
    });
  }
  return salida;
}

export interface ResumenDominio {
  dominadas: number;
  enMarcha: number;
  flojas: number;
  vistas: number;
}

export function resumenDeDominio(mapa: readonly NotaDelMapa[]): ResumenDominio {
  const cuenta = (nivel: NivelDeDominio) => mapa.filter((n) => n.nivel === nivel).length;
  return {
    dominadas: cuenta("dominada"),
    enMarcha: cuenta("en-marcha"),
    flojas: cuenta("floja"),
    vistas: mapa.filter((n) => n.nivel !== "sin-ver").length,
  };
}
