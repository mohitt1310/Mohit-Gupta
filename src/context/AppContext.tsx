import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  DailyReport,
  WeeklyReport,
  ReportStatus,
  ComplianceConfig,
  InAppNotification,
  SheetsSyncLog,
  GlobalSearchFilters,
  GlobalSearchResult,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DAILY_REPORTS,
  INITIAL_WEEKLY_REPORTS,
  INITIAL_COMPLIANCE_CONFIG,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { normalizeDepartment } from '../data/departments';
import {
  subscribeToSharedCloudData,
  seedCloudDatabaseIfNeeded,
  syncUserToCloud,
  removeUserFromCloud,
  syncDailyReportToCloud,
  syncWeeklyReportToCloud,
} from '../services/firestoreSync';

// Auto-detect peer edition URL between AI Studio Dev and Cloud Run Deployed instance
export function getPeerEditionUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('ub_peer_edition_url');
  if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');

  const origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    return origin.replace('ais-dev-', 'ais-pre-').replace(/\/+$/, '');
  }
  if (origin.includes('ais-pre-')) {
    return origin.replace('ais-pre-', 'ais-dev-').replace(/\/+$/, '');
  }
  return null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  complianceConfig: ComplianceConfig;
  complianceSettings: ComplianceConfig;
  notifications: InAppNotification[];
  googleAppsScriptUrl: string;
  syncLogs: SheetsSyncLog[];
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
  removeToast: (id: string) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Global Search
  isSearchOpen: boolean;
  openSearch: (initialQuery?: string) => void;
  closeSearch: () => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFilters: GlobalSearchFilters;
  setSearchFilters: React.Dispatch<React.SetStateAction<GlobalSearchFilters>>;
  searchReports: (filters?: Partial<GlobalSearchFilters>) => GlobalSearchResult[];

  // Auth
  login: (emailOrEmpId: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateProfile: (updatedUser: Partial<User>) => void;

  // Reports
  submitDailyReport: (data: Omit<DailyReport, 'id' | 'createdAt' | 'submittedAt' | 'updatedAt' | 'syncStatus'>, isDraft?: boolean) => Promise<string>;
  updateDailyReport: (reportId: string, data: Partial<DailyReport>, resubmit?: boolean) => Promise<void>;
  submitWeeklyReport: (data: Omit<WeeklyReport, 'id' | 'createdAt' | 'submittedAt' | 'updatedAt' | 'syncStatus'>, isDraft?: boolean) => Promise<string>;
  updateWeeklyReport: (reportId: string, data: Partial<WeeklyReport>, resubmit?: boolean) => Promise<void>;
  updateReportStatus: (type: 'DAILY' | 'WEEKLY', reportId: string, status: ReportStatus, adminRemark?: string) => Promise<void>;
  deleteDraftReport: (reportId: string, type: 'DAILY' | 'WEEKLY') => Promise<void>;

  // User Management
  addUser: (userData: Omit<User, 'id' | 'createdDate'>) => Promise<User>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string, tempPass: string) => Promise<void>;
  refreshUsersFromCloud: () => Promise<void>;
  pullUsersFromGoogleSheets: (url?: string) => Promise<{ success: boolean; addedCount?: number; message?: string }>;
  isCloudConnected: boolean;

  // Real-Time Multi-Edition Synchronization
  editionSyncStatus: 'synced' | 'syncing' | 'error';
  lastLiveSyncTime: string;
  syncBothEditionsNow: () => Promise<{ success: boolean; message: string }>;
  pullAllFromGoogleSheets: (url?: string) => Promise<{ success: boolean; message: string; addedUsers?: number; addedDaily?: number; addedWeekly?: number }>;

  // Compliance Config
  updateComplianceConfig: (config: ComplianceConfig) => void;
  updateComplianceSettings: (settings: Partial<ComplianceConfig>) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Google Sheets
  setGoogleAppsScriptUrl: (url: string) => void;
  sheetsConfig: { webAppUrl: string; isConnected: boolean; lastTestedAt?: string };
  updateSheetsConfig: (config: Partial<{ webAppUrl: string; isConnected: boolean; lastTestedAt?: string }>) => void;
  testSheetsConnection: (url?: string) => Promise<{ success: boolean; message: string }>;
  syncAllToSheets: () => Promise<{ totalSynced: number; failed: number }>;
  syncSelectedReportsToSheets: (
    selectedItems: Array<{ id: string; type: 'DAILY' | 'WEEKLY' }>,
    onProgress?: (synced: number, total: number) => void
  ) => Promise<{ totalSynced: number; failed: number }>;
  syncSingleReportToSheets: (
    reportId: string,
    type: 'DAILY' | 'WEEKLY'
  ) => Promise<{ success: boolean; message?: string }>;
}

const DEMO_USER_EMAILS = new Set([
  'det1@company.com',
  'rohan.m@company.com',
  'kavita.s@company.com',
  'manish.g@company.com',
  'neha.r@company.com',
  'hr1@company.com',
  'tigjfv@test.com'
]);
const DEMO_USER_IDS = new Set([
  'USR-DET-002',
  'USR-GET-003',
  'USR-DET-004',
  'USR-GET-005',
  'USR-GET-006',
  'USR-HR-007'
]);

function isDemoUser(u?: { id?: string; email?: string } | null): boolean {
  if (!u) return false;
  if (u.id && DEMO_USER_IDS.has(u.id)) return true;
  if (u.email && DEMO_USER_EMAILS.has(u.email.toLowerCase())) return true;
  return false;
}

