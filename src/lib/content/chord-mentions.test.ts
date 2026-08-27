import { describe, expect, it } from "vitest";
import { findChordMentions } from "./chord-mentions";

/** Solo los cifrados detectados, para leer los casos de un vistazo. */
const acordes = (text: string) =>
  findChordMentions(text).flatMap((s) => ("chord" in s ? [s.chord] : []));

/** El texto reconstruido tiene que ser idéntico al original. */
const reconstruido = (text: string) =>
  findChordMentions(text)
    .map((s) => ("chord" in s ? s.chord : s.text))
    .join("");

describe("findChordMentions", () => {
  it("reconstruye siempre el texto original", () => {
    for (const t of [
      "Toca Am y luego E7",
      "A la quinta, algo hace clic",
      "encadena C → F → G → C usando la inversión más próxima",
      "",
      "sin nada que ver",
    ]) {
      expect(reconstruido(t)).toBe(t);
    }
  });

  describe("cifrados con cualidad: siempre", () => {
    it("los detecta sueltos", () => {
      expect(acordes("Toca Am y luego E7")).toEqual(["Am", "E7"]);
      expect(acordes("el Dm7b5 del ii-V menor")).toEqual(["Dm7b5"]);
      expect(acordes("Cmaj7, C7, Cm7 y Cm7b5")).toEqual(["Cmaj7", "C7", "Cm7", "Cm7b5"]);
    });

    it("con alteraciones", () => {
      expect(acordes("pasa a Bb7 y luego F#m7")).toEqual(["Bb7", "F#m7"]);
    });
  });

  describe("letras sueltas: solo en progresión", () => {
    it("no toca una A que es preposición", () => {
      expect(acordes("A la quinta, algo hace clic")).toEqual([]);
      expect(acordes("A 162 los cambios llegan seguidos")).toEqual([]);
    });

    it("no toca la letra de un módulo", () => {
      expect(acordes("Y si todo sale: módulo A cerrado")).toEqual([]);
    });

    it("sí las detecta encadenadas", () => {
      expect(acordes("encadena C → F → G → C")).toEqual(["C", "F", "G", "C"]);
      expect(acordes("tocas G-D-Em-C toda la canción")).toEqual(["G", "D", "Em", "C"]);
      expect(acordes("un bucle de C - F - G")).toEqual(["C", "F", "G"]);
      expect(acordes("Am - G - D con frases cortas")).toEqual(["Am", "G", "D"]);
    });

    it("una letra suelta pegada a un cifrado con cualidad cuenta como progresión", () => {
      expect(acordes("cambia C→Am, G→Em y F→Dm")).toEqual([
        "C",
        "Am",
        "G",
        "Em",
        "F",
        "Dm",
      ]);
    });

    it("no encadena a través de una frase entera", () => {
      expect(acordes("el acorde de C suena bien y el de G también")).toEqual([]);
    });
  });

  describe("lo que no es un acorde", () => {
    it("ignora palabras españolas que empiezan por nota", () => {
      expect(acordes("El Fa de la escala. Es Do. Dos notas.")).toEqual([]);
      expect(acordes("Emocionante, Digital, Agudo, Bemol, Cuando")).toEqual([]);
    });

    it("ignora cifrados que no existen en nuestros datos", () => {
      expect(acordes("la nota C3 del piano")).toEqual([]);
    });

    it("no parte una palabra por dentro", () => {
      expect(acordes("Fíjate en el Am7 de arriba")).toEqual(["Am7"]);
      expect(acordes("cAmbio")).toEqual([]);
    });

    it("no confunde un traste ni una cuerda", () => {
      expect(acordes("6:5 en la 4ª cuerda")).toEqual([]);
    });
  });

  describe("posiciones", () => {
    it("devuelve el texto de alrededor intacto", () => {
      expect(findChordMentions("Toca Am ya")).toEqual([
        { text: "Toca " },
        { chord: "Am" },
        { text: " ya" },
      ]);
    });

    it("no deja segmentos de texto vacíos", () => {
      for (const segment of findChordMentions("Am E7")) {
        if ("text" in segment) expect(segment.text.length).toBeGreaterThan(0);
      }
    });
  });
});

/** Casos sacados del contenido real, no inventados. */
describe("lo que aparece de verdad en el contenido", () => {
  it("no marca los puntos del mástil, que son notas", () => {
    expect(acordes("Puntos 3, 5, 7, 9, 12 → D, E, F#, G#, B")).toEqual([]);
    expect(acordes("en la 3ª son Bb, C, D, E, G")).toEqual([]);
  });

  it("no marca los pares de semitonos", () => {
    expect(acordes("Dos parejas pegadas: E-F en el 0-1 y B-C en el 7-8")).toEqual([]);
  });

  it("no marca una serie de notas de una escala", () => {
    expect(acordes("El giro 6-1-2-3 (A-C-D-E en Do)")).toEqual([]);
    expect(acordes("A B C D E F G A, trastes 0-2-3-5-7-8-10-12")).toEqual([]);
  });

  it("sí marca una lista de acordes con comas si alguno lleva cualidad", () => {
    expect(acordes("tríadas al azar (C, Am, F, Dm, G, Em)")).toEqual([
      "C",
      "Am",
      "F",
      "Dm",
      "G",
      "Em",
    ]);
  });

  it("sí marca una progresión con guiones espaciados", () => {
    expect(acordes("un bucle de C - F - G")).toEqual(["C", "F", "G"]);
    expect(acordes("la cadencia Am - G - F - E")).toEqual(["Am", "G", "F", "E"]);
  });
});
