#!/bin/bash
# Nightly backup for the yerevan.digital stack.
#
# Backs up the two things that cannot be rebuilt:
#   - MySQL   : orders, stores, products, the commission ledger
#   - storage : uploaded product images / logos / banners
#
# Deliberately NOT backed up:
#   - redis : cache + queue. Losing it costs pending jobs, not records.
#
# Installed via scripts/install-backup-timer.sh (systemd timer, 03:20 daily).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="/var/backups/yerevan-digital"
LOG_FILE="/var/log/yerevan-digital/backup.log"
RETAIN_DAYS=7
COMPOSE="docker compose -f $REPO_DIR/docker-compose.yml -f $REPO_DIR/docker-compose.prod.yml"

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"
exec >> "$LOG_FILE" 2>&1

STAMP=$(date +%Y%m%d-%H%M%S)
say() { printf '%s  %s\n' "$(date -Is)" "$1"; }

fail() {
  say "FAILED: $1"
  # Leave a breadcrumb the health check can find, so a silently broken backup
  # is visible rather than assumed working.
  echo "$(date -Is) $1" > "$BACKUP_DIR/.last-failure"
  exit 1
}

say "=== backup $STAMP starting ==="

# ── free disk guard ───────────────────────────────────────────────────────────
# The box runs at ~80% full. A backup that fills the disk takes the site down,
# which is worse than a skipped backup.
AVAIL_MB=$(df -Pm / | awk 'NR==2 {print $4}')
if [ "$AVAIL_MB" -lt 2048 ]; then
  fail "only ${AVAIL_MB}MB free on / — refusing to write a backup"
fi

cd "$REPO_DIR"
set -a; . ./.env; set +a

# ── mysql ─────────────────────────────────────────────────────────────────────
SQL_FILE="$BACKUP_DIR/mysql-$STAMP.sql.gz"
say "dumping mysql -> $(basename "$SQL_FILE")"

# --single-transaction: consistent snapshot without locking writes.
# Piped straight to gzip so the uncompressed dump never lands on disk.
if ! $COMPOSE exec -T mysql sh -c \
  "exec mysqldump -u root -p\"\$MYSQL_ROOT_PASSWORD\" --single-transaction --quick --routines --events \"\$MYSQL_DATABASE\"" \
  2>/dev/null | gzip -c > "$SQL_FILE"; then
  rm -f "$SQL_FILE"
  fail "mysqldump failed"
fi

# A dump that exists but is truncated is worse than none — verify it.
if ! gzip -t "$SQL_FILE" 2>/dev/null; then
  rm -f "$SQL_FILE"
  fail "mysql dump is not a valid gzip"
fi
if ! zcat "$SQL_FILE" | tail -5 | grep -q "Dump completed"; then
  rm -f "$SQL_FILE"
  fail "mysql dump has no completion marker — likely truncated"
fi
say "mysql ok ($(du -h "$SQL_FILE" | cut -f1))"

# ── uploaded media ────────────────────────────────────────────────────────────
STORAGE_SRC="/var/lib/docker/volumes/vendora_storage_data/_data"
if [ -d "$STORAGE_SRC" ]; then
  MEDIA_FILE="$BACKUP_DIR/storage-$STAMP.tar.gz"
  say "archiving storage -> $(basename "$MEDIA_FILE")"
  if tar -czf "$MEDIA_FILE" -C "$STORAGE_SRC" . 2>/dev/null; then
    say "storage ok ($(du -h "$MEDIA_FILE" | cut -f1))"
  else
    rm -f "$MEDIA_FILE"
    fail "storage archive failed"
  fi
else
  say "WARN: storage volume not found at $STORAGE_SRC"
fi

# ── retention ─────────────────────────────────────────────────────────────────
find "$BACKUP_DIR" -name 'mysql-*.sql.gz'   -mtime +$RETAIN_DAYS -delete
find "$BACKUP_DIR" -name 'storage-*.tar.gz' -mtime +$RETAIN_DAYS -delete

rm -f "$BACKUP_DIR/.last-failure"
date -Is > "$BACKUP_DIR/.last-success"

say "=== backup $STAMP done — $(find "$BACKUP_DIR" -name 'mysql-*.sql.gz' | wc -l) dumps retained, $(du -sh "$BACKUP_DIR" | cut -f1) total ==="
