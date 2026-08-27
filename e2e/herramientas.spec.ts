import { expect, test } from "@playwright/test";

test.describe("las herramientas guardan su estado en la URL", () => {
  test("/escalas cambia de vista y lo refleja la URL", async ({ page }) => {
    await page.goto("/escalas?root=A&type=minor-pentatonic&view=cajas");
    // en modo cajas se dibuja más de un mástil
    expect(await page.locator('svg[role="img"]').count()).toBeGreaterThan(1);

    await page.goto("/escalas?root=A&type=minor-pentatonic&view=mastil");
    expect(await page.locator('svg[role="img"]').count()).toBeGreaterThan(0);
  });

  test("/acordes responde a la raíz y al tipo del enlace", async ({ page }) => {
    await page.goto("/acordes?root=F&type=maj7");
    await expect(page.locator("body")).toContainText(/Fa|F/);
    expect(await page.locator('svg[role="img"]').count()).toBeGreaterThan(0);
  });

  test("/bases transporta la forma al tono del enlace", async ({ page }) => {
    await page.goto("/bases?prog=ii-v-i&tono=F");
    // el ii-V-I en Fa es Gm7 - C7 - Fmaj7
    const rejilla = page.locator("ol").first();
    await expect(rejilla).toContainText("Gm7");
    await expect(rejilla).toContainText("C7");
    await expect(rejilla).toContainText("Fmaj7");
  });

  test("/bases deletrea con bemoles donde toca", async ({ page }) => {
    await page.goto("/bases?prog=ii-v-i&tono=Eb");
    // el ii de Mib es Fm7, y el I es Ebmaj7: nada de Re#
    const rejilla = page.locator("ol").first();
    await expect(rejilla).toContainText("Ebmaj7");
    await expect(rejilla).not.toContainText("D#");
  });
});

test.describe("/canciones", () => {
  test("filtra y llega a una ficha", async ({ page }) => {
    await page.goto("/canciones");
    const primera = page.locator('a[href^="/canciones/"]').first();
    await expect(primera).toBeVisible();
    await primera.click();
    await expect(page).toHaveURL(/\/canciones\/[a-z0-9-]+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("los filtros caben en pantalla sin ser una pared de chips", async ({ page }) => {
    await page.goto("/canciones");
    // el rediseño dejó los filtros en paneles: no debe haber cientos de botones sueltos
    const botones = await page.getByRole("button").count();
    expect(botones, "demasiados controles a la vista").toBeLessThan(60);
  });
});

test("/bases puede ir cambiando de tono en cada vuelta", async ({ page }) => {
  await page.goto("/bases?prog=ii-v-i&tono=C&bpm=200");
  const rejilla = page.locator("ol").first();
  await expect(rejilla).toContainText("Cmaj7");

  await page.getByLabel(/cambiar de tono/i).click();
  await page.getByRole("option", { name: /por cuartas/i }).click();
  await page.getByRole("button", { name: /tocar la base/i }).click();

  // a 200 bpm la vuelta de cuatro compases dura ~5 s: el tono siguiente es Fa
  await expect(rejilla).toContainText("Fmaj7", { timeout: 20_000 });
});
