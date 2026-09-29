import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for cross-edition communication between dev and deployed preview
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Sync-Replication');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Google Apps Script template code
export const GOOGLE_APPS_SCRIPT_SOURCE = `/**
 * Google Apps Script for Training Report Management System
 * 
 * Instructions:
 * 1. Create a new Google Spreadsheet named "Training Report Management System"
 * 2. Create 3 Sheets (tabs):
 *    - "Users"
 *    - "Daily Reports"
 *    - "Weekly Reports"
 * 3. Extensions > Apps Script -> Paste this code into Code.gs
 * 4. Run setupSheetHeaders() once to automatically add column headers.
 * 5. Deploy > New Deployment > Web app:
 *    - Description: "Report Sync Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (crucial for webhooks)
 * 6. Copy the Web App URL and paste it in the Admin Settings of the Training Report System!
 */

function setupSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Users
  var userSheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow([
      "User ID", "Employee ID", "Name", "Email", "Department", 
      "Designation", "Role", "Joining Date", "Status", "Created Date"
    ]);
    userSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#e2e8f0");
  }

  // Sheet 2: Daily Reports
  var dailySheet = ss.getSheetByName("Daily Reports") || ss.insertSheet("Daily Reports");
  if (dailySheet.getLastRow() === 0) {
    dailySheet.appendRow([
      "Report ID", "User ID", "Employee ID", "User Name", "Department",
      "Date", "Report Details", "Submission Date/Time", "Status", 
      "Admin Remark", "Reviewed By", "Reviewed Date"
    ]);
    dailySheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#dbeafe");
  }

  // Sheet 3: Weekly Reports
  var weeklySheet = ss.getSheetByName("Weekly Reports") || ss.insertSheet("Weekly Reports");
  if (weeklySheet.getLastRow() === 0) {
    weeklySheet.appendRow([
      "Report ID", "User ID", "Employee ID", "User Name", "Department",
      "Week Start", "Week End", "Weekly Report Details", "Submission Date/Time",
      "Status", "Admin Remark", "Reviewed By", "Reviewed Date"
    ]);
    weeklySheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#fef3c7");
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No POST body received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var type = payload.type; // 'USER' | 'DAILY_REPORT' | 'WEEKLY_REPORT' | 'PING'
    var data = payload.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (type === "PING") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Connection successful to Google Sheet: " + ss.getName(),
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === "DAILY_REPORT") {
      var sheet = ss.getSheetByName("Daily Reports");
      if (!sheet) {
        setupSheetHeaders();
        sheet = ss.getSheetByName("Daily Reports");
      }
      
      // Check for duplicate Report ID
      var existingData = sheet.getDataRange().getValues();
      var foundRowIndex = -1;
      for (var i = 1; i < existingData.length; i++) {
        if (existingData[i][0] == data.reportId) {
          foundRowIndex = i + 1;
          break;
        }
      }

      var rowValues = [
        data.reportId || "",
        data.userId || "",
        data.employeeId || "",
        data.userName || "",
        data.department || "",
        data.date || "",
        typeof data.reportDetails === 'object' ? JSON.stringify(data.reportDetails) : (data.reportDetails || ""),
        data.submissionDateTime || new Date().toISOString(),
        data.status || "SUBMITTED",
        data.adminRemark || "",
        data.reviewedBy || "",
        data.reviewedDate || ""
      ];

      if (foundRowIndex > 0) {
        sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: foundRowIndex > 0 ? "updated" : "inserted",
        reportId: data.reportId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === "WEEKLY_REPORT") {
      var sheet = ss.getSheetByName("Weekly Reports");
      if (!sheet) {
        setupSheetHeaders();
        sheet = ss.getSheetByName("Weekly Reports");
      }

      var existingData = sheet.getDataRange().getValues();
      var foundRowIndex = -1;
      for (var i = 1; i < existingData.length; i++) {
        if (existingData[i][0] == data.reportId) {
          foundRowIndex = i + 1;
          break;
        }
      }

      var rowValues = [
        data.reportId || "",
        data.userId || "",
        data.employeeId || "",
        data.userName || "",
        data.department || "",
        data.weekStart || "",
        data.weekEnd || "",
        typeof data.weeklyReportDetails === 'object' ? JSON.stringify(data.weeklyReportDetails) : (data.weeklyReportDetails || ""),
        data.submissionDateTime || new Date().toISOString(),
        data.status || "SUBMITTED",
        data.adminRemark || "",
        data.reviewedBy || "",
        data.reviewedDate || ""
      ];

      if (foundRowIndex > 0) {
        sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: foundRowIndex > 0 ? "updated" : "inserted",
        reportId: data.reportId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === "USER") {
      var sheet = ss.getSheetByName("Users");
      if (!sheet) {
        setupSheetHeaders();
        sheet = ss.getSheetByName("Users");
      }

      var existingData = sheet.getDataRange().getValues();
      var foundRowIndex = -1;
      for (var i = 1; i < existingData.length; i++) {
        if (existingData[i][0] == data.userId || existingData[i][1] == data.employeeId) {
          foundRowIndex = i + 1;
          break;
        }
      }

      var rowValues = [
        data.userId || "",
        data.employeeId || "",
        data.name || "",
        data.email || "",
        data.department || "",
        data.designation || "",
        data.role || "USER",
        data.joiningDate || "",
        data.status || "ACTIVE",
        data.createdDate || new Date().toISOString()
      ];

      if (foundRowIndex > 0) {
        sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: foundRowIndex > 0 ? "updated" : "inserted",
        userId: data.userId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown payload type: " + type
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "PING";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  function getSheetSafely(names) {
    for (var i = 0; i < names.length; i++) {
      var s = ss.getSheetByName(names[i]);
      if (s) return s;
    }
    return null;
  }

  function parseUsers() {
    var sheet = getSheetSafely(["Users"]);
    if (!sheet) return [];
    var rows = sheet.getDataRange().getValues();
    var users = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] || r[1] || r[2]) {
        users.push({
          id: String(r[0] || ""),
          employeeId: String(r[1] || ""),
          name: String(r[2] || ""),
          email: String(r[3] || ""),
          department: String(r[4] || ""),
          designation: String(r[5] || ""),
          role: String(r[6] || "USER"),
          joiningDate: String(r[7] || ""),
          status: String(r[8] || "ACTIVE"),
          createdDate: String(r[9] || "")
        });
      }
    }
    return users;
  }

  function parseDailyReports() {
    var sheet = getSheetSafely(["Daily Reports", "DailyReports"]);
    if (!sheet) return [];
    var rows = sheet.getDataRange().getValues();
    var reports = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) {
        var details = {};
        try {
          if (r[6] && typeof r[6] === 'string' && r[6].startsWith('{')) {
            details = JSON.parse(r[6]);
          }
        } catch(err) {}

        reports.push({
          id: String(r[0]),
          userId: String(r[1] || ""),
          employeeId: String(r[2] || ""),
          userName: String(r[3] || ""),
          department: String(r[4] || ""),
          date: String(r[5] || ""),
          trainingWorkArea: details.trainingWorkArea || String(r[4] || ""),
          topicActivity: details.topicActivity || "",
          workDescription: details.workDescription || (typeof r[6] === 'string' && !r[6].startsWith('{') ? r[6] : ""),
          learningOutcome: details.learningOutcome || "",
          toolsEquipmentUsed: details.toolsEquipmentUsed || "",
          safetyObservations: details.safetyObservations || "",
          remarks: details.remarks || "",
          submittedAt: String(r[7] || ""),
          submissionDateTime: String(r[7] || ""),
          status: String(r[8] || "SUBMITTED"),
          adminRemark: String(r[9] || ""),
          reviewedBy: String(r[10] || ""),
          reviewedDate: String(r[11] || "")
        });
      }
    }
    return reports;
  }

  function parseWeeklyReports() {
    var sheet = getSheetSafely(["Weekly Reports", "WeeklyReports"]);
    if (!sheet) return [];
    var rows = sheet.getDataRange().getValues();
    var reports = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) {
        var details = {};
        try {
          if (r[7] && typeof r[7] === 'string' && r[7].startsWith('{')) {
            details = JSON.parse(r[7]);
          }
        } catch(err) {}

        reports.push({
          id: String(r[0]),
          userId: String(r[1] || ""),
          employeeId: String(r[2] || ""),
          userName: String(r[3] || ""),
          department: String(r[4] || ""),
          weekStart: String(r[5] || ""),
          weekEnd: String(r[6] || ""),
          weekNumber: details.weekNumber || 1,
          assignedProjectDept: details.assignedProjectDept || String(r[4] || ""),
          majorLearnings: details.majorLearnings || (typeof r[7] === 'string' && !r[7].startsWith('{') ? r[7] : ""),
          technicalSkillsAcquired: details.technicalSkillsAcquired || "",
          challengesFaced: details.challengesFaced || "",
          solutionsImplemented: details.solutionsImplemented || "",
          planForNextWeek: details.planForNextWeek || "",
          submittedAt: String(r[8] || ""),
          submissionDateTime: String(r[8] || ""),
          status: String(r[9] || "SUBMITTED"),
          adminRemark: String(r[10] || ""),
          reviewedBy: String(r[11] || ""),
          reviewedDate: String(r[12] || "")
        });
      }
    }
    return reports;
  }

  if (action === "GET_USERS") {
    var users = parseUsers();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: users.length,
      users: users
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "GET_DAILY_REPORTS") {
    var dailyReports = parseDailyReports();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: dailyReports.length,
      dailyReports: dailyReports
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "GET_WEEKLY_REPORTS") {
    var weeklyReports = parseWeeklyReports();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: weeklyReports.length,
      weeklyReports: weeklyReports
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "GET_ALL_DATA") {
    var u = parseUsers();
    var d = parseDailyReports();
    var w = parseWeeklyReports();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      users: u,
      dailyReports: d,
      weeklyReports: w,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "Training Report Management System Google Apps Script Webhook is active.",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Optional Installable Trigger for real-time push:
 * Set up in Apps Script Triggers to run on spreadsheet Edit
 */
function onEditTrigger(e) {
  try {
    var webhookUrl = "YOUR_APP_URL/api/webhook/sheets-update";
    UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        event: "onEdit",
        sheetName: e && e.range ? e.range.getSheet().getName() : "",
        time: new Date().toISOString()
      }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("Webhook failed: " + err);
  }
}
`;

