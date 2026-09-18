#!/usr/bin/env bash
# Starts the API, runs the smoke test, stops the API. One command, one exit code.
set -uo pipefail
cd "$(dirname "$0")/.."
export $(grep -v '^#' .env | xargs) 2>/dev/null
DATABASE_URL="$DATABASE_URL" ./scripts/reset-db.sh
npx ts-node-dev --transpile-only --project tsconfig.api.json api/server.ts > /tmp/ceisd-api.log 2>&1 &
API_PID=$!
for i in $(seq 1 40); do curl -sf "http://localhost:${PORT:-4000}/api/health" >/dev/null && break; sleep 0.5; done
npx ts-node-dev --transpile-only --project tsconfig.api.json scripts/smoke.ts 2>&1 | grep -v -i deprecat
CODE=${PIPESTATUS[0]}
kill $API_PID 2>/dev/null; wait $API_PID 2>/dev/null
[ "$CODE" != "0" ] && { echo "--- api log tail ---"; grep -v -i deprecat /tmp/ceisd-api.log | tail -30; }
exit $CODE
