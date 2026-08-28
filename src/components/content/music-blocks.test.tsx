import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Mastil, num, nums, Rejilla, Tab } from "./music-blocks";

function board(container: HTMLElement) {
  // el primer <svg> puede ser el icono del botón de escuchar; el mástil es
  // el que se anuncia con su nombre
  const svg = container.querySelector("svg[aria-label]");
  if (!svg) throw new Error("no se dibujó el mástil");
  return {
    viewBox: svg.getAttribute("viewBox") ?? "",
    notas: svg.querySelectorAll("title").length,
    label: svg.getAttribute("aria-label") ?? "",
  };
}

describe("<Mastil />", () => {
  it("sin ventana dibuja el mástil entero", () => {
    const { container } = render(<Mastil escala="A minor-pentatonic" />);
    expect(board(container).notas).toBe(42);
  });

  it("recorta a la caja pedida", () => {
    const { container } = render(
      <Mastil escala="A minor-pentatonic" desde={5} hasta={8} />,
    );
    expect(board(container).notas).toBe(12);
  });

  it("la caja estrecha ocupa menos que el mástil entero", () => {
    const { container: caja } = render(
      <Mastil escala="A minor-pentatonic" desde={5} hasta={8} />,
    );
    const { container: todo } = render(<Mastil escala="A minor-pentatonic" />);
    const ancho = (c: HTMLElement) => Number(board(c).viewBox.split(" ")[2]);
    expect(ancho(caja)).toBeLessThan(ancho(todo));
  });

  it("filtra por cuerdas", () => {
    const { container } = render(
      <Mastil escala="A minor-pentatonic" desde={5} hasta={8} cuerdas={[1, 2]} />,
    );
    expect(board(container).notas).toBe(4);
  });

  it("dibuja acordes por cifrado", () => {
    const { container } = render(<Mastil acorde="Am7" desde={5} hasta={8} />);
    expect(board(container).label).toContain("La");
  });

  it("el pie entra en el aria-label", () => {
    const { container } = render(
      <Mastil escala="A minor-pentatonic" desde={5} hasta={8} pie="Caja 1" />,
    );
    expect(board(container).label).toContain("Caja 1");
  });
});

describe("coerción de props de MDX", () => {
  // en este pipeline las expresiones no se evalúan: el contenido escribe cadenas
  it("num acepta cadenas y números", () => {
    expect(num("5")).toBe(5);
    expect(num(5)).toBe(5);
    expect(num(" 12 ")).toBe(12);
  });

  it("num devuelve undefined si no hay número", () => {
    expect(num(undefined)).toBeUndefined();
    expect(num("")).toBeUndefined();
    expect(num("hola")).toBeUndefined();
  });

  it("nums parte listas escritas a mano", () => {
    expect(nums("6, 5, 4")).toEqual([6, 5, 4]);
    expect(nums("1 2")).toEqual([1, 2]);
    expect(nums([3, 2])).toEqual([3, 2]);
    expect(nums("x")).toBeUndefined();
  });

  it("la caja sale igual escrita como cadena que como número", () => {
    const conCadena = render(<Mastil escala="A minor-pentatonic" desde="5" hasta="8" />);
    const conNumero = render(<Mastil escala="A minor-pentatonic" desde={5} hasta={8} />);
    expect(board(conCadena.container)).toEqual(board(conNumero.container));
  });

  it("cuerdas como cadena filtra igual", () => {
    const { container } = render(
      <Mastil escala="A minor-pentatonic" desde="5" hasta="8" cuerdas="1, 2" />,
    );
    expect(board(container).notas).toBe(4);
  });
});

describe("<Ficha />", () => {
  it("etiqueta las claves conocidas y humaniza las libres", async () => {
    const { Ficha } = await import("./music-blocks");
    const { container } = render(
      <Ficha formula="1-3-5" grado7="la sensible" esLaEscalaDe="el dominante" />,
    );
    const dts = [...container.querySelectorAll("dt")].map((d) => d.textContent);
    expect(dts).toEqual(["Fórmula", "Grado 7", "Es la escala de"]);
  });

  it("ignora las props sin valor", async () => {
    const { Ficha } = await import("./music-blocks");
    const { container } = render(<Ficha formula="1-3-5" notas={undefined} />);
    expect(container.querySelectorAll("dt")).toHaveLength(1);
  });
});