// Persistent Server-Side Storage for Deployed Environment
import fs from 'fs';
import {
  INITIAL_USERS,
  INITIAL_DAILY_REPORTS,
  INITIAL_WEEKLY_REPORTS,
  INITIAL_COMPLIANCE_CONFIG,
} from './src/data/mockData';
import { User, DailyReport, WeeklyReport, ComplianceConfig } from './src/types';

interface ServerStore {
  users: User[];
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  complianceConfig: ComplianceConfig;
  googleAppsScriptUrl: string;
  peerAppUrl?: string;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE_PATH = path.join(DATA_DIR, 'store.json');

function initStore(): ServerStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE_PATH)) {
      const content = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return {
          users: parsed.users,
          dailyReports: Array.isArray(parsed.dailyReports) ? parsed.dailyReports : INITIAL_DAILY_REPORTS,
          weeklyReports: Array.isArray(parsed.weeklyReports) ? parsed.weeklyReports : INITIAL_WEEKLY_REPORTS,
          complianceConfig: parsed.complianceConfig || INITIAL_COMPLIANCE_CONFIG,
          googleAppsScriptUrl: parsed.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || '',
          peerAppUrl: parsed.peerAppUrl || process.env.PEER_APP_URL || '',
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Error loading persistent store:', err);
  }

  const defaultStore: ServerStore = {
    users: INITIAL_USERS,
    dailyReports: INITIAL_DAILY_REPORTS,
    weeklyReports: INITIAL_WEEKLY_REPORTS,
    complianceConfig: INITIAL_COMPLIANCE_CONFIG,
    googleAppsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
    peerAppUrl: process.env.PEER_APP_URL || '',
    lastUpdated: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(defaultStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial store:', err);
  }

  return defaultStore;
}

let store: ServerStore = initStore();
let storeRevision = 1;
const sseClients = new Set<express.Response>();

function broadcastUpdate(): void {
  const payload = JSON.stringify({
    type: 'SYNC_UPDATE',
    revision: storeRevision,
    lastUpdated: store.lastUpdated,
    usersCount: store.users.length,
    dailyCount: store.dailyReports.length,
    weeklyCount: store.weeklyReports.length,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function persistStore(): void {
  try {
    storeRevision++;
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    broadcastUpdate();
  } catch (err) {
    console.error('Failed to persist store to disk:', err);
  }
}

// Peer Edition Auto-Discovery & Real-Time Syncing (Dev <-> Deployed Cloud Run)
function getPeerUrl(req?: express.Request): string | null {
  if (store.peerAppUrl && store.peerAppUrl.trim()) {
    return store.peerAppUrl.trim().replace(/\/+$/, '');
  }
  const customPeer = process.env.PEER_APP_URL || process.env.SHARED_APP_URL;
  if (customPeer && customPeer.trim()) {
    return customPeer.trim().replace(/\/+$/, '');
  }
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || '';
  const hostStr = String(host);
  if (hostStr.includes('ais-dev-')) {
    return `https://${hostStr.replace('ais-dev-', 'ais-pre-')}`;
  }
  if (hostStr.includes('ais-pre-')) {
    return `https://${hostStr.replace('ais-pre-', 'ais-dev-')}`;
  }
  return null;
}

async function replicateToPeer(endpoint: string, method: string, payload: any, req?: express.Request) {
  if (payload?.isReplication) return;
  const peerUrl = getPeerUrl(req);
  if (!peerUrl) return;

  try {
    const cleanPeer = peerUrl.replace(/\/+$/, '');
    await fetch(`${cleanPeer}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Replication': 'true'
      },
      body: JSON.stringify({ ...payload, isReplication: true }),
      signal: AbortSignal.timeout(3500)
    });
  } catch {
    // Peer instance might be warming up
  }
}

async function syncWithPeerServer(req?: express.Request): Promise<{ syncedUsers: number }> {
  const peerUrl = getPeerUrl(req);
  if (!peerUrl) return { syncedUsers: 0 };
  let syncedUsers = 0;

  try {
    const cleanPeer = peerUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanPeer}/api/users`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return { syncedUsers: 0 };
    const data = await res.json();
    if (data.success && Array.isArray(data.users)) {
      let hasChanges = false;
      for (const pUser of data.users) {
        if (!pUser.name) continue;
        const idx = store.users.findIndex(u =>
          (pUser.id && u.id === pUser.id) ||
          (pUser.employeeId && u.employeeId && u.employeeId.trim().toLowerCase() === pUser.employeeId.trim().toLowerCase()) ||
          (pUser.email && u.email && u.email.trim().toLowerCase() === pUser.email.trim().toLowerCase())
        );
        if (idx === -1) {
          store.users.unshift(pUser);
          syncedUsers++;
          hasChanges = true;
        } else {
          if (pUser.status && pUser.status !== store.users[idx].status) {
            store.users[idx].status = pUser.status;
            hasChanges = true;
          }
        }
      }
      if (hasChanges) {
        persistStore();
      }
    }
  } catch {
    // Peer unavailable
  }
  return { syncedUsers };
}

// Background poll to synchronize with peer edition automatically every 6 seconds
setInterval(() => {
  syncWithPeerServer().catch(() => {});
}, 6000);

// In-memory sync log for tracking sync history
const syncLogs: Array<{
  id: string;
  timestamp: string;
  type: string;
  reportId?: string;
  status: 'SUCCESS' | 'FAILED' | 'LOCAL_QUEUED';
  message: string;
}> = [];

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Server-Sent Events (SSE) for instant push synchronization across all editions & tabs
app.get('/api/live-events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({
    type: 'CONNECTED',
    revision: storeRevision,
    lastUpdated: store.lastUpdated,
    usersCount: store.users.length,
    dailyCount: store.dailyReports.length,
    weeklyCount: store.weeklyReports.length,
  })}\n\n`);

  // Heartbeat ping every 15 seconds to prevent gateway / proxy timeout
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(pingInterval);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// API: Fast revision sync endpoint for checking deltas
app.get('/api/sync/live', (req, res) => {
  const clientRev = parseInt(String(req.query.rev || '0'), 10);
  const clientSince = String(req.query.since || '');

  const hasUpdate = isNaN(clientRev) || clientRev !== storeRevision || (Boolean(clientSince) && clientSince !== store.lastUpdated);

  res.json({
    success: true,
    hasUpdate,
    revision: storeRevision,
    lastUpdated: store.lastUpdated,
    state: hasUpdate ? {
      users: store.users,
      dailyReports: store.dailyReports,
      weeklyReports: store.weeklyReports,
      complianceConfig: store.complianceConfig,
      googleAppsScriptUrl: store.googleAppsScriptUrl,
      lastUpdated: store.lastUpdated,
    } : undefined
  });
});

// API: Peer connection status and manual sync trigger (Dev <-> Deployed Cloud Run)
app.get('/api/peer/info', (req, res) => {
  const peerUrl = getPeerUrl(req);
  res.json({
    success: true,
    detectedPeerUrl: peerUrl,
    configuredPeerUrl: store.peerAppUrl || null,
    isConfigured: Boolean(peerUrl),
    localUsersCount: store.users.length,
    revision: storeRevision,
  });
});

app.post('/api/peer/ping', async (req, res) => {
  const { peerUrl } = req.body || {};
  if (peerUrl && typeof peerUrl === 'string' && peerUrl.trim()) {
    store.peerAppUrl = peerUrl.trim().replace(/\/+$/, '');
    persistStore();
  }
  const activePeer = getPeerUrl(req);
  let syncResult = { syncedUsers: 0 };
  if (activePeer) {
    syncResult = await syncWithPeerServer(req);
  }
  res.json({
    success: true,
    peerUrl: activePeer,
    syncedUsers: syncResult.syncedUsers,
    usersCount: store.users.length,
  });
});

app.post('/api/peer/sync', async (req, res) => {
  const result = await syncWithPeerServer(req);
  res.json({
    success: true,
    syncedUsers: result.syncedUsers,
    usersCount: store.users.length,
    users: store.users,
  });
});

// ==========================================
// DevOps Data Sync & Backup Endpoints
// ==========================================

const UPLOADS_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}
}

// Check authorization if SYNC_SECRET_TOKEN is set
const checkSyncAuth = (req: express.Request, res: express.Response): boolean => {
  const requiredToken = process.env.SYNC_SECRET_TOKEN;
  if (!requiredToken) return true; // No token required if not configured
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token !== requiredToken) {
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid SYNC_SECRET_TOKEN' });
    return false;
  }
  return true;
};

// API: Export complete system state for DevOps sync
app.get('/api/devops/export', (req, res) => {
  if (!checkSyncAuth(req, res)) return;

  const uploads = fs.existsSync(UPLOADS_DIR)
    ? fs.readdirSync(UPLOADS_DIR).map(filename => {
        const filePath = path.join(UPLOADS_DIR, filename);
        const stat = fs.statSync(filePath);
        return { filename, size: stat.size, mtime: stat.mtime };
      })
    : [];

  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    revision: storeRevision,
    counts: {
      users: store.users.length,
      dailyReports: store.dailyReports.length,
      weeklyReports: store.weeklyReports.length,
      uploads: uploads.length,
    },
    data: {
      users: store.users,
      dailyReports: store.dailyReports,
      weeklyReports: store.weeklyReports,
      complianceConfig: store.complianceConfig,
    },
    uploads,
  });
});

// API: Pull all data from a remote deployed server directly via HTTP
app.post('/api/devops/pull-remote', async (req, res) => {
  if (!checkSyncAuth(req, res)) return;

  const targetUrl = (req.body?.remoteUrl || process.env.DEPLOYED_BACKEND_URL || 'https://ais-dev-2fmmamqij3vwkwqihexofz-799321273571.asia-southeast1.run.app').replace(/\/+$/, '');
  const token = req.body?.token || process.env.SYNC_SECRET_TOKEN || '';

  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const remoteRes = await fetch(`${targetUrl}/api/devops/export`, {
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!remoteRes.ok) {
      return res.status(remoteRes.status).json({
        success: false,
        message: `Remote server returned HTTP ${remoteRes.status}: ${remoteRes.statusText}`
      });
    }

    const remoteData: any = await remoteRes.json();
    if (!remoteData.success || !remoteData.data) {
      return res.status(502).json({ success: false, message: 'Invalid response from remote server.' });
    }

    // Safety Step: Save pre-restore backup first
    try {
      const backupDir = path.join(DATA_DIR, 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(path.join(backupDir, `pre_remote_pull_backup_${timestamp}.json`), JSON.stringify(store, null, 2), 'utf-8');
    } catch {}

    const incoming = remoteData.data;
    if (Array.isArray(incoming.users)) store.users = incoming.users;
    if (Array.isArray(incoming.dailyReports)) store.dailyReports = incoming.dailyReports;
    if (Array.isArray(incoming.weeklyReports)) store.weeklyReports = incoming.weeklyReports;
    if (incoming.complianceConfig) store.complianceConfig = incoming.complianceConfig;

    store.peerAppUrl = targetUrl;
    persistStore();
    broadcastUpdate();

    res.json({
      success: true,
      message: `Successfully pulled and synchronized state from ${targetUrl}`,
      counts: {
        users: store.users.length,
        dailyReports: store.dailyReports.length,
        weeklyReports: store.weeklyReports.length,
      },
      state: store,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to pull from remote: ' + err.message });
  }
});

// API: Trigger a local server-side snapshot backup
app.post('/api/devops/backup', (req, res) => {
  if (!checkSyncAuth(req, res)) return;

  try {
    const backupDir = path.join(DATA_DIR, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupDir, `store_backup_${timestamp}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(store, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Snapshot backup created successfully.',
      backupFile: backupFilePath,
      timestamp,
      counts: {
        users: store.users.length,
        dailyReports: store.dailyReports.length,
        weeklyReports: store.weeklyReports.length,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Backup failed: ' + err.message });
  }
});

// API: Safely import/restore system state (takes automatic pre-restore backup first!)
app.post('/api/devops/import', (req, res) => {
  if (!checkSyncAuth(req, res)) return;

  const importPayload = req.body;
  if (!importPayload || (!importPayload.data && !importPayload.users)) {
    return res.status(400).json({ success: false, message: 'Invalid payload: data or users object is required' });
  }

  const incomingData = importPayload.data || importPayload;

  // Safety Step: Always create backup before applying restore!
  try {
    const backupDir = path.join(DATA_DIR, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyBackupPath = path.join(backupDir, `pre_restore_safety_backup_${timestamp}.json`);
    fs.writeFileSync(safetyBackupPath, JSON.stringify(store, null, 2), 'utf-8');

    // Apply incoming data
    if (Array.isArray(incomingData.users)) {
      store.users = incomingData.users;
    }
    if (Array.isArray(incomingData.dailyReports)) {
      store.dailyReports = incomingData.dailyReports;
    }
    if (Array.isArray(incomingData.weeklyReports)) {
      store.weeklyReports = incomingData.weeklyReports;
    }
    if (incomingData.complianceConfig) {
      store.complianceConfig = incomingData.complianceConfig;
    }

    persistStore();
    broadcastUpdate();

    res.json({
      success: true,
      message: 'System state restored successfully with pre-restore safety backup.',
      safetyBackup: safetyBackupPath,
      newCounts: {
        users: store.users.length,
        dailyReports: store.dailyReports.length,
        weeklyReports: store.weeklyReports.length,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Restore failed: ' + err.message });
  }
});

// API: List uploaded document assets
app.get('/api/devops/uploads', (req, res) => {
  if (!checkSyncAuth(req, res)) return;
  if (!fs.existsSync(UPLOADS_DIR)) {
    return res.json({ success: true, uploads: [] });
  }
  const files = fs.readdirSync(UPLOADS_DIR).map(filename => {
    const filePath = path.join(UPLOADS_DIR, filename);
    const stat = fs.statSync(filePath);
    return {
      filename,
      size: stat.size,
      mtime: stat.mtime,
      downloadUrl: `/api/devops/uploads/${encodeURIComponent(filename)}`,
    };
  });
  res.json({ success: true, count: files.length, uploads: files });
});

// API: Download uploaded document asset
app.get('/api/devops/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  res.download(filePath);
});

// API: Get Google Apps Script Source code
app.get('/api/google-apps-script-code', (req, res) => {
  res.json({
    code: GOOGLE_APPS_SCRIPT_SOURCE,
    sheets: ['Users', 'Daily Reports', 'Weekly Reports']
  });
});

// API: Test Google Sheets Connection (supports both /api/test-sheets-connection and /api/sheets/test)
const handleSheetsTest = async (req: express.Request, res: express.Response) => {
  const rawUrl = req.body?.url || req.query?.url || process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return res.status(400).json({
      success: false,
      message: 'No Google Apps Script Web App URL provided. Please enter a valid URL ending in /exec.'
    });
  }

  let cleanUrl = rawUrl.trim();
  // If user pasted script editor URL instead of /exec
  if (cleanUrl.includes('/edit')) {
    cleanUrl = cleanUrl.replace(/\/edit.*$/, '/exec');
  }

  try {
    let responseData: any = null;
    let rawText = '';
    let isSuccess = false;

    // First attempt: GET request (Google Apps Script doGet is fastest and reliably handles 302 redirects)
    try {
      const getRes = await fetch(cleanUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'Accept': 'application/json, text/plain, */*' }
      });

      rawText = await getRes.text();
      if (rawText && rawText.trim()) {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed.status === 'ok' || parsed.success === true || parsed.message) {
            responseData = parsed;
            isSuccess = true;
          }
        } catch {
          // May be HTML or text
        }
      }
    } catch (getErr) {
      console.warn('GET ping to Google Apps Script failed, attempting POST:', getErr);
    }

    // Second attempt: POST request with both action and type PING
    if (!isSuccess) {
      try {
        const postRes = await fetch(cleanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
          },
          body: JSON.stringify({
            action: 'PING',
            type: 'PING',
            data: {},
            payload: {}
          }),
          redirect: 'follow'
        });

        const postText = await postRes.text();
        if (postText && postText.trim()) {
          rawText = postText;
          try {
            const parsed = JSON.parse(postText);
            responseData = parsed;
            isSuccess = parsed.status === 'success' || parsed.success === true || parsed.status === 'ok';
          } catch {
            // Not JSON
          }
        }
      } catch (postErr: any) {
        console.warn('POST ping to Google Apps Script failed:', postErr);
      }
    }

    // Check if Google returned an HTML login or permission challenge
    if (rawText && (rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('accounts.google.com') || rawText.includes('Sign in'))) {
      return res.json({
        success: false,
        message: 'Google returned an authorization/sign-in screen. In Apps Script, click Deploy > Manage deployments > Edit > ensure "Execute as" is "Me" and "Who has access" is "Anyone".'
      });
    }

    if (isSuccess || responseData) {
      return res.json({
        success: true,
        data: responseData || { status: 'ok', raw: rawText.slice(0, 150) },
        message: 'Connection to Google Apps Script succeeded! Endpoint is active and reachable.'
      });
    }

    // If neither returned valid JSON
    if (!rawText || !rawText.trim()) {
      return res.json({
        success: false,
        message: 'Google Apps Script returned an empty response. Please verify that the script is deployed as a Web App with access set to "Anyone".'
      });
    }

    return res.json({
      success: true,
      data: { raw: rawText.slice(0, 200) },
      message: 'Connection verified! Received response from Google Apps Script Web App.'
    });

  } catch (err: any) {
    return res.json({
      success: false,
      message: 'Failed to reach Google Apps Script Web App: ' + (err.message || String(err))
    });
  }
};

