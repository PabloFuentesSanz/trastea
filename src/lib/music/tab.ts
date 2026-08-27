/**
 * Tablatura en una línea de texto, pensada para escribirla dentro de un MDX
 * sin pelearse con el editor. Cada token es una columna:
 *
 *   6:5      6ª cuerda, traste 5
 *   6:3+5:2  varias cuerdas a la vez (un acorde)
 *   6:x      nota muerta
 *   -        silencio
 *   6:5>     acento
 *   6:0.     palm mute
 *   3:7b     bend
 *   h p s    enlace con la columna siguiente (ligado, tirón, slide)
 *   |        barra de compás
 *
 * El parser es puro y estricto: cualquier cosa que no entienda revienta con
 * un mensaje que dice qué token es, para que `content:audit` lo cace en el
 * build en vez de dibujar una tab silenciosamente mal.
 */

export type TabFret = number | "x";
export type TabLink = "h" | "p" | "s";

export interface TabEvent {
  string: number;
  fret: TabFret;
}

export interface TabColumn {
  events: TabEvent[];
  rest: boolean;
  accent: boolean;
  palmMute: boolean;
  bend: boolean;
  /** técnica que une esta columna con la siguiente */
  link?: TabLink;
}

export interface TabBar {
  /** número de compás, empezando en 1 */
  number: number;
  columns: TabColumn[];
}

export const MAX_FRET = 24;
export const STRINGS = 6;

const LINKS: Record<string, TabLink> = { h: "h", p: "p", s: "s" };
const NOTE = /^(\d):(x|\d{1,2})$/;

function parseEvent(token: string, raw: string): TabEvent {
  const match = NOTE.exec(token);
  if (!match) {
    throw new Error(`no entiendo "${raw}" en la tab`);
  }
  const string = Number(match[1]);
  if (string < 1 || string > STRINGS) {
    throw new Error(`cuerda ${string} en "${raw}": solo hay 1-${STRINGS}`);
  }
  if (match[2] === "x") return { string, fret: "x" };
  const fret = Number(match[2]);
  if (fret > MAX_FRET) {
    throw new Error(`traste ${fret} en "${raw}": el mástil llega al ${MAX_FRET}`);
  }
  return { string, fret };
}

function parseColumn(raw: string): TabColumn {
  let body = raw;
  let accent = false;
  let palmMute = false;
  let bend = false;

  // los modificadores van pegados al final y pueden combinarse
  for (let changed = true; changed;) {
    changed = false;
    if (body.endsWith(">")) {
      accent = true;
      body = body.slice(0, -1);
      changed = true;
    } else if (body.endsWith(".")) {
      palmMute = true;
      body = body.slice(0, -1);
      changed = true;
    } else if (body.endsWith("b")) {
      bend = true;
      body = body.slice(0, -1);
      changed = true;
    }
  }

  if (body === "-") {
    return { events: [], rest: true, accent, palmMute, bend };
  }

  const events = body.split("+").map((part) => parseEvent(part, raw));
  const seen = new Set<number>();
  for (const event of events) {
    if (seen.has(event.string)) {
      throw new Error(`"${raw}" pone dos notas en la misma cuerda a la vez`);
    }
    seen.add(event.string);
  }
  return { events, rest: false, accent, palmMute, bend };
}

/** Divide la tab en compases y cada compás en columnas. */
export function parseTab(spec: string): TabBar[] {
  const tokens = spec
    .split(/[\s,]+/)
    .flatMap((token) => token.split(/(\|)/))
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) throw new Error("tab vacía");

  const bars: TabBar[] = [];
  let columns: TabColumn[] = [];
  /** enlace leído que aún espera la nota de destino */
  let pending: TabLink | undefined;

  const closeBar = () => {
    if (pending) throw new Error("un ligado se queda sin la nota de destino");
    if (columns.length > 0) {
      bars.push({ number: bars.length + 1, columns });
      columns = [];
    }
  };

  for (const token of tokens) {
    if (token === "|") {
      closeBar();
      continue;
    }
    const link = LINKS[token];
    if (link) {
      if (columns.length === 0) throw new Error("un ligado empieza sin nota de origen");
      if (pending) throw new Error("dos ligados seguidos sin nota entre medias");
      pending = link;
      continue;
    }
    columns.push(parseColumn(token));
    if (pending) {
      columns[columns.length - 2].link = pending;
      pending = undefined;
    }
  }
  closeBar();

  if (bars.length === 0) throw new Error("tab vacía");
  return bars;
}

/** Número total de columnas: sirve para dimensionar el SVG. */
export function tabDuration(bars: TabBar[]): number {
  return bars.reduce((total, bar) => total + bar.columns.length, 0);
}

/**
 * Notas de la tab que NO pertenecen a la escala, como "3ª cuerda traste 4".
 * Escribir una tab a mano y equivocarse en un traste es demasiado fácil y no
 * se ve: con esto, una nota ajena a la escala declarada rompe el build.
 */
export function foreignNotes(
  bars: TabBar[],
  scalePitchClasses: readonly number[],
  tuningMidi: readonly number[],
): string[] {
  const allowed = new Set(scalePitchClasses.map((pc) => ((pc % 12) + 12) % 12));
  const fuera: string[] = [];
  for (const bar of bars) {
    for (const column of bar.columns) {
      for (const event of column.events) {
        if (event.fret === "x") continue;
        // la cuerda 1 es la aguda; el afinado viene de la 6ª a la 1ª
        const midi = tuningMidi[STRINGS - event.string] + event.fret;
        if (!allowed.has(((midi % 12) + 12) % 12)) {
          fuera.push(`${event.string}:${event.fret}`);
        }
      }
    }
  }
  return fuera;
}

/**
 * Notas de cada compás que no pertenecen al acorde de ese compás.
 * Es lo que necesita una tab de arpegios o de guide tones: ahí no hay una
 * escala única, hay un acorde por compás, y una nota mal puesta parece
 * correcta hasta que suena.
 */
export function foreignPerBar(
  bars: TabBar[],
  chordPitchClasses: readonly (readonly number[])[],
  tuningMidi: readonly number[],
): string[] {
  const fuera: string[] = [];
  bars.forEach((bar, i) => {
    const pcs = chordPitchClasses[i];
    if (!pcs) return;
    fuera.push(
      ...foreignNotes([bar], pcs, tuningMidi).map((n) => `compás ${i + 1}: ${n}`),
    );
  });
  return fuera;
}
