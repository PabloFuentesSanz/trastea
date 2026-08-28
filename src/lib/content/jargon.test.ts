import { describe, expect, it } from "vitest";
import {
  JERGA,
  mencionado,
  presentado,
  primerasApariciones,
  terminosPorDia,
} from "./jargon";

const vamp = { termino: "vamp", alias: ["vamps"] };
const guide = { termino: "guide tone", alias: ["guide tones"], wiki: "guide-tones" };

describe("mencionado", () => {
  it("encuentra el término y su plural", () => {
    expect(mencionado("tocamos sobre un vamp de cuatro acordes", vamp)).toBe(true);
    expect(mencionado("dos vamps seguidos", vamp)).toBe(true);
  });

  it("no confunde una palabra que lo contiene", () => {
    expect(mencionado("el vampiro del blues", vamp)).toBe(false);
    expect(mencionado("revamping", vamp)).toBe(false);
  });

  it("cuenta la mención aunque esté dentro de un atributo", () => {
    // el caso real: la <Ficha> soltaba "vamp" y el cuerpo no lo explicaba
    expect(mencionado('<Ficha enAplicacion="El vamp C-Am-F-G" />', vamp)).toBe(true);
  });

  it("respeta los acentos como bordes de palabra", () => {
    const sincopa = { termino: "síncopa" };
    expect(mencionado("la síncopa manda", sincopa)).toBe(true);
    expect(mencionado("sincopa sin tilde no cuenta", sincopa)).toBe(false);
  });
});

describe("presentado", () => {
  it("vale definirlo en negrita", () => {
    expect(presentado("Un **vamp** es una progresión que da vueltas", vamp)).toBe(true);
  });

  it("vale enlazar su ficha", () => {
    expect(presentado("los guide tones se explican en [[guide-tones]]", guide)).toBe(
      true,
    );
  });

  it("vale el enlace en cualquiera de sus tres formas", () => {
    expect(presentado('<WikiLink slug="guide-tones">guide tones</WikiLink>', guide)).toBe(
      true,
    );
    expect(presentado("mira los [guide tones](/wiki/guide-tones)", guide)).toBe(true);
  });

  it("no vale soltarlo y ya", () => {
    expect(presentado("hoy trabajamos el vamp de cuatro acordes", vamp)).toBe(false);
    expect(presentado("apunta a los guide tones", guide)).toBe(false);
  });
});

describe("primerasApariciones", () => {
  const dias = [
    { id: "w01/d1", cuerpo: "notas sueltas, nada más" },
    { id: "w03/d1", cuerpo: "hoy tocamos sobre un vamp" },
    { id: "w03/d2", cuerpo: "un **vamp** es una progresión corta" },
  ];

  it("marca el día en que se estrena, no uno posterior", () => {
    const [uso] = primerasApariciones(dias, [vamp]);
    expect(uso.dia).toBe("w03/d1");
    expect(uso.presentado).toBe(false);
  });

  it("no inventa términos que el curso no usa", () => {
    expect(primerasApariciones(dias, [guide])).toEqual([]);
  });

  it("la lista de jerga no repite términos", () => {
    const nombres = JERGA.map((t) => t.termino);
    expect(new Set(nombres).size).toBe(nombres.length);
  });
});

describe("terminosPorDia", () => {
  const dias = [
    { id: "d1", cuerpo: "un **vamp** y un **riff**" },
    { id: "d2", cuerpo: "más vamp, y ahora un **lick**" },
  ];
  const jerga = [
    { termino: "vamp" },
    { termino: "riff", alias: ["riffs"] },
    { termino: "lick", alias: ["licks"] },
  ];

  it("agrupa por el día que estrena cada palabra", () => {
    const mapa = terminosPorDia(dias, jerga);
    expect(mapa.get("d1")?.map((t) => t.termino)).toEqual(["vamp", "riff"]);
    expect(mapa.get("d2")?.map((t) => t.termino)).toEqual(["lick"]);
  });

  it("un día que no estrena nada no aparece", () => {
    expect(terminosPorDia([{ id: "d3", cuerpo: "nada nuevo" }], jerga).size).toBe(0);
  });
});
