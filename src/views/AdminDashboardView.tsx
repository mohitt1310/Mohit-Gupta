import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport } from '../types';
import { AdminProductivityHoursAnalytics } from '../components/AdminProductivityHoursAnalytics';
import {
  Users,
  FileText,
  CalendarDays,
  Clock,
  CheckCircle2,
  TrendingUp,
  Building2,
  FileSpreadsheet,
  Award,
  ArrowRight,
  Eye,
  Check,
  Search,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  BarChart3,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

interface AdminDashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
}

const DEPT_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; dot: string }> = {
  'Production': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    bar: '#10b981',
    dot: 'bg-emerald-500'
  },
  'Quality': {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/80',
    bar: '#6366f1',
    dot: 'bg-indigo-500'
  },
  'Production Planning Control': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/80',
    bar: '#f59e0b',
    dot: 'bg-amber-500'
  },
  'Design and Development': {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/80',
    bar: '#f43f5e',
    dot: 'bg-rose-500'
  },
  'Sales and Marketing': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/80',
    bar: '#a855f7',
    dot: 'bg-purple-500'
  },
  'After Sales': {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800/80',
    bar: '#0ea5e9',
    dot: 'bg-sky-500'
  },
  'Human Resources (Core HR)': {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800/80',
    bar: '#14b8a6',
    dot: 'bg-teal-500'
  },
};

