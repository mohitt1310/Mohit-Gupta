#!/usr/bin/env bash
# =============================================================================
# AI Training System - Database Export Utility
# =============================================================================
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./data/backups"
mkdir -p "$BACKUP_DIR"

echo "=== Exporting Database State ==="

# Check if PostgreSQL is available locally
if command -v docker >/dev/null 2>&1 && docker compose ps -q db >/dev/null 2>&1; then
  OUTPUT_FILE="$BACKUP_DIR/db_export_${TIMESTAMP}.sql"
  echo "Dumping PostgreSQL database..."
  docker compose exec -T db pg_dump -U postgres -d postgres > "$OUTPUT_FILE"
  echo "[+] PostgreSQL dump saved to: $OUTPUT_FILE"
fi

# Export store.json
if [ -f "./data/store.json" ]; then
  OUTPUT_JSON="$BACKUP_DIR/store_export_${TIMESTAMP}.json"
  cp "./data/store.json" "$OUTPUT_JSON"
  echo "[+] Store JSON export saved to: $OUTPUT_JSON"
fi

echo "=== Export Complete ==="
