import type { Meta } from "./goals";

/**
 * Qué hacer ahora, en tres o cuatro cosas concretas.
 *
 * No es una lista de tareas: es la respuesta a "me siento con la guitarra,
 * ¿por dónde empiezo?". Todo sale de datos que ya existen — la lección
 * siguiente, los repasos vencidos, las metas de bpm y las evaluaciones — así
 * que no hay nada que el usuario tenga que mantener.
 */

export interface Situacion {
  siguienteLeccion: { slug: string; titulo: string; href: string } | null;
  repasosVencidos: number;
  metas: readonly Meta[];
  moduloParaEvaluar: { slug: string; titulo: string } | null;
  diasSinPracticar: number;
}

export type TipoAccion = "leccion" | "repaso" | "meta" | "rescate" | "evaluacion";

export interface Accion {
  tipo: TipoAccion;
  titulo: string;
  texto: string;
  href: string;
}

const MAXIMO = 4;

export function queTocaAhora(s: Situacion): Accion[] {
  const acciones: Accion[] = [];

  if (s.siguienteLeccion) {
    acciones.push({
      tipo: "leccion",
      titulo: "La sesión de hoy",
      texto: s.siguienteLeccion.titulo,
      href: s.siguienteLeccion.href,
    });
  }

  if (s.repasosVencidos > 0) {
    acciones.push({
      tipo: "repaso",
      titulo: "Repasos que tocan",
      texto: `${s.repasosVencidos} tarjeta${s.repasosVencidos === 1 ? "" : "s"} vencida${
        s.repasosVencidos === 1 ? "" : "s"
      } en el entrenamiento`,
      href: "/entrenar",
    });
  }

  if (s.moduloParaEvaluar) {
    acciones.push({
      tipo: "evaluacion",
      titulo: "Módulo terminado",
      texto: `Te queda la evaluación de ${s.moduloParaEvaluar.titulo}`,
      href: `/curso/${s.moduloParaEvaluar.slug}/evaluacion`,
    });
  }

  const cerca = s.metas.find((m) => m.estado === "cerca");
  if (cerca) {
    acciones.push({
      tipo: "meta",
      titulo: "A punto de caer",
      texto: `${cerca.titulo}: te faltan ${cerca.faltan} bpm para los ${cerca.objetivo}`,
      href: `/ejercicios/${cerca.slug}`,
    });
  }

  const parada = s.metas.find((m) => m.estado === "parada");
  if (parada) {
    acciones.push({
      tipo: "rescate",
      titulo: "Lleva tiempo parado",
      texto: `${parada.titulo}: ${parada.diasSinTocar} días sin registrar bpm`,
      href: `/ejercicios/${parada.slug}`,
    });
  }

  return acciones.slice(0, MAXIMO);
}
