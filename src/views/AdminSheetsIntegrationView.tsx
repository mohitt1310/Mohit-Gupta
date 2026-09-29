import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport } from '../types';
import { ReportDetailModal } from '../components/ReportDetailModal';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Send,
  Database,
  CheckCircle2,
  XCircle,
  UploadCloud,
  CheckSquare,
  Search,
  FileText,
  CalendarDays,
  Eye,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const APPS_SCRIPT_CODE = `/**
 * Google Apps Script Web App for Training Report Management System (TRMS)
 * Two-way Live Synchronization & Webhook Trigger
 *
 * Supported Tabs:
 *  1. "Users"
 *  2. "Daily Reports" (or "DailyReports")
 *  3. "Weekly Reports" (or "WeeklyReports")
 */

// OPTIONAL: Set your application live URL below so edits made directly in Google Sheets trigger instant app sync!
var APP_WEBHOOK_URL = ""; // e.g. "https://your-domain.run.app/api/webhook/sheets-update"

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
      if (r[0]) {
        users.push({
          id: String(r[0]),
          employeeId: String(r[1] || ""),
          name: String(r[2] || ""),
          email: String(r[3] || ""),
          department: String(r[4] || ""),
          designation: String(r[5] || ""),
          role: String(r[6] || "TRAINEE"),
          joiningDate: String(r[7] || ""),
          status: String(r[8] || "ACTIVE"),
          createdDate: String(r[9] || new Date().toISOString())
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
          trainingWorkArea: details.trainingWorkArea || String(r[5] || ""),
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

  if (action === "GET_ALL_DATA") {
    return jsonResponse({
      status: "success",
      users: parseUsers(),
      dailyReports: parseDailyReports(),
      weeklyReports: parseWeeklyReports(),
      timestamp: new Date().toISOString()
    });
  }

  if (action === "GET_USERS") {
    return jsonResponse({ status: "success", users: parseUsers() });
  }
  if (action === "GET_DAILY_REPORTS") {
    return jsonResponse({ status: "success", dailyReports: parseDailyReports() });
  }
  if (action === "GET_WEEKLY_REPORTS") {
    return jsonResponse({ status: "success", weeklyReports: parseWeeklyReports() });
  }

  return jsonResponse({
    status: "ok",
    success: true,
    message: "Google Apps Script Webhook is active for spreadsheet: " + ss.getName(),
    time: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, status: "error", message: "No POST body received" });
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action || data.type;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "PING") {
      return jsonResponse({
        success: true,
        status: "ok",
        message: "Google Apps Script connection active: " + ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "SYNC_DAILY_REPORT" || action === "DAILY_REPORT") {
      var sheet = getOrCreateSheet(ss, "Daily Reports", [
        "Report ID", "User ID", "Employee ID", "Trainee Name", "Department",
        "Date", "Work Details (JSON)", "Submitted At", "Status", "Admin Remark", "Reviewed By", "Reviewed Date"
      ]);
      var r = data.payload || data.data;
      var existingData = sheet.getDataRange().getValues();
      var foundRowIndex = -1;
      for (var i = 1; i < existingData.length; i++) {
        if (existingData[i][0] == (r.id || r.reportId)) {
          foundRowIndex = i + 1;
          break;
        }
      }

      var rowValues = [
        r.id || r.reportId,
        r.userId || "",
        r.employeeId || "",
        r.userName || r.nameOfGet || "",
        r.department || "",
        r.date || "",
        JSON.stringify(r.reportDetails || {
          trainingWorkArea: r.trainingWorkArea || "",
          topicActivity: r.topicActivity || "",
          workDescription: r.workDescription || "",
          learningOutcome: r.learningOutcome || ""
        }),
        r.submittedAt || r.submissionDateTime || new Date().toISOString(),
        r.status || "SUBMITTED",
        r.adminRemark || "",
        r.reviewedBy || "",
        r.reviewedDate || ""
      ];

      if (foundRowIndex > 0) {
        sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      return jsonResponse({ success: true, id: r.id || r.reportId, message: "Daily Report synced" });
    }

    if (action === "SYNC_WEEKLY_REPORT" || action === "WEEKLY_REPORT") {
      var sheet = getOrCreateSheet(ss, "Weekly Reports", [
        "Report ID", "User ID", "Employee ID", "Trainee Name", "Department",
        "Week Start", "Week End", "Report Details (JSON)", "Submitted At", "Status", "Admin Remark", "Reviewed By", "Reviewed Date"
      ]);
      var w = data.payload || data.data;
      var existingData = sheet.getDataRange().getValues();
      var foundRowIndex = -1;
      for (var i = 1; i < existingData.length; i++) {
        if (existingData[i][0] == (w.id || w.reportId)) {
          foundRowIndex = i + 1;
          break;
        }
      }

      var rowValues = [
        w.id || w.reportId,
        w.userId || "",
        w.employeeId || "",
        w.userName || w.nameOfStudentTrainee || "",
        w.department || "",
        w.weekStart || "",
        w.weekEnd || "",
        JSON.stringify(w.weeklyReportDetails || {
          weekNumber: w.weekNumber || 1,
          assignedProjectDept: w.assignedProjectDept || "",
          majorLearnings: w.majorLearnings || "",
          technicalSkillsAcquired: w.technicalSkillsAcquired || "",
          challengesFaced: w.challengesFaced || "",
          solutionsImplemented: w.solutionsImplemented || ""
        }),
        w.submittedAt || w.submissionDateTime || new Date().toISOString(),
        w.status || "SUBMITTED",
        w.adminRemark || "",
        w.reviewedBy || "",
        w.reviewedDate || ""
      ];

      if (foundRowIndex > 0) {
        sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      return jsonResponse({ success: true, id: w.id || w.reportId, message: "Weekly Report synced" });
    }

    if (action === "USER") {
      var sheet = getOrCreateSheet(ss, "Users", [
        "User ID", "Employee ID", "Name", "Email", "Department", 
        "Designation", "Role", "Joining Date", "Status", "Created Date"
      ]);
      var u = data.payload || data.data;
      var existingData = sheet.getDataRange().getValues();
      var foundRowIndex = -1;
      for (var i = 1; i < existingData.length; i++) {
        if (existingData[i][0] == (u.id || u.userId)) {
          foundRowIndex = i + 1;
          break;
        }
      }

      var rowValues = [
        u.userId || u.id,
        u.employeeId || "",
        u.name || "",
        u.email || "",
        u.department || "",
        u.designation || "",
        u.role || "TRAINEE",
        u.joiningDate || "",
        u.status || "ACTIVE",
        u.createdDate || new Date().toISOString()
      ];

      if (foundRowIndex > 0) {
        sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      return jsonResponse({ success: true, id: u.userId || u.id, message: "User synced" });
    }

    if (action === "UPDATE_STATUS") {
      var targetId = data.payload ? data.payload.id : data.data.id;
      var newStatus = data.payload ? data.payload.status : data.data.status;
      var remark = (data.payload ? data.payload.adminRemark : data.data.adminRemark) || "";
      var reportType = data.payload ? data.payload.reportType : data.data.reportType;

      var targetSheet = ss.getSheetByName(reportType === "DAILY" ? "Daily Reports" : "Weekly Reports");
      if (!targetSheet) {
        targetSheet = ss.getSheetByName(reportType === "DAILY" ? "DailyReports" : "WeeklyReports");
      }
      if (targetSheet) {
        var values = targetSheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (values[i][0] == targetId) {
            targetSheet.getRange(i + 1, 9).setValue(newStatus);
            targetSheet.getRange(i + 1, 10).setValue(remark);
            return jsonResponse({ success: true, message: "Updated status in Google Sheets" });
          }
        }
      }
      return jsonResponse({ success: true, message: "Acknowledged" });
    }

    return jsonResponse({ success: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Installable Trigger: Automatically notify the App whenever a change is made in Google Sheets!
 * Setup in Apps Script: Triggers > Add Trigger > onEditTrigger > On edit
 */
function onEditTrigger(e) {
  if (!APP_WEBHOOK_URL) return;
  try {
    UrlFetchApp.fetch(APP_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        event: "SHEETS_ROW_EDITED",
        timestamp: new Date().toISOString()
      }),
      muteHttpExceptions: true
    });
  } catch(err) {
    Logger.log("Webhook call error: " + err);
  }
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const AdminSheetsIntegrationView: React.FC = () => {
  const {
    sheetsConfig,
    updateSheetsConfig,
    syncLogs,
    syncAllToSheets,
    syncSelectedReportsToSheets,
    syncSingleReportToSheets,
    testSheetsConnection,
    addToast,
    users,
    dailyReports,
    weeklyReports,
    syncBothEditionsNow,
    pullAllFromGoogleSheets,
    pullUsersFromGoogleSheets,
    editionSyncStatus,
    lastLiveSyncTime
  } = useApp();

  const [urlInput, setUrlInput] = useState(sheetsConfig?.webAppUrl || '');
  const [copied, setCopied] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSyncingBoth, setIsSyncingBoth] = useState(false);
  const [isPullingSheets, setIsPullingSheets] = useState(false);

  // Sync Selected & Batch push state
  const [selectedReportKeys, setSelectedReportKeys] = useState<Set<string>>(new Set());
  const [isSyncingSelected, setIsSyncingSelected] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncingSingleId, setSyncingSingleId] = useState<string | null>(null);

  // Filters & search state
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [syncStatusFilter, setSyncStatusFilter] = useState<'ALL' | 'UNSYNCED' | 'SYNCED'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Detail Modal preview state
  const [modalReport, setModalReport] = useState<DailyReport | WeeklyReport | null>(null);
  const [modalReportType, setModalReportType] = useState<'DAILY' | 'WEEKLY'>('DAILY');

  // Unified list of reports
  const allReports = useMemo(() => {
    const list: Array<{
      key: string;
      id: string;
      type: 'DAILY' | 'WEEKLY';
      report: DailyReport | WeeklyReport;
      userId: string;
      userName: string;
      employeeId: string;
      department: string;
      dateOrWeek: string;
      dateSort: string;
      summary: string;
      status: string;
      syncStatus: 'SYNCED' | 'QUEUED' | 'LOCAL';
    }> = [];

    dailyReports.forEach(d => {
      list.push({
        key: `DAILY:${d.id}`,
        id: d.id,
        type: 'DAILY',
        report: d,
        userId: d.userId,
        userName: d.userName || d.nameOfGet || 'Trainee',
        employeeId: d.employeeId,
        department: d.department || 'Production',
        dateOrWeek: d.date,
        dateSort: d.date || d.submittedAt || '',
        summary: d.topicActivity || d.processValueAdded || d.workDescription || d.inputDept || 'Daily plant visit & training',
        status: d.status,
        syncStatus: d.syncStatus || 'QUEUED'
      });
    });

    weeklyReports.forEach(w => {
      list.push({
        key: `WEEKLY:${w.id}`,
        id: w.id,
        type: 'WEEKLY',
        report: w,
        userId: w.userId,
        userName: w.userName || w.nameOfStudentTrainee || 'Trainee',
        employeeId: w.employeeId,
        department: w.department || w.assignedProjectDept || 'General',
        dateOrWeek: `Week ${w.weekNumber || 1} (${w.weekStart || ''} to ${w.weekEnd || ''})`,
        dateSort: w.weekStart || w.submittedAt || '',
        summary: w.classroomTrainingSummary || w.majorLearnings || w.shopFloorTrainingSummary || 'Weekly technical review',
        status: w.status,
        syncStatus: w.syncStatus || 'QUEUED'
      });
    });

    return list.sort((a, b) => (b.dateSort || '').localeCompare(a.dateSort || ''));
  }, [dailyReports, weeklyReports]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    return Array.from(new Set(allReports.map(r => r.department).filter(Boolean))).sort();
  }, [allReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return allReports.filter(r => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (syncStatusFilter === 'SYNCED' && r.syncStatus !== 'SYNCED') return false;
      if (syncStatusFilter === 'UNSYNCED' && r.syncStatus === 'SYNCED') return false;
      if (departmentFilter !== 'ALL' && r.department !== departmentFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(term);
        const matchesUser = r.userName.toLowerCase().includes(term);
        const matchesEmpId = r.employeeId.toLowerCase().includes(term);
        const matchesDept = r.department.toLowerCase().includes(term);
        const matchesSummary = r.summary.toLowerCase().includes(term);
        const matchesDate = r.dateOrWeek.toLowerCase().includes(term);
        if (!matchesId && !matchesUser && !matchesEmpId && !matchesDept && !matchesSummary && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [allReports, typeFilter, statusFilter, syncStatusFilter, departmentFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  // Selection statistics
  const isAllPageSelected =
    paginatedReports.length > 0 && paginatedReports.every(r => selectedReportKeys.has(r.key));
  const isSomePageSelected =
    paginatedReports.some(r => selectedReportKeys.has(r.key)) && !isAllPageSelected;

  const totalUnsynced = useMemo(() => {
    return allReports.filter(r => r.syncStatus !== 'SYNCED').length;
  }, [allReports]);

  const selectedBreakdown = useMemo(() => {
    let daily = 0;
    let weekly = 0;
    selectedReportKeys.forEach(k => {
      if (k.startsWith('DAILY:')) daily++;
      else if (k.startsWith('WEEKLY:')) weekly++;
    });
    return { daily, weekly };
  }, [selectedReportKeys]);

  // Selection handlers
  const handleToggleSelect = (key: string) => {
    setSelectedReportKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleSelectPage = () => {
    const next = new Set(selectedReportKeys);
    if (isAllPageSelected) {
      paginatedReports.forEach(r => next.delete(r.key));
    } else {
      paginatedReports.forEach(r => next.add(r.key));
    }
    setSelectedReportKeys(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedReportKeys);
    const allFilteredAreSelected = filteredReports.every(r => next.has(r.key));
    if (allFilteredAreSelected) {
      filteredReports.forEach(r => next.delete(r.key));
    } else {
      filteredReports.forEach(r => next.add(r.key));
    }
    setSelectedReportKeys(next);
  };

  const handleSelectUnsyncedFiltered = () => {
    const next = new Set<string>();
    filteredReports.forEach(r => {
      if (r.syncStatus !== 'SYNCED') {
        next.add(r.key);
      }
    });
    setSelectedReportKeys(next);
    addToast('info', `Selected ${next.size} unsynced report(s) from current view.`);
  };

  const handleClearSelection = () => {
    setSelectedReportKeys(new Set());
  };

  // Batch Sync Selected Action
  const handleSyncSelected = async () => {
    if (selectedReportKeys.size === 0) {
      addToast('info', 'Please select at least one report to sync.');
      return;
    }

    const itemsToSync: Array<{ id: string; type: 'DAILY' | 'WEEKLY' }> = [];
    selectedReportKeys.forEach(key => {
      const [type, id] = key.split(':');
      if (type && id) {
        itemsToSync.push({ id, type: type as 'DAILY' | 'WEEKLY' });
      }
    });

    setIsSyncingSelected(true);
    setSyncProgress({ current: 0, total: itemsToSync.length });

    try {
      const result = await syncSelectedReportsToSheets(itemsToSync, (current, total) => {
        setSyncProgress({ current, total });
      });

      if (result.totalSynced > 0) {
        addToast('success', `Batch push successful: ${result.totalSynced} report(s) transmitted to Google Sheets!`);
        setSelectedReportKeys(new Set());
      } else {
        addToast('error', 'Batch push failed. Check your Google Apps Script endpoint configuration.');
      }
    } catch (err: any) {
      addToast('error', 'Error syncing selected reports: ' + (err.message || String(err)));
    } finally {
      setIsSyncingSelected(false);
      setSyncProgress(null);
    }
  };

  // Single report sync action
  const handleSyncSingle = async (id: string, type: 'DAILY' | 'WEEKLY') => {
    setSyncingSingleId(id);
    try {
      const res = await syncSingleReportToSheets(id, type);
      if (res.success) {
        addToast('success', `Report ${id} pushed to Google Sheets!`);
      } else {
        addToast('error', `Failed to push report ${id}: ${res.message || 'Check connection'}`);
      }
    } catch (err: any) {
      addToast('error', `Failed to sync report ${id}: ${err.message || 'Network error'}`);
    } finally {
      setSyncingSingleId(null);
    }
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/sheets-update`
    : '/api/webhook/sheets-update';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    addToast('success', 'Google Apps Script code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    addToast('success', 'Webhook URL copied to clipboard!');
    setTimeout(() => setWebhookCopied(false), 2500);
  };

  const handleSyncBothEditions = async () => {
    setIsSyncingBoth(true);
    try {
      await syncBothEditionsNow();
      addToast('success', 'Synchronized live editions with server state!');
    } catch (err: any) {
      addToast('error', 'Synchronization error: ' + (err.message || 'Check connection'));
    } finally {
      setIsSyncingBoth(false);
    }
  };

  const handlePullAllFromSheets = async () => {
    setIsPullingSheets(true);
    try {
      const result = await pullAllFromGoogleSheets();
      if (result.success) {
        addToast('success', `Pulled from Sheets: ${result.syncedUsers} users, ${result.syncedDaily} daily reports, ${result.syncedWeekly} weekly reports.`);
      } else {
        addToast('info', result.message || 'Pull completed.');
      }
    } catch (err: any) {
      addToast('error', 'Failed to pull from Google Sheets: ' + (err.message || 'Check Web App URL'));
    } finally {
      setIsPullingSheets(false);
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Downloaded Code.gs');
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = urlInput.trim();
    if (cleanUrl.includes('/edit')) {
      cleanUrl = cleanUrl.replace(/\/edit.*$/, '/exec');
      setUrlInput(cleanUrl);
    }
    updateSheetsConfig({ webAppUrl: cleanUrl });
    addToast('success', 'Google Apps Script Web App URL saved successfully!');
  };

  const handleTestConnection = async () => {
    let cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      addToast('error', 'Please enter a Google Apps Script Web App URL first.');
      return;
    }
    if (cleanUrl.includes('/edit')) {
      cleanUrl = cleanUrl.replace(/\/edit.*$/, '/exec');
      setUrlInput(cleanUrl);
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const data = await testSheetsConnection(cleanUrl);
      setIsTesting(false);
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || `Connected successfully! Response: ${JSON.stringify(data.data || '')}`
        });
        updateSheetsConfig({ webAppUrl: cleanUrl, isConnected: true, lastTestedAt: new Date().toISOString() });
        addToast('success', 'Google Sheets connection verified!');
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || 'Failed to ping Google Apps Script URL. Check permissions.'
        });
        addToast('error', 'Connection test failed. Check permissions.');
      }
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({ success: false, message: err.message || 'Network error pinging server.' });
      addToast('error', 'Failed to test connection.');
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    await syncAllToSheets();
    setIsSyncingAll(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Google Sheets Integration Hub</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Secure two-way real-time synchronization between live editions, web reports, and enterprise Google Sheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedReportKeys.size > 0 && (
            <button
              id="btn-sync-selected-top-bar"
              onClick={handleSyncSelected}
              disabled={isSyncingSelected}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-60"
              title="Push selected reports to Google Sheets in one batch"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSyncingSelected ? 'animate-bounce' : ''}`} />
              <span>
                {isSyncingSelected
                  ? `Syncing (${syncProgress?.current || 0}/${syncProgress?.total || selectedReportKeys.size})...`
                  : `Sync Selected (${selectedReportKeys.size})`}
              </span>
            </button>
          )}

          <button
            id="btn-sync-both-editions-hub"
            onClick={handleSyncBothEditions}
            disabled={isSyncingBoth}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-60"
            title="Immediately sync dev, preview, and live editions with server state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBoth ? 'animate-spin' : ''}`} />
            <span>{isSyncingBoth ? 'Syncing Editions...' : 'Sync Both Editions Now'}</span>
          </button>

          <button
            id="btn-pull-all-sheets-hub"
            onClick={handlePullAllFromSheets}
            disabled={isPullingSheets}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-60"
            title="Fetch all latest rows from Google Sheets (Users, Daily Reports, Weekly Reports)"
          >
            <Download className={`w-3.5 h-3.5 ${isPullingSheets ? 'animate-spin' : ''}`} />
            <span>{isPullingSheets ? 'Pulling Data...' : 'Pull Latest from Sheets'}</span>
          </button>

          <button
            id="btn-sync-all-to-sheets-hub"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-60"
            title="Push all local app state to Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Push All to Sheets'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Edition Live Sync Status Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-blue-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                Live Multi-Edition Synchronization Active
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                {editionSyncStatus}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
              Any update or change made in the dev preview or deployed live edition (including user additions, report submissions, or status reviews) is automatically synchronized in real-time across both editions and Google Sheets.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-blue-200/70 font-mono">
              <span>Sync Engine: SSE + Fast Delta Polling (2.5s)</span>
              <span>•</span>
              <span>Last Checked: {lastLiveSyncTime}</span>
              <span>•</span>
              <span>Local State: {users.length} Users | {dailyReports.length} Daily | {weeklyReports.length} Weekly</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleSyncBothEditions}
              disabled={isSyncingBoth}
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isSyncingBoth ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{isSyncingBoth ? 'Synchronizing Editions...' : 'Sync Both Editions Now'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Webhook URL for Google Sheets */}
        <div className="mt-5 pt-4 border-t border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-semibold text-blue-200">Google Sheets Webhook URL:</span>
            <code className="bg-black/40 px-2 py-1 rounded text-emerald-300 font-mono text-[11px] select-all break-all">
              {webhookUrl}
            </code>
          </div>
          <button
            onClick={handleCopyWebhook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800/60 hover:bg-blue-700/60 text-blue-200 hover:text-white border border-blue-700/50 text-xs font-medium transition-colors self-start md:self-auto"
          >
            {webhookCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{webhookCopied ? 'Copied' : 'Copy Webhook URL'}</span>
          </button>
        </div>
      </div>

      {/* Connection Status Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${sheetsConfig?.webAppUrl ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Google Apps Script Web App Endpoint</h3>
                {sheetsConfig?.webAppUrl ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                    CONFIGURED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    PENDING URL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {sheetsConfig?.webAppUrl
                  ? `Active Endpoint: ${sheetsConfig.webAppUrl.substring(0, 50)}...`
                  : 'Configure your Google Apps Script URL below to enable automatic cloud backup to Google Sheets.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${testResult.success ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'}`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
            <div className="flex-1 break-words leading-relaxed">
              <span className="font-medium">{testResult.message}</span>
            </div>
          </div>
        )}

        {/* URL Input Form */}
        <form onSubmit={handleSaveUrl} className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 font-mono"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-xs"
            >
              Save Endpoint URL
            </button>
          </div>
          {urlInput && !urlInput.includes('/exec') && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Note: Google Apps Script Web App URLs must end with <strong className="font-mono">/exec</strong>. (If ending in /edit, it will be automatically converted).</span>
            </p>
          )}
        </form>
      </div>

      {/* Report Selection & Batch Push to Google Sheets Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Report Selection & Batch Push to Google Sheets
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {allReports.length} Total Reports
              </span>
              {totalUnsynced > 0 ? (
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {totalUnsynced} Unsynced
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> All Synced
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Select multiple Daily and Weekly reports below and click <strong>Sync Selected</strong> to transmit them directly into the "Daily Reports" and "Weekly Reports" tabs in your connected Google Sheet in a single batch operation.
            </p>
          </div>

          {/* Primary Sync Selected Button & Counter */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-sync-selected-sheets"
              onClick={handleSyncSelected}
              disabled={selectedReportKeys.size === 0 || isSyncingSelected}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                selectedReportKeys.size > 0 && !isSyncingSelected
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white ring-2 ring-emerald-500/30 shadow-emerald-500/20 shadow-md cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-70'
              }`}
            >
              <UploadCloud className={`w-4 h-4 ${isSyncingSelected ? 'animate-bounce' : ''}`} />
              <span>
                {isSyncingSelected
                  ? `Syncing (${syncProgress?.current || 0}/${syncProgress?.total || selectedReportKeys.size})...`
                  : `Sync Selected (${selectedReportKeys.size})`}
              </span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar when Batch Sync is Active */}
        {isSyncingSelected && syncProgress && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 px-6 py-3 border-b border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 font-semibold mb-1.5">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Batch pushing {syncProgress.current} of {syncProgress.total} reports to Google Sheets...
              </span>
              <span>{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Floating Batch Selection Banner when items are selected */}
        {selectedReportKeys.size > 0 && (
          <div className="bg-blue-50/90 dark:bg-blue-950/60 border-b border-blue-200/80 dark:border-blue-900/60 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="font-semibold text-blue-900 dark:text-blue-200">
                {selectedReportKeys.size} reports selected
              </span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="text-blue-700 dark:text-blue-300">
                {selectedBreakdown.daily} Daily, {selectedBreakdown.weekly} Weekly
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSelectAllFiltered}
                className="text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline underline-offset-2"
              >
                {filteredReports.every(r => selectedReportKeys.has(r.key))
                  ? 'Deselect all filtered'
                  : `Select all filtered (${filteredReports.length})`}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear selection</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Type Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => { setTypeFilter('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                typeFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({allReports.length})
            </button>
            <button
              onClick={() => { setTypeFilter('DAILY'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                typeFilter === 'DAILY'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Daily ({dailyReports.length})</span>
            </button>
            <button
              onClick={() => { setTypeFilter('WEEKLY'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                typeFilter === 'WEEKLY'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3 h-3" />
              <span>Weekly ({weeklyReports.length})</span>
            </button>
          </div>

          {/* Sync Status Filter & Department Filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={syncStatusFilter}
              onChange={e => { setSyncStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Sync Statuses</option>
              <option value="UNSYNCED">Pending Sync Only</option>
              <option value="SYNCED">Synced to Sheets Only</option>
            </select>

            <select
              value={departmentFilter}
              onChange={e => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600 max-w-[150px] truncate"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Quick Unsynced Selection Button */}
            <button
              onClick={handleSelectUnsyncedFiltered}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1.5"
              title="Select all reports in the current filter that have not been synced yet"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select Unsynced</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search ID, Trainee, Dept, Date..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomePageSelected;
                    }}
                    onChange={handleToggleSelectPage}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    title={isAllPageSelected ? 'Deselect page' : 'Select all on this page'}
                  />
                </th>
                <th className="py-3 px-3.5 w-24">Type</th>
                <th className="py-3 px-3.5 w-32">Report ID</th>
                <th className="py-3 px-3.5 min-w-[140px]">Trainee</th>
                <th className="py-3 px-3.5 min-w-[120px]">Date / Period</th>
                <th className="py-3 px-3.5 min-w-[180px]">Topic / Activity</th>
                <th className="py-3 px-3.5 w-28">Status</th>
                <th className="py-3 px-3.5 w-32">Sheets Sync</th>
                <th className="py-3 px-3.5 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-sm">No reports match your filters</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search query, type, or sync status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReports.map(item => {
                  const isSelected = selectedReportKeys.has(item.key);
                  const isSyncingThis = syncingSingleId === item.id;
                  const isDaily = item.type === 'DAILY';

                  return (
                    <tr
                      key={item.key}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.key)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDaily
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          {isDaily ? <FileText className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
                          <span>{item.type}</span>
                        </span>
                      </td>

                      {/* Report ID */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.id}
                      </td>

                      {/* Trainee Details */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {item.userName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                          <span>{item.employeeId}</span>
                          <span>•</span>
                          <span className="truncate max-w-[90px]">{item.department}</span>
                        </div>
                      </td>

                      {/* Date / Period */}
                      <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 text-xs">
                        <div className="font-medium">{item.dateOrWeek}</div>
                      </td>

                      {/* Topic / Activity Summary */}
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 truncate max-w-xs" title={item.summary}>
                        {item.summary}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            item.status === 'REVIEWED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : item.status === 'UNDER REVIEW'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Sheets Sync Status */}
                      <td className="py-3 px-3.5">
                        {item.syncStatus === 'SYNCED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>SYNCED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSyncSingle(item.id, item.type)}
                            disabled={isSyncingThis || isSyncingSelected}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              item.syncStatus === 'SYNCED'
                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            }`}
                            title={`Push ${item.id} to Google Sheets now`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={() => {
                              setModalReport(item.report);
                              setModalReportType(item.type);
                            }}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="View report details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {filteredReports.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredReports.length)} of {filteredReports.length} reports
            </span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7-Step Setup Guide as required by Section 9 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>7-Step Google Sheets Setup Guide</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Open Google Sheets</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Visit Google Drive or sheets.google.com and create a new blank spreadsheet for Training Reports.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Create 3 Tabs</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Rename the sheets to: <strong className="text-slate-800 dark:text-slate-200">Users</strong>, <strong className="text-slate-800 dark:text-slate-200">DailyReports</strong>, and <strong className="text-slate-800 dark:text-slate-200">WeeklyReports</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Open Apps Script</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Click on the top menu: <strong className="text-slate-800 dark:text-slate-200">Extensions &gt; Apps Script</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Paste Code.gs</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Copy the Google Apps Script below and paste it into the Apps Script editor window.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">5</span>
              <span>Deploy as Web App</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Click <strong className="text-slate-800 dark:text-slate-200">Deploy &gt; New deployment</strong>, select type <strong className="text-slate-800 dark:text-slate-200">Web App</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">6</span>
              <span>Set Access to Anyone</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Under "Who has access", choose <strong className="text-slate-800 dark:text-slate-200">Anyone</strong>, then click Deploy.
            </p>
          </div>
        </div>
      </div>

      {/* Code Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">Code.gs (Apps Script)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownloadCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Code.gs</span>
            </button>
          </div>
        </div>

        <pre className="p-5 text-[11px] font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 overflow-x-auto max-h-72 leading-relaxed">
          {APPS_SCRIPT_CODE}
        </pre>
      </div>

      {/* Live Sync Logs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Real-Time Sync Logs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live operational ledger of data pushed to Google Sheets</p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{syncLogs.length} events</span>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action / Record</th>
                <th className="py-2.5 px-4">Report / User ID</th>
                <th className="py-2.5 px-4">Result</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500 font-sans">
                    No sync events recorded in this session.
                  </td>
                </tr>
              ) : (
                syncLogs.slice(-10).reverse().map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-blue-700 dark:text-blue-400 font-bold">
                      {log.recordId}
                    </td>
                    <td className="py-2.5 px-4">
                      {log.status === 'SUCCESS' && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">SUCCESS</span>
                      )}
                      {log.status === 'QUEUED' && (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">LOCAL QUEUED</span>
                      )}
                      {log.status === 'FAILED' && (
                        <span className="text-rose-700 dark:text-rose-400 font-bold">FAILED</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 font-sans truncate max-w-xs">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Modal */}
      {modalReport && (
        <ReportDetailModal
          report={modalReport}
          reportType={modalReportType}
          onClose={() => setModalReport(null)}
        />
      )}
    </div>
  );
};
