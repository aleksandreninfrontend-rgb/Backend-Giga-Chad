#!/bin/sh
set -e

CONNECT_URL="${CONNECT_URL:-http://connect:8083}"
TEMPLATE_FILE="${TEMPLATE_FILE:-/outbox-connector.template.json}"
NAME="outbox-connector"
RENDERED="/tmp/outbox-connector.json"

# Defaults for local Docker Compose (override via env / .env)
DEBEZIUM_DB_HOSTNAME="${DEBEZIUM_DB_HOSTNAME:-postgres}"
DEBEZIUM_DB_PORT="${DEBEZIUM_DB_PORT:-5432}"
DEBEZIUM_DB_USER="${DEBEZIUM_DB_USER:-backend_giga_chad}"
DEBEZIUM_DB_PASSWORD="${DEBEZIUM_DB_PASSWORD:-backend_giga_chad}"
DEBEZIUM_DB_NAME="${DEBEZIUM_DB_NAME:-backend_giga_chad}"
DEBEZIUM_TOPIC_PREFIX="${DEBEZIUM_TOPIC_PREFIX:-backendgigachad}"

export DEBEZIUM_DB_HOSTNAME DEBEZIUM_DB_PORT DEBEZIUM_DB_USER \
  DEBEZIUM_DB_PASSWORD DEBEZIUM_DB_NAME DEBEZIUM_TOPIC_PREFIX

echo "Waiting for Kafka Connect at ${CONNECT_URL}..."
i=0
until curl -sf "${CONNECT_URL}/connectors" >/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 90 ]; then
    echo "Kafka Connect did not become ready in time"
    exit 1
  fi
  sleep 2
done

# Only substitute our Debezium_* vars — leave EventRouter ${routedByValue} alone.
envsubst '${DEBEZIUM_DB_HOSTNAME} ${DEBEZIUM_DB_PORT} ${DEBEZIUM_DB_USER} ${DEBEZIUM_DB_PASSWORD} ${DEBEZIUM_DB_NAME} ${DEBEZIUM_TOPIC_PREFIX}' \
  < "${TEMPLATE_FILE}" > "${RENDERED}"

echo "Ensuring connector '${NAME}' is registered..."
curl -sf -X DELETE "${CONNECT_URL}/connectors/${NAME}" >/dev/null 2>&1 || true
sleep 1

STATUS=$(curl -s -o /tmp/connect_resp.txt -w "%{http_code}" \
  -X POST "${CONNECT_URL}/connectors" \
  -H "Content-Type: application/json" \
  --data @"${RENDERED}")

echo "HTTP ${STATUS}"
echo "Connector '${NAME}'"

if [ "$STATUS" != "201" ] && [ "$STATUS" != "200" ]; then
  ERROR_MSG=$(sed -n 's/.*"message"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' /tmp/connect_resp.txt | head -n 1)
  if [ -n "$ERROR_MSG" ]; then
    echo "Failed to register connector: ${ERROR_MSG}"
  else
    echo "Failed to register connector (response redacted)"
  fi
  exit 1
fi

echo "Connector '${NAME}' is ready"
