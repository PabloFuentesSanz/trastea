import { expect, test } from "@playwright/test";

const LECCION = "/curso/a-cimientos/a-cimientos-w04-d2";

test.describe("una lección del curso", () => {
  test("abre con su objetivo, su ficha y lo que dibuja", async ({ page }) => {
    await page.goto(LECCION);

    await expect(page.getByText(/Objetivo de hoy/i)).toBeVisible();
    // la ficha del día: al menos una fila de datos
    await expect(page.locator("dl dt").first()).toBeVisible();
    // y algo dibujado (mástil, tab o diagrama de acorde)
    expect(await page.locator('svg[role="img"]').count()).toBeGreaterThan(0);
  });

  test("un bloque abierto dice qué haces y para qué, y la ficha entera va plegada", async ({
    page,
  }) => {
    await page.goto(LECCION);

    const bloque = page.getByRole("button", { name: /abrir bloque/i }).first();
    await expect(bloque).toBeVisible();
    await bloque.click();

    // lo que se ve sin tocar nada: las dos líneas del profesor
    await expect(page.getByText("Qué haces", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Para qué", { exact: true }).first()).toBeVisible();

    // la ficha entera (tab, mástil, rutina) solo si la pides
    const dibujosAntes = await page.locator('svg[role="img"]:visible').count();
    await page
      .getByRole("button", { name: /ver el ejercicio entero/i })
      .first()
      .click();
    await expect
      .poll(async () => page.locator('svg[role="img"]:visible').count(), {
        timeout: 7000,
      })
      .toBeGreaterThan(dibujosAntes);
  });

  test("la cabecera dice para qué sirve el día", async ({ page }) => {
    await page.goto(LECCION);
    await expect(page.getByText(/Para qué:/)).toBeVisible();
  });

  test("los enlaces a la wiki del día funcionan", async ({ page }) => {
    await page.goto(LECCION);
    const wiki = page.locator('a[href^="/wiki/"]').first();
    if ((await wiki.count()) === 0) test.skip();
    await wiki.click();
    await expect(page).toHaveURL(/\/wiki\//);
    await expect(page.locator("h1")).toBeVisible();
  });
});
