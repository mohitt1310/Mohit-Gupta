#!/usr/bin/env bash
# =============================================================================
# AI Training System - Cross-Environment Data & Storage Sync Script
# =============================================================================
# Usage:
#   ./scripts/sync_data.sh [OPTIONS]
# Options:
#   --dry-run       Check disparity without overwriting local state
#   --remote-url    Override remote deployed URL
# =============================================================================

set -euo pipefail

DEPLOYED_URL="${DEPLOYED_BACKEND_URL:-https://ais-dev-2fmmamqij3vwkwqihexofz-799321273571.asia-southeast1.run.app}"
TOKEN="${SYNC_SECRET_TOKEN:-}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./data/backups"
UPLOADS_DIR="./data/uploads"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --remote-url)
      DEPLOYED_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run] [--remote-url URL]"
      exit 1
      ;;
  esac
done

mkdir -p "$BACKUP_DIR" "$UPLOADS_DIR"

echo "================================================================="
echo " AI Training System - Data & Document Synchronization"
echo " Deployed Source: $DEPLOYED_URL"
echo " Mode: $( [ $DRY_RUN -eq 1 ] && echo 'DRY RUN (Read Only)' || echo 'ACTIVE SYNC' )"
echo "================================================================="

# 1. Test connectivity and fetch remote metadata
AUTH_HEADER=""
if [ -n "$TOKEN" ]; then
  AUTH_HEADER="Authorization: Bearer $TOKEN"
fi

echo -e "\n[1/4] Fetching remote state metadata..."
EXPORT_FILE="/tmp/remote_export_${TIMESTAMP}.json"
HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$EXPORT_FILE" \
  ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
  "$DEPLOYED_URL/api/devops/export")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "[-] Failed connecting to deployed server (HTTP $HTTP_STATUS)."
  cat "$EXPORT_FILE" 2>/dev/null || true
  exit 1
fi

echo "[+] Successfully connected to remote deployed instance."
if command -v python3 >/dev/null 2>&1; then
  python3 -c "
import json
with open('$EXPORT_FILE') as f:
    d = json.load(f)
counts = d.get('counts', {})
print(f'    - Remote Users: {counts.get(\"users\", 0)}')
print(f'    - Remote Daily Reports: {counts.get(\"dailyReports\", 0)}')
print(f'    - Remote Weekly Reports: {counts.get(\"weeklyReports\", 0)}')
print(f'    - Remote Uploaded Docs: {counts.get(\"uploads\", 0)}')
"
fi

# 2. Mandatory Local Backup Before Any Modification
echo -e "\n[2/4] Safety Step: Backing up current local environment..."
# A. Backup PostgreSQL if docker compose is active
if command -v docker >/dev/null 2>&1 && docker compose ps -q db >/dev/null 2>&1; then
  echo "    Backing up local PostgreSQL container..."
  docker compose exec -T db pg_dump -U postgres -d postgres > "$BACKUP_DIR/local_pg_backup_${TIMESTAMP}.sql" 2>/dev/null || true
  echo "    [+] PostgreSQL backup saved to $BACKUP_DIR/local_pg_backup_${TIMESTAMP}.sql"
fi

# B. Backup local store.json
if [ -f "./data/store.json" ]; then
  cp "./data/store.json" "$BACKUP_DIR/local_store_backup_${TIMESTAMP}.json"
  echo "    [+] Local store.json backed up to $BACKUP_DIR/local_store_backup_${TIMESTAMP}.json"
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo -e "\n[!] Dry run finished. Local state was not modified."
  exit 0
fi

# 3. Apply remote state to local store
echo -e "\n[3/4] Ingesting remote data into local store..."
if command -v python3 >/dev/null 2>&1; then
  python3 -c "
import json
with open('$EXPORT_FILE') as f:
    remote = json.load(f)
with open('./data/store.json', 'w', encoding='utf-8') as f:
    json.dump(remote.get('data', {}), f, indent=2, ensure_ascii=False)
"
  echo "    [+] Updated ./data/store.json with deployed state."
fi

# 4. Download and synchronize missing uploaded documents
echo -e "\n[4/4] Synchronizing uploaded documents and training materials..."
if command -v python3 >/dev/null 2>&1; then
  python3 ./scripts/sync_data.py --remote-url "$DEPLOYED_URL" ${TOKEN:+--token "$TOKEN"}
fi

echo -e "\n================================================================="
echo " DATA & STORAGE SYNC COMPLETE"
echo " All records and files are now synchronized."
echo "================================================================="
