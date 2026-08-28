/**
 * El resumen de una semana: qué hiciste, cuánto subiste y qué apuntaste.
 *
 * Todo sale de lo que ya se guarda al practicar. La gracia de mirarlo por
 * semanas y no por días es que una semana es la unidad en la que se nota si
 * algo mejora: un día suelto no dice nada.
 */

export interface RangoSemana {
  desde: string;
  hasta: string;
}

export interface SesionSemana {
  date: string;
  duration_min: number;
  lesson_slug: string | null;
  notes: string | null;
  mood: number | null;
}

export interface RegistroSemana {
  exercise_slug: string;
  bpm: number;
  recorded_at: string;
}

export interface LeccionTerminada {
  lesson_slug: string;
  completed_at: string | null;
}

export interface Subida {
  slug: string;
  desde: number;
  hasta: number;
  ganancia: number;
}

export interface ResumenSemana {
  rango: RangoSemana;
  minutos: number;
  dias: number;
  sesiones: number;
  lecciones: string[];
  subidas: Subida[];
  notas: { date: string; texto: string }[];
  animoMedio?: number;
}

/** Lunes a domingo. `atras` = 0 es la semana en curso, 1 la anterior. */
export function semanaCerrada(hoy: string, atras: number): RangoSemana {
  const dia = new Date(`${hoy}T00:00:00Z`);
  // getUTCDay: 0 domingo … 6 sábado; queremos lunes como primer día
  const desdeElLunes = (dia.getUTCDay() + 6) % 7;
  const lunes = new Date(dia);
  lunes.setUTCDate(dia.getUTCDate() - desdeElLunes - atras * 7);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);
  return {
    desde: lunes.toISOString().slice(0, 10),
    hasta: domingo.toISOString().slice(0, 10),
  };
}

const dentro = (fecha: string, r: RangoSemana) => fecha >= r.desde && fecha <= r.hasta;

export function resumenSemanal(
  rango: RangoSemana,
  sesiones: readonly SesionSemana[],
  registros: readonly RegistroSemana[],
  lecciones: readonly LeccionTerminada[],
): ResumenSemana {
  const deLaSemana = sesiones.filter((s) => dentro(s.date, rango));
  const animos = deLaSemana
    .map((s) => s.mood)
    .filter((m): m is number => typeof m === "number");

  // lo que subió: el mejor bpm de la semana contra el mejor de antes
  const porEjercicio = new Map<string, { antes: number; ahora: number }>();
  for (const r of registros) {
    const fecha = r.recorded_at.slice(0, 10);
    if (fecha > rango.hasta) continue;
    const actual = porEjercicio.get(r.exercise_slug) ?? { antes: 0, ahora: 0 };
    if (fecha < rango.desde) actual.antes = Math.max(actual.antes, r.bpm);
    else actual.ahora = Math.max(actual.ahora, r.bpm);
    porEjercicio.set(r.exercise_slug, actual);
  }

  const subidas: Subida[] = [];
  for (const [slug, { antes, ahora }] of porEjercicio) {
    if (ahora > antes) {
      subidas.push({ slug, desde: antes, hasta: ahora, ganancia: ahora - antes });
    }
  }

  return {
    rango,
    minutos: deLaSemana.reduce((sum, s) => sum + s.duration_min, 0),
    dias: new Set(deLaSemana.map((s) => s.date)).size,
    sesiones: deLaSemana.length,
    lecciones: lecciones
      .filter(
        (l) => l.completed_at !== null && dentro(l.completed_at.slice(0, 10), rango),
      )
      .map((l) => l.lesson_slug),
    subidas,
    notas: deLaSemana
      .filter((s) => s.notes !== null && s.notes.trim() !== "")
      .map((s) => ({ date: s.date, texto: s.notes as string }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    animoMedio:
      animos.length > 0
        ? Math.round((animos.reduce((a, b) => a + b, 0) / animos.length) * 10) / 10
        : undefined,
  };
}
