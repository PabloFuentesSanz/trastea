import { z } from "zod";

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
  focus: z.string().min(1),
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
  style: z.string().min(1),
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
