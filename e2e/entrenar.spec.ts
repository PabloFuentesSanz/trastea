import { expect, test } from "@playwright/test";

test.describe("el centro de entrenamiento", () => {
  test("los filtros de la URL recortan el catálogo", async ({ page }) => {
    await page.goto("/entrenar?tema=escalas");
    await expect(
      page.getByRole("heading", { name: "Grados de la escala" }),
    ).toBeVisible();
    // los de oído son de otro tema: no deberían salir
    await expect(page.getByRole("heading", { name: "Acordes de oído" })).toHaveCount(0);
  });

  test("grados: ofrece solo los grados de esa escala y corrige", async ({ page }) => {
    await page.goto("/entrenar/grados-de-la-escala?nivel=1");
    const opciones = page.getByRole("group", { name: "Elige el grado" });
    // la pentatónica menor tiene cinco grados: ni doce botones ni tres
    await expect(opciones.getByRole("button")).toHaveCount(5);

    // la raíz se pinta de contexto: sin ella el grado no se puede contar
    expect(await page.locator("svg text", { hasText: /^R$/ }).count()).toBeGreaterThan(0);

    await opciones.getByRole("button").first().click();
    await expect(page.locator("p[aria-live='polite']")).not.toBeEmpty();
  });

  test("una lección lleva al entrenamiento de lo que toca ese día", async ({ page }) => {
    await page.goto("/curso/a-cimientos/a-cimientos-w01-d1");
    // el bloque de diapasón: se abre y aparece su versión interactiva
    for (let i = 0; i < 8; i += 1) {
      const boton = page.getByRole("button", { name: "Abrir bloque" }).first();
      if ((await boton.count()) === 0) break;
      await boton.click();
    }
    // el nivel sale de la semana, no está escrito en la lección: semana 1 → 1
    await expect(
      page.locator('a[href="/entrenar/notas-del-mastil?nivel=1"]'),
    ).toHaveCount(1);
  });

  test("subir de nivel cambia de verdad lo que se pregunta", async ({ page }) => {
    // El caso que se vio usándolo: de principiante a avanzado seguían saliendo
    // las mismas preguntas en la 6ª cuerda. La sesión cogía siempre las
    // primeras veinte cartas del mazo, y los mazos se generan cuerda a cuerda.
    const cuerdasEn = async (nivel: number, cargas: number) => {
      const vistas = new Set<number>();
      for (let i = 0; i < cargas; i += 1) {
        await page.goto(`/entrenar/reconocer-intervalos?nivel=${nivel}`);
        const alturas = await page
          .locator("svg > g > circle")
          .evaluateAll((els) => els.map((e) => e.getAttribute("cy")));
        for (const y of alturas) if (y) vistas.add(Number(y));
      }
      return vistas.size;
    };

    // el nivel 4 usa las seis cuerdas: en varias cargas tienen que aparecer
    expect(await cuerdasEn(4, 8)).toBeGreaterThanOrEqual(4);
  });

  test("un entrenamiento de oído dura una sesión entera", async ({ page }) => {
    // "Acordes de oído" nivel 1 son dos tarjetas y se acababa en dos preguntas
    await page.goto("/entrenar/acordes-de-oido?nivel=1");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-label", /de 20$/);
  });

  test("cajas: se responde tocando el hueco en el mástil", async ({ page }) => {
    await page.goto("/entrenar/cajas-de-escala?nivel=1");
    // un hueco, y solo uno, dibujado a rayas
    await expect(page.locator("svg circle[stroke-dasharray]")).toHaveCount(1);
    // el resto de la caja está a la vista como contexto
    expect(await page.locator("svg circle[fill='var(--muted)']").count()).toBeGreaterThan(
      5,
    );

    await page
      .getByRole("button", { name: /^Cuerda \d, traste \d+$/ })
      .first()
      .click();
    await expect(page.locator("p[aria-live='polite']")).toContainText(/Esa es|Era/);
  });
});
