#!/usr/bin/env bash
# Aplica TODAS las migraciones a un Postgres limpio, en orden, y comprueba el
# aislamiento por RLS.
#
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/verify-migration.sh
#
# Con un Postgres cualquiera vale: no hace falta Supabase, porque lo que se
# está probando es el SQL, no el servicio.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
DB="${DB:-trastea_verify}"
PSQL=(psql -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -d postgres -c "drop database if exists ${DB};"
"${PSQL[@]}" -d postgres -c "create database ${DB};"

# los objetos que pone Supabase y un Postgres pelado no tiene
"${PSQL[@]}" -d "${DB}" -f "${DIR}/verify-stubs.sql"

# todas las migraciones, en el orden de su nombre
shopt -s nullglob
migraciones=("${DIR}/../supabase/migrations/"*.sql)
if [ ${#migraciones[@]} -eq 0 ]; then
  echo "No hay migraciones que aplicar." >&2
  exit 1
fi
for f in "${migraciones[@]}"; do
  echo "→ $(basename "$f")"
  "${PSQL[@]}" -d "${DB}" -f "$f"
done

"${PSQL[@]}" -d "${DB}" -f "${DIR}/verify-checks.sql"
psql -q -d postgres -c "drop database ${DB};"
