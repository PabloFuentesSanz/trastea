import { expect, test, type Page } from "@playwright/test";

const RUTAS = [
  "/",
  "/curso/a-cimientos/a-cimientos-w04-d2",
  "/bases",
  "/canciones",
  "/wiki/pentatonica-menor",
  "/escalas",
  "/metronomo",
  "/entrenar",
  "/entrenar/reconocer-intervalos?nivel=3",
  "/entrenar/intervalos-de-oido",
  "/afinador",
  "/entrenar/grados-de-la-escala",
  "/entrenar/cajas-de-escala?nivel=2",
  "/ejercicios/cromatico-1234",
];

/**
 * Contraste de todo el texto visible contra su fondo real.
 *
 * El color se mide pintándolo en un canvas y leyendo el píxel: la paleta usa
 * oklch y cualquier parseo del string devuelve otra cosa (lo intenté dos
 * veces y las dos daban ratios imposibles de 1.2).
 */
async function textoConPocoContraste(page: Page) {
  return page.evaluate(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    const cache = new Map<string, number[]>();
    const aRgb = (css: string) => {
      const previo = cache.get(css);
      if (previo) return previo;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      const v = [d[0], d[1], d[2], d[3] / 255];
      cache.set(css, v);
      return v;
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: number[], b: number[]) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const fondoDe = (el: Element) => {
      let n: Element | null = el;
      while (n) {
        const c = aRgb(getComputedStyle(n).backgroundColor);
        if (c[3] > 0.5) return c;
        n = n.parentElement;
      }
      return [0, 0, 0, 1];
    };

    const malos: string[] = [];
    const selector = "p,span,a,button,h1,h2,h3,li,dt,dd,label,small,div,figcaption";
    for (const el of document.querySelectorAll(selector)) {
      const texto = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent?.trim() ?? "")
        .join("");
      if (texto.length < 2) continue;
      const caja = el.getBoundingClientRect();
      if (caja.width === 0 || caja.height === 0) continue;
      const st = getComputedStyle(el);
      if (st.visibility === "hidden" || Number(st.opacity) < 0.5) continue;

      const tam = parseFloat(st.fontSize);
      const grande = tam >= 24 || (tam >= 18.66 && Number(st.fontWeight) >= 700);
      const minimo = grande ? 3 : 4.5;
      const c = ratio(aRgb(st.color), fondoDe(el));
      if (c < minimo) {
        malos.push(`${c.toFixed(2)} < ${minimo} · ${tam}px · "${texto.slice(0, 45)}"`);
      }
    }
    return malos;
  });
}

test.describe("accesibilidad", () => {
  for (const ruta of RUTAS) {
    test(`${ruta} cumple el contraste de WCAG AA`, async ({ page }) => {
      await page.goto(ruta);
      expect(await textoConPocoContraste(page)).toEqual([]);
    });
  }

  /**
   * Se lee del árbol de accesibilidad, no de los atributos: un `<label for>`
   * también nombra un control, y comprobarlo a mano da falsos positivos
   * (el interruptor de bucle de /bases se llama "Repetir en bucle" así).
   */
  test("todo lo interactivo tiene nombre accesible", async ({ page }) => {
    const CONTROLES = /^(button|link|switch|checkbox|slider|combobox|textbox|tab)$/;
    for (const ruta of RUTAS) {
      await page.goto(ruta);
      const arbol = await page.locator("body").ariaSnapshot();
      // en el snapshot un control con nombre sale como `- button "Tocar"`;
      // sin nombre sale pelado
      const sinNombre = arbol
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => {
          const m = /^- ([a-z]+)(.*)$/.exec(l);
          return m !== null && CONTROLES.test(m[1]) && !m[2].includes('"');
        });
      expect(sinNombre, `en ${ruta}`).toEqual([]);
    }
  });

  test("el movimiento se apaga con prefers-reduced-motion", async ({ browser }) => {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    await page.goto("/curso/a-cimientos/a-cimientos-w04-d2");
    const conMovimiento = await page.evaluate(
      () =>
        [...document.querySelectorAll("*")].filter((el) => {
          const st = getComputedStyle(el);
          const dur = (s: string) =>
            Math.max(...s.split(",").map((v) => parseFloat(v) || 0));
          return dur(st.animationDuration) > 0.05 || dur(st.transitionDuration) > 0.05;
        }).length,
    );
    expect(conMovimiento).toBe(0);
    await page.close();
  });
});
