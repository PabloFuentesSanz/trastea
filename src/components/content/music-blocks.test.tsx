import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Mastil, num, nums } from "./music-blocks";

function board(container: HTMLElement) {
  const svg = container.querySelector("svg");
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
    const { container } = render(<Ficha formula="1-3-5" grado7="la sensible" />);
    const dts = [...container.querySelectorAll("dt")].map((d) => d.textContent);
    expect(dts).toEqual(["Fórmula", "Grado 7"]);
  });

  it("ignora las props sin valor", async () => {
    const { Ficha } = await import("./music-blocks");
    const { container } = render(<Ficha formula="1-3-5" notas={undefined} />);
    expect(container.querySelectorAll("dt")).toHaveLength(1);
  });
});