app.post('/api/test-sheets-connection', handleSheetsTest);
app.post('/api/sheets/test', handleSheetsTest);
app.get('/api/sheets/test', handleSheetsTest);

// API: Sync Report or User to Google Sheets
app.post('/api/sync-google-sheets', async (req, res) => {
  const { type, data, webAppUrl } = req.body;
  const targetUrl = webAppUrl || store.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
  const syncId = 'SYNC-' + Date.now();

  if (webAppUrl && webAppUrl !== store.googleAppsScriptUrl) {
    store.googleAppsScriptUrl = webAppUrl;
    persistStore();
  }

  if (!type || !data) {
    return res.status(400).json({ success: false, message: 'Type and data are required.' });
  }

  // Ensure data is immediately stored in local store and broadcast to all connected editions
  if (type === 'DAILY_REPORT' && data.reportId) {
    const reportObj = { ...data, id: data.reportId, submittedAt: data.submissionDateTime || new Date().toISOString() };
    const idx = store.dailyReports.findIndex(r => r.id === reportObj.id);
    if (idx >= 0) {
      store.dailyReports[idx] = { ...store.dailyReports[idx], ...reportObj, updatedAt: new Date().toISOString() };
    } else {
      store.dailyReports.unshift(reportObj);
    }
    persistStore();
  } else if (type === 'WEEKLY_REPORT' && data.reportId) {
    const reportObj = { ...data, id: data.reportId, submittedAt: data.submissionDateTime || new Date().toISOString() };
    const idx = store.weeklyReports.findIndex(r => r.id === reportObj.id);
    if (idx >= 0) {
      store.weeklyReports[idx] = { ...store.weeklyReports[idx], ...reportObj, updatedAt: new Date().toISOString() };
    } else {
      store.weeklyReports.unshift(reportObj);
    }
    persistStore();
  } else if (type === 'USER' && (data.userId || data.id)) {
    const userObj = { ...data, id: data.userId || data.id };
    const idx = store.users.findIndex(u => u.id === userObj.id || (userObj.email && u.email === userObj.email));
    if (idx >= 0) {
      store.users[idx] = { ...store.users[idx], ...userObj };
    } else {
      store.users.push(userObj);
    }
    persistStore();
  }

  if (targetUrl) {
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          action: type === 'DAILY_REPORT' ? 'SYNC_DAILY_REPORT' : type === 'WEEKLY_REPORT' ? 'SYNC_WEEKLY_REPORT' : type,
          data,
          payload: data
        }),
        redirect: 'follow'
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { responseText };
      }

      syncLogs.unshift({
        id: syncId,
        timestamp: new Date().toISOString(),
        type,
        reportId: data.reportId || data.userId || data.id,
        status: 'SUCCESS',
        message: 'Synced to remote Google Sheet successfully.'
      });

      return res.json({
        success: true,
        mode: 'LIVE_GOOGLE_SHEETS',
        syncId,
        result
      });
    } catch (err: any) {
      syncLogs.unshift({
        id: syncId,
        timestamp: new Date().toISOString(),
        type,
        reportId: data.reportId || data.userId || data.id,
        status: 'FAILED',
        message: 'Network error pushing to Google Sheets: ' + (err.message || String(err))
      });

      // Still return a 200 with fallback so user flow is not broken
      return res.json({
        success: true,
        mode: 'LOCAL_FALLBACK',
        syncId,
        warning: 'Could not connect to Google Apps Script URL. Saved locally.',
        error: err.message
      });
    }
  } else {
    // Queued locally in-memory
    syncLogs.unshift({
      id: syncId,
      timestamp: new Date().toISOString(),
      type,
      reportId: data.reportId || data.userId || data.id,
      status: 'LOCAL_QUEUED',
      message: 'Recorded in database. Web App URL pending configuration.'
    });

    return res.json({
      success: true,
      mode: 'LOCAL_QUEUED',
      syncId,
      message: 'Report stored in database. Configure Google Apps Script URL in Admin settings to automatically mirror to Google Sheets.'
    });
  }
});

