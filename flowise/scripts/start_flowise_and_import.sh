#!/usr/bin/env bash
# Start Flowise (native) with envs, wait for UI, and try importing a flow JSON

set -euo pipefail

FLOWISE_PORT=${FLOWISE_PORT:-3000}
FLOWISE_HOST=${FLOWISE_HOST:-localhost}
FLOWISE_UI_URL="http://${FLOWISE_HOST}:${FLOWISE_PORT}"
FLOWISE_PROXY_KEY=${FLOWISE_PROXY_KEY:-8b7f6c9f2d4e1a3b5c7d0e8f9a1b2c3d}
HTTP_ALLOW_LIST=${HTTP_ALLOW_LIST:-localhost,127.0.0.1,host.docker.internal,localhost:3005}
FLOW_JSON_PATH=${1:-"$(dirname "$0")/../agentic_flow_v2_native_docker.json"}

echo "Using Flowise UI: $FLOWISE_UI_URL"
echo "Flow JSON: $FLOW_JSON_PATH"

export FLOWISE_PROXY_KEY
export HTTP_ALLOW_LIST

SUCCESS=0

echo "Starting Flowise (npx flowise start) in background..."
npx flowise start &
FLOWISE_PID=$!

cleanup() {
  if [ "$SUCCESS" -eq 0 ]; then
    echo "Stopping Flowise..."
    kill $FLOWISE_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "Waiting for Flowise UI to be available at $FLOWISE_UI_URL ..."
for i in {1..60}; do
  if curl -sSf "$FLOWISE_UI_URL" >/dev/null 2>&1; then
    echo "Flowise UI is up"
    break
  fi
  sleep 1
done

if ! curl -sSf "$FLOWISE_UI_URL" >/dev/null 2>&1; then
  echo "Flowise UI did not become available; check 'npx flowise start' output" >&2
  exit 1
fi

echo "Attempting to import flow JSON..."

# Try a list of likely import endpoints and methods
ENDPOINTS=(
  "/api/flows/import"
  "/api/flow/import"
  "/api/flows"
  "/api/flow"
  "/api/import"
)

for ep in "${ENDPOINTS[@]}"; do
  url="$FLOWISE_UI_URL$ep"
  echo "Trying import endpoint: $url"

  # Try multipart upload (common pattern)
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
    -H "x-flowise-key: $FLOWISE_PROXY_KEY" \
    -F "file=@${FLOW_JSON_PATH};type=application/json" || true)

  if [[ "$http_code" =~ ^20[0-9]$ ]]; then
    echo "Import succeeded via multipart POST to $url (HTTP $http_code)"
    echo "Flowise has started and the flow has been imported. Press Ctrl+C to stop."
    SUCCESS=1
    wait $FLOWISE_PID
    exit 0
  fi

  # Try raw JSON POST
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
    -H "Content-Type: application/json" \
    -H "x-flowise-key: $FLOWISE_PROXY_KEY" \
    --data-binary @"${FLOW_JSON_PATH}" || true)

  if [[ "$http_code" =~ ^20[0-9]$ ]]; then
    echo "Import succeeded via raw POST to $url (HTTP $http_code)"
    echo "Flowise has started and the flow has been imported. Press Ctrl+C to stop."
    SUCCESS=1
    wait $FLOWISE_PID
    exit 0
  fi
done

echo "Automatic import failed. Please import the flow manually in the Flowise UI: $FLOWISE_UI_URL"
echo "Open Flowise → Import Flow → Upload: $FLOW_JSON_PATH"
exit 1
