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
