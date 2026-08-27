import { expect, test, devices } from "@playwright/test";

const LECCION = "/curso/a-cimientos/a-cimientos-w04-d2";
const tarjeta = (page: import("@playwright/test").Page) => page.getByRole("dialog");

test.describe("la tarjeta de acorde", () => {
  test("hay cifrados marcados en la prosa y en la rejilla", async ({ page }) => {
    await page.goto(LECCION);
    const chips = page.getByRole("button", { name: /ver cómo se toca/i });
    expect(await chips.count()).toBeGreaterThan(3);
  });

  test("con el ratón: abre al pasar por encima y cierra al salir", async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(testInfo.project.name === "movil", "en táctil no hay hover");
    await page.goto(LECCION);
    const chip = page.getByRole("button", { name: /ver cómo se toca/i }).first();

    await chip.hover();
    await expect(tarjeta(page)).toBeVisible();
    // enseña el diagrama y las notas, no solo el nombre
    expect(await tarjeta(page).locator("svg").count()).toBeGreaterThan(0);

    await page.mouse.move(0, 0);
    await expect(tarjeta(page)).toBeHidden();
    expect(browserName).toBeTruthy();
  });

  test("con el teclado: Enter abre, Escape cierra y el foco vuelve", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "movil", "sin teclado físico");
    await page.goto(LECCION);
    const chip = page.getByRole("button", { name: /ver cómo se toca/i }).first();

    await chip.focus();
    await expect(tarjeta(page)).toBeHidden();

    await page.keyboard.press("Enter");
    await expect(tarjeta(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(tarjeta(page)).toBeHidden();
    await expect(chip).toBeFocused();
  });

  test("con el dedo: abre al tocar y cierra tocando fuera", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "movil", "solo en el proyecto táctil");
    await page.goto(LECCION);
    const chip = page.getByRole("button", { name: /ver cómo se toca/i }).first();

    await chip.tap();
    await expect(tarjeta(page)).toBeVisible();

    await page.touchscreen.tap(10, 10);
    await expect(tarjeta(page)).toBeHidden();
  });
});

test("desde la tarjeta se llega a /acordes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "movil", "el hover es más estable en escritorio");
  await page.goto(LECCION);
  await page
    .getByRole("button", { name: /ver cómo se toca/i })
    .first()
    .hover();
  await tarjeta(page)
    .getByRole("link", { name: /más formas/i })
    .click();
  await expect(page).toHaveURL(/\/acordes\?/);
});

// devices se importa para dejar claro de dónde salen los proyectos del config
void devices;