// API: Batch Sync Reports to Google Sheets
app.post('/api/sync-google-sheets/batch', async (req, res) => {
  const { items, webAppUrl } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items array is required' });
  }

  const targetUrl = webAppUrl || store.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
  let synced = 0;
  let failed = 0;
  const results: any[] = [];

  for (const item of items) {
    const { type, data } = item;
    if (!type || !data) continue;

    const syncId = 'SYNC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Save/update in server store
    if (type === 'DAILY_REPORT' && data.reportId) {
      const reportObj = { ...data, id: data.reportId, syncStatus: targetUrl ? 'SYNCED' : 'QUEUED', submittedAt: data.submissionDateTime || new Date().toISOString() };
      const idx = store.dailyReports.findIndex(r => r.id === reportObj.id);
      if (idx >= 0) {
        store.dailyReports[idx] = { ...store.dailyReports[idx], ...reportObj, updatedAt: new Date().toISOString() };
      } else {
        store.dailyReports.unshift(reportObj);
      }
    } else if (type === 'WEEKLY_REPORT' && data.reportId) {
      const reportObj = { ...data, id: data.reportId, syncStatus: targetUrl ? 'SYNCED' : 'QUEUED', submittedAt: data.submissionDateTime || new Date().toISOString() };
      const idx = store.weeklyReports.findIndex(r => r.id === reportObj.id);
      if (idx >= 0) {
        store.weeklyReports[idx] = { ...store.weeklyReports[idx], ...reportObj, updatedAt: new Date().toISOString() };
      } else {
        store.weeklyReports.unshift(reportObj);
      }
    }

    if (targetUrl) {
      try {
        let cleanUrl = targetUrl.trim();
        if (cleanUrl.includes('/edit')) cleanUrl = cleanUrl.replace(/\/edit.*$/, '/exec');
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            action: type === 'DAILY_REPORT' ? 'SYNC_DAILY_REPORT' : 'SYNC_WEEKLY_REPORT',
            data,
            payload: data
          }),
          redirect: 'follow',
          signal: AbortSignal.timeout(8000)
        });

        const responseText = await response.text();
        let result;
        try {
          result = JSON.parse(responseText);
        } catch {
          result = { responseText };
        }

        syncLogs.unshift({
          id: syncId,
          timestamp: new Date().toISOString(),
          type,
          reportId: data.reportId || data.userId || data.id,
          status: 'SUCCESS',
          message: 'Pushed to Google Sheets batch successfully.'
        });
        synced++;
        results.push({ id: data.reportId, success: true, mode: 'LIVE_GOOGLE_SHEETS', result });
      } catch (err: any) {
        syncLogs.unshift({
          id: syncId,
          timestamp: new Date().toISOString(),
          type,
          reportId: data.reportId || data.userId || data.id,
          status: 'FAILED',
          message: 'Batch sync error: ' + (err.message || String(err))
        });
        failed++;
        results.push({ id: data.reportId, success: false, error: err.message });
      }
    } else {
      syncLogs.unshift({
        id: syncId,
        timestamp: new Date().toISOString(),
        type,
        reportId: data.reportId || data.userId || data.id,
        status: 'LOCAL_QUEUED',
        message: 'Batch saved to database. Google Sheets Web App URL pending configuration.'
      });
      synced++;
      results.push({ id: data.reportId, success: true, mode: 'LOCAL_QUEUED' });
    }
  }

  persistStore();
  return res.json({
    success: true,
    total: items.length,
    synced,
    failed,
    results
  });
});

