import { describe, expect, it } from "vitest";
import { mapaDelCurso } from "./course-map";

const LECCIONES = [
  { slug: "a-d1", moduloSlug: "a", moduloTitulo: "Módulo A", semana: 1 },
  { slug: "a-d2", moduloSlug: "a", moduloTitulo: "Módulo A", semana: 1 },
  { slug: "b-d1", moduloSlug: "b", moduloTitulo: "Módulo B", semana: 5 },
  { slug: "b-d2", moduloSlug: "b", moduloTitulo: "Módulo B", semana: 5 },
];

describe("mapaDelCurso", () => {
  it("cuenta lo hecho por módulo y en total", () => {
    const mapa = mapaDelCurso(LECCIONES, new Set(["a-d1", "a-d2", "b-d1"]));
    expect(mapa.hechas).toBe(3);
    expect(mapa.total).toBe(4);
    expect(mapa.modulos).toEqual([
      { slug: "a", titulo: "Módulo A", hechas: 2, total: 2, completo: true },
      { slug: "b", titulo: "Módulo B", hechas: 1, total: 2, completo: false },
    ]);
  });

  it("el sitio donde estás es la primera sin hacer, no la última hecha", () => {
    const mapa = mapaDelCurso(LECCIONES, new Set(["a-d1", "b-d1"]));
    expect(mapa.siguiente?.slug).toBe("a-d2");
  });

  it("sin nada hecho, empiezas por el principio", () => {
    expect(mapaDelCurso(LECCIONES, new Set()).siguiente?.slug).toBe("a-d1");
  });

  it("con el curso entero hecho no hay siguiente", () => {
    const todo = new Set(LECCIONES.map((l) => l.slug));
    expect(mapaDelCurso(LECCIONES, todo).siguiente).toBeNull();
  });

  it("el módulo a evaluar es el último completo, y solo si lo está", () => {
    expect(mapaDelCurso(LECCIONES, new Set(["a-d1", "a-d2"])).moduloCompleto?.slug).toBe(
      "a",
    );
    expect(mapaDelCurso(LECCIONES, new Set(["a-d1"])).moduloCompleto).toBeNull();
  });
});
