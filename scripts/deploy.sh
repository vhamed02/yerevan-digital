#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="/var/log/vendora"
LOG_FILE="$LOG_DIR/deploy.log"
LOCK_FILE="/tmp/vendora-deploy.lock"
LAST_BUILD_FILE="/tmp/vendora-last-build-commit"
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

echo ""
echo "========================================"
echo " Deploy started:  $(date -Iseconds)"

# Read the last commit that was successfully built (survives kills)
# Fall back to current HEAD only if the file doesn't exist (first ever deploy)
if [ -f "$LAST_BUILD_FILE" ]; then
  PREV_COMMIT=$(cat "$LAST_BUILD_FILE")
else
  PREV_COMMIT=$(git rev-parse HEAD)
fi

echo " Last built:      $(git rev-parse --short "$PREV_COMMIT" 2>/dev/null || echo unknown)"

# hooks.json has the secret injected locally — tell git to ignore that change
git update-index --assume-unchanged scripts/hooks.json

git pull origin main

NEW_COMMIT=$(git rev-parse HEAD)
NEW_SHORT=$(git rev-parse --short HEAD)

echo " Commit after:    $NEW_SHORT"
echo "========================================"

# Diff between last successfully built commit and current HEAD
CHANGED=""
if [ "$PREV_COMMIT" != "$NEW_COMMIT" ]; then
  CHANGED=$(git diff --name-only "$PREV_COMMIT" "$NEW_COMMIT" 2>/dev/null || echo "")
fi

REBUILD_WEB=false
REBUILD_API=false
RUN_MIGRATE=false

if [ -n "$CHANGED" ]; then
  if echo "$CHANGED" | grep -qE "^services/web/|^docker/node/"; then
    REBUILD_WEB=true
  fi
  if echo "$CHANGED" | grep -qE "^services/api/|^docker/php/"; then
    REBUILD_API=true
  fi
  if echo "$CHANGED" | grep -q "^services/api/database/migrations/"; then
    RUN_MIGRATE=true
  fi
fi

echo " Rebuild web: $REBUILD_WEB  |  Rebuild api: $REBUILD_API  |  Migrate: $RUN_MIGRATE"
echo "----------------------------------------"

BUILD_ARGS="--build-arg CACHEBUST=$NEW_COMMIT"

if [ "$REBUILD_WEB" = true ] && [ "$REBUILD_API" = true ]; then
  $COMPOSE build $BUILD_ARGS web api
  $COMPOSE up -d --no-deps web api
elif [ "$REBUILD_WEB" = true ]; then
  $COMPOSE build $BUILD_ARGS web
  $COMPOSE up -d --no-deps web
elif [ "$REBUILD_API" = true ]; then
  $COMPOSE build $BUILD_ARGS api
  $COMPOSE up -d --no-deps api
else
  echo " Nothing to rebuild."
fi

if [ "$REBUILD_API" = true ]; then
  echo "Waiting for API to be ready..."
  for i in $(seq 1 15); do
    if $COMPOSE exec -T api php -r "exit(0);" 2>/dev/null; then
      break
    fi
    sleep 2
  done
fi

$COMPOSE exec -T api php artisan migrate --force
echo "Migration done."

# Record successful build commit — this is the baseline for next deploy's diff
echo "$NEW_COMMIT" > "$LAST_BUILD_FILE"

echo " Deploy finished: $(date -Iseconds)"
echo "========================================"
