import { describe, expect, it } from "vitest";
import { weekFrontmatterSchema } from "./schemas";

const semana = {
  slug: "a-cimientos-w03",
  title: "La escala mayor de verdad",
  focus: "La escala mayor en dos posiciones · cantar grados",
  summary: "Dos posiciones con nombre y apellidos, y el oído cantando grados.",
  order: 3,
};

describe("frontmatter de semana", () => {
  it("acepta un foco que cabe en una línea", () => {
    expect(weekFrontmatterSchema.parse(semana).focus).toBe(semana.focus);
  });

  it("rechaza el foco que se sale de la pantalla", () => {
    // el que rompía /curso/a-cimientos: 122 caracteres empujaban la página
    // 247 px fuera del móvil
    const largo =
      "Escala mayor en 2 posiciones (Do, Sol, Fa) + notas en 2ª y 1ª cuerda + cantar grados";
    expect(() => weekFrontmatterSchema.parse({ ...semana, focus: largo })).toThrow(
      /subtítulo/i,
    );
  });
});
