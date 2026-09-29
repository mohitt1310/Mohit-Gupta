# AI Training System (Training Report & Assessment Management System)

Comprehensive corporate portal for Graduate Engineer Trainee (GET) and Diploma Engineer Trainee (DET) programs, featuring daily/weekly reporting, assessment tracking, review workflows, compliance analytics, Google Sheets live integration, and cross-environment synchronization.

---

## Environments and data sync

### 1. Root Cause Summary
- **Isolated Storage Volumes**: When running in dual environments (e.g., a deployed Cloud Run instance and a local developer laptop), each environment maintains its own isolated database/file store.
- **Data & Upload Separation**:
  - User accounts, quizzes, reports, and trainee records written on the **DEPLOYED** instance remain in the deployed server's storage (`/app/applet/data/store.json` / remote DB).
  - Uploaded training documents (PDFs, DOCXs, PPTXs) are saved to the host/container's local uploads directory (`./data/uploads`).
  - Without an active sync bridge or shared database connection, the local laptop cannot see data authored in the deployed instance.

---

### 2. Synchronization Options

#### Option A — Local Frontend with Deployed Backend (Recommended for UI & Rapid Dev)
- **Concept**: Run the React frontend locally on your laptop while connecting its API calls directly to the deployed backend URL.
- **Setup**:
  In your local frontend environment file (`.env` or `.env.development`):
  ```bash
  VITE_API_BASE_URL=https://ais-dev-2fmmamqij3vwkwqihexofz-799321273571.asia-southeast1.run.app
  ```
- **CORS Support**: The backend server is pre-configured with CORS headers allowing cross-origin requests from local origins (`http://localhost:3000`, `http://localhost:5173`, etc.).
- **Pros**: Zero data duplication, zero sync delays, and instant visibility into all deployed records.

#### Option B — Shared Hosted Database (Recommended for Production & Multi-Developer Teams)
- **Concept**: Move persistence to a single managed cloud database (e.g., Neon, Supabase, Cloud SQL PostgreSQL) accessible by both deployed containers and local instances.
- **Setup**:
  1. Configure `DATABASE_URL` with SSL enforcement in `.env`:
     ```bash
     DATABASE_URL="postgresql://user:password@cloud-db-host.com:5432/training_db?sslmode=require"
     ```
  2. Use separate schemas or prefixes (e.g., `prod` vs. `dev_local`) to prevent test workflows from corrupting production tables.
  3. Store uploaded documents in an S3-compatible cloud object store (e.g., Cloud Storage / AWS S3) rather than local container volumes.

#### Option C — One-Way Data & Document Copy (Recommended for Offline Development)
- **Concept**: Pull an automated snapshot from the deployed instance and ingest it into your local environment on demand.
- **How to Run**:
  On your local laptop:
  ```bash
  # 1. Dry run to inspect record disparity before making changes
  ./scripts/sync_data.sh --dry-run

  # 2. Execute sync (automatically creates a local backup first)
  ./scripts/sync_data.sh
  ```
  Or using the cross-platform Python sync engine:
  ```bash
  python3 ./scripts/sync_data.py
  ```

---

### 3. Step-by-Step Data Sync Guide

#### Step 1: Pre-Sync Safety Backup
Before syncing or restoring, always take a timestamped backup of your local database/store:
```bash
# Export local state:
./scripts/export_db.sh
# Creates: ./data/backups/store_export_<TIMESTAMP>.json
# And:     ./data/backups/db_export_<TIMESTAMP>.sql (if PostgreSQL is running)
```

#### Step 2: Running the Synchronization
```bash
# Pull all users, daily reports, weekly reports, and uploaded documents
./scripts/sync_data.sh
```

#### Step 3: Verification Checklist
After syncing, verify parity across both environments:
1. **User Accounts Match**: Verify that user accounts registered on deployed (e.g. `sattu`, `get1@uttam-bharat.com`) appear in the Admin Users view on the local instance.
2. **Report & Quiz Counts Match**: Check that daily reports (28 records) and weekly reports (2 records) match the deployed dashboard metrics.
3. **Uploaded Documents Open Locally**: Verify that uploaded training manuals or assessment attachments in `./data/uploads` can be previewed without 404 errors.
4. **Live Synchronization**: Create a test record or update a status on deployed; verify that the local client updates in real time via the SSE/polling bridge.

---

### 4. Code & Migration Drift Prevention

1. **Git Commit Parity**:
   Ensure both machines are synchronized with the same commit:
   ```bash
   git fetch origin
   git status
   git log -1 --oneline
   ```
2. **Database Schema Migrations**:
   When schema definitions change, use migration tooling (e.g., Alembic for SQLAlchemy or migration scripts) rather than unmanaged `create_all()`. Apply migrations across both environments before running sync scripts.
3. **Uploads Storage Best Practice**:
   For distributed setups, point `STORAGE_BACKEND=s3` and configure shared object storage so files uploaded from any client are globally available.