function isDemoReport(r?: { id?: string; userEmail?: string } | null): boolean {
  if (!r) return false;
  if (r.id && (/^DR-2026-00(0[1-9]|1[0-9]|2[0-8])$/.test(r.id) || r.id === 'WR-2026-0001' || r.id === 'WR-2026-0002')) {
    return true;
  }
  if (r.userEmail && DEMO_USER_EMAILS.has(r.userEmail.toLowerCase())) {
    return true;
  }
  return false;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [editionSyncStatus, setEditionSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState<string>(() => new Date().toLocaleTimeString());
  const latestRevisionRef = useRef<number>(1);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trms_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && !isDemoUser(u)) {
          const norm = normalizeDepartment(u.department, u.subDepartment);
          return { ...u, department: norm.department, subDepartment: norm.subDepartment };
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Default to the GET trainee matching the user prompt's email!
    return INITIAL_USERS[1];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('trms_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded: User[] = parsed
            .filter((u: User) => !isDemoUser(u))
            .map((u: User) => {
              const norm = normalizeDepartment(u.department, u.subDepartment);
              return { ...u, department: norm.department, subDepartment: norm.subDepartment };
            });
          // Guarantee all system trainees/users (including newly added sattu) exist
          for (const initU of INITIAL_USERS) {
            if (!loaded.some((u: User) => u.id === initU.id || (u.employeeId && u.employeeId.toLowerCase() === initU.employeeId.toLowerCase()))) {
              const norm = normalizeDepartment(initU.department, initU.subDepartment);
              loaded.unshift({ ...initU, department: norm.department, subDepartment: norm.subDepartment });
            }
          }
          return loaded;
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_USERS;
  });

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('trms_daily_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((r: DailyReport) => !isDemoReport(r))
            .map((r: DailyReport) => {
              const norm = normalizeDepartment(r.department, r.subDepartment);
              return {
                ...r,
                department: norm.department,
                subDepartment: norm.subDepartment,
                nameOfGet: r.nameOfGet || r.userName,
                nameOfHod: r.nameOfHod || r.reportingManager || 'Rajesh Verma (Senior DGM / HOD)',
                staffMet1: r.staffMet1 || 'S. K. Gupta - Section Incharge',
                staffMet2: r.staffMet2 || 'P. N. Mishra - Senior Test Engineer',
                inputDept: r.inputDept || `Incoming components, drawings, materials and specifications for ${r.topicActivity || r.trainingWorkArea || 'the work section'}.`,
                processValueAdded: r.processValueAdded || r.workDescription || '',
                outputNextDept: r.outputNextDept || r.learningOutcome || '',
                standards: r.standards || 'IS 2026 (Part 1-5), IEC 60076, IEEE C57.12, ISO 9001:2015',
                safetyStandards: r.safetyStandards || r.safetyObservations || 'Mandatory PPE (Safety helmet, shoes, cut-resistant gloves), LOTO procedures.',
                chronicProblem1: r.chronicProblem1 || r.challengesFaced || 'Tolerance variations in raw conductor coils during setup.',
                chronicProblem2: r.chronicProblem2 || r.bottlenecks || 'Stabilization heating cycle time constraints.',
                chronicProblem3: r.chronicProblem3 || '',
                backOfPageNotes: r.backOfPageNotes || r.remarks || '',
              };
            });
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_DAILY_REPORTS;
  });

  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>(() => {
    const saved = localStorage.getItem('trms_weekly_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((r: WeeklyReport) => !isDemoReport(r))
            .map((r: WeeklyReport) => {
              const norm = normalizeDepartment(r.department, r.subDepartment);
              return {
                ...r,
                department: norm.department,
                subDepartment: norm.subDepartment,
                nameOfStudentTrainee: r.nameOfStudentTrainee || r.userName,
                daysPresent: r.daysPresent !== undefined ? r.daysPresent : 6,
                classroomTrainingSummary: r.classroomTrainingSummary || r.majorLearnings || 'Lectures on Transformer Design Standards (IS 2026 / IEC 60076), electrical clearances and magnetic circuits.',
                shopFloorTrainingSummary: r.shopFloorTrainingSummary || (r.dailySummary ? r.dailySummary.map(d => `${d.day}: ${d.activity}`).join('\n') : 'Active involvement in core stacking, coil winding, insulation assembly and stage quality inspections.'),
                projectSummaryA: r.projectSummaryA || r.assignedProjectDept || 'Overhaul and pre-tanking quality inspection of high voltage power transformer assemblies.',
                projectSummaryB: r.projectSummaryB || r.solutionsImplemented || 'Vapor Phase Drying (VPD) cycle monitoring and moisture extraction verification.',
                selfLearningSummary: r.selfLearningSummary || r.technicalSkillsAcquired || 'Studied CBIP Transformer Manual and Indian Standard specifications for transformer oil and protective relays.',
                suggestion: r.suggestion || 'Provide calibrated magnetic dial gauges at core stacking tables for rapid limb squareness verification.',
                traineeSignature: r.traineeSignature || `${r.userName} (Signed digitally)`,
                backOfPageNotes: r.backOfPageNotes || r.remarks || '',
              };
            });
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_WEEKLY_REPORTS;
  });

  const [complianceConfig, setComplianceConfig] = useState<ComplianceConfig>(() => {
    const saved = localStorage.getItem('trms_compliance_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_COMPLIANCE_CONFIG, ...parsed };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_COMPLIANCE_CONFIG;
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem('trms_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: InAppNotification) => !n.id || !n.id.startsWith('NOTIF-0'));
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [googleAppsScriptUrl, setGoogleAppsScriptUrlState] = useState<string>(() => {
    return localStorage.getItem('trms_google_apps_script_url') || '';
  });

  const [sheetsConfig, setSheetsConfig] = useState<{ webAppUrl: string; isConnected: boolean; lastTestedAt?: string }>(() => {
    const saved = localStorage.getItem('trms_sheets_config');
    const defaultUrl = localStorage.getItem('trms_google_apps_script_url') || '';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          webAppUrl: parsed.webAppUrl ?? defaultUrl,
          isConnected: parsed.isConnected ?? Boolean(parsed.webAppUrl || defaultUrl),
          lastTestedAt: parsed.lastTestedAt,
        };
      } catch (e) {
        console.error(e);
      }
    }
    return {
      webAppUrl: defaultUrl,
      isConnected: Boolean(defaultUrl),
    };
  });

  const updateSheetsConfig = (cfg: Partial<{ webAppUrl: string; isConnected: boolean; lastTestedAt?: string }>) => {
    setSheetsConfig(prev => {
      const updated = { ...prev, ...cfg };
      localStorage.setItem('trms_sheets_config', JSON.stringify(updated));
      if (cfg.webAppUrl !== undefined) {
        setGoogleAppsScriptUrlState(cfg.webAppUrl);
        localStorage.setItem('trms_google_apps_script_url', cfg.webAppUrl);
      }
      return updated;
    });
  };

  const [syncLogs, setSyncLogs] = useState<SheetsSyncLog[]>(() => {
    const saved = localStorage.getItem('trms_sync_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Theme State (Persisted in localStorage with prefers-color-scheme fallback)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trms_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Apply dark class to documentElement whenever theme changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('trms_theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // Global Search State & Handlers
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<GlobalSearchFilters>({
    keyword: '',
    date: '',
    traineeId: 'ALL',
    traineeName: '',
    reportType: 'ALL',
    status: 'ALL',
    scope: 'ALL',
  });

  const openSearch = useCallback((initialQuery?: string) => {
    if (typeof initialQuery === 'string') {
      setSearchQuery(initialQuery);
      setSearchFilters(prev => ({ ...prev, keyword: initialQuery }));
    }
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const searchReports = useCallback((customFilters?: Partial<GlobalSearchFilters>): GlobalSearchResult[] => {
    const activeFilters = { ...searchFilters, ...customFilters };
    const query = (activeFilters.keyword || '').trim().toLowerCase();
    const dateFilter = (activeFilters.date || '').trim().toLowerCase();
    const traineeNameFilter = (activeFilters.traineeName || '').trim().toLowerCase();
    const traineeIdFilter = activeFilters.traineeId || 'ALL';
    const reportType = activeFilters.reportType || 'ALL';
    const statusFilter = activeFilters.status || 'ALL';
    const scope = activeFilters.scope || 'ALL';

    const results: GlobalSearchResult[] = [];

    const createSnippet = (text: string, targetKeyword: string): string => {
      if (!text) return '';
      if (!targetKeyword) return text.slice(0, 130) + (text.length > 130 ? '...' : '');
      const lower = text.toLowerCase();
      const idx = lower.indexOf(targetKeyword);
      if (idx === -1) return text.slice(0, 130) + (text.length > 130 ? '...' : '');
      const start = Math.max(0, idx - 35);
      const end = Math.min(text.length, idx + targetKeyword.length + 65);
      const prefix = start > 0 ? '...' : '';
      const suffix = end < text.length ? '...' : '';
      return prefix + text.slice(start, end) + suffix;
    };

    // 1. Process Daily Reports
    if (reportType === 'ALL' || reportType === 'DAILY') {
      dailyReports.forEach(report => {
        if (scope === 'MINE' && currentUser && report.userId !== currentUser.id) {
          return;
        }

        if (traineeIdFilter !== 'ALL' && report.userId !== traineeIdFilter) {
          return;
        }

        if (statusFilter !== 'ALL' && report.status !== statusFilter) {
          return;
        }

        if (traineeNameFilter) {
          const nameMatches =
            report.userName.toLowerCase().includes(traineeNameFilter) ||
            report.employeeId.toLowerCase().includes(traineeNameFilter) ||
            (report.department && report.department.toLowerCase().includes(traineeNameFilter));
          if (!nameMatches) return;
        }

        if (dateFilter) {
          const rawDate = report.date.toLowerCase();
          const formatted = new Date(report.date + 'T00:00:00').toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).toLowerCase();
          const matchesDate = rawDate.includes(dateFilter) || formatted.includes(dateFilter);
          if (!matchesDate) return;
        }

        const matchedFields: { label: string; snippet: string }[] = [];
        if (query) {
          const searchFields: [string, string][] = [
            ['Report ID', report.id],
            ['Topic / Activity', report.topicActivity],
            ['Work Area', report.trainingWorkArea],
            ['Work Description', report.workDescription],
            ['Key Learning', report.learningOutcome],
            ['Tools & Equipment', report.toolsEquipmentUsed || ''],
            ['Safety Observations', report.safetyObservations || ''],
            ['Remarks', report.remarks || ''],
            ['Admin Remark', report.adminRemark || ''],
            ['Trainee Name', report.userName],
            ['Employee ID', report.employeeId],
            ['Department', report.department],
            ['Date', report.date],
          ];

          let matched = false;
          for (const [label, val] of searchFields) {
            if (val && val.toLowerCase().includes(query)) {
              matched = true;
              matchedFields.push({
                label,
                snippet: createSnippet(val, query),
              });
            }
          }

          if (!matched) return;
        } else {
          matchedFields.push({
            label: 'Activity',
            snippet: createSnippet(report.topicActivity || report.workDescription, ''),
          });
        }

        results.push({
          id: report.id,
          type: 'DAILY',
          report,
          title: report.topicActivity || `Daily Training Report (${report.date})`,
          subtitle: report.workDescription || report.learningOutcome,
          dateStr: new Date(report.date + 'T00:00:00').toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          rawDate: report.date,
          userName: report.userName,
          employeeId: report.employeeId,
          department: report.department,
          status: report.status,
          workAreaOrDept: report.trainingWorkArea,
          matchedFields,
        });
      });
    }

    // 2. Process Weekly Reports
    if (reportType === 'ALL' || reportType === 'WEEKLY') {
      weeklyReports.forEach(report => {
        if (scope === 'MINE' && currentUser && report.userId !== currentUser.id) {
          return;
        }

        if (traineeIdFilter !== 'ALL' && report.userId !== traineeIdFilter) {
          return;
        }

        if (statusFilter !== 'ALL' && report.status !== statusFilter) {
          return;
        }

        if (traineeNameFilter) {
          const nameMatches =
            report.userName.toLowerCase().includes(traineeNameFilter) ||
            report.employeeId.toLowerCase().includes(traineeNameFilter) ||
            (report.department && report.department.toLowerCase().includes(traineeNameFilter));
          if (!nameMatches) return;
        }

        if (dateFilter) {
          const start = report.weekStart.toLowerCase();
          const end = report.weekEnd.toLowerCase();
          const weekStr = `week ${report.weekNumber}`.toLowerCase();
          let isWithin = false;
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
            isWithin = dateFilter >= report.weekStart && dateFilter <= report.weekEnd;
          }
          const matchesDate = start.includes(dateFilter) || end.includes(dateFilter) || weekStr.includes(dateFilter) || isWithin;
          if (!matchesDate) return;
        }

        const matchedFields: { label: string; snippet: string }[] = [];
        const dailySummaryText = (report.dailySummary || []).map(d => `${d.day} (${d.date}): ${d.activity}`).join('; ');

        if (query) {
          const searchFields: [string, string][] = [
            ['Report ID', report.id],
            ['Week Number', `Week ${report.weekNumber}`],
            ['Assigned Dept / Project', report.assignedProjectDept],
            ['Major Learnings', report.majorLearnings],
            ['Technical Skills', report.technicalSkillsAcquired],
            ['Challenges Faced', report.challengesFaced],
            ['Solutions Implemented', report.solutionsImplemented],
            ['Next Week Plan', report.planForNextWeek],
            ['Daily Activities', dailySummaryText],
            ['Remarks', report.remarks || ''],
            ['Admin Remark', report.adminRemark || ''],
            ['Trainee Name', report.userName],
            ['Employee ID', report.employeeId],
            ['Department', report.department],
          ];

          let matched = false;
          for (const [label, val] of searchFields) {
            if (val && val.toLowerCase().includes(query)) {
              matched = true;
              matchedFields.push({
                label,
                snippet: createSnippet(val, query),
              });
            }
          }

          if (!matched) return;
        } else {
          matchedFields.push({
            label: 'Major Learnings',
            snippet: createSnippet(report.majorLearnings || report.assignedProjectDept, ''),
          });
        }

        results.push({
          id: report.id,
          type: 'WEEKLY',
          report,
          title: `Week ${report.weekNumber}: ${report.assignedProjectDept || 'Technical Synthesis'}`,
          subtitle: report.majorLearnings || report.technicalSkillsAcquired,
          dateStr: `${report.weekStart} to ${report.weekEnd}`,
          rawDate: report.weekStart,
          userName: report.userName,
          employeeId: report.employeeId,
          department: report.department,
          status: report.status,
          workAreaOrDept: report.assignedProjectDept,
          matchedFields,
        });
      });
    }

    results.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
    return results;
  }, [dailyReports, weeklyReports, searchFilters, currentUser]);

  // Sync to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('trms_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('trms_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('trms_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('trms_daily_reports', JSON.stringify(dailyReports));
  }, [dailyReports]);

  useEffect(() => {
    localStorage.setItem('trms_weekly_reports', JSON.stringify(weeklyReports));
  }, [weeklyReports]);

  useEffect(() => {
    localStorage.setItem('trms_compliance_config', JSON.stringify(complianceConfig));
  }, [complianceConfig]);

  useEffect(() => {
    localStorage.setItem('trms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('trms_google_apps_script_url', googleAppsScriptUrl);
  }, [googleAppsScriptUrl]);

  useEffect(() => {
    localStorage.setItem('trms_sync_logs', JSON.stringify(syncLogs));
  }, [syncLogs]);

  // Helper to notify other tabs/editions in the same browser session
  const notifyEditionBroadcast = (type: string, meta?: any) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type, meta, timestamp: Date.now() });
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  };

  // Helper to apply incoming full state safely without losing local unpersisted draft edits
  const applyServerState = (data: any) => {
    if (!data) return;
    setIsCloudConnected(true);
    setEditionSyncStatus('synced');
    setLastLiveSyncTime(new Date().toLocaleTimeString());

    if (Array.isArray(data.users)) {
      const filteredUsers = data.users.filter((u: User) => !isDemoUser(u));
      if (filteredUsers.length > 0) {
        setUsers(filteredUsers);
      }
    }
    if (Array.isArray(data.dailyReports)) {
      setDailyReports(data.dailyReports.filter((r: DailyReport) => !isDemoReport(r)));
    }
    if (Array.isArray(data.weeklyReports)) {
      setWeeklyReports(data.weeklyReports.filter((r: WeeklyReport) => !isDemoReport(r)));
    }
    if (data.complianceConfig) {
      setComplianceConfig(data.complianceConfig);
    }
    if (data.googleAppsScriptUrl && !googleAppsScriptUrl) {
      setGoogleAppsScriptUrlState(data.googleAppsScriptUrl);
    }
  };

  // Cloud Synchronization Engine: Real-Time SSE + Cross-Tab BroadcastChannel + Fast Delta Polling + Peer Edition Mirroring
  useEffect(() => {
    // 0. Auto-notify local server of detected peer edition URL
    const peerEditionUrl = getPeerEditionUrl();
    if (peerEditionUrl) {
      fetch('/api/peer/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerUrl: peerEditionUrl })
      }).catch(() => {});
    }

    // 1. Initialize Cross-Tab Broadcast Channel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('trms_multi_edition_sync');
        broadcastChannelRef.current = bc;
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'USER_ADDED' && ev.data?.user) {
            const newUser = ev.data.user;
            setUsers(prev => {
              if (prev.some(u => u.id === newUser.id || (newUser.employeeId && u.employeeId.toLowerCase() === newUser.employeeId.toLowerCase()))) {
                return prev;
              }
              return [newUser, ...prev];
            });
          }
          // Immediately fetch latest state when another tab/edition updates
          fetch('/api/sync/live?rev=0')
            .then(r => r.json())
            .then(res => {
              if (res.success && res.state) {
                applyServerState(res.state);
                latestRevisionRef.current = res.revision || latestRevisionRef.current + 1;
              }
            })
            .catch(() => {});
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization skipped:', err);
      }
    }

    // 2. Initial full state fetch from server
    fetch('/api/system-state')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          applyServerState(data);
          if (data.revision) latestRevisionRef.current = data.revision;
        }
      })
      .catch(err => {
        console.warn('Initial server state fetch failed, running with local data:', err);
        setIsCloudConnected(false);
      });

    // 3. Connect to Server-Sent Events (SSE) for instant zero-latency push from deployed server
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/live-events');
      eventSource.onopen = () => {
        setIsCloudConnected(true);
        setEditionSyncStatus('synced');
      };
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'SYNC_UPDATE') {
            fetch(`/api/sync/live?rev=0`)
              .then(r => r.json())
              .then(res => {
                if (res.success && res.state) {
                  applyServerState(res.state);
                  if (res.revision) latestRevisionRef.current = res.revision;
                }
              })
              .catch(() => {});
          }
        } catch (err) {}
      };
      eventSource.onerror = () => {
        // SSE disconnected or proxy buffered, seamless fallback to polling
        setEditionSyncStatus('syncing');
      };
    } catch (err) {
      console.warn('EventSource setup notice:', err);
    }

    // 4. Fast Delta Polling (every 2.5 seconds) - checks local server + peer edition
    const pollTimer = setInterval(() => {
      // Check local server
      fetch(`/api/sync/live?rev=${latestRevisionRef.current}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setIsCloudConnected(true);
            setEditionSyncStatus('synced');
            if (data.hasUpdate && data.state) {
              applyServerState(data.state);
              latestRevisionRef.current = data.revision;
            }
          }
        })
        .catch(() => {
          setIsCloudConnected(false);
          setEditionSyncStatus('error');
        });

      // Also check peer edition (dev <-> deployed) directly to ensure user additions propagate in real time
      const targetPeer = getPeerEditionUrl();
      if (targetPeer) {
        fetch(`${targetPeer}/api/users`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(2200)
        })
          .then(r => r.json())
          .then(pData => {
            if (pData.success && Array.isArray(pData.users)) {
              setUsers(prevUsers => {
                let hasNew = false;
                const merged = [...prevUsers];
                for (const pu of pData.users) {
                  if (!pu.name) continue;
                  const exists = merged.some(u =>
                    (pu.id && u.id === pu.id) ||
                    (pu.employeeId && u.employeeId && u.employeeId.trim().toLowerCase() === pu.employeeId.trim().toLowerCase()) ||
                    (pu.email && u.email && u.email.trim().toLowerCase() === pu.email.trim().toLowerCase())
                  );
                  if (!exists) {
                    merged.unshift(pu);
                    hasNew = true;
                    // Persist to local server store as replication
                    fetch('/api/users', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-Sync-Replication': 'true' },
                      body: JSON.stringify({ ...pu, isReplication: true })
                    }).catch(() => {});
                  }
                }
                return hasNew ? merged : prevUsers;
              });
            }
          })
          .catch(() => {});
      }
    }, 2500);

    // 5. Immediate check when window regains focus or tab becomes visible
    const onWindowFocus = () => {
      fetch(`/api/sync/live?rev=0`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.state) {
            setIsCloudConnected(true);
            setEditionSyncStatus('synced');
            applyServerState(data.state);
            latestRevisionRef.current = data.revision;
          }
        })
        .catch(() => {});

      const targetPeer = getPeerEditionUrl();
      if (targetPeer) {
        fetch(`${targetPeer}/api/users`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(2200)
        })
          .then(r => r.json())
          .then(pData => {
            if (pData.success && Array.isArray(pData.users)) {
              setUsers(prevUsers => {
                let hasNew = false;
                const merged = [...prevUsers];
                for (const pu of pData.users) {
                  if (!pu.name) continue;
                  const exists = merged.some(u =>
                    (pu.id && u.id === pu.id) ||
                    (pu.employeeId && u.employeeId && u.employeeId.trim().toLowerCase() === pu.employeeId.trim().toLowerCase()) ||
                    (pu.email && u.email && u.email.trim().toLowerCase() === pu.email.trim().toLowerCase())
                  );
                  if (!exists) {
                    merged.unshift(pu);
                    hasNew = true;
                  }
                }
                return hasNew ? merged : prevUsers;
              });
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('focus', onWindowFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        onWindowFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 6. Real-Time Shared Cloud Database Sync (Google Cloud Firestore)
    // Synchronizes reports and user data seamlessly between Deployed Cloud Run and AI Studio
    seedCloudDatabaseIfNeeded(users, dailyReports, weeklyReports);
    const unsubFirestore = subscribeToSharedCloudData({
      onUsersUpdate: (cloudUsers) => {
        const filtered = cloudUsers.filter(u => !isDemoUser(u));
        if (filtered.length > 0) {
          setUsers(filtered);
          setIsCloudConnected(true);
          setEditionSyncStatus('synced');
          setLastLiveSyncTime(new Date().toLocaleTimeString());
        }
      },
      onDailyReportsUpdate: (cloudDaily) => {
        const filtered = cloudDaily.filter(r => !isDemoReport(r));
        setDailyReports(filtered);
        setIsCloudConnected(true);
        setEditionSyncStatus('synced');
        setLastLiveSyncTime(new Date().toLocaleTimeString());
      },
      onWeeklyReportsUpdate: (cloudWeekly) => {
        const filtered = cloudWeekly.filter(r => !isDemoReport(r));
        setWeeklyReports(filtered);
        setIsCloudConnected(true);
        setEditionSyncStatus('synced');
        setLastLiveSyncTime(new Date().toLocaleTimeString());
      }
    });

    return () => {
      clearInterval(pollTimer);
      if (eventSource) eventSource.close();
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      unsubFirestore();
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    showToast(type, message, title);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Trigger server sync to Google Sheets
  const syncToSheetsServer = async (type: 'USER' | 'DAILY_REPORT' | 'WEEKLY_REPORT', data: any) => {
    try {
      const res = await fetch('/api/sync-google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          webAppUrl: googleAppsScriptUrl || sheetsConfig?.webAppUrl || undefined
        })
      });
      const text = await res.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        result = { success: res.ok, mode: res.ok ? 'LIVE_GOOGLE_SHEETS' : 'LOCAL_FALLBACK', message: text };
      }
      
      const newLog: SheetsSyncLog = {
        id: result.syncId || ('LOG-' + Date.now()),
        timestamp: new Date().toISOString(),
        type,
        reportId: data.reportId || data.userId || data.id,
        status: result.mode === 'LIVE_GOOGLE_SHEETS' ? 'SUCCESS' : 'LOCAL_QUEUED',
        message: result.message || (result.mode === 'LIVE_GOOGLE_SHEETS' ? 'Pushed to Google Sheets' : 'Stored in database')
      };
      setSyncLogs(prev => [newLog, ...prev.slice(0, 49)]);
      return result;
    } catch (err: any) {
      console.warn('Sync server call error:', err);
      const newLog: SheetsSyncLog = {
        id: 'LOG-' + Date.now(),
        timestamp: new Date().toISOString(),
        type,
        reportId: data.reportId || data.userId || data.id,
        status: 'LOCAL_QUEUED',
        message: 'Saved locally. Google Sheets connection offline.'
      };
      setSyncLogs(prev => [newLog, ...prev.slice(0, 49)]);
      return { success: true, mode: 'LOCAL_QUEUED' };
    }
  };

  // Auth functions
  const login = (emailOrEmpId: string, password?: string): boolean => {
    const cleanId = emailOrEmpId.trim().toLowerCase();
    const found = users.find(
      u => (u.email.toLowerCase() === cleanId || u.employeeId.toLowerCase() === cleanId)
    );

    if (!found) {
      showToast('error', 'Invalid email or Employee ID. Please check your credentials.');
      return false;
    }

    if (found.status === 'DISABLED') {
      showToast('error', 'Your account has been deactivated by administrator. Please contact HR.');
      return false;
    }

    // If password provided and user has a password, verify
    if (password && found.password && found.password !== password) {
      showToast('error', 'Incorrect password. Try again or contact Admin to reset.');
      return false;
    }

    setCurrentUser(found);
    showToast('success', `Welcome back, ${found.name}! (${found.role})`);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('info', 'You have been logged out successfully.');
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      showToast('info', `Switched active account to: ${target.name} (${target.role})`);
    }
  };

  const updateProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    showToast('success', 'Profile updated successfully.');
  };

  // Report submission
  const generateDailyReportId = () => {
    const year = new Date().getFullYear();
    const count = dailyReports.length + 1;
    const padded = String(count).padStart(4, '0');
    return `DR-${year}-${padded}`;
  };

  const generateWeeklyReportId = () => {
    const year = new Date().getFullYear();
    const count = weeklyReports.length + 1;
    const padded = String(count).padStart(4, '0');
    return `WR-${year}-${padded}`;
  };

  const submitDailyReport = async (
    data: Omit<DailyReport, 'id' | 'createdAt' | 'submittedAt' | 'updatedAt' | 'syncStatus'>,
    isDraft = false
  ): Promise<string> => {
    const reportId = generateDailyReportId();
    const now = new Date().toISOString();
    const status: ReportStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

    const newReport: DailyReport = {
      ...data,
      id: reportId,
      status,
      createdAt: now,
      submittedAt: now,
      updatedAt: now,
      syncStatus: googleAppsScriptUrl ? 'SYNCED' : 'QUEUED',
    };

    setDailyReports(prev => [newReport, ...prev]);

    // Notify Admins
    if (!isDraft) {
      const newNotif: InAppNotification = {
        id: 'NOTIF-' + Date.now(),
        userId: 'ADMIN',
        title: 'New Daily Report Submitted',
        message: `${newReport.userName} (${newReport.employeeId}) submitted ${reportId} for ${newReport.date}.`,
        type: 'INFO',
        reportId,
        reportType: 'DAILY',
        read: false,
        createdAt: now,
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    // Google Sheets sync
    await syncToSheetsServer('DAILY_REPORT', {
      reportId: newReport.id,
      userId: newReport.userId,
      employeeId: newReport.employeeId,
      userName: newReport.userName,
      nameOfGet: newReport.nameOfGet || newReport.userName,
      department: newReport.department,
      subDepartment: newReport.subDepartment || '',
      nameOfHod: newReport.nameOfHod || '',
      staffMet1: newReport.staffMet1 || '',
      staffMet2: newReport.staffMet2 || '',
      date: newReport.date,
      inputDept: newReport.inputDept || '',
      processValueAdded: newReport.processValueAdded || '',
      outputNextDept: newReport.outputNextDept || '',
      standards: newReport.standards || '',
      safetyStandards: newReport.safetyStandards || '',
      chronicProblem1: newReport.chronicProblem1 || '',
      chronicProblem2: newReport.chronicProblem2 || '',
      chronicProblem3: newReport.chronicProblem3 || '',
      backOfPageNotes: newReport.backOfPageNotes || '',
      reportDetails: {
        trainingWorkArea: newReport.trainingWorkArea,
        topicActivity: newReport.topicActivity,
        workDescription: newReport.workDescription,
        learningOutcome: newReport.learningOutcome,
        toolsEquipmentUsed: newReport.toolsEquipmentUsed,
        safetyObservations: newReport.safetyObservations,
        remarks: newReport.remarks
      },
      submissionDateTime: now,
      status: newReport.status,
      adminRemark: newReport.adminRemark || '',
      reviewedBy: newReport.reviewedBy || '',
      reviewedDate: newReport.reviewedDate || ''
    });

    showToast(
      'success',
      isDraft ? `Daily Report draft saved with ID ${reportId}` : `Daily Report ${reportId} submitted successfully!`,
      'Submission Confirmed'
    );

    notifyEditionBroadcast('DAILY_REPORT_SAVED', newReport);
    syncDailyReportToCloud(newReport);
    return reportId;
  };

  const updateDailyReport = async (reportId: string, updatedFields: Partial<DailyReport>, resubmit = false) => {
    const now = new Date().toISOString();
    let updatedReport: DailyReport | null = null;

    setDailyReports(prev => {
      const exists = prev.some(r => r.id === reportId);
      if (exists) {
        return prev.map(r => {
          if (r.id === reportId) {
            updatedReport = {
              ...r,
              ...updatedFields,
              status: resubmit ? 'SUBMITTED' : (updatedFields.status || r.status),
              updatedAt: now,
              submittedAt: resubmit ? now : r.submittedAt,
            };
            return updatedReport;
          }
          return r;
        });
      } else {
        const finalId = reportId.startsWith('DRAFT-') ? generateDailyReportId() : reportId;
        const newRep: DailyReport = {
          id: finalId,
          userId: currentUser?.id || 'USR-GET-001',
          employeeId: currentUser?.employeeId || 'GET-2025-001',
          userName: currentUser?.name || 'Trainee',
          department: currentUser?.department || 'Production',
          date: new Date().toISOString().split('T')[0],
          status: 'SUBMITTED',
          createdAt: now,
          submittedAt: now,
          updatedAt: now,
          syncStatus: googleAppsScriptUrl ? 'SYNCED' : 'QUEUED',
          ...updatedFields,
        } as DailyReport;
        updatedReport = newRep;
        return [newRep, ...prev];
      }
    });

    if (updatedReport) {
      const rep = updatedReport as DailyReport;
      syncDailyReportToCloud(rep);
      if (resubmit) {
        const newNotif: InAppNotification = {
          id: 'NOTIF-' + Date.now(),
          userId: 'ADMIN',
          title: 'Daily Report Resubmitted',
          message: `${rep.userName} resubmitted ${rep.id} after addressing remarks.`,
          type: 'INFO',
          reportId: rep.id,
          reportType: 'DAILY',
          read: false,
          createdAt: now,
        };
        setNotifications(prev => [newNotif, ...prev]);
      }

      await syncToSheetsServer('DAILY_REPORT', {
        reportId: rep.id,
        userId: rep.userId,
        employeeId: rep.employeeId,
        userName: rep.userName,
        nameOfGet: rep.nameOfGet || rep.userName,
        department: rep.department,
        subDepartment: rep.subDepartment || '',
        nameOfHod: rep.nameOfHod || '',
        staffMet1: rep.staffMet1 || '',
        staffMet2: rep.staffMet2 || '',
        date: rep.date,
        inputDept: rep.inputDept || '',
        processValueAdded: rep.processValueAdded || '',
        outputNextDept: rep.outputNextDept || '',
        standards: rep.standards || '',
        safetyStandards: rep.safetyStandards || '',
        chronicProblem1: rep.chronicProblem1 || '',
        chronicProblem2: rep.chronicProblem2 || '',
        chronicProblem3: rep.chronicProblem3 || '',
        backOfPageNotes: rep.backOfPageNotes || '',
        reportDetails: {
          trainingWorkArea: rep.trainingWorkArea,
          topicActivity: rep.topicActivity,
          workDescription: rep.workDescription,
          learningOutcome: rep.learningOutcome,
          toolsEquipmentUsed: rep.toolsEquipmentUsed,
          safetyObservations: rep.safetyObservations,
          remarks: rep.remarks
        },
        submissionDateTime: rep.submittedAt,
        status: rep.status,
        adminRemark: rep.adminRemark || '',
        reviewedBy: rep.reviewedBy || '',
        reviewedDate: rep.reviewedDate || ''
      });

      showToast('success', `Daily Report ${reportId} updated successfully.`);
      notifyEditionBroadcast('DAILY_REPORT_SAVED', updatedReport);
    }
  };

  const submitWeeklyReport = async (
    data: Omit<WeeklyReport, 'id' | 'createdAt' | 'submittedAt' | 'updatedAt' | 'syncStatus'>,
    isDraft = false
  ): Promise<string> => {
    const reportId = generateWeeklyReportId();
    const now = new Date().toISOString();
    const status: ReportStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

    const newReport: WeeklyReport = {
      ...data,
      id: reportId,
      status,
      createdAt: now,
      submittedAt: now,
      updatedAt: now,
      syncStatus: googleAppsScriptUrl ? 'SYNCED' : 'QUEUED',
    };

    setWeeklyReports(prev => [newReport, ...prev]);

    if (!isDraft) {
      const newNotif: InAppNotification = {
        id: 'NOTIF-' + Date.now(),
        userId: 'ADMIN',
        title: 'New Weekly Report Submitted',
        message: `${newReport.userName} submitted Weekly Report ${reportId} (Week ${newReport.weekNumber}).`,
        type: 'INFO',
        reportId,
        reportType: 'WEEKLY',
        read: false,
        createdAt: now,
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    await syncToSheetsServer('WEEKLY_REPORT', {
      reportId: newReport.id,
      userId: newReport.userId,
      employeeId: newReport.employeeId,
      userName: newReport.userName,
      nameOfStudentTrainee: newReport.nameOfStudentTrainee || newReport.userName,
      daysPresent: newReport.daysPresent,
      department: newReport.department,
      subDepartment: newReport.subDepartment,
      weekStart: newReport.weekStart,
      weekEnd: newReport.weekEnd,
      classroomTrainingSummary: newReport.classroomTrainingSummary || '',
      shopFloorTrainingSummary: newReport.shopFloorTrainingSummary || '',
      projectSummaryA: newReport.projectSummaryA || '',
      projectSummaryB: newReport.projectSummaryB || '',
      selfLearningSummary: newReport.selfLearningSummary || '',
      suggestion: newReport.suggestion || '',
      traineeSignature: newReport.traineeSignature || '',
      backOfPageNotes: newReport.backOfPageNotes || '',
      weeklyReportDetails: {
        weekNumber: newReport.weekNumber,
        assignedProjectDept: newReport.assignedProjectDept,
        dailySummary: newReport.dailySummary,
        majorLearnings: newReport.majorLearnings,
        technicalSkillsAcquired: newReport.technicalSkillsAcquired,
        challengesFaced: newReport.challengesFaced,
        solutionsImplemented: newReport.solutionsImplemented,
        planForNextWeek: newReport.planForNextWeek,
        traineeSelfAssessment: newReport.traineeSelfAssessment,
        remarks: newReport.remarks
      },
      submissionDateTime: now,
      status: newReport.status,
      adminRemark: newReport.adminRemark || '',
      reviewedBy: newReport.reviewedBy || '',
      reviewedDate: newReport.reviewedDate || ''
    });

    showToast(
      'success',
      isDraft ? `Weekly Report draft saved with ID ${reportId}` : `Weekly Report ${reportId} submitted successfully!`,
      'Submission Confirmed'
    );

    notifyEditionBroadcast('WEEKLY_REPORT_SAVED', newReport);
    syncWeeklyReportToCloud(newReport);
    return reportId;
  };

  const updateWeeklyReport = async (reportId: string, updatedFields: Partial<WeeklyReport>, resubmit = false) => {
    const now = new Date().toISOString();
    let updatedReport: WeeklyReport | null = null;

    setWeeklyReports(prev => {
      const exists = prev.some(r => r.id === reportId);
      if (exists) {
        return prev.map(r => {
          if (r.id === reportId) {
            updatedReport = {
              ...r,
              ...updatedFields,
              status: resubmit ? 'SUBMITTED' : (updatedFields.status || r.status),
              updatedAt: now,
              submittedAt: resubmit ? now : r.submittedAt,
            };
            return updatedReport;
          }
          return r;
        });
      } else {
        const finalId = reportId.startsWith('DRAFT-') ? generateWeeklyReportId() : reportId;
        const newRep: WeeklyReport = {
          id: finalId,
          userId: currentUser?.id || 'USR-GET-001',
          employeeId: currentUser?.employeeId || 'GET-2025-001',
          userName: currentUser?.name || 'Trainee',
          department: currentUser?.department || 'Production',
          weekNumber: 1,
          weekStart: new Date().toISOString().split('T')[0],
          weekEnd: new Date().toISOString().split('T')[0],
          status: 'SUBMITTED',
          createdAt: now,
          submittedAt: now,
          updatedAt: now,
          syncStatus: googleAppsScriptUrl ? 'SYNCED' : 'QUEUED',
          ...updatedFields,
        } as WeeklyReport;
        updatedReport = newRep;
        return [newRep, ...prev];
      }
    });

    if (updatedReport) {
      const rep = updatedReport as WeeklyReport;
      syncWeeklyReportToCloud(rep);
      if (resubmit) {
        const newNotif: InAppNotification = {
          id: 'NOTIF-' + Date.now(),
          userId: 'ADMIN',
          title: 'Weekly Report Resubmitted',
          message: `${rep.userName} resubmitted ${rep.id} after addressing remarks.`,
          type: 'INFO',
          reportId: rep.id,
          reportType: 'WEEKLY',
          read: false,
          createdAt: now,
        };
        setNotifications(prev => [newNotif, ...prev]);
      }

      await syncToSheetsServer('WEEKLY_REPORT', {
        reportId: rep.id,
        userId: rep.userId,
        employeeId: rep.employeeId,
        userName: rep.userName,
        nameOfStudentTrainee: rep.nameOfStudentTrainee || rep.userName,
        daysPresent: rep.daysPresent,
        department: rep.department,
        subDepartment: rep.subDepartment,
        weekStart: rep.weekStart,
        weekEnd: rep.weekEnd,
        classroomTrainingSummary: rep.classroomTrainingSummary || '',
        shopFloorTrainingSummary: rep.shopFloorTrainingSummary || '',
        projectSummaryA: rep.projectSummaryA || '',
        projectSummaryB: rep.projectSummaryB || '',
        selfLearningSummary: rep.selfLearningSummary || '',
        suggestion: rep.suggestion || '',
        traineeSignature: rep.traineeSignature || '',
        backOfPageNotes: rep.backOfPageNotes || '',
        weeklyReportDetails: {
          weekNumber: rep.weekNumber,
          assignedProjectDept: rep.assignedProjectDept,
          dailySummary: rep.dailySummary,
          majorLearnings: rep.majorLearnings,
          technicalSkillsAcquired: rep.technicalSkillsAcquired,
          challengesFaced: rep.challengesFaced,
          solutionsImplemented: rep.solutionsImplemented,
          planForNextWeek: rep.planForNextWeek,
          traineeSelfAssessment: rep.traineeSelfAssessment,
          remarks: rep.remarks
        },
        submissionDateTime: rep.submittedAt,
        status: rep.status,
        adminRemark: rep.adminRemark || '',
        reviewedBy: rep.reviewedBy || '',
        reviewedDate: rep.reviewedDate || ''
      });

      showToast('success', `Weekly Report ${reportId} updated.`);
      notifyEditionBroadcast('WEEKLY_REPORT_SAVED', updatedReport);
    }
  };

  const deleteDraftReport = async (reportId: string, type: 'DAILY' | 'WEEKLY') => {
    if (type === 'DAILY') {
      setDailyReports(prev => prev.filter(r => r.id !== reportId));
    } else {
      setWeeklyReports(prev => prev.filter(r => r.id !== reportId));
    }
    try {
      await fetch(`/api/reports/${type.toLowerCase()}/${reportId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete report on server:', e);
    }
  };

  const updateReportStatus = async (
    type: 'DAILY' | 'WEEKLY',
    reportId: string,
    status: ReportStatus,
    adminRemark?: string
  ) => {
    const now = new Date().toISOString();
    const reviewerName = currentUser ? currentUser.name : 'Administrator';

    if (type === 'DAILY') {
      let targetRep: DailyReport | undefined;
      setDailyReports(prev =>
        prev.map(r => {
          if (r.id === reportId) {
            targetRep = {
              ...r,
              status,
              adminRemark: adminRemark !== undefined ? adminRemark : r.adminRemark,
              reviewedBy: reviewerName,
              reviewedDate: now,
              updatedAt: now,
            };
            return targetRep;
          }
          return r;
        })
      );

      if (targetRep) {
        // Send user notification
        const userNotif: InAppNotification = {
          id: 'NOTIF-' + Date.now(),
          userId: targetRep.userId,
          title: status === 'REVIEWED' ? 'Daily Report Reviewed' : `Report Status: ${status}`,
          message: status === 'REVIEWED'
            ? `Your Daily Report ${reportId} has been reviewed by the administrator.${adminRemark ? ` Remark: "${adminRemark}"` : ''}`
            : `Your Daily Report ${reportId} status is now ${status}.`,
          type: status === 'REVIEWED' ? 'SUCCESS' : 'INFO',
          reportId,
          reportType: 'DAILY',
          read: false,
          createdAt: now,
        };
        setNotifications(prev => [userNotif, ...prev]);

        // Sync to Sheets
        await syncToSheetsServer('DAILY_REPORT', {
          reportId: targetRep.id,
          userId: targetRep.userId,
          employeeId: targetRep.employeeId,
          userName: targetRep.userName,
          department: targetRep.department,
          date: targetRep.date,
          reportDetails: {
            trainingWorkArea: targetRep.trainingWorkArea,
            topicActivity: targetRep.topicActivity,
            workDescription: targetRep.workDescription,
            learningOutcome: targetRep.learningOutcome
          },
          submissionDateTime: targetRep.submittedAt,
          status,
          adminRemark: adminRemark || targetRep.adminRemark || '',
          reviewedBy: reviewerName,
          reviewedDate: now
        });
        syncDailyReportToCloud(targetRep);
      }
    } else {
      let targetRep: WeeklyReport | undefined;
      setWeeklyReports(prev =>
        prev.map(r => {
          if (r.id === reportId) {
            targetRep = {
              ...r,
              status,
              adminRemark: adminRemark !== undefined ? adminRemark : r.adminRemark,
              reviewedBy: reviewerName,
              reviewedDate: now,
              updatedAt: now,
            };
            return targetRep;
          }
          return r;
        })
      );

      if (targetRep) {
        const userNotif: InAppNotification = {
          id: 'NOTIF-' + Date.now(),
          userId: targetRep.userId,
          title: status === 'REVIEWED' ? 'Weekly Report Reviewed' : `Weekly Report Status: ${status}`,
          message: status === 'REVIEWED'
            ? `Your Weekly Report ${reportId} has been reviewed by the administrator.${adminRemark ? ` Remark: "${adminRemark}"` : ''}`
            : `Your Weekly Report ${reportId} status is now ${status}.`,
          type: status === 'REVIEWED' ? 'SUCCESS' : 'INFO',
          reportId,
          reportType: 'WEEKLY',
          read: false,
          createdAt: now,
        };
        setNotifications(prev => [userNotif, ...prev]);

        await syncToSheetsServer('WEEKLY_REPORT', {
          reportId: targetRep.id,
          userId: targetRep.userId,
          employeeId: targetRep.employeeId,
          userName: targetRep.userName,
          department: targetRep.department,
          weekStart: targetRep.weekStart,
          weekEnd: targetRep.weekEnd,
          weeklyReportDetails: {
            weekNumber: targetRep.weekNumber,
            majorLearnings: targetRep.majorLearnings
          },
          submissionDateTime: targetRep.submittedAt,
          status,
          adminRemark: adminRemark || targetRep.adminRemark || '',
          reviewedBy: reviewerName,
          reviewedDate: now
        });
        syncWeeklyReportToCloud(targetRep);
      }
    }

    // Persist status to server store so all other editions receive it immediately
    try {
      await fetch('/api/reports/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          reportId,
          status,
          adminRemark,
          reviewedBy: reviewerName,
          reviewedDate: now,
          webAppUrl: googleAppsScriptUrl || sheetsConfig?.webAppUrl || undefined
        })
      });
    } catch (e) {
      console.warn('Status update API error:', e);
    }

    notifyEditionBroadcast('REPORT_STATUS_UPDATED', { type, reportId, status, adminRemark });
    showToast('success', `Report ${reportId} status updated to ${status}.`);
  };

  // User Management
  const addUser = async (userData: Omit<User, 'id' | 'createdDate'>): Promise<User> => {
    const rolePrefix = userData.role === 'ADMIN' ? 'ADM' : userData.role === 'DET' ? 'DET' : 'GET';
    const newId = 'USR-' + rolePrefix + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newUser: User = {
      ...userData,
      id: newId,
      createdDate: new Date().toISOString(),
      status: userData.status || 'ACTIVE',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      password: userData.password || (userData.role === 'ADMIN' ? 'Admin@123' : 'Trainee@123'),
    };

    // Optimistically update local users state immediately
    setUsers(prev => [newUser, ...prev.filter(u => u.employeeId !== newUser.employeeId)]);

    // Save to local server
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          webAppUrl: googleAppsScriptUrl || sheetsConfig?.webAppUrl || undefined
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn('Server user persistence warning:', err);
    }

    // Direct real-time forward to peer edition (Dev <-> Deployed Cloud Run)
    const peerUrl = getPeerEditionUrl();
    if (peerUrl) {
      fetch(`${peerUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Sync-Replication': 'true' },
        body: JSON.stringify({ ...newUser, isReplication: true })
      }).catch(() => {});
    }

    // Save to local storage cache so it persists across refreshes
    try {
      localStorage.setItem('trms_users', JSON.stringify([newUser, ...users.filter(u => u.id !== newUser.id)]));
    } catch {}

    showToast('success', `User ${newUser.name} (${newUser.employeeId}) created successfully and synced across all editions in real time.`);

    await syncToSheetsServer('USER', {
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
    });

    notifyEditionBroadcast('USER_ADDED', newUser);
    syncUserToCloud(newUser);
    return newUser;
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    let updatedUser: User | null = null;
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          updatedUser = { ...u, ...data };
          return updatedUser;
        }
        return u;
      })
    );

    if (currentUser?.id === userId && updatedUser) {
      setCurrentUser(updatedUser);
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          webAppUrl: googleAppsScriptUrl || sheetsConfig?.webAppUrl || undefined
        })
      });
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.users)) {
        setUsers(resData.users);
      }
    } catch (err) {
      console.warn('Server user update warning:', err);
    }

    if (updatedUser) {
      const u = updatedUser as User;
      syncUserToCloud(u);
      await syncToSheetsServer('USER', {
        userId: u.id,
        employeeId: u.employeeId,
        name: u.name,
        email: u.email,
        department: u.department,
        designation: u.designation,
        role: u.role,
        joiningDate: u.joiningDate,
        status: u.status,
        createdDate: u.createdDate,
      });
      notifyEditionBroadcast('USER_UPDATED', u);
      showToast('success', `User ${u.name} updated successfully.`);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await updateUser(userId, { status: newStatus, isActive: newStatus === 'ACTIVE' });
    showToast('info', `User account ${target.name} is now ${newStatus}.`);
  };

  const deleteUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    removeUserFromCloud(userId);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn('Server user deletion warning:', err);
    }

    notifyEditionBroadcast('USER_DELETED', { userId });
    showToast('info', `User ${target.name} has been removed.`);
  };

  const resetUserPassword = async (userId: string, tempPass: string) => {
    await updateUser(userId, { password: tempPass });
    showToast('success', `Password reset successfully for user. New password: ${tempPass}`);
  };

  const refreshUsersFromCloud = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
        showToast('info', `User list refreshed from server (${data.users.length} registered accounts).`);
      }
    } catch (err) {
      console.warn('Refresh users error:', err);
    }
  };

  const pullUsersFromGoogleSheets = async (url?: string) => {
    const targetUrl = url || googleAppsScriptUrl || sheetsConfig?.webAppUrl;
    try {
      const res = await fetch('/api/sheets/pull-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
        showToast('success', `Imported ${data.addedCount ?? 0} user(s) from Google Sheets. Total users: ${data.totalUsers || data.users?.length}`);
        notifyEditionBroadcast('SHEETS_USERS_PULLED');
        return { success: true, addedCount: data.addedCount, message: `Synced with Google Sheet successfully.` };
      } else {
        showToast('error', data.message || 'Could not pull users from Google Sheet.');
        return { success: false, message: data.message };
      }
    } catch (err: any) {
      showToast('error', 'Error syncing with Google Sheets: ' + (err.message || String(err)));
      return { success: false, message: err.message };
    }
  };

  const pullAllFromGoogleSheets = async (url?: string) => {
    setEditionSyncStatus('syncing');
    const targetUrl = url || googleAppsScriptUrl || sheetsConfig?.webAppUrl;
    try {
      const res = await fetch('/api/sheets/pull-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.success) {
        if (data.state) {
          applyServerState(data.state);
        }
        setEditionSyncStatus('synced');
        setLastLiveSyncTime(new Date().toLocaleTimeString());
        notifyEditionBroadcast('SHEETS_ALL_PULLED');
        showToast('success', `Synced from Google Sheets: +${data.addedUsers ?? 0} users, +${data.addedDaily ?? 0} daily, +${data.addedWeekly ?? 0} weekly.`);
        return {
          success: true,
          message: 'Google Sheets sync successful',
          addedUsers: data.addedUsers,
          addedDaily: data.addedDaily,
          addedWeekly: data.addedWeekly
        };
      } else {
        setEditionSyncStatus('error');
        showToast('error', data.message || 'Failed to pull all data from Google Sheets.');
        return { success: false, message: data.message };
      }
    } catch (err: any) {
      setEditionSyncStatus('error');
      showToast('error', 'Google Sheets pull error: ' + (err.message || String(err)));
      return { success: false, message: err.message };
    }
  };

  const syncBothEditionsNow = async () => {
    setEditionSyncStatus('syncing');
    try {
      // 0. Trigger server-to-server peer synchronization
      fetch('/api/peer/sync', { method: 'POST' }).catch(() => {});

      // 1. Directly fetch from peer edition (dev <-> deployed) to merge any users added there
      const targetPeer = getPeerEditionUrl();
      if (targetPeer) {
        try {
          const peerRes = await fetch(`${targetPeer}/api/users`, { signal: AbortSignal.timeout(3000) });
          const peerData = await peerRes.json();
          if (peerData.success && Array.isArray(peerData.users)) {
            setUsers(prevUsers => {
              let hasNew = false;
              const merged = [...prevUsers];
              for (const pu of peerData.users) {
                if (!pu.name) continue;
                const exists = merged.some(u =>
                  (pu.id && u.id === pu.id) ||
                  (pu.employeeId && u.employeeId && u.employeeId.trim().toLowerCase() === pu.employeeId.trim().toLowerCase()) ||
                  (pu.email && u.email && u.email.trim().toLowerCase() === pu.email.trim().toLowerCase())
                );
                if (!exists) {
                  merged.unshift(pu);
                  hasNew = true;
                  fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Sync-Replication': 'true' },
                    body: JSON.stringify({ ...pu, isReplication: true })
                  }).catch(() => {});
                }
              }
              return hasNew ? merged : prevUsers;
            });
          }
        } catch {}
      }

      // 2. Fetch latest server state across all editions
      const res = await fetch('/api/sync/live?rev=0');
      const data = await res.json();
      if (data.success && data.state) {
        applyServerState(data.state);
        latestRevisionRef.current = data.revision || latestRevisionRef.current + 1;
      }

      // 2. Also trigger Google Sheets sync if URL configured
      let sheetsDetail = '';
      if (googleAppsScriptUrl || sheetsConfig?.webAppUrl) {
        try {
          const sRes = await fetch('/api/sheets/pull-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: googleAppsScriptUrl || sheetsConfig?.webAppUrl })
          });
          const sData = await sRes.json();
          if (sData.success && sData.state) {
            applyServerState(sData.state);
            sheetsDetail = ` • Google Sheets live: +${sData.addedUsers ?? 0} users, +${sData.addedDaily ?? 0} daily, +${sData.addedWeekly ?? 0} weekly.`;
          }
        } catch (sErr) {
          console.warn('Sheets pull in syncBothEditions notice:', sErr);
        }
      }

      setEditionSyncStatus('synced');
      const syncTime = new Date().toLocaleTimeString();
      setLastLiveSyncTime(syncTime);
      notifyEditionBroadcast('BOTH_EDITIONS_SYNCED');

      showToast('success', `Both editions & live state fully synchronized at ${syncTime}!${sheetsDetail}`);
      return { success: true, message: `Synchronized successfully at ${syncTime}` };
    } catch (err: any) {
      setEditionSyncStatus('error');
      showToast('error', 'Live synchronization error: ' + (err.message || String(err)));
      return { success: false, message: err.message || 'Failed to sync' };
    }
  };

  const updateComplianceConfig = (config: ComplianceConfig) => {
    setComplianceConfig(config);
    showToast('success', 'Compliance schedule updated.');
  };

  const updateComplianceSettings = (settings: Partial<ComplianceConfig>) => {
    setComplianceConfig(prev => ({ ...prev, ...settings }));
    showToast('success', 'Compliance settings updated.');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('info', 'All notifications marked as read.');
  };

  const setGoogleAppsScriptUrl = (url: string) => {
    setGoogleAppsScriptUrlState(url);
    showToast('success', 'Google Apps Script Web App URL updated.');
  };

  const testSheetsConnection = async (url?: string) => {
    const targetUrl = url || googleAppsScriptUrl || sheetsConfig?.webAppUrl;
    if (!targetUrl) {
      return { success: false, message: 'Please enter a Google Apps Script Web App URL first.' };
    }

    try {
      const res = await fetch('/api/test-sheets-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: res.ok, message: text || `Server responded with HTTP ${res.status}` };
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection test failed.' };
    }
  };

  const syncAllToSheets = async () => {
    let synced = 0;
    let failed = 0;

    for (const u of users) {
      try {
        await syncToSheetsServer('USER', {
          userId: u.id,
          employeeId: u.employeeId,
          name: u.name,
          email: u.email,
          department: u.department,
          designation: u.designation,
          role: u.role,
          joiningDate: u.joiningDate,
          status: u.status,
          createdDate: u.createdDate,
        });
        synced++;
      } catch {
        failed++;
      }
    }

    for (const d of dailyReports) {
      try {
        await syncToSheetsServer('DAILY_REPORT', {
          reportId: d.id,
          userId: d.userId,
          employeeId: d.employeeId,
          userName: d.userName,
          department: d.department,
          date: d.date,
          reportDetails: {
            trainingWorkArea: d.trainingWorkArea,
            topicActivity: d.topicActivity,
            workDescription: d.workDescription,
            learningOutcome: d.learningOutcome,
            toolsEquipmentUsed: d.toolsEquipmentUsed,
            safetyObservations: d.safetyObservations,
            remarks: d.remarks
          },
          submissionDateTime: d.submittedAt,
          status: d.status,
          adminRemark: d.adminRemark || '',
          reviewedBy: d.reviewedBy || '',
          reviewedDate: d.reviewedDate || ''
        });
        synced++;
      } catch {
        failed++;
      }
    }

    for (const w of weeklyReports) {
      try {
        await syncToSheetsServer('WEEKLY_REPORT', {
          reportId: w.id,
          userId: w.userId,
          employeeId: w.employeeId,
          userName: w.userName,
          department: w.department,
          weekStart: w.weekStart,
          weekEnd: w.weekEnd,
          weeklyReportDetails: {
            weekNumber: w.weekNumber,
            assignedProjectDept: w.assignedProjectDept,
            dailySummary: w.dailySummary,
            majorLearnings: w.majorLearnings,
            technicalSkillsAcquired: w.technicalSkillsAcquired,
            challengesFaced: w.challengesFaced,
            solutionsImplemented: w.solutionsImplemented,
            planForNextWeek: w.planForNextWeek,
            traineeSelfAssessment: w.traineeSelfAssessment,
            remarks: w.remarks
          },
          submissionDateTime: w.submittedAt,
          status: w.status,
          adminRemark: w.adminRemark || '',
          reviewedBy: w.reviewedBy || '',
          reviewedDate: w.reviewedDate || ''
        });
        synced++;
      } catch {
        failed++;
      }
    }

    showToast('success', `Synchronized ${synced} records with Google Sheets.`);
    return { totalSynced: synced, failed };
  };

  const syncSelectedReportsToSheets = async (
    selectedItems: Array<{ id: string; type: 'DAILY' | 'WEEKLY' }>,
    onProgress?: (synced: number, total: number) => void
  ): Promise<{ totalSynced: number; failed: number }> => {
    if (!selectedItems || selectedItems.length === 0) {
      return { totalSynced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const total = selectedItems.length;

    // Prepare batch payloads
    const batchPayloads: Array<{ type: 'DAILY_REPORT' | 'WEEKLY_REPORT'; data: any }> = [];
    const dailyToUpdate: DailyReport[] = [];
    const weeklyToUpdate: WeeklyReport[] = [];

    for (const item of selectedItems) {
      if (item.type === 'DAILY') {
        const d = dailyReports.find(r => r.id === item.id);
        if (d) {
          batchPayloads.push({
            type: 'DAILY_REPORT',
            data: {
              reportId: d.id,
              userId: d.userId,
              employeeId: d.employeeId,
              userName: d.userName,
              nameOfGet: d.nameOfGet || d.userName,
              department: d.department,
              subDepartment: d.subDepartment || '',
              designation: d.designation || '',
              date: d.date,
              inputDept: d.inputDept || '',
              processValueAdded: d.processValueAdded || '',
              outputNextDept: d.outputNextDept || '',
              standards: d.standards || '',
              safetyStandards: d.safetyStandards || '',
              chronicProblem1: d.chronicProblem1 || '',
              chronicProblem2: d.chronicProblem2 || '',
              chronicProblem3: d.chronicProblem3 || '',
              reportDetails: {
                trainingWorkArea: d.trainingWorkArea || d.department,
                topicActivity: d.topicActivity || d.processValueAdded || '',
                workDescription: d.workDescription || d.inputDept || '',
                learningOutcome: d.learningOutcome || d.outputNextDept || '',
                toolsEquipmentUsed: d.toolsEquipmentUsed || '',
                safetyObservations: d.safetyObservations || d.safetyStandards || '',
                remarks: d.remarks || d.backOfPageNotes || ''
              },
              submissionDateTime: d.submittedAt,
              status: d.status,
              adminRemark: d.adminRemark || '',
              reviewedBy: d.reviewedBy || '',
              reviewedDate: d.reviewedDate || ''
            }
          });
          dailyToUpdate.push(d);
        }
      } else {
        const w = weeklyReports.find(r => r.id === item.id);
        if (w) {
          batchPayloads.push({
            type: 'WEEKLY_REPORT',
            data: {
              reportId: w.id,
              userId: w.userId,
              employeeId: w.employeeId,
              userName: w.userName,
              department: w.department,
              subDepartment: w.subDepartment || '',
              designation: w.designation || '',
              weekStart: w.weekStart,
              weekEnd: w.weekEnd,
              nameOfStudentTrainee: w.nameOfStudentTrainee || w.userName,
              daysPresent: w.daysPresent || '',
              classroomTrainingSummary: w.classroomTrainingSummary || '',
              shopFloorTrainingSummary: w.shopFloorTrainingSummary || '',
              projectSummaryA: w.projectSummaryA || '',
              projectSummaryB: w.projectSummaryB || '',
              selfLearningSummary: w.selfLearningSummary || '',
              weeklyReportDetails: {
                weekNumber: w.weekNumber,
                assignedProjectDept: w.assignedProjectDept || w.department,
                dailySummary: w.dailySummary,
                majorLearnings: w.majorLearnings || w.classroomTrainingSummary || '',
                technicalSkillsAcquired: w.technicalSkillsAcquired || w.shopFloorTrainingSummary || '',
                challengesFaced: w.challengesFaced || '',
                solutionsImplemented: w.solutionsImplemented || '',
                planForNextWeek: w.planForNextWeek || '',
                traineeSelfAssessment: w.traineeSelfAssessment,
                remarks: w.remarks || w.suggestion || ''
              },
              submissionDateTime: w.submittedAt,
              status: w.status,
              adminRemark: w.adminRemark || '',
              reviewedBy: w.reviewedBy || '',
              reviewedDate: w.reviewedDate || ''
            }
          });
          weeklyToUpdate.push(w);
        }
      }
    }

    try {
      const res = await fetch('/api/sync-google-sheets/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: batchPayloads,
          webAppUrl: googleAppsScriptUrl || sheetsConfig?.webAppUrl || undefined
        })
      });

      if (res.ok) {
        const result = await res.json();
        synced = result.synced || 0;
        failed = result.failed || 0;
      } else {
        throw new Error('Batch endpoint failed with status: ' + res.status);
      }
    } catch {
      // Fallback: push one by one
      for (let i = 0; i < batchPayloads.length; i++) {
        const p = batchPayloads[i];
        try {
          await syncToSheetsServer(p.type, p.data);
          synced++;
        } catch {
          failed++;
        }
        if (onProgress) {
          onProgress(i + 1, total);
        }
      }
    }

    // Update local state to mark synced reports as 'SYNCED'
    if (dailyToUpdate.length > 0) {
      const ids = new Set(dailyToUpdate.map(d => d.id));
      setDailyReports(prev =>
        prev.map(r => (ids.has(r.id) ? { ...r, syncStatus: 'SYNCED', updatedAt: new Date().toISOString() } : r))
      );
      dailyToUpdate.forEach(d => {
        syncDailyReportToCloud({ ...d, syncStatus: 'SYNCED' });
      });
    }

    if (weeklyToUpdate.length > 0) {
      const ids = new Set(weeklyToUpdate.map(w => w.id));
      setWeeklyReports(prev =>
        prev.map(r => (ids.has(r.id) ? { ...r, syncStatus: 'SYNCED', updatedAt: new Date().toISOString() } : r))
      );
      weeklyToUpdate.forEach(w => {
        syncWeeklyReportToCloud({ ...w, syncStatus: 'SYNCED' });
      });
    }

    // Refresh sync logs from server
    try {
      const logsRes = await fetch('/api/sync-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs) {
          setSyncLogs(logsData.logs);
        }
      }
    } catch {}

    showToast('success', `Synchronized ${synced} report(s) with Google Sheets.`);
    return { totalSynced: synced, failed };
  };

  const syncSingleReportToSheets = async (
    reportId: string,
    type: 'DAILY' | 'WEEKLY'
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await syncSelectedReportsToSheets([{ id: reportId, type }]);
    return {
      success: res.totalSynced > 0,
      message: res.totalSynced > 0 ? 'Report pushed to Google Sheets successfully' : 'Failed to push report'
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        dailyReports,
        weeklyReports,
        complianceConfig,
        complianceSettings: complianceConfig,
        notifications,
        googleAppsScriptUrl,
        syncLogs,
        toasts,
        showToast,
        addToast,
        removeToast,
        theme,
        toggleTheme,
        setTheme,
        isSearchOpen,
        openSearch,
        closeSearch,
        setIsSearchOpen,
        searchQuery,
        setSearchQuery,
        searchFilters,
        setSearchFilters,
        searchReports,
        login,
        logout,
        switchUser,
        updateProfile,
        submitDailyReport,
        updateDailyReport,
        submitWeeklyReport,
        updateWeeklyReport,
        updateReportStatus,
        deleteDraftReport,
        addUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        resetUserPassword,
        refreshUsersFromCloud,
        pullUsersFromGoogleSheets,
        pullAllFromGoogleSheets,
        syncBothEditionsNow,
        editionSyncStatus,
        lastLiveSyncTime,
        isCloudConnected,
        updateComplianceConfig,
        updateComplianceSettings,
        markNotificationRead,
        markAllNotificationsRead,
        setGoogleAppsScriptUrl,
        sheetsConfig,
        updateSheetsConfig,
        testSheetsConnection,
        syncAllToSheets,
        syncSelectedReportsToSheets,
        syncSingleReportToSheets,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
