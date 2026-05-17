#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Pull first, then re-exec so the rest of the script runs from the freshly-pulled version
if [ -z "${_DEPLOY_PULLED:-}" ]; then
  git -C "$REPO_DIR" update-index --assume-unchanged scripts/hooks.json
  git -C "$REPO_DIR" pull origin main
  export _DEPLOY_PULLED=1
  exec bash "$REPO_DIR/scripts/deploy.sh"
fi

LOG_DIR="/var/log/vendora"
LOG_FILE="$LOG_DIR/deploy.log"
LOCK_FILE="/tmp/vendora-deploy.lock"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

mkdir -p "$LOG_DIR"

# Keep only the latest 50 MB of the log
MAX_LOG_BYTES=$((50 * 1024 * 1024))
if [ -f "$LOG_FILE" ] && [ "$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt "$MAX_LOG_BYTES" ]; then
  tail -c "$MAX_LOG_BYTES" "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

exec >> "$LOG_FILE" 2>&1

# Kill any running deploy and take over
if [ -f "$LOCK_FILE" ]; then
  OLD_PID=$(cat "$LOCK_FILE" 2>/dev/null || true)
  if [ -n "$OLD_PID" ] && [ "$OLD_PID" != "$$" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    printf '\033[1;33m  ⚠  Killing previous deploy (PID %s) — superseded by new commit.\033[0m\n' "$OLD_PID"
    kill -- -"$OLD_PID" 2>/dev/null || kill "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

cd "$REPO_DIR"

DEPLOY_START=$(date +%s)
NEW_SHORT=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty='%s')
COMMIT_AUTHOR=$(git log -1 --pretty='%an')
DEPLOY_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# ── helpers ──────────────────────────────────────────────────────────────────
HR='\033[2;36m  ════════════════════════════════════════════════════════════\033[0m'
section() { printf '\n\033[1;96m  ▶  %s\033[0m\n' "$1"; }
ok()      { printf '\033[0;92m  ✔  %s\033[0m\n' "$1"; }
took()    { printf '\033[2;37m     (took %ds)\033[0m\n' "$(( $(date +%s) - $1 ))"; }

# ── header ───────────────────────────────────────────────────────────────────
printf '\n%b\n' "$HR"
printf '\033[1;97m  🚀  VENDORA DEPLOY\033[0m\n'
printf '\033[2;37m  %s  ·  %s  ·  %s\033[0m\n' "$DEPLOY_TIME" "$NEW_SHORT" "$COMMIT_AUTHOR"
printf '\033[2;37m  "%s"\033[0m\n' "$COMMIT_MSG"
printf '%b\n' "$HR"

# ── build ─────────────────────────────────────────────────────────────────────
section "Building containers"
T=$(date +%s)
$COMPOSE build --build-arg CACHEBUST="$(git rev-parse HEAD)" web api queue
ok "web + api + queue built"
took $T

# ── start ─────────────────────────────────────────────────────────────────────
section "Starting services"
T=$(date +%s)
$COMPOSE up -d --no-deps web api queue
ok "Containers up"
took $T

# ── wait for php-fpm ──────────────────────────────────────────────────────────
section "Waiting for PHP-FPM"
T=$(date +%s)
for i in $(seq 1 30); do
  if $COMPOSE exec -T api sh -c 'grep -q ":2328 " /proc/net/tcp /proc/net/tcp6 2>/dev/null || test -S /run/php-fpm/php-fpm.sock 2>/dev/null || test -S /var/run/php-fpm.sock 2>/dev/null'; then
    ok "Ready (attempt $i)"
    break
  fi
  sleep 2
done
took $T

# ── cache ─────────────────────────────────────────────────────────────────────
section "Clearing cache"
T=$(date +%s)
$COMPOSE exec -T api php artisan optimize:clear
$COMPOSE exec -T api php artisan cache:clear
ok "Cache cleared"
took $T

# ── migrate ───────────────────────────────────────────────────────────────────
section "Running migrations"
T=$(date +%s)
$COMPOSE exec -T api php artisan migrate --force
ok "Migrations done"
took $T

# ── nginx ─────────────────────────────────────────────────────────────────────
section "Reloading nginx"
T=$(date +%s)
$COMPOSE exec -T nginx nginx -s reload
ok "nginx reloaded"
took $T

# ── footer ────────────────────────────────────────────────────────────────────
TOTAL=$(( $(date +%s) - DEPLOY_START ))
printf '\n%b\n' "$HR"
printf '\033[1;30;102m  ✔  Deploy finished in %ds  ·  %s  \033[0m\n' "$TOTAL" "$(date '+%Y-%m-%d %H:%M:%S')"
_RAND_COLOR=$((16 + RANDOM % 216))
printf "\033[1;30;48;5;${_RAND_COLOR}m  %s  %s  \033[0m\n" "$NEW_SHORT" "$COMMIT_MSG"
printf '%b\n\n' "$HR"
