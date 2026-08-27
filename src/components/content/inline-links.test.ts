import { describe, expect, it } from "vitest";
import { splitInlineLinks } from "./inline-links";

describe("splitInlineLinks", () => {
  it("un texto sin enlaces se queda como está", () => {
    expect(splitInlineLinks("hola qué tal")).toEqual([
      { tipo: "texto", texto: "hola qué tal" },
    ]);
  });

  it("separa el enlace del texto de alrededor", () => {
    expect(splitInlineLinks("ver [las permutaciones](/wiki/x) para más")).toEqual([
      { tipo: "texto", texto: "ver " },
      { tipo: "enlace", texto: "las permutaciones", href: "/wiki/x" },
      { tipo: "texto", texto: " para más" },
    ]);
  });

  it("admite varios enlaces seguidos", () => {
    const trozos = splitInlineLinks("[a](/1) y [b](/2)");
    expect(trozos.filter((t) => t.tipo === "enlace")).toHaveLength(2);
  });

  it("un enlace al principio no deja un trozo vacío delante", () => {
    expect(splitInlineLinks("[a](/1) final")[0]).toEqual({
      tipo: "enlace",
      texto: "a",
      href: "/1",
    });
  });

  it("los corchetes sueltos no son un enlace", () => {
    expect(splitInlineLinks("un [aparte] cualquiera")).toEqual([
      { tipo: "texto", texto: "un [aparte] cualquiera" },
    ]);
  });

  it("solo enlaces internos: nada de javascript: ni de fuera", () => {
    expect(splitInlineLinks("[x](javascript:alert(1))")).toEqual([
      { tipo: "texto", texto: "[x](javascript:alert(1))" },
    ]);
    expect(splitInlineLinks("[x](https://ejemplo.com)")).toEqual([
      { tipo: "texto", texto: "[x](https://ejemplo.com)" },
    ]);
  });
});
