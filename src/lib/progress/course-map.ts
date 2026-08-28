/**
 * Dónde estás en el curso: cuánto llevas por módulo, cuál es la siguiente
 * lección y si hay un módulo terminado esperando su evaluación.
 */

export interface LeccionDelMapa {
  slug: string;
  moduloSlug: string;
  moduloTitulo: string;
  semana: number;
}

export interface ModuloDelMapa {
  slug: string;
  titulo: string;
  hechas: number;
  total: number;
  completo: boolean;
}

export interface MapaCurso {
  hechas: number;
  total: number;
  modulos: ModuloDelMapa[];
  /** la primera sin hacer: por ahí se sigue */
  siguiente: LeccionDelMapa | null;
  /** el último módulo terminado, que es el que toca evaluar */
  moduloCompleto: { slug: string; titulo: string } | null;
}

export function mapaDelCurso(
  lecciones: readonly LeccionDelMapa[],
  hechas: ReadonlySet<string>,
): MapaCurso {
  const modulos: ModuloDelMapa[] = [];
  for (const l of lecciones) {
    let mod = modulos.find((m) => m.slug === l.moduloSlug);
    if (!mod) {
      mod = {
        slug: l.moduloSlug,
        titulo: l.moduloTitulo,
        hechas: 0,
        total: 0,
        completo: false,
      };
      modulos.push(mod);
    }
    mod.total += 1;
    if (hechas.has(l.slug)) mod.hechas += 1;
  }
  for (const m of modulos) m.completo = m.total > 0 && m.hechas === m.total;

  const completos = modulos.filter((m) => m.completo);
  const ultimo = completos[completos.length - 1];

  return {
    hechas: lecciones.filter((l) => hechas.has(l.slug)).length,
    total: lecciones.length,
    modulos,
    siguiente: lecciones.find((l) => !hechas.has(l.slug)) ?? null,
    moduloCompleto: ultimo ? { slug: ultimo.slug, titulo: ultimo.titulo } : null,
  };
}
