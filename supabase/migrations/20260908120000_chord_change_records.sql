-- Cambios de acorde en un minuto: cuántos cambios limpios entre dos acordes
-- en una tanda. Es el entrenamiento práctico del principio del curso y no
-- cabía en exercise_records (que mide bpm, y aquí se mide una cuenta).

create table public.chord_change_records (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  pair text not null,
  changes integer not null check (changes between 0 and 300),
  seconds integer not null default 60 check (seconds between 10 and 300),
  recorded_at timestamptz not null default now()
);

create index chord_change_records_user_pair_idx
  on public.chord_change_records (user_id, pair, recorded_at desc);

alter table public.chord_change_records enable row level security;

create policy "chord_change_records_select_own" on public.chord_change_records
  for select using (auth.uid() = user_id);
create policy "chord_change_records_insert_own" on public.chord_change_records
  for insert with check (auth.uid() = user_id);
create policy "chord_change_records_delete_own" on public.chord_change_records
  for delete using (auth.uid() = user_id);
