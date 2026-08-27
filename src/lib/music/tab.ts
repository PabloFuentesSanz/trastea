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
 *   [16]     a partir de aquí, semicorcheas (ver FIGURES)
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

export interface TabFigure {
  /** lo que dura, en pulsos */
  beats: number;
  /** barras de la plica: 0 negra o más larga, 1 corchea, 2 semicorchea, 3 fusa */
  beams: number;
  triplet: boolean;
  dotted: boolean;
}

export interface TabColumn {
  events: TabEvent[];
  /**
   * Lo que dura la columna, en pulsos. Sale de la figura vigente, no del
   * número de columnas: es lo que permite meter un compás de corcheas y otro
   * de semicorcheas en la misma tab.
   */
  beats: number;
  /**
   * La figura con la que está escrita. Las barras NO se deducen de la
   * duración: un tresillo de corchea dura 1/3 y una semicorchea 0,25, y por
   * número el tresillo parece más corto — pero lleva una barra, no dos.
   */
  figure: TabFigure;
  rest: boolean;
  accent: boolean;
  palmMute: boolean;
  bend: boolean;
  /** semitonos que sube el bend: 1 = medio tono, 2 = un tono */
  bendSemitones?: number;
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

/**
 * Figuras, escritas como en cualquier partitura: el número es la fracción de
 * redonda (4 = negra, 8 = corchea), `t` la hace tresillo y `.` le pone
 * puntillo. En pulsos, que es la unidad con la que se toca.
 */
const FIGURE = /^\[(1|2|4|8|16|32)(t?)(\.?)\]$/;

/** Barras de la plica de cada figura, por su denominador. */
const BEAMS: Record<number, number> = { 1: 0, 2: 0, 4: 0, 8: 1, 16: 2, 32: 3 };

function parseFigure(token: string): TabFigure | null {
  const m = FIGURE.exec(token);
  if (!m) return null;
  return figureOf(Number(m[1]), m[2] === "t", m[3] === ".");
}

function figureOf(denominator: number, triplet: boolean, dotted: boolean): TabFigure {
  let beats = 4 / denominator;
  if (triplet) beats = (beats * 2) / 3;
  if (dotted) beats *= 1.5;
  return { beats, beams: BEAMS[denominator] ?? 0, triplet, dotted };
}

/** Corcheas: lo que dura una columna cuando la tab no dice otra cosa. */
export const DEFAULT_PER_BEAT = 2;

/**
 * La figura con la que arranca una tab, a partir de `porPulso`. Tres
 * columnas por pulso son tresillos de corchea (una barra), no una figura
 * rara de 1/3: por eso hace falta la tabla y no basta con dividir.
 */
const BY_PER_BEAT: Record<number, TabFigure> = {
  1: figureOf(4, false, false),
  2: figureOf(8, false, false),
  3: figureOf(8, true, false),
  4: figureOf(16, false, false),
  6: figureOf(16, true, false),
  8: figureOf(32, false, false),
};

export function figureFromPerBeat(perBeat: number): TabFigure {
  return (
    BY_PER_BEAT[perBeat] ?? {
      beats: 1 / perBeat,
      beams: 0,
      triplet: false,
      dotted: false,
    }
  );
}

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

function parseColumn(raw: string, figure: TabFigure): TabColumn {
  let body = raw;
  let accent = false;
  let palmMute = false;
  let bend = false;
  let bendSemitones: number | undefined;

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
    } else {
      // "b" solo, o "b2" con los semitonos que sube
      const conCuanto = /b([1-4])$/.exec(body);
      if (conCuanto) {
        bend = true;
        bendSemitones = Number(conCuanto[1]);
        body = body.slice(0, conCuanto[0].length * -1);
        changed = true;
      } else if (body.endsWith("b")) {
        bend = true;
        body = body.slice(0, -1);
        changed = true;
      }
    }
  }

  if (body === "-") {
    return {
      events: [],
      beats: figure.beats,
      figure,
      rest: true,
      accent,
      palmMute,
      bend,
      bendSemitones,
    };
  }

  const events = body.split("+").map((part) => parseEvent(part, raw));
  const seen = new Set<number>();
  for (const event of events) {
    if (seen.has(event.string)) {
      throw new Error(`"${raw}" pone dos notas en la misma cuerda a la vez`);
    }
    seen.add(event.string);
  }
  return {
    events,
    beats: figure.beats,
    figure,
    rest: false,
    accent,
    palmMute,
    bend,
    bendSemitones,
  };
}

export interface ParseTabOptions {
  /** columnas por pulso mientras la tab no declare una figura: 2 = corcheas */
  perBeat?: number;
}

/** Divide la tab en compases y cada compás en columnas. */
export function parseTab(spec: string, options: ParseTabOptions = {}): TabBar[] {
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
  /**
   * La figura vigente. No se reinicia en la barra de compás, igual que en
   * papel: se escribe una vez y vale hasta que cambie.
   */
  let figure = figureFromPerBeat(options.perBeat ?? DEFAULT_PER_BEAT);
  /** una figura declarada que todavía no ha estrenado columna */
  let figuraHuerfana: string | undefined;

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
    const figura = parseFigure(token);
    if (figura !== null) {
      figure = figura;
      figuraHuerfana = token;
      continue;
    }
    if (token.startsWith("[")) {
      throw new Error(
        `no existe la figura "${token}": usa [1] [2] [4] [8] [16] [32], con t de tresillo o . de puntillo`,
      );
    }
    const link = LINKS[token];
    if (link) {
      if (columns.length === 0) throw new Error("un ligado empieza sin nota de origen");
      if (pending) throw new Error("dos ligados seguidos sin nota entre medias");
      pending = link;
      continue;
    }
    columns.push(parseColumn(token, figure));
    figuraHuerfana = undefined;
    if (pending) {
      columns[columns.length - 2].link = pending;
      pending = undefined;
    }
  }
  closeBar();

  if (figuraHuerfana) {
    throw new Error(`la figura ${figuraHuerfana} se queda sin notas detrás`);
  }
  if (bars.length === 0) throw new Error("tab vacía");
  return bars;
}

/** Lo que dura un compás, en pulsos. */
export function barBeats(bar: TabBar): number {
  return bar.columns.reduce((total, column) => total + column.beats, 0);
}

/** Lo que dura la tab entera, en pulsos. */
export function tabBeats(bars: readonly TabBar[]): number {
  return bars.reduce((total, bar) => total + barBeats(bar), 0);
}

/**
 * El pulso en el que entra cada columna, de la primera a la última. Con
 * figuras mezcladas ya no vale multiplicar el índice por un paso fijo: hay
 * que acumular.
 */
export function columnStarts(bars: readonly TabBar[]): number[] {
  const starts: number[] = [];
  let beat = 0;
  for (const bar of bars) {
    for (const column of bar.columns) {
      starts.push(beat);
      beat += column.beats;
    }
  }
  return starts;
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