describe("<Acorde />", () => {
  async function diagrama(node: React.ReactElement) {
    const { container } = render(node);
    const svg = container.querySelector("svg");
    return {
      label: svg?.getAttribute("aria-label") ?? "",
      puntos: container.querySelectorAll("circle, rect").length,
    };
  }

  it("dibuja una forma del acorde pedido", async () => {
    const { Acorde } = await import("./music-blocks");
    expect((await diagrama(<Acorde nombre="C" />)).label).toContain("Do");
  });

  it("restringido a un grupo de cuerdas, las otras tres quedan muteadas", async () => {
    const { Acorde } = await import("./music-blocks");
    const { container } = render(<Acorde nombre="C" cuerdas="3, 2, 1" />);
    const mudas = [...container.querySelectorAll("svg text")].filter(
      (t) => t.textContent === "✕",
    );
    expect(mudas).toHaveLength(3);
  });

  it("sin restringir usa formas de más cuerdas", async () => {
    const { Acorde } = await import("./music-blocks");
    const { container } = render(<Acorde nombre="C" />);
    const mudas = [...container.querySelectorAll("svg text")].filter(
      (t) => t.textContent === "✕",
    );
    expect(mudas.length).toBeLessThan(3);
  });

  it("acepta pedir una inversión concreta", async () => {
    const { Acorde } = await import("./music-blocks");
    expect(
      (await diagrama(<Acorde nombre="C" cuerdas="3, 2, 1" inversion="1" />)).label,
    ).toContain("Do");
  });

  it("un acorde inexistente revienta en vez de dibujar otro", async () => {
    const { Acorde } = await import("./music-blocks");
    expect(() => render(<Acorde nombre="Cxyz" />)).toThrow();
  });
});

describe("<Acorde trastes> con digitación exacta", () => {
  it("dibuja la forma escrita, saltando cuerdas si hace falta", async () => {
    const { Acorde } = await import("./music-blocks");
    // shell de G7: 6ª-4ª-3ª, la 5ª muteada en medio
    const { container } = render(<Acorde nombre="G7" trastes="3,x,3,4,x,x" />);
    const mudas = [...container.querySelectorAll("svg text")].filter(
      (t) => t.textContent === "✕",
    );
    expect(mudas).toHaveLength(3);
  });

  it("una digitación mal escrita revienta en vez de dibujar de más", async () => {
    const { Acorde } = await import("./music-blocks");
    expect(() => render(<Acorde nombre="G7" trastes="3,x,3" />)).toThrow(/6 valores/);
  });
});

describe("<Mastil notas> con notas sueltas", () => {
  it("dibuja solo las notas pedidas", () => {
    const { container } = render(<Mastil notas="5:3, 4:2" />);
    expect(board(container).notas).toBe(2);
  });

  it("nombra el intervalo desde la primera nota", () => {
    const { container } = render(<Mastil notas="5:3, 4:2" />);
    const etiquetas = [...container.querySelectorAll("svg text")]
      .filter((t) => t.getAttribute("font-weight") === "700")
      .map((t) => t.textContent);
    expect(etiquetas).toEqual(["1", "3"]);
  });

  it("mide desde la raíz explícita si se da", () => {
    const { container } = render(<Mastil notas="5:3, 4:2" raiz="A" />);
    const etiquetas = [...container.querySelectorAll("svg text")]
      .filter((t) => t.getAttribute("font-weight") === "700")
      .map((t) => t.textContent);
    expect(etiquetas).toEqual(["b3", "5"]);
  });

  it("una nota mal escrita revienta en vez de dibujar de menos", () => {
    expect(() => render(<Mastil notas="6-5" />)).toThrow(/cuerda:traste/);
  });

  it("sin escala, acorde ni notas es un error de autoría", () => {
    expect(() => render(<Mastil />)).toThrow(/necesita/);
  });
});

describe("<Mastil caja> y <Cajas>", () => {
  it("la caja 2 incluye el traste 7, que la ventana rectangular se comía", async () => {
    const { Mastil } = await import("./music-blocks");
    const { container } = render(<Mastil escala="A minor-pentatonic" caja="2" />);
    const titulos = [...container.querySelectorAll("title")].map((t) => t.textContent);
    expect(titulos.some((t) => t?.includes("traste 7"))).toBe(true);
  });

  it("una caja tiene doce notas, no las que quepan en un rectángulo", async () => {
    const { Mastil } = await import("./music-blocks");
    const { container } = render(<Mastil escala="A minor-pentatonic" caja="3" />);
    expect(board(container).notas).toBe(12);
  });

  it("<Cajas> dibuja las cinco de una pentatónica", async () => {
    const { Cajas } = await import("./music-blocks");
    const { container } = render(<Cajas escala="A minor-pentatonic" />);
    expect(container.querySelectorAll("svg[aria-label]")).toHaveLength(5);
  });

  it("<Cajas> dibuja las siete de una escala de siete notas", async () => {
    const { Cajas } = await import("./music-blocks");
    const { container } = render(<Cajas escala="G major" />);
    expect(container.querySelectorAll("svg[aria-label]")).toHaveLength(7);
  });

  it("<PorCuerdas> dibuja una por cuerda", async () => {
    const { PorCuerdas } = await import("./music-blocks");
    const { container } = render(<PorCuerdas escala="A minor-pentatonic" />);
    expect(container.querySelectorAll("svg[aria-label]")).toHaveLength(6);
  });

  it("una caja inexistente revienta en vez de dibujar otra", async () => {
    const { Mastil } = await import("./music-blocks");
    expect(() => render(<Mastil escala="A minor-pentatonic" caja="9" />)).toThrow(
      /caja/i,
    );
  });
});

