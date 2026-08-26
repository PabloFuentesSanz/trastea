import { describe, expect, it } from "vitest";
import { resolveInterlinksWith, stripLeadingArticle } from "./interlinks";

const TITLES: Record<string, string> = {
  pentatonicas: "Las pentatónicas",
  caged: "El sistema CAGED",
  "ii-v-i": "La progresión ii-V-I",
  "guide-tones": "Guide tones",
};

const resolve = (body: string) =>
  resolveInterlinksWith(body, (slug) => TITLES[slug] ?? null);

describe("stripLeadingArticle", () => {
  it("quita el artículo inicial", () => {
    expect(stripLeadingArticle("Las pentatónicas")).toBe("pentatónicas");
    expect(stripLeadingArticle("El sistema CAGED")).toBe("sistema CAGED");
  });

  it("deja intactos los títulos sin artículo", () => {
    expect(stripLeadingArticle("Guide tones")).toBe("Guide tones");
    expect(stripLeadingArticle("Lavado de cara")).toBe("Lavado de cara");
  });
});

describe("resolveInterlinksWith", () => {
  it("enlaza con el título del artículo", () => {
    expect(resolve("Estudia [[guide-tones]] hoy.")).toBe(
      "Estudia [Guide tones](/wiki/guide-tones) hoy.",
    );
  });

  it("elide el artículo si ya hay un determinante delante", () => {
    expect(resolve("las cajas de la [[pentatonicas]] menor")).toBe(
      "las cajas de la [pentatónicas](/wiki/pentatonicas) menor",
    );
    expect(resolve("aplica el [[caged]] aquí")).toBe(
      "aplica el [sistema CAGED](/wiki/caged) aquí",
    );
    expect(resolve("un [[ii-v-i]] en Do")).toBe(
      "un [progresión ii-V-I](/wiki/ii-v-i) en Do",
    );
  });

  it("no elide a principio de frase ni tras palabra normal", () => {
    expect(resolve("[[pentatonicas]] son cinco notas")).toBe(
      "[Las pentatónicas](/wiki/pentatonicas) son cinco notas",
    );
    expect(resolve("Repasa [[caged]] mañana")).toBe(
      "Repasa [El sistema CAGED](/wiki/caged) mañana",
    );
  });

  it("elide también cruzando salto de línea", () => {
    expect(resolve("toca la\n[[pentatonicas]] menor")).toBe(
      "toca la\n[pentatónicas](/wiki/pentatonicas) menor",
    );
  });

  it("respeta el alias explícito", () => {
    expect(resolve("mira [[pentatonicas|estas cinco notas]]")).toBe(
      "mira [estas cinco notas](/wiki/pentatonicas)",
    );
  });

  it("cae al slug si el artículo no existe", () => {
    expect(resolve("ver [[inexistente]]")).toBe("ver [inexistente](/wiki/inexistente)");
  });

  it("resuelve varios enlaces en el mismo texto", () => {
    expect(resolve("de la [[pentatonicas]] al [[caged]]")).toBe(
      "de la [pentatónicas](/wiki/pentatonicas) al [sistema CAGED](/wiki/caged)",
    );
  });
});
