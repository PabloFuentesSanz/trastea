-- Comprueba que las RLS aíslan de verdad a los usuarios. Se ejecuta DESPUÉS de
-- aplicar los stubs y todas las migraciones (ver scripts/verify-migration.sh).
--
-- No sustituye a probarlo en Supabase, pero caza lo que más caro sale: una
-- política mal escrita que deje a un usuario leer los datos de otro.

\set ON_ERROR_STOP on


-- === Comprobación 1: RLS activa en todas las tablas de public ===
do $$
declare sin_rls text;
begin
  select string_agg(tablename, ', ') into sin_rls
  from pg_tables where schemaname = 'public' and not rowsecurity;
  if sin_rls is not null then
    raise exception 'tablas sin row level security: %', sin_rls;
  end if;
end $$;

-- === Comprobación 2: un usuario no ve ni toca los datos de otro ===
do $$
declare ana uuid := '11111111-1111-1111-1111-111111111111';
        bea uuid := '22222222-2222-2222-2222-222222222222';
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test'),
  ('22222222-2222-2222-2222-222222222222', 'bea@test');
insert into public.practice_sessions (user_id, date, duration_min) values
  ('11111111-1111-1111-1111-111111111111', current_date, 40),
  ('22222222-2222-2222-2222-222222222222', current_date, 25);

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

do $$
declare n int;
begin
  select count(*) into n from public.practice_sessions;
  if n <> 1 then raise exception 'Ana ve % sesiones y debería ver 1', n; end if;

  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'Ana ve % perfiles y debería ver 1', n; end if;

  select count(*) into n from public.practice_sessions
   where user_id = '22222222-2222-2222-2222-222222222222';
  if n <> 0 then raise exception 'Ana ve % filas de Bea', n; end if;

  begin
    insert into public.practice_sessions (user_id, date, duration_min)
    values ('22222222-2222-2222-2222-222222222222', current_date, 99);
    raise exception 'Ana ha podido escribir a nombre de Bea';
  exception when insufficient_privilege then
    null; -- correcto: la política lo impide
  end;

  delete from public.practice_sessions
   where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Ana ha borrado % filas de Bea', n; end if;
end $$;

-- === Comprobación 3: el aislamiento vale para TODAS las tablas ===
-- Antes solo se comprobaban practice_sessions y profiles. Una política mal
-- escrita en cualquiera de las otras filtra el historial, las grabaciones o el
-- progreso de otra persona, y no se ve por ninguna parte hasta que pasa.
reset role;

do $$
declare
  ana uuid := '11111111-1111-1111-1111-111111111111';
  bea uuid := '22222222-2222-2222-2222-222222222222';
  n int;
  t text;
  tablas text[] := array[
    'assessments', 'exercise_records', 'lesson_progress', 'practice_sessions',
    'recordings', 'srs_cards', 'user_notes', 'user_resources', 'user_songs'
  ];
begin
  -- una fila de cada tabla a nombre de Bea, con lo mínimo obligatorio
  insert into public.assessments (user_id, module_slug, type) values (bea, 'a-cimientos', 'quiz');
  insert into public.exercise_records (user_id, exercise_slug, bpm) values (bea, 'cromatico-1234', 90);
  insert into public.lesson_progress (user_id, lesson_slug) values (bea, 'a-cimientos-w01-d1');
  insert into public.recordings (user_id, storage_path) values (bea, 'bea/x.webm');
  insert into public.srs_cards (user_id, card_type, payload)
    values (bea, 'fretboard_note', '{"id": "fretboard_note:0:5"}'::jsonb);
  insert into public.user_notes (user_id) values (bea);
  insert into public.user_resources (user_id, title, url) values (bea, 'x', 'https://x');
  insert into public.user_songs (user_id, title) values (bea, 'x');

  set role authenticated;
  perform set_config('request.jwt.claim.sub', ana::text, false);

  foreach t in array tablas loop
    -- las suyas sí puede verlas (la comprobación 2 le creó alguna): lo que no
    -- puede es ver una sola de Bea
    execute format('select count(*) from public.%I where user_id = %L', t, bea) into n;
    if n <> 0 then
      raise exception 'Ana ve % filas de Bea en %', n, t;
    end if;

    -- y tampoco puede escribir a nombre de Bea
    begin
      execute format(
        'insert into public.%I (user_id) values (%L)', t, bea);
      raise exception 'Ana ha podido escribir en % a nombre de Bea', t;
    exception
      when insufficient_privilege then null; -- correcto
      when not_null_violation then null;     -- la política ni llegó a evaluarse
    end;
  end loop;
  reset role;
end $$;

reset role;

-- === Comprobación 4: el CHECK de card_type acepta lo del modelo y nada más ===
-- El test card-types.test.ts ya compara la lista con `CARD_TYPES`; esto
-- comprueba lo otro: que el constraint de verdad rechaza lo que no está.
do $$
declare ana uuid := '11111111-1111-1111-1111-111111111111';
begin
  insert into public.srs_cards (user_id, card_type, payload)
  values (ana, 'scale_box', '{"id": "scale_box:A:minor-pentatonic:1:0:8"}'::jsonb);

  begin
    insert into public.srs_cards (user_id, card_type, payload)
    values (ana, 'tipo_inventado', '{"id": "x"}'::jsonb);
    raise exception 'el CHECK de card_type deja pasar cualquier cosa';
  exception when check_violation then
    null; -- correcto: solo entran los tipos declarados
  end;
end $$;

\echo '✅ migración aplicada, RLS activa en todas las tablas y los usuarios aislados'
