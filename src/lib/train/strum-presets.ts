/**
 * Los patrones de rasgueo que cubren casi todo, para el entrenamiento de
 * mano derecha con el click. La notación es la de <Rasgueo>: ocho corcheas
 * por compás, ↓ ↑ x ·.
 */
import type { TrainLevel } from "./taxonomy";

export interface PatronDeRasgueo {
  id: string;
  nombre: string;
  patron: string;
  dondeSuena: string;
  level: TrainLevel;
}

export const PATRONES: readonly PatronDeRasgueo[] = [
  {
    id: "negras",
    nombre: "Negras",
    patron: "↓ · ↓ · ↓ · ↓ ·",
    dondeSuena: "Punk, folk cantado, el primer día",
    level: 1,
  },
  {
    id: "corcheas",
    nombre: "Corcheas",
    patron: "↓↑ ↓↑ ↓↑ ↓↑",
    dondeSuena: "Rock básico, todo abajo-arriba",
    level: 1,
  },
  {
    id: "de-siempre",
    nombre: "El de siempre",
    patron: "↓ · ↓↑ · ↑ ↓↑",
    dondeSuena: "Media discografía del pop y el folk",
    level: 1,
  },
  {
    id: "con-el-y",
    nombre: "Entra el «y»",
    patron: "↓ · ↓↑ ↓ · ↓ ·",
    dondeSuena: "Un golpe arriba de propina en el 2",
    level: 1,
  },
  {
    id: "acento-2-4",
    nombre: "Acento en 2 y 4",
    patron: "↓ · ↓ · ↓ · ↓ ·",
    dondeSuena: "Reggae y soul: los golpes 2 y 4 más fuertes",
    level: 2,
  },
  {
    id: "apagado",
    nombre: "Con apagado",
    patron: "↓ x ↓↑ x ↑ ↓↑",
    dondeSuena: "Funk y pop percusivo: la x es la mano apagando",
    level: 2,
  },
  {
    id: "folk-pulgar",
    nombre: "Bajo y rasgueo",
    patron: "↓ · ↓↑ · ↑ · ↑",
    dondeSuena: "El primer golpe es solo el bajo, el resto el acorde",
    level: 2,
  },
  {
    id: "semicorcheas",
    nombre: "Semicorcheas de funk",
    patron: "↓↑ ↓↑ ↓↑ ↓↑",
    dondeSuena: "A doble velocidad: la mano no para nunca",
    level: 3,
  },
];

export const BUCLES: readonly { id: string; nombre: string; acordes: string }[] = [
  { id: "em", nombre: "Em quieto", acordes: "Em" },
  { id: "g-d-em-c", nombre: "G · D · Em · C", acordes: "G | D | Em | C" },
  { id: "a-d-e", nombre: "A · D · E · A", acordes: "A | D | E | A" },
  { id: "c-am-f-g", nombre: "C · Am · F · G", acordes: "C | Am | F | G" },
];
