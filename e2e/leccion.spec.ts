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

  test("los bloques se despliegan y traen el ejercicio dentro", async ({ page }) => {
    await page.goto(LECCION);

    const bloque = page.getByRole("button", { name: /abrir bloque/i }).first();
    await expect(bloque).toBeVisible();
    const dibujosAntes = await page.locator('svg[role="img"]').count();
    await bloque.click();

    // al abrirse aparece el contenido del ejercicio, que siempre dibuja algo
    await expect
      .poll(async () => page.locator('svg[role="img"]').count(), { timeout: 7000 })
      .toBeGreaterThan(dibujosAntes);
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