describe("<Tab />", () => {
  it("dibuja un número de traste por nota", () => {
    const { container } = render(<Tab notas="6:5 6:7 5:5" />);
    const numeros = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(numeros).toContain("5");
    expect(numeros).toContain("7");
  });

  it("numera los compases cuando hay más de uno", () => {
    const { container } = render(<Tab notas="6:5 | 6:7" />);
    const textos = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(textos).toContain("1");
    expect(textos).toContain("2");
  });

  it("marca un tramo seguido de palm mute con una sola etiqueta", () => {
    const { container } = render(<Tab notas="6:0. 6:0. 6:0." />);
    const textos = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(textos.filter((t) => t === "P.M.")).toHaveLength(1);
  });

  it("etiqueta cada tramo de palm mute por separado", () => {
    const { container } = render(<Tab notas="6:0. 6:0. 6:3 6:0. 6:0." />);
    const textos = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(textos.filter((t) => t === "P.M.")).toHaveLength(2);
  });

  it("pone la figuración cuando se le da", () => {
    const { container } = render(<Tab notas="6:5 6:7" figuras="corcheas" />);
    expect(container.textContent).toContain("corcheas");
  });

  it("usa el pie como descripción accesible si no hay título", () => {
    const { container } = render(<Tab notas="6:5" pie="Cromático" />);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Cromático");
  });

  it("revienta con una tab que no se entiende, no la dibuja a medias", () => {
    expect(() => render(<Tab notas="6-5" />)).toThrow(/6-5/);
  });
});

describe("<Mastil caja desdeTraste>", () => {
  it("dibuja la misma caja en la octava que se le pida", () => {
    const alto = render(<Mastil escala="C major" caja="5" notasPorCuerda="3" />);
    const bajo = render(
      <Mastil escala="C major" caja="5" notasPorCuerda="3" desdeTraste="0" />,
    );
    // misma forma: mismo número de notas y mismo ancho de ventana
    expect(board(bajo.container).notas).toBe(board(alto.container).notas);
    expect(board(bajo.container).viewBox).toBe(board(alto.container).viewBox);
    // otra octava: la caja alta empieza en el 15, la baja en el 3
    expect(alto.container.textContent).toContain("15");
    expect(bajo.container.textContent).not.toContain("15");
  });
});

describe("<Mastil cuerdas>", () => {
  it("acepta una lista de cuerdas y dibuja solo esas", () => {
    const una = render(<Mastil escala="C major" cuerdas="6" />);
    const dos = render(<Mastil escala="C major" cuerdas="6, 5" />);
    const todas = render(<Mastil escala="C major" />);

    expect(board(dos.container).notas).toBe(board(una.container).notas * 2);
    expect(board(dos.container).notas).toBeLessThan(board(todas.container).notas);
  });
});

describe("qué hacer con lo que suena", () => {
  it("la rejilla enseña la instrucción como instrucción, no como pie", () => {
    const { container } = render(
      <Rejilla
        compases="C | Am | F | G"
        pie="Cuatro acordes en bucle"
        queHacer="Una nota por compás: la 3ª del acorde que entra."
      />,
    );
    const instruccion = container.querySelector("[data-que-hacer]");
    expect(instruccion?.textContent).toContain("Qué haces");
    expect(instruccion?.textContent).toContain("la 3ª del acorde que entra");
    // el pie sigue siendo el pie
    expect(container.querySelector("figcaption")?.textContent).toBe(
      "Cuatro acordes en bucle",
    );
  });

  it("sin instrucción no dibuja la tira vacía", () => {
    const { container } = render(<Rejilla compases="C | Am" />);
    expect(container.querySelector("[data-que-hacer]")).toBeNull();
  });

  it("la tab también la lleva", () => {
    const { container } = render(
      <Tab notas="6:3 6:5 6:7 -" queHacer="A 60 bpm, mirando la mano izquierda." />,
    );
    expect(container.querySelector("[data-que-hacer]")?.textContent).toContain(
      "A 60 bpm",
    );
  });

  it("y el mástil, cuando hace falta decir qué hacer con el dibujo", () => {
    const { container } = render(
      <Mastil escala="C major" cuerdas="6" queHacer="Di la nota antes de pisarla." />,
    );
    expect(container.querySelector("[data-que-hacer]")?.textContent).toContain(
      "Di la nota",
    );
  });
});