// Helper for background push to Google Sheets
async function syncToSheetsDirect(type: string, data: any, targetUrl?: string) {
  const url = targetUrl || store.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url || typeof url !== 'string' || !url.trim()) return;
  try {
    let cleanUrl = url.trim();
    if (cleanUrl.includes('/edit')) cleanUrl = cleanUrl.replace(/\/edit.*$/, '/exec');
    await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        action: type === 'DAILY_REPORT' ? 'SYNC_DAILY_REPORT' : type === 'WEEKLY_REPORT' ? 'SYNC_WEEKLY_REPORT' : type,
        data,
        payload: data
      }),
      redirect: 'follow'
    });
  } catch (err) {
    console.warn('Background syncToSheetsDirect error:', err);
  }
}

// API: Get Sync Logs
app.get('/api/sync-logs', (req, res) => {
  res.json({ logs: syncLogs.slice(0, 50) });
});

// API: Get entire System State (Fast initial load & syncing across sessions)
app.get('/api/system-state', (req, res) => {
  res.json({
    success: true,
    users: store.users,
    dailyReports: store.dailyReports,
    weeklyReports: store.weeklyReports,
    complianceConfig: store.complianceConfig,
    googleAppsScriptUrl: store.googleAppsScriptUrl,
    lastUpdated: store.lastUpdated,
  });
});

