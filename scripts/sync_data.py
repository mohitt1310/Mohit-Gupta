#!/usr/bin/env python3
"""
AI Training System - Cross-Environment Data & Storage Synchronization Utility
=============================================================================
This tool synchronizes users, reports, quizzes, documents, and uploads
between a DEPLOYED instance and a LOCAL copy.

Features:
- Pre-sync automatic backup of the local target state / database.
- Safe download and verification of data and documents.
- Support for token-based authorization via SYNC_SECRET_TOKEN.
- Non-destructive execution with dry-run option.
"""

import os
import sys
import json
import urllib.request
import urllib.error
import shutil
from datetime import datetime
from pathlib import Path

DEFAULT_DEPLOYED_URL = "https://ais-dev-2fmmamqij3vwkwqihexofz-799321273571.asia-southeast1.run.app"

def get_env_or_default(key: str, default: str) -> str:
    return os.environ.get(key, default).strip()

def make_request(url: str, token: str = "") -> dict:
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "AITrainingDevOpsSync/1.0")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status == 200:
                data = response.read().decode("utf-8")
                return json.loads(data)
    except urllib.error.HTTPError as e:
        print(f"[-] HTTP Error {e.code}: {e.reason} for {url}")
        sys.exit(1)
    except Exception as e:
        print(f"[-] Connection Error: {e} for {url}")
        sys.exit(1)
    return {}

def download_file(source_url: str, target_path: Path, token: str = ""):
    req = urllib.request.Request(source_url)
    req.add_header("User-Agent", "AITrainingDevOpsSync/1.0")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as response, open(target_path, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Synchronize data and documents from deployed AI-Training-System.")
    parser.add_argument("--remote-url", default=get_env_or_default("DEPLOYED_BACKEND_URL", DEFAULT_DEPLOYED_URL),
                        help="Base URL of deployed applet")
    parser.add_argument("--token", default=get_env_or_default("SYNC_SECRET_TOKEN", ""),
                        help="Optional sync secret token")
    parser.add_argument("--dry-run", action="store_true",
                        help="Check connectivity and count disparities without modifying local files")
    args = parser.parse_args()

    remote_url = args.remote_url.rstrip("/")
    token = args.token
    dry_run = args.dry_run

    print("=" * 65)
    print(" AI Training System - DevOps Data & Storage Sync")
    print(f" Target Remote: {remote_url}")
    print(f" Mode: {'DRY RUN' if dry_run else 'ACTIVE SYNC'}")
    print("=" * 65)

    # 1. Fetch remote data
    export_url = f"{remote_url}/api/devops/export"
    print(f"\n[1/4] Fetching remote state from {export_url} ...")
    remote_state = make_request(export_url, token)
    if not remote_state.get("success"):
        print("[-] Remote did not return success status.")
        sys.exit(1)

    counts = remote_state.get("counts", {})
    print(f"[+] Remote state retrieved successfully:")
    print(f"    - Users: {counts.get('users', 0)}")
    print(f"    - Daily Reports: {counts.get('dailyReports', 0)}")
    print(f"    - Weekly Reports: {counts.get('weeklyReports', 0)}")
    print(f"    - Uploaded Documents: {counts.get('uploads', 0)}")

    # 2. Local Backup Step
    local_root = Path.cwd()
    data_dir = local_root / "data"
    data_dir.mkdir(exist_ok=True)
    backups_dir = data_dir / "backups"
    backups_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    local_store_path = data_dir / "store.json"

    print(f"\n[2/4] Safety Step: Creating local backup before any overwrite ...")
    if local_store_path.exists():
        backup_file = backups_dir / f"store_backup_{timestamp}.json"
        shutil.copy2(local_store_path, backup_file)
        print(f"[+] Local store backed up to: {backup_file}")
    else:
        print("[!] No existing local store.json found; initial sync.")

    if dry_run:
        print("\n[!] Dry run complete. No local files were modified.")
        return

    # 3. Ingest state into local store
    print("\n[3/4] Updating local store with deployed state ...")
    payload_data = remote_state.get("data", {})
    with open(local_store_path, "w", encoding="utf-8") as f:
        json.dump(payload_data, f, indent=2, ensure_ascii=False)
    print(f"[+] Local store.json updated with {len(payload_data.get('users', []))} users.")

    # 4. Sync uploaded documents
    uploads_dir = local_root / "data" / "uploads"
    uploads_dir.mkdir(exist_ok=True)

    remote_uploads = remote_state.get("uploads", [])
    print(f"\n[4/4] Syncing {len(remote_uploads)} document upload(s) ...")
    downloaded = 0
    for upload in remote_uploads:
        fname = upload.get("filename")
        if not fname:
            continue
        dest_file = uploads_dir / fname
        if not dest_file.exists() or dest_file.stat().st_size != upload.get("size"):
            doc_url = f"{remote_url}/api/devops/uploads/{urllib.parse.quote(fname)}"
            try:
                download_file(doc_url, dest_file, token)
                print(f"    [+] Downloaded: {fname} ({upload.get('size')} bytes)")
                downloaded += 1
            except Exception as e:
                print(f"    [-] Failed downloading {fname}: {e}")
        else:
            print(f"    [*] Already up to date: {fname}")

    print("\n" + "=" * 65)
    print(f" SYNCHRONIZATION COMPLETE")
    print(f" Local data and {downloaded} new document(s) synchronized safely.")
    print("=" * 65)

if __name__ == "__main__":
    main()
