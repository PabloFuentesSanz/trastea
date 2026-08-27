-- Lo que Supabase pone y un Postgres pelado no tiene. Se aplica ANTES de las
-- migraciones (ver scripts/verify-migration.sh, que las recorre todas).
--
-- No sustituye a probarlo en Supabase, pero caza lo que más caro sale: una
-- política mal escrita que deje a un usuario leer los datos de otro.

\set ON_ERROR_STOP on

-- Lo que Supabase pone y un Postgres pelado no tiene
create schema auth;
create schema storage;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select string_to_array(name, '/') $$;

