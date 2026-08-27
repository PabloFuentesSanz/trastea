import type { Page } from "@playwright/test";

/**
 * Cuenta las fuentes de audio que crea la página. Es la forma de comprobar
 * que algo suena de verdad sin poder escucharlo: si el motor agenda notas,
 * crea osciladores (los clicks) o buffers (las cuerdas).
 */
export async function contarAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __osc: number; __buf: number };
    w.__osc = 0;
    w.__buf = 0;
    const proto = window.AudioContext.prototype;
    const osc = proto.createOscillator;
    const buf = proto.createBufferSource;
    proto.createOscillator = function (this: AudioContext) {
      w.__osc++;
      return osc.call(this);
    };
    proto.createBufferSource = function (this: AudioContext) {
      w.__buf++;
      return buf.call(this);
    };
  });
}

export async function sonidosEmitidos(page: Page): Promise<number> {
  return page.evaluate(() => {
    const w = window as unknown as { __osc: number; __buf: number };
    return w.__osc + w.__buf;
  });
}

/** ¿Está la app en modo demo, sin Supabase configurado? */
export async function enModoDemo(page: Page): Promise<boolean> {
  return (await page.getByText(/Modo demo/i).count()) > 0;
}
