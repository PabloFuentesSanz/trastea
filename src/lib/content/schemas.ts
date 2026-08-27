import { z } from "zod";
import { SONG_COLLECTIONS, SONG_STYLES, SONG_TECHNIQUES } from "./song-taxonomy";

/**
 * Frontmatter de todo el contenido MDX, validado en build y en content:audit.
 * Un slug referenciado que no existe = build rojo.
 */

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug en kebab-case");

export type Slug = z.infer<typeof slugSchema>;

export const blockTypeSchema = z.enum([
  "tecnica",
  "diapason",
  "oido",
  "aplicacion",
  "repertorio",
  "teoria",
]);

export type BlockType = z.infer<typeof blockTypeSchema>;

export const lessonBlockSchema = z.object({
  id: z.string().regex(/^b\d+$/),
  type: blockTypeSchema,
  min: z.number().int().min(1).max(60),
  title: z.string().optional(),
  exercise: slugSchema.optional(),
  song: slugSchema.optional(),
  /** ruta interna con estado precargado, p. ej. /metronomo?bpm=70 */
  tool: z.string().regex(/^\//, "ruta interna").optional(),
  bpm_start: z.number().int().min(20).max(300).optional(),
  bpm_target: z.number().int().min(20).max(300).optional(),
  /** pedir bpm alcanzado al completar el bloque */
  log_bpm: z.boolean().optional(),
  notes: z.string().optional(),
});

export type LessonBlock = z.infer<typeof lessonBlockSchema>;

export const lessonFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  order: z.number().int().min(1).max(7),
  duration_min: z.number().int().min(10).max(120),
  goal: z.string().min(5),
  blocks: z.array(lessonBlockSchema).min(1),
  wiki_refs: z.array(slugSchema).default([]),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

export const weekFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  order: z.number().int().min(1),
  /**
   * Subtítulo de la semana en /curso/[modulo]. Es una línea, no un resumen:
   * uno de 122 caracteres empujaba la página 247 px fuera de la pantalla del
   * móvil. Lo largo va en `summary`, que es un párrafo y fluye.
   */
  focus: z
    .string()
    .min(1)
    .max(60, "el foco es un subtítulo de una línea: 60 caracteres como mucho"),
  summary: z.string().min(1),
});

export type WeekFrontmatter = z.infer<typeof weekFrontmatterSchema>;

export const moduleFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  order: z.number().int().min(1),
  level: z.enum(["cero", "principiante", "intermedio", "avanzado"]),
  goals: z.array(z.string()).min(1),
  summary: z.string().min(1),
  /**
   * Nivel máximo de canción que el módulo puede pedir. Sin esto se colaban
   * estándares de jazz de nivel 3 en la semana 1: content:audit lo rechaza.
   */
  max_song_level: z.number().int().min(1).max(5),
  /** vacío = módulo placeholder (aparece como "próximamente") */
  placeholder: z.boolean().default(false),
  assessment: z
    .object({
      quiz_slug: slugSchema.optional(),
      checklist: z.array(z.string()).default([]),
      recording_prompt: z.string().optional(),
    })
    .optional(),
});

export type ModuleFrontmatter = z.infer<typeof moduleFrontmatterSchema>;

export const exerciseCategorySchema = z.enum([
  "tecnica",
  "diapason",
  "oido",
  "aplicacion",
  "repertorio",
  "teoria",
]);

export const exerciseFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  category: exerciseCategorySchema,
  /** Qué entrena, con el vocabulario cerrado de /entrenar. */
  trains: z.array(z.string().min(1)).default([]),
  /**
   * Nivel, SOLO para los ejercicios que no pertenecen al curso de 12 semanas
   * (los de práctica libre: sweep, tapping, fingerstyle…). Si el ejercicio sí
   * aparece en una lección, el nivel se deduce de la semana y declararlo aquí
   * es un error: dos fuentes de verdad que se separan solas. `content:audit`
   * comprueba las dos direcciones.
   */
  level: z.number().int().min(1).max(5).optional(),
  bpm_start: z.number().int().min(20).max(300).optional(),
  bpm_target: z.number().int().min(20).max(300).optional(),
  /** tablatura corta inline en alphaTex */
  alphatex: z.string().optional(),
  links: z
    .object({
      scale: z.string().optional(),
      chord: z.string().optional(),
      wiki: z.array(slugSchema).default([]),
      tool: z.string().optional(),
    })
    .default({ wiki: [] }),
});

export type ExerciseFrontmatter = z.infer<typeof exerciseFrontmatterSchema>;

export const songFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  artist: z.string().min(1),
  level: z.number().int().min(1).max(5),
  purpose: z.string().min(1),
  key: z.string().min(1),
  style: z.enum(SONG_STYLES),
  /** qué se practica tocándola: el eje por el que el curso pide repertorio */
  techniques: z.array(z.enum(SONG_TECHNIQUES)).min(1),
  /** temáticas curadas a las que pertenece (al menos una) */
  collections: z.array(z.enum(SONG_COLLECTIONS)).min(1),
  /** acordes que exige, en cifrado americano: "¿qué puedo tocar con lo que sé?" */
  chords: z.array(z.string()).default([]),
  /** progresión principal en grados, p. ej. "I-V-vi-IV" */
  progression: z.string().optional(),
  year: z.number().int().min(1500).max(2100).optional(),
  /** tempo aproximado del original, para el metrónomo */
  bpm: z.number().int().min(20).max(300).optional(),
  /** afinación; ausente = estándar (E A D G B E) */
  tuning: z.string().optional(),
  /** traste del capo; ausente o 0 = sin capo */
  capo: z.number().int().min(0).max(12).optional(),
  youtube_url: z.string().url().optional(),
  backing_track_url: z.string().url().optional(),
  /** tab propia (alphaTex) en /content/tabs */
  tab_slug: slugSchema.optional(),
  /** enlace externo para canciones con copyright */
  external_tab_url: z.string().url().optional(),
  wiki_refs: z.array(slugSchema).default([]),
});

export type SongFrontmatter = z.infer<typeof songFrontmatterSchema>;

export const wikiCategorySchema = z.enum([
  "teoria",
  "tecnica",
  "ritmo",
  "equipo",
  "historia",
  "glosario",
]);

export const wikiFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  category: wikiCategorySchema,
  level: z.number().int().min(1).max(3).default(1),
  related: z.array(slugSchema).default([]),
  summary: z.string().min(1),
  /**
   * Escala de la que trata el artículo, p. ej. "A minor-pentatonic".
   * Ponerlo obliga (vía content:audit) a que la ficha muestre TODAS sus
   * posiciones y su estudio cuerda a cuerda: la regla de contenido no puede
   * quedarse en una promesa.
   */
  scale: z.string().min(1).optional(),
});

export type WikiFrontmatter = z.infer<typeof wikiFrontmatterSchema>;

export const quizQuestionSchema = z.object({
  q: z.string().min(1),
  options: z.array(z.string()).min(2),
  answer: z.number().int().min(0),
  explain: z.string().optional(),
});

export const quizFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  module: slugSchema,
  pass_score: z.number().min(0).max(1).default(0.8),
  questions: z.array(quizQuestionSchema).min(1),
});

export type QuizFrontmatter = z.infer<typeof quizFrontmatterSchema>;
