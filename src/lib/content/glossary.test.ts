import { describe, expect, it } from "vitest";
import { parseGlosario } from "./glossary";

const MDX = `
Definiciones cortas y, cuando hay más que contar, el enlace a la ficha entera.

## C

**Caja.** Una de las posiciones cerradas de una escala. Ver
[[pentatonica-menor]].

**Cejilla.** Un dedo (o un capo) pisando varias cuerdas a la vez.

## O

**Octavación (quintaje).** Que el traste 12 dé la octava exacta. Ver
[[mantenimiento-y-setup]].

## Para trastear

Si te has quedado con una palabra que no está aquí, apúntala.
`;

describe("parseGlosario", () => {
  const entradas = parseGlosario(MDX);

  it("saca una entrada por término, y solo los términos", () => {
    expect(entradas.map((e) => e.termino)).toEqual([
      "Caja",
      "Cejilla",
      "Octavación (quintaje)",
    ]);
  });

  it("la definición viene limpia, sin el 'Ver [[ficha]]'", () => {
    expect(entradas[0].definicion).toBe("Una de las posiciones cerradas de una escala.");
    expect(entradas[0].ficha).toBe("pentatonica-menor");
  });

  it("una entrada sin ficha se queda sin enlace", () => {
    expect(entradas[1].definicion).toBe(
      "Un dedo (o un capo) pisando varias cuerdas a la vez.",
    );
    expect(entradas[1].ficha).toBeUndefined();
  });

  it("el paréntesis es parte del nombre pero no de lo que se busca", () => {
    expect(entradas[2].termino).toBe("Octavación (quintaje)");
    expect(entradas[2].busca).toBe("octavación");
  });

  it("no se cuela la prosa de alrededor", () => {
    expect(entradas.some((e) => e.termino.includes("apúntala"))).toBe(false);
  });
});
