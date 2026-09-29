import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport, ReportStatus } from '../types';
import { UserDraftsSection } from '../components/UserDraftsSection';
import {
  FileText,
  CalendarPlus,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  ArrowUpRight,
  Eye,
  Search,
  Flame,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  Check,
  Zap,
  Target,
  ChevronRight
} from 'lucide-react';

interface UserDashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
  onEditReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
}

const DEPT_BADGES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Production': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  'Quality': {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500'
  },
  'Production Planning Control': {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  'Design and Development': {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500'
  },
  'Sales and Marketing': {
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500'
  },
  'After Sales': {
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500'
  },
};

const DEFAULT_DEPT_BADGE = {
  bg: 'bg-blue-50 dark:bg-blue-950/50',
  text: 'text-blue-700 dark:text-blue-300',
  border: 'border-blue-200 dark:border-blue-800',
  dot: 'bg-blue-500'
};

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  onNavigate,
  onOpenReport,
  onEditReport
}) => {
  const { currentUser, dailyReports, weeklyReports, openSearch } = useApp();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  if (!currentUser) return null;

  // Filter only this user's reports
  const myDailyReports = useMemo(
    () => dailyReports.filter(r => r.userId === currentUser.id),
    [dailyReports, currentUser.id]
  );
  const myWeeklyReports = useMemo(
    () => weeklyReports.filter(r => r.userId === currentUser.id),
    [weeklyReports, currentUser.id]
  );

  const totalDaily = myDailyReports.length;
  const totalWeekly = myWeeklyReports.length;

  const allMyReports = useMemo(() => {
    return [
      ...myDailyReports.map(r => ({ ...r, reportType: 'DAILY' as const })),
      ...myWeeklyReports.map(r => ({ ...r, reportType: 'WEEKLY' as const }))
    ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [myDailyReports, myWeeklyReports]);

  const pendingCount = allMyReports.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER REVIEW').length;
  const reviewedCount = allMyReports.filter(r => r.status === 'REVIEWED').length;

  // Today's date in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayReport = useMemo(
    () => myDailyReports.find(r => r.date === todayStr && r.status !== 'DRAFT'),
    [myDailyReports, todayStr]
  );

  // Total recorded learning hours
  const totalHoursLogged = useMemo(() => {
    return myDailyReports.reduce((sum, r) => sum + (r.hours || 8), 0);
  }, [myDailyReports]);

  // Current Week 6-day strip (Mon - Sat)
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const found = myDailyReports.find(r => r.date === iso && r.status !== 'DRAFT');
      const isToday = iso === todayStr;
      const isPast = iso < todayStr;
      const isFuture = iso > todayStr;

      days.push({
        dayName: dayNames[i],
        dateStr: iso,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        report: found,
        isToday,
        isPast,
        isFuture,
        status: found ? found.status : isPast ? 'MISSING' : isToday ? 'DUE' : 'UPCOMING'
      });
    }
    return days;
  }, [myDailyReports, todayStr]);

  const completedWeekDays = currentWeekDays.filter(d => d.report).length;
  const weekProgressPct = Math.round((completedWeekDays / 6) * 100);

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            REVIEWED
          </span>
        );
      case 'UNDER REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            UNDER REVIEW
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            SUBMITTED
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            DRAFT
          </span>
        );
    }
  };

  const currentDeptColor = DEPT_BADGES[currentUser.department] || DEFAULT_DEPT_BADGE;

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Colorful Hero Banner & Trainee Control Deck */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-blue-800/60">
        {/* Subtle decorative geometric overlay */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Trainee Identity & Streak */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-md shrink-0 ring-4 ring-white/10">
              {currentUser.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-blue-200 backdrop-blur-xs border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{currentUser.designation}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>5-Day Streak Active</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                Welcome back, {currentUser.name}
              </h1>

              <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-xl leading-relaxed">
                Uttam Bharat Electricals Training Portal • Industrial transformer manufacturing & shop-floor logbook
              </p>
            </div>
          </div>

          {/* Today's Status Callout & Quick Action Hub */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            {/* Today's Submission Status Badge */}
            {todayReport ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Today's Daily Report: Logged ({todayReport.id})</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/25 border border-amber-400/50 text-amber-200 text-xs font-bold backdrop-blur-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Today's Report Pending (Due 18:30)</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-quick-new-daily"
                onClick={() => onNavigate('new-daily-report')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Log Daily Report</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-blue-700/80 text-blue-100 rounded border border-blue-400/40">
                  {modKey}+D
                </kbd>
              </button>

              <button
                id="btn-quick-new-weekly"
                onClick={() => onNavigate('new-weekly-report')}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/20 backdrop-blur-xs transition-all"
              >
                <CalendarPlus className="w-4 h-4 text-purple-300" />
                <span>+ Weekly Report</span>
              </button>

              <button
                id="btn-quick-search-user"
                onClick={() => openSearch()}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 backdrop-blur-xs transition-all"
                title={`Search Reports (${modKey}+F)`}
              >
                <Search className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Attributes Strip */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 text-xs">
          <div>
            <span className="text-blue-200/70 font-medium block">Employee ID</span>
            <span className="font-mono font-bold text-white mt-0.5 block">{currentUser.employeeId}</span>
          </div>

          <div>
            <span className="text-blue-200/70 font-medium block">Current Department</span>
            <span className="font-semibold text-white mt-0.5 block truncate">
              {currentUser.department}
            </span>
          </div>

          <div>
            <span className="text-blue-200/70 font-medium block">Sub-Section / Stage</span>
            <span className="font-medium text-blue-200 mt-0.5 block truncate">
              {currentUser.subDepartment || 'General Rotation'}
            </span>
          </div>

          <div>
            <span className="text-blue-200/70 font-medium block">Reporting Manager</span>
            <span className="font-medium text-white mt-0.5 block truncate">
              {currentUser.reportingManager || 'Senior Plant DGM'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-blue-200/70 font-medium block">Training Cohort</span>
            <span className="font-semibold text-emerald-300 mt-0.5 block">
              Batch 2026-27 (Active)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Weekly Training Calendar Ribbon (Mon - Sat) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Current Week Activity Schedule (Mon – Sat)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Weekly progress: {completedWeekDays} of 6 days logged ({weekProgressPct}% compliance)
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 w-full sm:w-56">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                style={{ width: `${weekProgressPct}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
              {weekProgressPct}%
            </span>
          </div>
        </div>

        {/* 6-Day Interactive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {currentWeekDays.map(d => {
            const hasReport = !!d.report;
            const isReviewed = d.report?.status === 'REVIEWED';

            return (
              <div
                key={d.dateStr}
                onClick={() => {
                  if (hasReport) {
                    onOpenReport(d.report!, 'DAILY');
                  } else if (!d.isFuture) {
                    onNavigate('new-daily-report');
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  d.isToday
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : hasReport
                    ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400'
                    : d.status === 'MISSING'
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/15 hover:border-amber-400'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${d.isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {d.dayName}
                  </span>
                  {d.isToday && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                      Today
                    </span>
                  )}
                </div>

                <div className="my-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {d.displayDate}
                  </div>
                  {hasReport ? (
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isReviewed ? 'Certified' : 'Logged'}</span>
                    </div>
                  ) : d.isToday ? (
                    <div className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Log Now</span>
                    </div>
                  ) : d.status === 'MISSING' ? (
                    <div className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      Not Logged
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      Upcoming
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>{hasReport ? `${d.report?.hours || 8.5} hrs` : '—'}</span>
                  <span className="text-[9px] uppercase tracking-wider">{hasReport ? d.report?.status.slice(0, 4) : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Colorful Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Daily Reports */}
        <div className="bg-gradient-to-br from-blue-500/10 via-white to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/60 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">Daily Logbooks</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalDaily}</div>
          <div className="flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
            <span>{totalHoursLogged} plant hours</span>
            <span>✓ Verified</span>
          </div>
        </div>

        {/* 2. Weekly Reports */}
        <div className="bg-gradient-to-br from-purple-500/10 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/60 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">Weekly Syntheses</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/80 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalWeekly}</div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
            Shop floor summaries
          </div>
        </div>

        {/* 3. Pending Review */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-100 mt-2">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
            With reporting manager
          </div>
        </div>

        {/* 4. Reviewed & Certified */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Certified & Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-emerald-100 mt-2">{reviewedCount}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            Supervisor validated
          </div>
        </div>
      </div>

      {/* Engineering Rotation & Skill Track */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Technical Training Rotation Pathway</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Core engineering syllabus & hands-on plant rotations</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            Phase 1 • Core Manufacturing
          </span>
        </div>

        {/* 4 Rotation Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Current Stage • Wk 1–4
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              Coil Winding (HV & LV)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Production • Copper/Al strip winding & insulation
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stage 2 • Wk 5–8
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
              Core Stacking & Tanking
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              CRGO lamination stacking, clamping & oven drying
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stage 3 • Wk 9–12
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
              Quality Assurance & Testing
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Routine ratio, Tan Delta, Megger & HV testing
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stage 4 • Wk 13–16
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
              PPC & Site Commissioning
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Substation delivery, oil filling & commissioning
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Saved Drafts in Progress */}
      <UserDraftsSection onNavigate={onNavigate} onEditReport={onEditReport} />

      {/* Recent Submitted Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Recent Submissions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your most recently logged daily logbooks and weekly modules</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openSearch()}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search</span>
            </button>
            <button
              onClick={() => onNavigate('my-reports')}
              className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors"
            >
              <span>View All ({allMyReports.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Department & Stage</th>
                <th className="py-3 px-4">Date / Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Supervisor Remark</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allMyReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="w-8 h-8 text-blue-400 opacity-80" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">No reports submitted yet</span>
                      <span className="text-xs text-slate-400">Click "+ Log Daily Report" above to start your engineering logbook.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                allMyReports.slice(0, 5).map(rep => {
                  const isDaily = rep.reportType === 'DAILY';
                  const daily = isDaily ? (rep as DailyReport) : null;
                  const weekly = !isDaily ? (rep as WeeklyReport) : null;
                  const deptColor = DEPT_BADGES[rep.department] || DEFAULT_DEPT_BADGE;

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {rep.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            isDaily
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50'
                          }`}
                        >
                          {isDaily ? 'DAILY REPORT' : 'WEEKLY REPORT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${deptColor.bg} ${deptColor.text} ${deptColor.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${deptColor.dot}`} />
                          <span>{rep.department}</span>
                        </span>
                        {rep.subDepartment && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            ↳ {rep.subDepartment}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {isDaily ? daily?.date : `Week ${weekly?.weekNumber} (${weekly?.weekStart})`}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(rep.status)}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400" title={rep.adminRemark || ''}>
                        {rep.adminRemark ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                            ✓ {rep.adminRemark}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">No remarks yet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-report-${rep.id}`}
                            onClick={() => onOpenReport(rep, rep.reportType)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                            title="View Report Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-report-${rep.id}`}
                            onClick={() => onEditReport(rep, rep.reportType)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                          >
                            Edit
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
