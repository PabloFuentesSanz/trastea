#!/usr/bin/env bash
# Aplica la migración a un Postgres limpio y comprueba el aislamiento por RLS.
#
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/verify-migration.sh
#
# Con un Postgres cualquiera vale: no hace falta Supabase, porque lo que se
# está probando es el SQL, no el servicio.
set -euo pipefail

DB="${DB:-trastea_verify}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists ${DB};"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database ${DB};"
psql -v ON_ERROR_STOP=1 -q -d "${DB}" -f "$(dirname "$0")/verify-migration.sql"
psql -q -d postgres -c "drop database ${DB};"