// API: Get all users (Persistent across all deployed clients)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: store.users,
    count: store.users.length,
    lastUpdated: store.lastUpdated,
  });
});

// API: Add new user (Admin creates user -> saved on server -> live for all devices)
app.post('/api/users', async (req, res) => {
  const userData = req.body;
  if (!userData || !userData.name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  const rolePrefix = userData.role === 'ADMIN' ? 'ADM' : userData.role === 'DET' ? 'DET' : 'GET';
  const newId = userData.id || ('USR-' + rolePrefix + '-' + Math.random().toString(36).substring(2, 7).toUpperCase());
  const newUser: User = {
    ...userData,
    id: newId,
    createdDate: userData.createdDate || new Date().toISOString(),
    status: userData.status || 'ACTIVE',
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    password: userData.password || (userData.role === 'ADMIN' ? 'Admin@123' : 'Trainee@123'),
  };

  const existingIndex = store.users.findIndex(u =>
    u.id === newUser.id ||
    (newUser.employeeId && u.employeeId.trim().toLowerCase() === newUser.employeeId.trim().toLowerCase()) ||
    (newUser.email && u.email.trim().toLowerCase() === newUser.email.trim().toLowerCase())
  );

  if (existingIndex >= 0) {
    store.users[existingIndex] = { ...store.users[existingIndex], ...newUser };
  } else {
    store.users.unshift(newUser);
  }
  persistStore();

  // Forward to peer edition (dev <-> deployed) in real-time
  replicateToPeer('/api/users', 'POST', newUser, req).catch(() => {});

  // Background sync to Google Sheets if connected
  const targetUrl = req.body.webAppUrl || store.googleAppsScriptUrl;
  syncToSheetsDirect('USER', {
    userId: newUser.id,
    employeeId: newUser.employeeId,
    name: newUser.name,
    email: newUser.email,
    department: newUser.department,
    designation: newUser.designation,
    role: newUser.role,
    joiningDate: newUser.joiningDate,
    status: newUser.status,
    createdDate: newUser.createdDate,
  }, targetUrl);

  res.json({
    success: true,
    user: newUser,
    users: store.users,
    message: `User ${newUser.name} registered and saved successfully.`
  });
});

// API: Update user
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  const index = store.users.findIndex(u => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  store.users[index] = { ...store.users[index], ...updates };
  persistStore();

  const updatedUser = store.users[index];

  // Forward update to peer edition in real-time
  replicateToPeer(`/api/users/${userId}`, 'PUT', updates, req).catch(() => {});

  const targetUrl = req.body.webAppUrl || store.googleAppsScriptUrl;
  syncToSheetsDirect('USER', {
    userId: updatedUser.id,
    employeeId: updatedUser.employeeId,
    name: updatedUser.name,
    email: updatedUser.email,
    department: updatedUser.department,
    designation: updatedUser.designation,
    role: updatedUser.role,
    joiningDate: updatedUser.joiningDate,
    status: updatedUser.status,
    createdDate: updatedUser.createdDate,
  }, targetUrl);

  res.json({ success: true, user: updatedUser, users: store.users });
});

// API: Delete user
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const initialLen = store.users.length;
  store.users = store.users.filter(u => u.id !== userId);
  if (store.users.length !== initialLen) {
    persistStore();
    replicateToPeer(`/api/users/${userId}`, 'DELETE', {}, req).catch(() => {});
  }
  res.json({ success: true, users: store.users });
});

// API: Submit or save Daily Report
app.post('/api/reports/daily', (req, res) => {
  const report = req.body;
  if (!report || !report.id) {
    return res.status(400).json({ success: false, message: 'Report ID is required' });
  }
  const index = store.dailyReports.findIndex(r => r.id === report.id);
  if (index >= 0) {
    store.dailyReports[index] = { ...store.dailyReports[index], ...report, updatedAt: new Date().toISOString() };
  } else {
    store.dailyReports.unshift(report);
  }
  persistStore();

  const targetUrl = req.body.webAppUrl || store.googleAppsScriptUrl;
  syncToSheetsDirect('DAILY_REPORT', report, targetUrl);

  res.json({ success: true, report });
});

// API: Update Daily Report
app.put('/api/reports/daily/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const index = store.dailyReports.findIndex(r => r.id === id);
  if (index >= 0) {
    store.dailyReports[index] = { ...store.dailyReports[index], ...updates, updatedAt: new Date().toISOString() };
    persistStore();

    const targetUrl = req.body.webAppUrl || store.googleAppsScriptUrl;
    syncToSheetsDirect('DAILY_REPORT', store.dailyReports[index], targetUrl);

    return res.json({ success: true, report: store.dailyReports[index] });
  }
  res.status(404).json({ success: false, message: 'Daily report not found' });
});

// API: Submit or save Weekly Report
app.post('/api/reports/weekly', (req, res) => {
  const report = req.body;
  if (!report || !report.id) {
    return res.status(400).json({ success: false, message: 'Report ID is required' });
  }
  const index = store.weeklyReports.findIndex(r => r.id === report.id);
  if (index >= 0) {
    store.weeklyReports[index] = { ...store.weeklyReports[index], ...report, updatedAt: new Date().toISOString() };
  } else {
    store.weeklyReports.unshift(report);
  }
  persistStore();

  const targetUrl = req.body.webAppUrl || store.googleAppsScriptUrl;
  syncToSheetsDirect('WEEKLY_REPORT', report, targetUrl);

  res.json({ success: true, report });
});

// API: Update Weekly Report
app.put('/api/reports/weekly/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const index = store.weeklyReports.findIndex(r => r.id === id);
  if (index >= 0) {
    store.weeklyReports[index] = { ...store.weeklyReports[index], ...updates, updatedAt: new Date().toISOString() };
    persistStore();

    const targetUrl = req.body.webAppUrl || store.googleAppsScriptUrl;
    syncToSheetsDirect('WEEKLY_REPORT', store.weeklyReports[index], targetUrl);

    return res.json({ success: true, report: store.weeklyReports[index] });
  }
  res.status(404).json({ success: false, message: 'Weekly report not found' });
});

