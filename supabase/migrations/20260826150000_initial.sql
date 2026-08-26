-- Trastea — migración inicial
-- Todas las tablas de usuario con RLS por auth.uid().

-- =============================================================
-- profiles
-- =============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  level text not null default 'intermedio'
    check (level in ('cero', 'principiante', 'intermedio', 'avanzado')),
  current_lesson_slug text,
  streak_days integer not null default 0,
  last_practice_date date,
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid () = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid () = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid () = id);

-- Perfil automático al registrarse
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- =============================================================
-- practice_sessions
-- =============================================================
create table public.practice_sessions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  lesson_slug text,
  duration_min integer not null check (duration_min >= 0),
  blocks jsonb not null default '[]'::jsonb,
  mood smallint check (mood between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index practice_sessions_user_date_idx on public.practice_sessions (user_id, date desc);

-- =============================================================
-- exercise_records
-- =============================================================
create table public.exercise_records (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_slug text not null,
  bpm integer not null check (bpm between 20 and 400),
  clean boolean not null default true,
  recorded_at timestamptz not null default now()
);

create index exercise_records_user_exercise_idx
  on public.exercise_records (user_id, exercise_slug, recorded_at desc);

-- =============================================================
-- lesson_progress
-- =============================================================
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_slug text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  blocks_done text[] not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_slug)
);

create index lesson_progress_user_idx on public.lesson_progress (user_id, status);

-- =============================================================
-- assessments
-- =============================================================
create table public.assessments (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_slug text not null,
  type text not null check (type in ('quiz', 'recording', 'checklist')),
  score numeric,
  passed boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index assessments_user_module_idx on public.assessments (user_id, module_slug);

-- =============================================================
-- recordings
-- =============================================================
create table public.recordings (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  title text not null default '',
  lesson_slug text,
  duration_s integer,
  created_at timestamptz not null default now()
);

create index recordings_user_idx on public.recordings (user_id, created_at desc);

-- =============================================================
-- user_notes
-- =============================================================
create table public.user_notes (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null default 'free'
    check (entity_type in ('lesson', 'exercise', 'song', 'wiki', 'free')),
  entity_slug text,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_notes_user_entity_idx
  on public.user_notes (user_id, entity_type, entity_slug);

-- =============================================================
-- user_songs
-- =============================================================
create table public.user_songs (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  artist text not null default '',
  status text not null default 'wishlist'
    check (status in ('learning', 'repertoire', 'wishlist')),
  youtube_url text,
  tab_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index user_songs_user_idx on public.user_songs (user_id, status);

-- =============================================================
-- user_resources
-- =============================================================
create table public.user_resources (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  kind text not null default 'other'
    check (kind in ('video', 'article', 'app', 'backing_track', 'other')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index user_resources_user_idx on public.user_resources (user_id);

-- =============================================================
-- srs_cards
-- =============================================================
create table public.srs_cards (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_type text not null
    check (card_type in ('fretboard_note', 'interval', 'chord_tone')),
  payload jsonb not null default '{}'::jsonb,
  due_at timestamptz not null default now(),
  interval_days numeric not null default 0,
  ease numeric not null default 2.5,
  reps integer not null default 0,
  lapses integer not null default 0,
  created_at timestamptz not null default now()
);

create index srs_cards_user_due_idx on public.srs_cards (user_id, due_at);

-- =============================================================
-- RLS genérica para tablas con user_id
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'practice_sessions', 'exercise_records', 'lesson_progress', 'assessments',
    'recordings', 'user_notes', 'user_songs', 'user_resources', 'srs_cards'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s_select_own" on public.%I for select using (auth.uid() = user_id)', t, t);
    execute format(
      'create policy "%s_insert_own" on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format(
      'create policy "%s_update_own" on public.%I for update using (auth.uid() = user_id)', t, t);
    execute format(
      'create policy "%s_delete_own" on public.%I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- =============================================================
-- Storage: bucket de grabaciones (privado, carpeta por usuario)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

create policy "recordings_read_own" on storage.objects
  for select using (
    bucket_id = 'recordings'
    and auth.uid ()::text = (storage.foldername (name))[1]
  );

create policy "recordings_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'recordings'
    and auth.uid ()::text = (storage.foldername (name))[1]
  );

create policy "recordings_delete_own" on storage.objects
  for delete using (
    bucket_id = 'recordings'
    and auth.uid ()::text = (storage.foldername (name))[1]
  );
