/**
 * Una tab convertida en notas con su sitio en el tiempo, para poder oírla.
 *
 * Cada columna trae ya lo que dura, en pulsos, porque la figura es parte de
 * la notación y no del reproductor: la tab dice si eso son corcheas o
 * semicorcheas, y aquí solo se acumula. Antes se multiplicaba el índice por
 * un paso fijo, y por eso una tab con figuras mezcladas no se podía tocar.
 */

import {
  columnStarts,
  STRINGS,
  tabBeats,
  type TabBar,
  type TabColumn,
} from "@/lib/music/tab";
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
 * otra cosa. Se mira columna a columna, así que en una tab con figuras
 * mezcladas solo se mueven las corcheas.
 */
function swung(beat: number, beats: number, swing: boolean): number {
  if (!swing || Math.abs(beats - 0.5) > 1e-9) return beat;
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
  const tuningMidi = options.tuningMidi ?? STANDARD;

  const notes: BackingNote[] = [];
  const todas = columns(bars);
  const starts = columnStarts(bars);

  todas.forEach((column, index) => {
    if (column.rest) return;
    const beat = swung(starts[index], column.beats, options.swing ?? false);
    // la nota suena hasta la columna siguiente que tenga notas: en esta
    // notación los silencios de detrás son la duración, no un corte
    let hueco = column.beats;
    for (let i = index + 1; todas[i]?.rest; i += 1) hueco += todas[i].beats;
    const duration = hueco * (column.palmMute ? PALM_MUTE_LENGTH : DETACHE);
    const velocity = velocityOf(column);

    for (const event of column.events) {
      if (event.fret === "x") {
        // no tiene altura: es un golpe seco, y en el funk es la mitad del groove
        notes.push({
          beat,
          duration: column.beats * 0.3,
          midi: 40,
          velocity,
          voice: "muerta",
        });
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
export function tabLength(bars: readonly TabBar[]): number {
  return Math.max(Math.ceil(tabBeats(bars)), 1);
}
