/**
 * Encontrar cifrados dentro de un texto para poder enseñar su forma al pasar
 * el ratón por encima.
 *
 * El problema no es detectar "Dm7b5": es no detectar de más. En castellano,
 * "A la quinta", "módulo A cerrado" o "A 162 bpm" empiezan por lo que parece
 * un cifrado, y "A-C-D-E" pueden ser cuatro notas y no cuatro acordes. La
 * regla que sale de mirar el contenido real:
 *
 *   1. Un cifrado CON cualidad (Am, C7, Dm7b5, Bb7…) es inequívoco: siempre.
 *   2. Una letra suelta (C, F, Bb) solo cuenta si está encadenada con otra
 *      por un separador de progresión: "C → F → G", "G-D-Em-C", "Am - G - D".
 *   3. Todo se valida contra nuestros datos: lo que no es un acorde de
 *      verdad, no se marca.
 *
 * Lo que quede fuera se escribe con `<Acorde>` a mano, y lo que sobre se
 * escapa con acentos graves: el código en línea no se toca.
 */

import { parseFormulaSpec } from "@/lib/music/spec";

export type ChordSegment = { text: string } | { chord: string };

/** Candidato: empieza por nota y sigue con lo que puede ser una cualidad. */
const CANDIDATE = /[A-G](?:#|b)?[A-Za-z0-9#]*/g;

/**
 * Una flecha entre dos cifrados es inequívoca: nadie lista notas sueltas con
 * flechas, se listan progresiones.
 */
const ARROW_CHAIN = /^[\s]*(?:→|->|=>)[\s]*$/;

/**
 * Un guion CON espacios alrededor separa acordes: "C - F - G", "Am - G - D".
 * Con notas no se escribe así.
 */
const SPACED_CHAIN = /^\s+[-–—]\s+$/;

/**
 * Guion pegado o coma: ambiguo. "E-F" es un semitono, "A-C-D-E" son cuatro
 * notas y "D, E, F#, G#, B" son los puntos del mástil. Una cadena así solo
 * cuenta si alguno de sus miembros lleva cualidad.
 */
const TIGHT_CHAIN = /^[\s\-–—,.·|]+$/;

interface Candidate {
  chord: string;
  start: number;
  end: number;
  /** lleva cualidad (Am, C7) frente a letra suelta (C, Bb) */
  qualified: boolean;
}

function isChord(symbol: string): boolean {
  try {
    parseFormulaSpec(symbol, "chord");
    return true;
  } catch {
    return false;
  }
}

/** Cifrados válidos del texto, con su sitio. */
function candidates(text: string): Candidate[] {
  const found: Candidate[] = [];
  for (const match of text.matchAll(CANDIDATE)) {
    const start = match.index;
    const chord = match[0];

    // dentro de una palabra no hay acordes: "cAmbio", "Emocionante"
    const before = text[start - 1];
    if (before !== undefined && /[A-Za-z0-9#]/.test(before)) continue;
    // ni pegado a un número o a dos puntos: "6:5", "4ª"
    if (before === ":" || before === "/") continue;

    if (!isChord(chord)) continue;

    const quality = chord.slice(1).replace(/^[#b]/, "");
    found.push({
      chord,
      start,
      end: start + chord.length,
      qualified: quality.length > 0,
    });
  }
  return found;
}

type Link = "arrow" | "spaced" | "tight" | "none";

/** Cómo están unidos dos candidatos consecutivos, si es que lo están. */
function linkBetween(text: string, left: Candidate, right: Candidate): Link {
  const between = text.slice(left.end, right.start);
  if (between.length === 0 || between.length > 5) return "none";
  if (ARROW_CHAIN.test(between)) return "arrow";
  if (SPACED_CHAIN.test(between)) return "spaced";
  if (TIGHT_CHAIN.test(between)) return "tight";
  return "none";
}

/**
 * Parte el texto en trozos: lo que es un cifrado y lo que no. Unir los
 * trozos vuelve a dar el texto original, siempre.
 */
export function findChordMentions(text: string): ChordSegment[] {
  const found = candidates(text);
  if (found.length === 0) return text.length > 0 ? [{ text }] : [];

  // Las letras sueltas se agrupan en cadenas y se decide por cadena, no una
  // a una: es lo que separa "C → F → G" de "D, E, F#, G#, B".
  const chains: Candidate[][] = [];
  let current: Candidate[] = [];
  let currentLink: Link = "none";

  for (const [i, candidate] of found.entries()) {
    const link = i === 0 ? "none" : linkBetween(text, found[i - 1], candidate);
    if (link === "none") {
      if (current.length > 0) chains.push(current);
      current = [candidate];
      currentLink = "none";
    } else {
      current.push(candidate);
      // un eslabón inequívoco basta para dar la cadena entera por buena
      if (link === "arrow" || link === "spaced") currentLink = link;
      else if (currentLink === "none") currentLink = "tight";
    }
    (current as Candidate[] & { link?: Link }).link = currentLink;
  }
  if (current.length > 0) chains.push(current);

  const keep = chains.flatMap((chain) => {
    const link = (chain as Candidate[] & { link?: Link }).link ?? "none";
    if (chain.every((c) => c.qualified)) return chain;
    if (chain.length < 2) return chain.filter((c) => c.qualified);
    // flecha o guion espaciado: progresión segura. Guion pegado o coma:
    // hace falta que al menos uno lleve cualidad, o serían notas sueltas.
    if (link === "arrow" || link === "spaced" || chain.some((c) => c.qualified)) {
      return chain;
    }
    return chain.filter((c) => c.qualified);
  });

  const segments: ChordSegment[] = [];
  let cursor = 0;
  for (const candidate of keep) {
    if (candidate.start > cursor) {
      segments.push({ text: text.slice(cursor, candidate.start) });
    }
    segments.push({ chord: candidate.chord });
    cursor = candidate.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return segments;
}

/** ¿Merece la pena recorrer este texto? Evita trabajo en la mayoría. */
export function mightMentionChord(text: string): boolean {
  return /[A-G]/.test(text);
}