const DEFAULT_COLOR = {
  bg: 'bg-blue-50 dark:bg-blue-950/40',
  text: 'text-blue-700 dark:text-blue-300',
  border: 'border-blue-200 dark:border-blue-800/80',
  bar: '#3b82f6',
  dot: 'bg-blue-500'
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
  onOpenReport,
}) => {
  const { users, dailyReports, weeklyReports, updateReportStatus, openSearch, theme } = useApp();
  const isDark = theme === 'dark';

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  const totalUsers = users.length;
  const traineeUsers = useMemo(() => users.filter(u => u.role !== 'ADMIN'), [users]);
  const totalDaily = dailyReports.length;
  const totalWeekly = weeklyReports.length;

  const allReports = useMemo(() => {
    return [
      ...dailyReports.map(d => ({ ...d, reportType: 'DAILY' as const })),
      ...weeklyReports.map(w => ({ ...w, reportType: 'WEEKLY' as const }))
    ];
  }, [dailyReports, weeklyReports]);

  const pendingReports = useMemo(
    () => allReports.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER REVIEW'),
    [allReports]
  );
  const reviewedReports = useMemo(
    () => allReports.filter(r => r.status === 'REVIEWED'),
    [allReports]
  );
  const draftReports = useMemo(
    () => allReports.filter(r => r.status === 'DRAFT'),
    [allReports]
  );

  // Status distribution stats
  const totalCount = allReports.length || 1;
  const reviewedPct = Math.round((reviewedReports.length / totalCount) * 100);
  const pendingPct = Math.round((pendingReports.length / totalCount) * 100);
  const draftPct = Math.round((draftReports.length / totalCount) * 100);

  // Sparkline data for daily reports (last 7 reporting slots)
  const dailySparklineData = useMemo(() => {
    const map: Record<string, number> = {};
    dailyReports.forEach(r => {
      const d = r.date || 'Unknown';
      map[d] = (map[d] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
    if (sorted.length === 0) {
      return [{ day: 'Mon', count: 3 }, { day: 'Tue', count: 5 }, { day: 'Wed', count: 4 }, { day: 'Thu', count: 6 }, { day: 'Fri', count: 7 }];
    }
    return sorted.map(([dt, count]) => ({
      day: dt.slice(5),
      fullDate: dt,
      count
    }));
  }, [dailyReports]);

  // Weekly sparkline data
  const weeklySparklineData = useMemo(() => {
    const map: Record<number, number> = {};
    weeklyReports.forEach(r => {
      const wk = r.weekNumber || 1;
      map[wk] = (map[wk] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => Number(a[0]) - Number(b[0])).slice(-5);
    if (sorted.length === 0) {
      return [{ week: 'W34', count: 4 }, { week: 'W35', count: 6 }, { week: 'W36', count: 7 }, { week: 'W37', count: 5 }, { week: 'W38', count: 8 }];
    }
    return sorted.map(([wk, count]) => ({
      week: `W${wk}`,
      count
    }));
  }, [weeklyReports]);

  // Department distribution data for BarChart
  const deptStats = useMemo(() => {
    const map: Record<string, { count: number; reviewed: number; pending: number }> = {};
    allReports.forEach(r => {
      const dept = r.department || 'General';
      if (!map[dept]) {
        map[dept] = { count: 0, reviewed: 0, pending: 0 };
      }
      map[dept].count += 1;
      if (r.status === 'REVIEWED') map[dept].reviewed += 1;
      if (r.status === 'SUBMITTED' || r.status === 'UNDER REVIEW') map[dept].pending += 1;
    });
    return Object.entries(map)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        reviewed: stats.reviewed,
        pending: stats.pending,
        color: DEPT_COLORS[name]?.bar || DEFAULT_COLOR.bar
      }))
      .sort((a, b) => b.count - a.count);
  }, [allReports]);

  // Production sub-departments
  const productionSubDeptStats = useMemo(() => {
    const map: Record<string, number> = {};
    allReports.filter(r => r.department === 'Production' && r.subDepartment).forEach(r => {
      const sub = r.subDepartment!;
      map[sub] = (map[sub] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [allReports]);

  // Filtered pending reports based on selected department tab
  const filteredPendingReports = useMemo(() => {
    if (selectedDeptFilter === 'ALL') return pendingReports;
    return pendingReports.filter(r => r.department === selectedDeptFilter);
  }, [pendingReports, selectedDeptFilter]);

  // Cohort breakdown
  const cohortBreakdown = useMemo(() => {
    const getCount = traineeUsers.filter(u => u.designation.includes('Graduate') || u.designation.includes('GET')).length;
    const detCount = traineeUsers.filter(u => u.designation.includes('Diploma') || u.designation.includes('DET')).length;
    const mtCount = traineeUsers.length - getCount - detCount;
    return { getCount, detCount, mtCount: Math.max(0, mtCount) };
  }, [traineeUsers]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Header & Colorful Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Training Administration Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Supervisor Suite</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time executive supervision of GET & DET cohorts, shop-floor logbooks, verification workflows, and compliance
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-admin-search"
            onClick={() => openSearch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition-all shadow-2xs group"
            title="Search all reports by keyword, date, or trainee (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span>Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
              Ctrl+F
            </kbd>
          </button>

          <button
            onClick={() => onNavigate('admin-compliance')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-all shadow-2xs"
          >
            <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Compliance Tracker</span>
          </button>

          <button
            onClick={() => onNavigate('admin-productivity')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-xl transition-all shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Productivity Hours</span>
          </button>

          <button
            onClick={() => onNavigate('admin-sheets')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Google Sheets</span>
          </button>
        </div>
      </div>

      {/* Top 5 Dynamic Statistics Cards with Color Accents & Recharts Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Total Trainees Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs hover:border-indigo-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">Enrolled Cohort</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{traineeUsers.length}</span>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Trainees Active</span>
          </div>
          {/* Cohort micro tags */}
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-medium">
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {cohortBreakdown.getCount} GET
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-100/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              {cohortBreakdown.detCount} DET
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              1 Admin
            </span>
          </div>
        </div>

        {/* 2. Daily Reports Card with Area Sparkline */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-500/10 via-white to-white dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/60 shadow-xs hover:border-sky-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-900 dark:text-sky-300">Daily Logbooks</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/80 text-sky-600 dark:text-sky-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{totalDaily}</span>
            <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">Records Logged</span>
          </div>
          {/* Mini Sparkline */}
          <div className="h-8 mt-1.5 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySparklineData}>
                <defs>
                  <linearGradient id="skySpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2} fill="url(#skySpark)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Weekly Reports Card with Bar Sparkline */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/60 shadow-xs hover:border-purple-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">Weekly Syntheses</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/80 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{totalWeekly}</span>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Weekly Modules</span>
          </div>
          {/* Mini Bar Sparkline */}
          <div className="h-8 mt-1.5 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySparklineData}>
                <Bar dataKey="count" fill="#9333ea" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Pending Reviews Action Card with Pulsing Alert Badge */}
        <div
          onClick={() => onNavigate('admin-daily')}
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/15 via-amber-50/50 to-white dark:from-amber-950/50 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/80 shadow-xs hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Pending Review</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-100">{pendingReports.length}</span>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Awaiting Sign-off</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 mt-2 font-medium">
            <span>Action Required</span>
            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              Review Now &rarr;
            </span>
          </div>
        </div>

        {/* 5. Reviewed & Certified Rate Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 shadow-xs hover:border-emerald-300 transition-all group sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Certified & Verified</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-emerald-100">{reviewedReports.length}</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{reviewedPct}% Rate</span>
          </div>
          {/* Progress Pill */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              style={{ width: `${reviewedPct}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
            />
          </div>
        </div>
      </div>

      {/* Trainee Daily Productivity Hours Section */}
      <AdminProductivityHoursAnalytics
        onNavigate={onNavigate}
        onOpenReport={onOpenReport}
      />

      {/* Analytics Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual 1: Report Status Proportion & Workflow Health (1 Column) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Workflow Status Health</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Review funnel balance</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {totalCount} total
            </span>
          </div>

          {/* Segmented Gradient Bar */}
          <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 p-0.5 gap-1">
            <div
              style={{ width: `${reviewedPct}%` }}
              className="bg-emerald-500 rounded-l-full transition-all duration-500"
              title={`Reviewed: ${reviewedReports.length} (${reviewedPct}%)`}
            />
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`Pending: ${pendingReports.length} (${pendingPct}%)`}
            />
            <div
              style={{ width: `${draftPct}%` }}
              className="bg-slate-400 rounded-r-full transition-all duration-500"
              title={`Draft: ${draftReports.length} (${draftPct}%)`}
            />
          </div>

          {/* 3 Status Cards with Distinct Vibrancy */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/50" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">Reviewed & Approved</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">HOD verified and certified</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-900 dark:text-emerald-200">{reviewedReports.length}</span>
                <span className="text-[10px] font-mono block text-emerald-700 dark:text-emerald-400">{reviewedPct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-100 dark:ring-amber-900/50" />
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">Under Review / Pending</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">Requires supervisor comments</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-amber-900 dark:text-amber-200">{pendingReports.length}</span>
                <span className="text-[10px] font-mono block text-amber-700 dark:text-amber-400">{pendingPct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-slate-100 dark:ring-slate-700" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">In-Progress Drafts</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Unsubmitted local saves</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{draftReports.length}</span>
                <span className="text-[10px] font-mono block text-slate-500 dark:text-slate-400">{draftPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual 2: Submission Velocity by Date (Recharts AreaChart, 2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Submission Cadence & Volume</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Daily reports logged across recent training calendar days</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Active GET/DET Cohort</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySparklineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelFormatter={label => `Reporting Date: ${label}`}
                  formatter={(value) => [`${value} Reports Logged`, 'Submissions']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visual 3: Department Distribution & Rotation Focus (Horizontal BarChart + Department Pills) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Department Training Rotations & Coverage</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total submitted reports across plant and functional areas</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {deptStats.length} Active Departments
          </span>
        </div>

        {/* Department Interactive Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedDeptFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Departments ({allReports.length})
          </button>
          {deptStats.map(d => {
            const colorDef = DEPT_COLORS[d.name] || DEFAULT_COLOR;
            const isSelected = selectedDeptFilter === d.name;
            return (
              <button
                key={d.name}
                onClick={() => setSelectedDeptFilter(isSelected ? 'ALL' : d.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isSelected
                    ? `${colorDef.bg} ${colorDef.text} ${colorDef.border} font-bold ring-2 ring-blue-500 shadow-xs`
                    : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colorDef.dot}`} />
                <span>{d.name}</span>
                <span className="font-mono text-[10px] opacity-75">({d.count})</span>
              </button>
            );
          })}
        </div>

        {/* Horizontal Stacked Bar Visualization */}
        <div className="space-y-3 pt-2">
          {deptStats.map(dept => {
            const colorDef = DEPT_COLORS[dept.name] || DEFAULT_COLOR;
            const pct = Math.round((dept.count / totalCount) * 100);
            return (
              <div key={dept.name} className="space-y-1 group">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-sm ${colorDef.dot}`} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{dept.reviewed} reviewed</span>
                    {dept.pending > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{dept.pending} pending</span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400 font-bold">{dept.count} ({pct}%)</span>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${(dept.reviewed / totalCount) * 100}%` }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                    title={`${dept.reviewed} Reviewed`}
                  />
                  <div
                    style={{ width: `${(dept.pending / totalCount) * 100}%` }}
                    className="h-full bg-amber-400 transition-all duration-500"
                    title={`${dept.pending} Pending`}
                  />
                </div>

                {/* Sub-departments chips if Production */}
                {dept.name === 'Production' && productionSubDeptStats.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 pl-4">
                    <span className="text-[10px] text-slate-400 font-medium">Sub-units:</span>
                    {productionSubDeptStats.map(([subDept, count]) => (
                      <span
                        key={subDept}
                        className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                      >
                        {subDept} ({count})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Reports Quick Action Table with Vibrant Styling & Quick Approve */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  Pending Review Queue ({filteredPendingReports.length})
                </h2>
                {selectedDeptFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Filtered: {selectedDeptFilter}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trainee logs awaiting supervisory verification, grading, and certification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openSearch()}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search All</span>
            </button>
            <button
              onClick={() => onNavigate('admin-daily')}
              className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors"
            >
              <span>View Full Daily Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Trainee Name</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date / Period</th>
                <th className="py-3 px-4 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPendingReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedDeptFilter === 'ALL'
                          ? 'Zero pending reports! All submissions have been certified.'
                          : `No pending reports for ${selectedDeptFilter}.`}
                      </span>
                      <span className="text-xs text-slate-400">Great work maintaining zero review backlog.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPendingReports.slice(0, 6).map(rep => {
                  const isDaily = rep.reportType === 'DAILY';
                  const daily = isDaily ? (rep as DailyReport) : null;
                  const weekly = !isDaily ? (rep as WeeklyReport) : null;
                  const deptColor = DEPT_COLORS[rep.department] || DEFAULT_COLOR;

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {rep.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-[10px] font-bold">
                            {rep.userName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{rep.userName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {rep.employeeId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${deptColor.bg} ${deptColor.text} ${deptColor.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${deptColor.dot}`} />
                          <span>{rep.department}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isDaily
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60'
                            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60'
                        }`}>
                          {rep.reportType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {isDaily ? daily?.date : `Week ${weekly?.weekNumber}`}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-admin-view-${rep.id}`}
                            onClick={() => onOpenReport(rep, rep.reportType)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors border border-blue-200/70 dark:border-blue-800"
                            title="Open & Review Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                          <button
                            id={`btn-admin-quick-review-${rep.id}`}
                            onClick={() => updateReportStatus(rep.reportType, rep.id, 'REVIEWED', 'Verified & certified by training supervisor')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-200/70 dark:border-emerald-800"
                            title="Quick Certify as Reviewed"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Certify</span>
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
      </div>
    </div>
  );
};