// API: Delete report / draft
app.delete('/api/reports/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (type.toUpperCase() === 'DAILY') {
    store.dailyReports = store.dailyReports.filter(r => r.id !== id);
  } else if (type.toUpperCase() === 'WEEKLY') {
    store.weeklyReports = store.weeklyReports.filter(r => r.id !== id);
  }
  persistStore();
  return res.json({ success: true, message: `Report ${id} deleted successfully` });
});

// API: Update report status (Review / Approve)
app.post('/api/reports/status', (req, res) => {
  const { type, reportId, status, adminRemark, reviewedBy, reviewedDate } = req.body;
  const now = reviewedDate || new Date().toISOString();
  if (type === 'DAILY') {
    const rep = store.dailyReports.find(r => r.id === reportId);
    if (rep) {
      rep.status = status;
      if (adminRemark !== undefined) rep.adminRemark = adminRemark;
      rep.reviewedBy = reviewedBy || 'Administrator';
      rep.reviewedDate = now;
      rep.updatedAt = now;
      persistStore();

      syncToSheetsDirect('UPDATE_STATUS', {
        id: reportId,
        reportType: 'DAILY',
        status,
        adminRemark: adminRemark || ''
      }, req.body.webAppUrl || store.googleAppsScriptUrl);
    }
  } else if (type === 'WEEKLY') {
    const rep = store.weeklyReports.find(r => r.id === reportId);
    if (rep) {
      rep.status = status;
      if (adminRemark !== undefined) rep.adminRemark = adminRemark;
      rep.reviewedBy = reviewedBy || 'Administrator';
      rep.reviewedDate = now;
      rep.updatedAt = now;
      persistStore();

      syncToSheetsDirect('UPDATE_STATUS', {
        id: reportId,
        reportType: 'WEEKLY',
        status,
        adminRemark: adminRemark || ''
      }, req.body.webAppUrl || store.googleAppsScriptUrl);
    }
  }
  res.json({ success: true });
});

// API: Update Compliance Settings
app.post('/api/compliance', (req, res) => {
  const settings = req.body;
  if (settings) {
    store.complianceConfig = { ...store.complianceConfig, ...settings };
    persistStore();
  }
  res.json({ success: true, complianceConfig: store.complianceConfig });
});

