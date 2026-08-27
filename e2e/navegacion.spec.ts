import { expect, test } from "@playwright/test";

/** Las páginas que tienen que responder siempre, con lo que las identifica. */
const PAGINAS: [string, RegExp][] = [
  ["/", /Trastea|Hoy|Curso/i],
  ["/hoy", /hoy/i],
  ["/curso", /curso|módulo/i],
  ["/metronomo", /metrónomo/i],
  ["/escalas", /escalas/i],
  ["/acordes", /acordes/i],
  ["/bases", /bases/i],
  ["/canciones", /canciones/i],
  ["/wiki", /wiki/i],
  ["/entrenar", /entrenar|mástil/i],
];

test.describe("las páginas cargan", () => {
  for (const [ruta, esperado] of PAGINAS) {
    test(`${ruta} responde y se identifica`, async ({ page }) => {
      const errores: string[] = [];
      page.on("pageerror", (e) => errores.push(String(e)));

      const respuesta = await page.goto(ruta);
      expect(respuesta?.status(), `${ruta} devolvió ${respuesta?.status()}`).toBeLessThan(
        400,
      );
      await expect(page.locator("body")).toContainText(esperado);
      expect(errores, `${ruta} lanzó errores de JS`).toEqual([]);
    });
  }
});

test("la navegación principal lleva a las herramientas", async ({ page }) => {
  await page.goto("/");
  // en móvil la barra inferior no lleva todos los enlaces; se comprueba el que sí
  const metronomo = page.getByRole("link", { name: /metrónomo/i }).first();
  await metronomo.click();
  await expect(page).toHaveURL(/\/metronomo/);
});

/**
 * Las de dentro: una de cada tipo. El desbordamiento no aparece en los
 * índices, aparece donde entra el contenido — un foco de semana de 122
 * caracteres empujaba /curso/a-cimientos 247 px fuera del móvil y las
 * páginas de arriba no lo veían.
 */
const PAGINAS_DE_CONTENIDO = [
  "/curso/a-cimientos",
  "/curso/b-armonia",
  "/curso/c-lenguaje",
  "/curso/a-cimientos/a-cimientos-w01-d1",
  "/wiki/pentatonica-mayor",
  "/ejercicios/cantar-resolucion-7-3",
  "/canciones/spain",
];

test("no hay scroll horizontal en ninguna página principal", async ({ page }) => {
  for (const [ruta] of PAGINAS) {
    await page.goto(ruta);
    const desborda = await page.evaluate(
      () =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    expect(desborda, `${ruta} se desborda a lo ancho`).toBe(false);
  }
});

test("no hay scroll horizontal donde entra el contenido", async ({ page }) => {
  for (const ruta of PAGINAS_DE_CONTENIDO) {
    await page.goto(ruta);
    const desborda = await page.evaluate(
      () =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    expect(desborda, `${ruta} se desborda a lo ancho`).toBe(false);
  }
});

test("ningún título se corta a media palabra en el móvil", async ({ page }) => {
  // `truncate` recorta con puntos suspensivos: en un título de lección no es
  // elegancia, es información perdida. Donde el texto pueda ser largo va
  // `line-clamp`, que deja leer dos líneas.
  for (const ruta of ["/curso/c-lenguaje", ...PAGINAS_DE_CONTENIDO]) {
    await page.goto(ruta);
    const cortados = await page.evaluate(() =>
      [...document.querySelectorAll(".truncate")]
        .filter((e) => e.scrollWidth > e.clientWidth + 1)
        .map((e) => e.textContent?.trim() ?? ""),
    );
    expect(cortados, `${ruta} corta texto`).toEqual([]);
  }
});
