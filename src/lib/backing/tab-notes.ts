/**
 * Una tab convertida en notas con su sitio en el tiempo, para poder oírla.
 *
 * Nuestra notación es de columnas: cada columna dura lo mismo, y cuántas
 * caben en un pulso lo dice `perBeat` (2 corcheas, 3 tresillos, 4 semis).
 * Con eso se cubren casi todas las tabs del curso, que son series regulares
 * —escalas, cromáticos, arpegios, secuencias—. Las de figuras mezcladas se
 * marcan como no tocables en vez de sonar mal.
 */

import { STRINGS, type TabBar, type TabColumn } from "@/lib/music/tab";
import { getTuning } from "@/data/tunings";
import type { BackingNote } from "./groove";

const STANDARD = getTuning("standard").midi;

/** columnas por pulso de cada figura, tal y como se nombran en el contenido */
export const PER_BEAT: Record<string, number> = {
  redondas: 0.25,
  blancas: 0.5,
  negras: 1,
  corcheas: 2,
  tresillos: 3,
  semicorcheas: 4,
};

const ACCENT_VELOCITY = 0.95;
const NORMAL_VELOCITY = 0.62;
/** el palm mute corta la nota a la mitad y la baja un poco */
const PALM_MUTE_LENGTH = 0.45;
const PALM_MUTE_VELOCITY = 0.85;
/** las notas suenan un pelo más cortas que su hueco, para que se separen */
const DETACHE = 0.9;

export interface TabNotesOptions {
  /** 2 = corcheas, 3 = tresillos, 4 = semicorcheas… */
  perBeat?: number;
  /** retrasa el contratiempo de las corcheas a 2/3 del pulso */
  swing?: boolean;
  tuningMidi?: readonly number[];
}

/** Altura que suena en una cuerda y un traste. */
function midiAt(string: number, fret: number, tuningMidi: readonly number[]): number {
  return tuningMidi[STRINGS - string] + fret;
}

/**
 * El swing solo tiene sentido en corcheas: con tresillos ya está la
 * subdivisión ternaria, y en semicorcheas retrasarlas las convertiría en
 * otra cosa.
 */
function swung(beat: number, perBeat: number, swing: boolean): number {
  if (!swing || perBeat !== 2) return beat;
  const pulso = Math.floor(beat);
  return Math.abs(beat - pulso - 0.5) < 1e-9 ? pulso + 2 / 3 : beat;
}

function velocityOf(column: TabColumn): number {
  const base = column.accent ? ACCENT_VELOCITY : NORMAL_VELOCITY;
  return column.palmMute ? base * PALM_MUTE_VELOCITY : base;
}

/** Todas las columnas de todos los compases, en fila. */
function columns(bars: readonly TabBar[]): TabColumn[] {
  return bars.flatMap((bar) => bar.columns);
}

/** Notas de la tab, ordenadas por pulso. */
export function tabNotes(
  bars: readonly TabBar[],
  options: TabNotesOptions = {},
): BackingNote[] {
  const perBeat = options.perBeat ?? 2;
  const tuningMidi = options.tuningMidi ?? STANDARD;
  const step = 1 / perBeat;

  const notes: BackingNote[] = [];
  const todas = columns(bars);

  todas.forEach((column, index) => {
    if (column.rest) return;
    const beat = swung(index * step, perBeat, options.swing ?? false);
    // la nota suena hasta la columna siguiente que tenga notas: en esta
    // notación los silencios de detrás son la duración, no un corte
    let huecos = 1;
    while (todas[index + huecos]?.rest) huecos++;
    const duration = step * huecos * (column.palmMute ? PALM_MUTE_LENGTH : DETACHE);
    const velocity = velocityOf(column);

    for (const event of column.events) {
      if (event.fret === "x") {
        // no tiene altura: es un golpe seco, y en el funk es la mitad del groove
        notes.push({ beat, duration: step * 0.3, midi: 40, velocity, voice: "muerta" });
        continue;
      }
      notes.push({
        beat,
        duration,
        midi: midiAt(event.string, event.fret, tuningMidi) + (column.bendSemitones ?? 0),
        velocity,
        voice: "melodia",
      });
    }
  });

  return notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * Pulsos que dura una vuelta: lo que dura la tab, redondeado al pulso.
 * Rellenar hasta el compás de 4 metía silencios al final de las tabs que
 * agrupan por cuerda, y el bucle entraba tarde.
 */
export function tabLength(
  bars: readonly TabBar[],
  options: TabNotesOptions = {},
): number {
  const perBeat = options.perBeat ?? 2;
  return Math.max(Math.ceil(columns(bars).length / perBeat), 1);
}
