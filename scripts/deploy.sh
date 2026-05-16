#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="/var/log/vendora"
LOG_FILE="$LOG_DIR/deploy.log"
LOCK_FILE="/tmp/vendora-deploy.lock"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

mkdir -p "$LOG_DIR"
chmod +x "$REPO_DIR/scripts/deploy.sh"
exec >> "$LOG_FILE" 2>&1

# Kill any running deploy and take over
if [ -f "$LOCK_FILE" ]; then
  OLD_PID=$(cat "$LOCK_FILE" 2>/dev/null || true)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[$(date -Iseconds)] Killing previous deploy (PID $OLD_PID) — new commit arrived."
    kill -- -"$OLD_PID" 2>/dev/null || kill "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

cd "$REPO_DIR"

git update-index --assume-unchanged scripts/hooks.json
git pull origin main

NEW_SHORT=$(git rev-parse --short HEAD)

echo ""
echo "========================================"
echo " Deploy started:  $(date -Iseconds)"
echo " Commit:          $NEW_SHORT"
echo "========================================"

BUILD_ARGS="--build-arg CACHEBUST=$(git rev-parse HEAD)"

$COMPOSE build $BUILD_ARGS web api
$COMPOSE up -d --no-deps web api

echo "Waiting for PHP-FPM on port 9000..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T api sh -c 'grep -q ":2328 " /proc/net/tcp /proc/net/tcp6 2>/dev/null'; then
    echo "PHP-FPM ready (attempt $i)."
    break
  fi
  sleep 2
done

$COMPOSE exec -T api php artisan optimize:clear
echo "Cache cleared."

$COMPOSE exec -T api php artisan migrate --force
echo "Migration done."

$COMPOSE exec -T nginx nginx -s reload
echo "Nginx reloaded."

echo -e "\033[1;30;102m Deploy finished: $(date -Iseconds) \033[0m"
echo "========================================"
