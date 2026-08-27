// Tipos del esquema de Supabase.
// Escritos a mano a partir de supabase/migrations; cuando haya proyecto real,
// regenerar con `pnpm db:types` (supabase gen types) y comparar.

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserLevel = "cero" | "principiante" | "intermedio" | "avanzado";
export type LessonStatus = "pending" | "in_progress" | "done";
export type AssessmentType = "quiz" | "recording" | "checklist";
export type NoteEntityType = "lesson" | "exercise" | "song" | "wiki" | "free";
export type UserSongStatus = "learning" | "repertoire" | "wishlist";
export type ResourceKind = "video" | "article" | "app" | "backing_track" | "other";
/** Espejo del CHECK de srs_cards; la fuente es src/lib/train/cards.ts. */
export type SrsCardType =
  | "fretboard_note"
  | "interval_name"
  | "interval_build"
  | "chord_notes"
  | "ear_interval"
  | "ear_chord"
  | "scale_degree"
  | "scale_box";

type TableDef<Row, Required extends keyof Row, Generated extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required | Generated>>;
  Update: Partial<Omit<Row, Generated>>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  display_name: string;
  level: UserLevel;
  current_lesson_slug: string | null;
  streak_days: number;
  last_practice_date: string | null;
  prefs: Json;
  created_at: string;
};

export type PracticeSessionRow = {
  id: string;
  user_id: string;
  date: string;
  lesson_slug: string | null;
  duration_min: number;
  blocks: Json;
  mood: number | null;
  notes: string | null;
  created_at: string;
};

export type ExerciseRecordRow = {
  id: string;
  user_id: string;
  exercise_slug: string;
  bpm: number;
  clean: boolean;
  recorded_at: string;
};

export type LessonProgressRow = {
  id: string;
  user_id: string;
  lesson_slug: string;
  status: LessonStatus;
  blocks_done: string[];
  completed_at: string | null;
  updated_at: string;
};

export type AssessmentRow = {
  id: string;
  user_id: string;
  module_slug: string;
  type: AssessmentType;
  score: number | null;
  passed: boolean;
  data: Json;
  created_at: string;
};

export type RecordingRow = {
  id: string;
  user_id: string;
  storage_path: string;
  title: string;
  lesson_slug: string | null;
  duration_s: number | null;
  created_at: string;
};

export type UserNoteRow = {
  id: string;
  user_id: string;
  entity_type: NoteEntityType;
  entity_slug: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export type UserSongRow = {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  status: UserSongStatus;
  youtube_url: string | null;
  tab_url: string | null;
  notes: string | null;
  created_at: string;
};

export type UserResourceRow = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  kind: ResourceKind;
  tags: string[];
  created_at: string;
};

export type SrsCardRow = {
  id: string;
  user_id: string;
  card_type: SrsCardType;
  payload: Json;
  due_at: string;
  interval_days: number;
  ease: number;
  reps: number;
  lapses: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, "id", "created_at">;
      practice_sessions: TableDef<
        PracticeSessionRow,
        "user_id" | "duration_min",
        "id" | "created_at"
      >;
      exercise_records: TableDef<
        ExerciseRecordRow,
        "user_id" | "exercise_slug" | "bpm",
        "id"
      >;
      lesson_progress: TableDef<LessonProgressRow, "user_id" | "lesson_slug", "id">;
      assessments: TableDef<
        AssessmentRow,
        "user_id" | "module_slug" | "type",
        "id" | "created_at"
      >;
      recordings: TableDef<RecordingRow, "user_id" | "storage_path", "id" | "created_at">;
      user_notes: TableDef<UserNoteRow, "user_id", "id" | "created_at" | "updated_at">;
      user_songs: TableDef<UserSongRow, "user_id" | "title", "id" | "created_at">;
      user_resources: TableDef<
        UserResourceRow,
        "user_id" | "title" | "url",
        "id" | "created_at"
      >;
      srs_cards: TableDef<SrsCardRow, "user_id" | "card_type", "id" | "created_at">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
