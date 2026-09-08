/**
 * Lo que el bloque de una lección enseña de su ejercicio sin abrir la ficha
 * entera: qué es y para qué sirve, sacado del <Ficha> con el que empieza
 * cada ejercicio. Un día con cinco bloques abiertos metía 1.700-2.300
 * palabras en pantalla; con esto son dos líneas por bloque y la ficha
 * completa a un toque.
 */

export interface ResumenDeEjercicio {
  queEs?: string;
  paraQue?: string;
}

const FICHA = /<Ficha\b([\s\S]*?)\/>/;

function atributo(ficha: string, nombre: string): string | undefined {
  const match = new RegExp(`\\b${nombre}="([^"]*)"`).exec(ficha);
  return match?.[1];
}

export function resumenDeEjercicio(cuerpo: string): ResumenDeEjercicio {
  const ficha = FICHA.exec(cuerpo)?.[1];
  if (!ficha) return {};
  const resumen: ResumenDeEjercicio = {};
  const queEs = atributo(ficha, "queEs");
  const paraQue = atributo(ficha, "paraQue");
  if (queEs) resumen.queEs = queEs;
  if (paraQue) resumen.paraQue = paraQue;
  return resumen;
}
