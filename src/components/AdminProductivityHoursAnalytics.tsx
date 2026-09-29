import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport, User } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  Clock,
  TrendingUp,
  Award,
  Users,
  Building2,
  CalendarDays,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { PRODUCTION_SUB_DEPARTMENTS, DEPARTMENT_SUB_DEPARTMENTS } from '../data/departments';

interface AdminProductivityHoursAnalyticsProps {
  onNavigate?: (view: string) => void;
  onOpenReport?: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
  isStandalone?: boolean;
}

type TimeRange = '7D' | '14D' | '30D';
type MetricMode = 'AVERAGE' | 'TOTAL';

interface DayAggregatePoint {
  date: string;
  displayDate: string;
  dayName: string;
  fullDay: string;
  isWeekend: boolean;
  totalHours: number;
  averageHours: number;
  reportCount: number;
  submissions: Array<{
    report: DailyReport;
    hours: number;
    userName: string;
    employeeId: string;
    department: string;
    subDepartment?: string;
    designation: string;
    topic: string;
    status: string;
  }>;
}

export const AdminProductivityHoursAnalytics: React.FC<AdminProductivityHoursAnalyticsProps> = ({
  onNavigate,
  onOpenReport,
  isStandalone = false
}) => {
  const { users, dailyReports, weeklyReports, theme } = useApp();
  const isDark = theme === 'dark';

  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSubDept, setSelectedSubDept] = useState<string>('ALL');
  const [metricMode, setMetricMode] = useState<MetricMode>('AVERAGE');
  const [showBenchmarkLine, setShowBenchmarkLine] = useState<boolean>(true);

  // List of active trainees (GET and DET)
  const traineeUsers = useMemo(() => {
    return users.filter(u => u.role !== 'ADMIN');
  }, [users]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    traineeUsers.forEach(u => {
      if (u.department) set.add(u.department);
    });
    dailyReports.forEach(r => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set).sort();
  }, [traineeUsers, dailyReports]);

  // Filtered trainees based on department & sub-department
  const filteredTrainees = useMemo(() => {
    return traineeUsers.filter(u => {
      if (selectedDept !== 'ALL' && u.department !== selectedDept) return false;
      if (selectedSubDept !== 'ALL' && u.subDepartment !== selectedSubDept) return false;
      return true;
    });
  }, [traineeUsers, selectedDept, selectedSubDept]);

  // Determine anchor date
  const anchorDateStr = useMemo(() => {
    const allDates = dailyReports.map(r => r.date).filter(Boolean).sort();
    if (allDates.length > 0) {
      return allDates[allDates.length - 1];
    }
    return new Date().toISOString().split('T')[0];
  }, [dailyReports]);

  const numDays = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;

  // Filter raw daily reports based on criteria
  const eligibleReports = useMemo(() => {
    return dailyReports.filter(r => {
      if (selectedDept !== 'ALL' && r.department !== selectedDept) return false;
      if (selectedSubDept !== 'ALL' && r.subDepartment !== selectedSubDept) return false;
      if (selectedTraineeId !== 'ALL' && r.userId !== selectedTraineeId) return false;
      return true;
    });
  }, [dailyReports, selectedDept, selectedSubDept, selectedTraineeId]);

  // Generate day-by-day aggregate data
  const chartData = useMemo<DayAggregatePoint[]>(() => {
    const anchor = new Date(anchorDateStr);
    const points: DayAggregatePoint[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isWeekend = d.getDay() === 0;

      const dayReports = eligibleReports.filter(r => r.date === dateStr);
      let dayTotalHours = 0;

      const submissions = dayReports.map(r => {
        const h = r.hours !== undefined && r.hours !== null ? Number(r.hours) : 8.0;
        dayTotalHours += h;
        return {
          report: r,
          hours: h,
          userName: r.userName,
          employeeId: r.employeeId,
          department: r.department,
          subDepartment: r.subDepartment,
          designation: r.designation,
          topic: r.topicActivity || r.trainingWorkArea || 'General Technical Duty',
          status: r.status
        };
      });

      const avg = dayReports.length > 0 ? parseFloat((dayTotalHours / dayReports.length).toFixed(1)) : 0;

      points.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDay: d.toLocaleDateString('en-US', { weekday: 'long' }),
        isWeekend,
        totalHours: parseFloat(dayTotalHours.toFixed(1)),
        averageHours: avg,
        reportCount: dayReports.length,
        submissions
      });
    }

    return points;
  }, [anchorDateStr, numDays, eligibleReports]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    let totalLoggedHours = 0;
    let totalShifts = 0;
    let benchmarkMetShifts = 0;
    const activeTraineeSet = new Set<string>();
    let peakHours = 0;
    let peakDate = '';

    chartData.forEach(p => {
      totalLoggedHours += p.totalHours;
      totalShifts += p.reportCount;
      p.submissions.forEach(sub => {
        activeTraineeSet.add(sub.employeeId);
        if (sub.hours >= 8.0) {
          benchmarkMetShifts++;
        }
      });
      if (p.totalHours > peakHours) {
        peakHours = p.totalHours;
        peakDate = p.displayDate;
      }
    });

    const avgShiftHours = totalShifts > 0 ? (totalLoggedHours / totalShifts).toFixed(1) : '0.0';
    const benchmarkCompliancePct = totalShifts > 0 ? Math.round((benchmarkMetShifts / totalShifts) * 100) : 0;

    return {
      totalLoggedHours: totalLoggedHours.toFixed(1),
      avgShiftHours,
      totalShifts,
      benchmarkCompliancePct,
      activeTraineesCount: activeTraineeSet.size,
      peakHours: peakHours.toFixed(1),
      peakDate: peakDate || 'None'
    };
  }, [chartData]);

  // Recent Shift Submissions within range (sorted descending)
  const recentShiftList = useMemo(() => {
    const list: Array<{
      report: DailyReport;
      hours: number;
      userName: string;
      employeeId: string;
      designation: string;
      department: string;
      subDepartment?: string;
      date: string;
      topic: string;
      status: string;
    }> = [];

    chartData.forEach(point => {
      point.submissions.forEach(sub => {
        list.push({
          report: sub.report,
          hours: sub.hours,
          userName: sub.userName,
          employeeId: sub.employeeId,
          designation: sub.designation,
          department: sub.department,
          subDepartment: sub.subDepartment,
          date: point.date,
          topic: sub.topic,
          status: sub.status
        });
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [chartData]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Employee ID',
      'Trainee Name',
      'Designation',
      'Department',
      'Sub-Department',
      'Shift Hours',
      'Benchmark Standard',
      'Variance',
      'Topic / Activity',
      'Status'
    ];

    const rows = recentShiftList.map(item => [
      `"${item.date}"`,
      `"${item.employeeId}"`,
      `"${item.userName}"`,
      `"${item.designation}"`,
      `"${item.department}"`,
      `"${item.subDepartment || ''}"`,
      item.hours,
      8.0,
      item.hours - 8.0,
      `"${(item.topic || '').replace(/"/g, '""')}"`,
      `"${item.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Trainee_Daily_Productivity_Hours_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: DayAggregatePoint = payload[0].payload;

    return (
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs max-w-xs z-50 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{data.fullDay}</span>
            <span className="text-[10px] text-slate-400 font-mono">({data.displayDate})</span>
          </div>
          {data.isWeekend && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60">
              Weekend
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              {selectedTraineeId !== 'ALL' ? 'Logged Hours:' : metricMode === 'AVERAGE' ? 'Avg Shift Hours:' : 'Total Group Hours:'}
            </span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
              {selectedTraineeId !== 'ALL' ? `${data.totalHours} hrs` : metricMode === 'AVERAGE' ? `${data.averageHours} hrs` : `${data.totalHours} hrs`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Reports Submitted:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              {data.reportCount} {data.reportCount === 1 ? 'shift' : 'shifts'}
            </span>
          </div>

          {data.submissions.length > 0 ? (
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Logged Shifts ({data.submissions.length}):
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {data.submissions.slice(0, 3).map((sub, idx) => (
                  <div
                    key={idx}
                    onClick={() => onOpenReport && onOpenReport(sub.report, 'DAILY')}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {sub.userName}
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                        {sub.hours}h
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {sub.topic}
                    </div>
                  </div>
                ))}
                {data.submissions.length > 3 && (
                  <div className="text-[10px] text-slate-400 text-center italic">
                    +{data.submissions.length - 3} more shifts logged
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-2 text-[11px] text-slate-400 italic">
              No shift reports submitted on this date.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden ${isStandalone ? 'p-6 space-y-6' : ''}`}>
      {/* Header & Controls Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Trainee Daily Productivity Hours Analytics</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Live Shift Trends
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Executive 30-day shift productivity monitoring, cohort compliance, and corporate benchmark tracking
              </p>
            </div>
          </div>
        </div>

        {/* Global Action & Export */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
            title="Export filtered productivity hours dataset to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Time Horizon Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {(['7D', '14D', '30D'] as TimeRange[]).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === t
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t === '7D' ? '7 Days' : t === '14D' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Row: Trainee, Department, and Metric Mode */}
      <div className="px-5 py-3.5 sm:px-6 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Trainee Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Trainee:</span>
            <select
              value={selectedTraineeId}
              onChange={e => setSelectedTraineeId(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none max-w-[200px]"
            >
              <option value="ALL">All Trainees (Combined)</option>
              {filteredTrainees.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Dept:</span>
            <select
              value={selectedDept}
              onChange={e => {
                setSelectedDept(e.target.value);
                setSelectedSubDept('ALL');
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none max-w-[180px]"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Department Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sub-Dept:</span>
            <select
              value={selectedSubDept}
              onChange={e => setSelectedSubDept(e.target.value)}
              disabled={selectedDept !== 'Production' && !DEPARTMENT_SUB_DEPARTMENTS[selectedDept]}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none max-w-[180px] disabled:opacity-50"
            >
              <option value="ALL">{selectedDept === 'Production' ? 'All Production Sub-Depts' : 'Sub-Dept (All)'}</option>
              {PRODUCTION_SUB_DEPARTMENTS.map(sub => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode & Benchmark Toggle */}
        <div className="flex items-center gap-3">
          {selectedTraineeId === 'ALL' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Metric:</span>
              <button
                onClick={() => setMetricMode(m => m === 'AVERAGE' ? 'TOTAL' : 'AVERAGE')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50"
              >
                {metricMode === 'AVERAGE' ? 'Avg Hours/Shift' : 'Total Group Hours'}
              </button>
            </div>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={showBenchmarkLine}
              onChange={e => setShowBenchmarkLine(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>8.0h Corporate Target</span>
          </label>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs">
            <span>Total Hours Logged</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-blue-950 dark:text-blue-100 mt-1 font-mono">
            {metrics.totalLoggedHours} <span className="text-xs font-normal text-blue-600 dark:text-blue-400">hrs</span>
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
            Across {metrics.totalShifts} shift reports
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs">
            <span>Avg Shift Duration</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1 font-mono">
            {metrics.avgShiftHours} <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">hrs/shift</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            Benchmark: 8.0h corporate standard
          </div>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs">
            <span>Shift Compliance</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-purple-950 dark:text-purple-100 mt-1 font-mono">
            {metrics.benchmarkCompliancePct}%
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
            Shifts meeting ≥8.0h target
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 text-xs">
            <span>Active Trainees</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-950 dark:text-amber-100 mt-1 font-mono">
            {metrics.activeTraineesCount}
          </div>
          <div className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
            Submitted in selected window
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs">
            <span>Peak Daily Output</span>
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {metrics.peakHours} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Recorded on {metrics.peakDate}
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Visualization */}
      <div className="px-5 sm:px-6 pb-6 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {selectedTraineeId !== 'ALL'
                ? `Daily Hours for ${traineeUsers.find(u => u.id === selectedTraineeId)?.name || 'Selected Trainee'}`
                : metricMode === 'AVERAGE'
                ? 'Average Daily Hours per Reporting Trainee'
                : 'Aggregated Total Shift Hours Logged'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({numDays} Day Timeline)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Logged Productivity Curve</span>
            </div>
            {showBenchmarkLine && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 stroke-dashed rounded-full" />
                <span className="text-amber-700 dark:text-amber-400 font-medium">8.0h Corporate Benchmark</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                opacity={0.6}
              />
              <XAxis
                dataKey="displayDate"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                interval={numDays === 30 ? 3 : numDays === 14 ? 1 : 0}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax + 1))]}
                tickFormatter={(val: number) => `${val}h`}
              />
              <Tooltip content={<CustomTooltip />} />
              {showBenchmarkLine && (
                <ReferenceLine
                  y={8.0}
                  stroke={isDark ? '#f59e0b' : '#d97706'}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '8h Target',
                    position: 'insideTopRight',
                    fill: isDark ? '#f59e0b' : '#d97706',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey={selectedTraineeId !== 'ALL' ? 'totalHours' : metricMode === 'AVERAGE' ? 'averageHours' : 'totalHours'}
                stroke={isDark ? '#60a5fa' : '#2563eb'}
                strokeWidth={2.5}
                dot={props => {
                  const { cx, cy, payload } = props;
                  const val = selectedTraineeId !== 'ALL' ? payload.totalHours : metricMode === 'AVERAGE' ? payload.averageHours : payload.totalHours;
                  if (val === 0) return null;
                  const isMet = val >= 8.0;
                  return (
                    <circle
                      key={props.key}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={isMet ? (isDark ? '#34d399' : '#10b981') : (isDark ? '#60a5fa' : '#2563eb')}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{
                  r: 6,
                  fill: isDark ? '#60a5fa' : '#2563eb',
                  stroke: isDark ? '#ffffff' : '#1e3a8a',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Logged Shifts Table */}
      <div className="border-t border-slate-100 dark:border-slate-800">
        <div className="px-5 py-4 sm:px-6 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Verified Trainee Shifts ({recentShiftList.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Shift hours, training topics, and supervisor certification statuses
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('admin-daily')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto max-h-80 divide-y divide-slate-100 dark:divide-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Trainee</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-right">Shift Hours</th>
                <th className="py-2.5 px-4">Core Activity</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentShiftList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No shift reports match the current filters.
                  </td>
                </tr>
              ) : (
                recentShiftList.slice(0, 15).map((item, idx) => {
                  const isDet = item.designation?.toUpperCase().includes('DET') || item.employeeId?.toUpperCase().includes('DET');
                  const diff = item.hours - 8.0;

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.userName}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Trainee
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.employeeId}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.department}</div>
                        {item.subDepartment && (
                          <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span>↳ {item.subDepartment}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.hours}h
                        </span>
                        <span
                          className={`ml-1.5 text-[10px] px-1 py-0.2 rounded font-semibold ${
                            diff >= 0
                              ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50'
                              : 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50'
                          }`}
                        >
                          {diff >= 0 ? `+${diff.toFixed(1)}h` : `${diff.toFixed(1)}h`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {item.topic}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'REVIEWED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : item.status === 'SUBMITTED'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onOpenReport && onOpenReport(item.report, 'DAILY')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
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
