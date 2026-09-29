#!/usr/bin/env bash
# =============================================================================
# AI Training System - Database Import / Restore Utility
# =============================================================================
# Usage:
#   ./scripts/import_db.sh <path_to_backup_file>
# =============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path_to_sql_or_json_backup>"
  exit 1
fi

INPUT_FILE="$1"
if [ ! -f "$INPUT_FILE" ]; then
  echo "[-] File not found: $INPUT_FILE"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./data/backups"
mkdir -p "$BACKUP_DIR"

echo "================================================================="
echo " WARNING: RESTORE OPERATION"
echo " Target File: $INPUT_FILE"
echo "================================================================="
read -p "Are you sure you want to restore this data over your current state? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled."
  exit 0
fi

# Mandatory Pre-Restore Backup
echo -e "\n[1/2] Taking safety pre-restore backup..."
if [ -f "./data/store.json" ]; then
  cp "./data/store.json" "$BACKUP_DIR/pre_restore_safety_${TIMESTAMP}.json"
  echo "[+] Safety copy created: $BACKUP_DIR/pre_restore_safety_${TIMESTAMP}.json"
fi

# Restore depending on file extension
echo -e "\n[2/2] Applying restore..."
if [[ "$INPUT_FILE" == *.json ]]; then
  cp "$INPUT_FILE" "./data/store.json"
  echo "[+] Restored ./data/store.json from $INPUT_FILE"
elif [[ "$INPUT_FILE" == *.sql ]]; then
  if command -v docker >/dev/null 2>&1 && docker compose ps -q db >/dev/null 2>&1; then
    docker compose exec -T db psql -U postgres -d postgres < "$INPUT_FILE"
    echo "[+] Restored PostgreSQL database from $INPUT_FILE"
  else
    echo "[-] PostgreSQL container not running; cannot restore SQL dump."
    exit 1
  fi
else
  echo "[-] Unrecognized file format: $INPUT_FILE (expected .json or .sql)"
  exit 1
fi

echo -e "\n=== Restore Completed Successfully ==="
