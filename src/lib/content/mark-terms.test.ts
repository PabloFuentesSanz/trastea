import { describe, expect, it } from "vitest";
import { marcarTexto, type Trozo } from "./mark-terms";

const INDICE = [
  { busca: "vamp", termino: "Vamp" },
  { busca: "guide tones", termino: "Guide tones" },
  { busca: "púa alterna", termino: "Púa alterna" },
];

const textos = (trozos: Trozo[]) => trozos.map((t) => t.texto);
const marcados = (trozos: Trozo[]) =>
  trozos.filter((t) => t.termino !== undefined).map((t) => t.texto);

describe("marcarTexto", () => {
  it("marca la palabra y deja el resto intacto", () => {
    const trozos = marcarTexto(
      "tocamos sobre un vamp de cuatro acordes",
      INDICE,
      new Set(),
    );
    expect(textos(trozos).join("")).toBe("tocamos sobre un vamp de cuatro acordes");
    expect(marcados(trozos)).toEqual(["vamp"]);
  });

  it("respeta cómo estaba escrita", () => {
    const trozos = marcarTexto("Vamp de cuatro acordes", INDICE, new Set());
    expect(marcados(trozos)).toEqual(["Vamp"]);
  });

  it("no marca una palabra que solo la contiene", () => {
    expect(marcados(marcarTexto("el vampiro del blues", INDICE, new Set()))).toEqual([]);
  });

  it("marca términos de varias palabras", () => {
    const trozos = marcarTexto("apunta a los guide tones", INDICE, new Set());
    expect(marcados(trozos)).toEqual(["guide tones"]);
  });

  it("solo la primera vez en toda la página", () => {
    const vistos = new Set<string>();
    const uno = marcarTexto("un vamp", INDICE, vistos);
    const dos = marcarTexto("otro vamp", INDICE, vistos);
    expect(marcados(uno)).toEqual(["vamp"]);
    expect(marcados(dos)).toEqual([]);
  });

  it("con acentos, el borde de palabra también funciona", () => {
    const trozos = marcarTexto("con púa alterna, siempre", INDICE, new Set());
    expect(marcados(trozos)).toEqual(["púa alterna"]);
  });

  it("un texto sin nada del glosario devuelve un solo trozo", () => {
    const trozos = marcarTexto("hoy no hay palabras nuevas", INDICE, new Set());
    expect(trozos).toHaveLength(1);
    expect(trozos[0].termino).toBeUndefined();
  });

  it("también en plural, que es como se habla", () => {
    const indice = [
      { busca: "riff", termino: "Riff" },
      { busca: "inversión", termino: "Inversión" },
      { busca: "guide tones", termino: "Guide tones" },
    ];
    expect(marcados(marcarTexto("dos riffs seguidos", indice, new Set()))).toEqual([
      "riffs",
    ]);
    expect(marcados(marcarTexto("las inversiones de Do", indice, new Set()))).toEqual([
      "inversiones",
    ]);
    // el que ya es plural no gana una "s" de más
    expect(marcados(marcarTexto("los guide toness", indice, new Set()))).toEqual([]);
  });

  it("prefiere el término largo cuando uno contiene al otro", () => {
    const indice = [{ busca: "púa", termino: "Púa" }, ...INDICE];
    const trozos = marcarTexto("con púa alterna", indice, new Set());
    expect(marcados(trozos)).toEqual(["púa alterna"]);
  });
});
