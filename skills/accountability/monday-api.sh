#!/bin/bash
# Monday.com API helper for Accountability board
set -euo pipefail

TOKEN=$(grep MONDAY_API_TOKEN ~/.openclaw/.env | cut -d= -f2)
BOARD=5092401929
API="https://api.monday.com/v2"

query() {
  curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -H "Authorization: $TOKEN" \
    -d "{\"query\": \"$1\"}"
}

case "${1:-help}" in
  list)
    query "{ boards(ids: $BOARD) { items_page(limit: 50) { items { id name column_values { id text value } updates(limit: 3) { body created_at } } } } }" | jq .
    ;;
  update)
    ITEM_ID="$2"
    BODY="$3"
    query "mutation { create_update(item_id: $ITEM_ID, body: \"$BODY\") { id } }" | jq .
    ;;
  checked)
    ITEM_ID="$2"
    DATE=$(date +%Y-%m-%d)
    query "mutation { change_column_value(board_id: $BOARD, item_id: $ITEM_ID, column_id: \\\"date_mm0y8p9j\\\", value: \\\"{\\\\\\\"date\\\\\\\":\\\\\\\"$DATE\\\\\\\"}\\\") { id } }" | jq .
    ;;
  status)
    ITEM_ID="$2"
    LABEL="$3"
    query "mutation { change_column_value(board_id: $BOARD, item_id: $ITEM_ID, column_id: \\\"color_mm0yr4nm\\\", value: \\\"{\\\\\\\"label\\\\\\\":\\\\\\\"$LABEL\\\\\\\"}\\\") { id } }" | jq .
    ;;
  *)
    echo "Usage: $0 {list|update <id> <html>|checked <id>|status <id> <label>}"
    ;;
esac
