#!/usr/bin/env bash
# Applies the migrations to a throwaway local PostgreSQL cluster and runs the
# RLS tests. Requires PostgreSQL 15+ binaries (initdb, pg_ctl, psql).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
TMP="$(mktemp -d)"
PORT="${PGPORT_TEST:-55432}"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$TMP"; RUN_AS=(runuser -u postgres --); fi
cleanup() { "${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
"${RUN_AS[@]}" "$PGBIN/initdb" -D "$TMP/data" -A trust -U postgres >/dev/null
"${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null
PSQL=("${RUN_AS[@]}" "$PGBIN/psql" -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$ROOT/supabase/tests/auth_stub.sql"
# storage migration needs Supabase's storage schema; skipped here.
for f in "$ROOT"/supabase/migrations/*.sql; do
  case "$f" in *storage*) echo "skip (needs Supabase storage): $(basename "$f")"; continue;; esac
  echo "apply $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f "$ROOT/supabase/tests/rls_test.sql"
