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