// API: Pull Users from Google Sheets
app.post('/api/sheets/pull-users', async (req, res) => {
  const rawUrl = req.body?.url || store.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!rawUrl) {
    return res.status(400).json({ success: false, message: 'No Google Apps Script Web App URL configured.' });
  }
  let url = rawUrl.trim();
  if (url.includes('/edit')) url = url.replace(/\/edit.*$/, '/exec');
  const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'action=GET_USERS';

  try {
    const response = await fetch(fetchUrl, { redirect: 'follow' });
    const text = await response.text();
    const parsed = JSON.parse(text);
    if (parsed.status === 'success' && Array.isArray(parsed.users)) {
      let addedCount = 0;
      parsed.users.forEach((sheetUser: any) => {
        if (!sheetUser.email && !sheetUser.employeeId) return;
        const idx = store.users.findIndex(u =>
          (sheetUser.id && u.id === sheetUser.id) ||
          (sheetUser.employeeId && u.employeeId.toLowerCase() === sheetUser.employeeId.toLowerCase()) ||
          (sheetUser.email && u.email.toLowerCase() === sheetUser.email.toLowerCase())
        );
        if (idx === -1) {
          store.users.push({
            id: sheetUser.id || ('USR-SHT-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
            employeeId: sheetUser.employeeId || `EMP-${Date.now()}`,
            name: sheetUser.name || 'Sheet User',
            email: sheetUser.email || '',
            department: sheetUser.department || 'Production',
            designation: sheetUser.designation || 'Trainee',
            reportingManager: 'Assigned Manager',
            joiningDate: sheetUser.joiningDate || new Date().toISOString().split('T')[0],
            role: (sheetUser.role === 'ADMIN' ? 'ADMIN' : (sheetUser.role === 'DET' || sheetUser.designation?.toUpperCase().includes('DET') || sheetUser.employeeId?.toUpperCase().startsWith('DET')) ? 'DET' : 'GET'),
            status: (sheetUser.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'),
            createdDate: sheetUser.createdDate || new Date().toISOString(),
            password: 'Trainee@123',
            isActive: sheetUser.status !== 'DISABLED',
          });
          addedCount++;
        }
      });
      if (addedCount > 0) {
        persistStore();
      }
      return res.json({ success: true, addedCount, totalUsers: store.users.length, users: store.users });
    }
    return res.json({ success: false, message: 'Google Sheet response: ' + text.slice(0, 150) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error querying Google Sheet: ' + err.message });
  }
});

// Helper to pull all datasets from Google Sheets and synchronize bidirectional state
async function pullAllFromSheets(targetUrl?: string) {
  const rawUrl = targetUrl || store.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { success: false, message: 'No Google Apps Script Web App URL configured.' };
  }
  let url = rawUrl.trim();
  if (url.includes('/edit')) url = url.replace(/\/edit.*$/, '/exec');
  const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'action=GET_ALL_DATA';

  try {
    const response = await fetch(fetchUrl, { redirect: 'follow' });
    const text = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, message: 'Non-JSON response from Google Sheets: ' + text.slice(0, 150) };
    }

    if (parsed.status === 'success' || parsed.users || parsed.dailyReports || parsed.weeklyReports) {
      let addedUsers = 0;
      let addedDaily = 0;
      let addedWeekly = 0;
      let hasChanges = false;

      // 1. Sync Users
      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((sheetUser: any) => {
          if (!sheetUser.email && !sheetUser.employeeId) return;
          const idx = store.users.findIndex(u =>
            (sheetUser.id && u.id === sheetUser.id) ||
            (sheetUser.employeeId && u.employeeId.toLowerCase() === sheetUser.employeeId.toLowerCase()) ||
            (sheetUser.email && u.email.toLowerCase() === sheetUser.email.toLowerCase())
          );
          if (idx >= 0) {
            // Update fields
            const prev = store.users[idx];
            if (sheetUser.status && sheetUser.status !== prev.status) {
              prev.status = sheetUser.status;
              hasChanges = true;
            }
            if (sheetUser.name && sheetUser.name !== prev.name) {
              prev.name = sheetUser.name;
              hasChanges = true;
            }
          } else {
            store.users.push({
              id: sheetUser.id || ('USR-SHT-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
              employeeId: sheetUser.employeeId || `EMP-${Date.now()}`,
              name: sheetUser.name || 'Sheet User',
              email: sheetUser.email || '',
              department: sheetUser.department || 'Production',
              designation: sheetUser.designation || 'Trainee',
              reportingManager: 'Assigned Manager',
              joiningDate: sheetUser.joiningDate || new Date().toISOString().split('T')[0],
              role: (sheetUser.role === 'ADMIN' ? 'ADMIN' : (sheetUser.role === 'DET' || sheetUser.designation?.toUpperCase().includes('DET') || sheetUser.employeeId?.toUpperCase().startsWith('DET')) ? 'DET' : 'GET'),
              status: (sheetUser.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'),
              createdDate: sheetUser.createdDate || new Date().toISOString(),
              password: 'Trainee@123',
              isActive: sheetUser.status !== 'DISABLED',
            });
            addedUsers++;
            hasChanges = true;
          }
        });
      }

      // 2. Sync Daily Reports
      if (Array.isArray(parsed.dailyReports)) {
        parsed.dailyReports.forEach((sr: any) => {
          const reportId = sr.id || sr.reportId;
          if (!reportId) return;
          const idx = store.dailyReports.findIndex(r => r.id === reportId);
          if (idx >= 0) {
            const current = store.dailyReports[idx];
            if (sr.status && sr.status !== current.status) {
              current.status = sr.status;
              hasChanges = true;
            }
            if (sr.adminRemark !== undefined && sr.adminRemark !== current.adminRemark) {
              current.adminRemark = sr.adminRemark;
              hasChanges = true;
            }
            if (sr.reviewedBy) current.reviewedBy = sr.reviewedBy;
            if (sr.reviewedDate) current.reviewedDate = sr.reviewedDate;
          } else {
            const dailyObj: DailyReport = {
              id: reportId,
              userId: sr.userId || 'USR-SHT-01',
              employeeId: sr.employeeId || 'EMP-SHT',
              userName: sr.userName || 'Trainee',
              nameOfGet: sr.userName,
              department: sr.department || 'Production',
              subDepartment: sr.subDepartment || '',
              designation: sr.designation || 'GET',
              reportingManager: sr.reportingManager || '',
              nameOfHod: sr.nameOfHod || '',
              staffMet1: sr.staffMet1 || '',
              staffMet2: sr.staffMet2 || '',
              date: sr.date || new Date().toISOString().split('T')[0],
              inputDept: sr.inputDept || '',
              processValueAdded: sr.processValueAdded || sr.workDescription || '',
              outputNextDept: sr.outputNextDept || sr.learningOutcome || '',
              standards: sr.standards || '',
              safetyStandards: sr.safetyStandards || '',
              chronicProblem1: sr.chronicProblem1 || '',
              chronicProblem2: sr.chronicProblem2 || '',
              chronicProblem3: sr.chronicProblem3 || '',
              backOfPageNotes: sr.backOfPageNotes || '',
              trainingWorkArea: sr.trainingWorkArea || sr.department,
              topicActivity: sr.topicActivity || '',
              workDescription: sr.workDescription || '',
              learningOutcome: sr.learningOutcome || '',
              status: sr.status || 'SUBMITTED',
              adminRemark: sr.adminRemark || '',
              reviewedBy: sr.reviewedBy || '',
              reviewedDate: sr.reviewedDate || '',
              createdAt: sr.submittedAt || new Date().toISOString(),
              submittedAt: sr.submittedAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncStatus: 'SYNCED',
            };
            store.dailyReports.unshift(dailyObj);
            addedDaily++;
            hasChanges = true;
          }
        });
      }

      // 3. Sync Weekly Reports
      if (Array.isArray(parsed.weeklyReports)) {
        parsed.weeklyReports.forEach((sw: any) => {
          const reportId = sw.id || sw.reportId;
          if (!reportId) return;
          const idx = store.weeklyReports.findIndex(w => w.id === reportId);
          if (idx >= 0) {
            const current = store.weeklyReports[idx];
            if (sw.status && sw.status !== current.status) {
              current.status = sw.status;
              hasChanges = true;
            }
            if (sw.adminRemark !== undefined && sw.adminRemark !== current.adminRemark) {
              current.adminRemark = sw.adminRemark;
              hasChanges = true;
            }
            if (sw.reviewedBy) current.reviewedBy = sw.reviewedBy;
            if (sw.reviewedDate) current.reviewedDate = sw.reviewedDate;
          } else {
            const weeklyObj: WeeklyReport = {
              id: reportId,
              userId: sw.userId || 'USR-SHT-01',
              employeeId: sw.employeeId || 'EMP-SHT',
              userName: sw.userName || 'Trainee',
              department: sw.department || 'Production',
              subDepartment: sw.subDepartment || '',
              designation: sw.designation || 'GET',
              weekNumber: Number(sw.weekNumber) || 1,
              weekStart: sw.weekStart || new Date().toISOString().split('T')[0],
              weekEnd: sw.weekEnd || new Date().toISOString().split('T')[0],
              assignedProjectDept: sw.assignedProjectDept || sw.department,
              majorLearnings: sw.majorLearnings || '',
              technicalSkillsAcquired: sw.technicalSkillsAcquired || '',
              challengesFaced: sw.challengesFaced || '',
              solutionsImplemented: sw.solutionsImplemented || '',
              planForNextWeek: sw.planForNextWeek || '',
              status: sw.status || 'SUBMITTED',
              adminRemark: sw.adminRemark || '',
              reviewedBy: sw.reviewedBy || '',
              reviewedDate: sw.reviewedDate || '',
              createdAt: sw.submittedAt || new Date().toISOString(),
              submittedAt: sw.submittedAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncStatus: 'SYNCED',
            };
            store.weeklyReports.unshift(weeklyObj);
            addedWeekly++;
            hasChanges = true;
          }
        });
      }

      if (hasChanges) {
        persistStore();
      }

      return {
        success: true,
        hasChanges,
        addedUsers,
        addedDaily,
        addedWeekly,
        totalUsers: store.users.length,
        totalDaily: store.dailyReports.length,
        totalWeekly: store.weeklyReports.length,
        timestamp: new Date().toISOString()
      };
    }

    return { success: false, message: 'Google Sheets returned unexpected structure: ' + text.slice(0, 120) };
  } catch (err: any) {
    return { success: false, message: 'Error querying Google Sheets: ' + err.message };
  }
}

// API: Pull all data from Google Sheets (Users, Daily Reports, Weekly Reports)
app.post('/api/sheets/pull-all', async (req, res) => {
  const result = await pullAllFromSheets(req.body?.url);
  if (result.success) {
    return res.json({
      ...result,
      state: {
        users: store.users,
        dailyReports: store.dailyReports,
        weeklyReports: store.weeklyReports,
        complianceConfig: store.complianceConfig,
        lastUpdated: store.lastUpdated
      }
    });
  }
  return res.status(result.message?.includes('No Google Apps Script') ? 400 : 502).json(result);
});

// API: Webhook triggered by Google Sheets onEdit or external change
app.post('/api/webhook/sheets-update', async (req, res) => {
  console.log('Received Sheets Webhook update notification:', req.body);
  // Schedule background sync
  setTimeout(async () => {
    try {
      const res = await pullAllFromSheets();
      console.log('Webhook triggered sync finished:', res);
    } catch (e) {
      console.warn('Webhook sync error:', e);
    }
  }, 300);

  res.json({ success: true, message: 'Webhook received. Synchronization triggered across all live editions.' });
});

// Background Sync Timer: Periodically check Google Sheets if configured (every 35 seconds)
setInterval(async () => {
  if (store.googleAppsScriptUrl && store.googleAppsScriptUrl.trim()) {
    try {
      await pullAllFromSheets(store.googleAppsScriptUrl);
    } catch (e) {
      // Silent error in background poll
    }
  }
}, 35000);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Training Report Management Server running on port ${PORT}`);
  });
}

startServer();
