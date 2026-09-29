import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport } from '../types';
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
  CalendarCheck,
  Award,
  Plus,
  BarChart2,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface ProductivityHoursSummaryProps {
  onNavigate?: (view: string) => void;
  onOpenReport?: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
}

type TimeRange = '7D' | '14D' | '30D';

interface DayDataPoint {
  date: string;
  displayDate: string;
  dayName: string;
  fullDay: string;
  isWeekend: boolean;
  hours: number;
  reportId?: string;
  reportType?: 'DAILY' | 'WEEKLY';
  topic?: string;
  workArea?: string;
  status?: string;
  rawReport?: DailyReport | WeeklyReport;
}

export const ProductivityHoursSummary: React.FC<ProductivityHoursSummaryProps> = ({
  onNavigate,
  onOpenReport
}) => {
  const { currentUser, dailyReports, weeklyReports, theme } = useApp();
  const isDark = theme === 'dark';

  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);

  // Determine latest anchor date (defaults to 2026-09-15 if today is different)
  const anchorDateStr = useMemo(() => {
    // Check if there are reports with dates in 2026-09
    const allDates = [
      ...dailyReports.map(r => r.date),
      ...weeklyReports.map(r => r.weekEnd)
    ].filter(Boolean).sort();

    if (allDates.length > 0) {
      return allDates[allDates.length - 1]; // e.g. 2026-09-15
    }
    return new Date().toISOString().split('T')[0];
  }, [dailyReports, weeklyReports]);

  // Generate date points for the selected range (7, 14, or 30 days)
  const numDays = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;

  const chartData = useMemo<DayDataPoint[]>(() => {
    if (!currentUser) return [];

    const userDaily = dailyReports.filter(r => r.userId === currentUser.id);
    const userWeekly = weeklyReports.filter(r => r.userId === currentUser.id);

    const anchor = new Date(anchorDateStr);
    const points: DayDataPoint[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isWeekend = d.getDay() === 0; // Sunday

      // Check daily reports first
      const matchedDaily = userDaily.find(r => r.date === dateStr);
      if (matchedDaily) {
        points.push({
          date: dateStr,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDay: d.toLocaleDateString('en-US', { weekday: 'long' }),
          isWeekend,
          hours: matchedDaily.hours !== undefined ? matchedDaily.hours : 8.0,
          reportId: matchedDaily.id,
          reportType: 'DAILY',
          topic: matchedDaily.topicActivity,
          workArea: matchedDaily.trainingWorkArea,
          status: matchedDaily.status,
          rawReport: matchedDaily
        });
        continue;
      }

      // Check weekly reports dailySummary
      let matchedInWeekly: { hours: number; activity: string; weeklyReport: WeeklyReport } | null = null;
      for (const w of userWeekly) {
        if (w.dailySummary) {
          const entry = w.dailySummary.find(day => day.date === dateStr && day.activity?.trim());
          if (entry) {
            matchedInWeekly = {
              hours: entry.hours || 8.0,
              activity: entry.activity,
              weeklyReport: w
            };
            break;
          }
        }
      }

      if (matchedInWeekly) {
        points.push({
          date: dateStr,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDay: d.toLocaleDateString('en-US', { weekday: 'long' }),
          isWeekend,
          hours: matchedInWeekly.hours,
          reportId: matchedInWeekly.weeklyReport.id,
          reportType: 'WEEKLY',
          topic: matchedInWeekly.activity,
          workArea: matchedInWeekly.weeklyReport.assignedProjectDept,
          status: matchedInWeekly.weeklyReport.status,
          rawReport: matchedInWeekly.weeklyReport
        });
        continue;
      }

      // Day without logged submission
      points.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDay: d.toLocaleDateString('en-US', { weekday: 'long' }),
        isWeekend,
        hours: 0,
        status: isWeekend ? 'REST_DAY' : 'NO_ENTRY'
      });
    }

    return points;
  }, [currentUser, dailyReports, weeklyReports, anchorDateStr, numDays]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const loggedDays = chartData.filter(d => d.hours > 0);
    const totalHours = loggedDays.reduce((acc, curr) => acc + curr.hours, 0);
    const workdaysTotal = chartData.filter(d => !d.isWeekend).length;
    const submittedWorkdays = loggedDays.filter(d => !d.isWeekend).length;
    const avgHours = loggedDays.length > 0 ? (totalHours / loggedDays.length).toFixed(1) : '0';
    const compliancePct = workdaysTotal > 0 ? Math.round((submittedWorkdays / workdaysTotal) * 100) : 0;

    // Peak day
    let peakDay: DayDataPoint | null = null;
    loggedDays.forEach(d => {
      if (!peakDay || d.hours > peakDay.hours) {
        peakDay = d;
      }
    });

    return {
      totalHours: totalHours.toFixed(1),
      avgHours,
      loggedDaysCount: loggedDays.length,
      workdaysTotal,
      compliancePct,
      peakDay
    };
  }, [chartData]);

  // Color tokens for Recharts
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const axisTextColor = isDark ? '#94a3b8' : '#64748b';
  const primaryStroke = isDark ? '#60a5fa' : '#2563eb';
  const targetStroke = isDark ? '#f59e0b' : '#d97706';

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayDataPoint = payload[0].payload;
      const isLogged = data.hours > 0;

      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg text-xs max-w-xs space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-1.5 gap-3">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                {data.fullDay}, {data.displayDate}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{data.date}</span>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 font-mono font-bold text-sm ${
                data.hours >= 8
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : data.hours > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {data.hours > 0 ? `${data.hours} hrs` : '0 hrs'}
              </span>
            </div>
          </div>

          {isLogged ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Report:</span>
                <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  {data.reportId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Status:</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  data.status === 'REVIEWED'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                    : data.status === 'UNDER REVIEW'
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                    : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                }`}>
                  {data.status}
                </span>
              </div>
              {data.topic && (
                <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Topic: </span>
                  {data.topic}
                </div>
              )}
              {data.rawReport && onOpenReport && (
                <button
                  type="button"
                  onClick={() => onOpenReport(data.rawReport!, data.reportType || 'DAILY')}
                  className="w-full mt-1.5 py-1 px-2 text-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors"
                >
                  View Full Report →
                </button>
              )}
            </div>
          ) : (
            <div className="py-1 text-center text-slate-400 dark:text-slate-500 italic text-[11px]">
              {data.isWeekend ? 'Rest Day / Scheduled Sunday Off' : 'No report submitted for this working day'}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-lg">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Daily Productivity Hours
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
              Last {numDays} Days
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Training and shift hours logged through daily reports and weekly day-wise entries
          </p>
        </div>

        {/* Action / Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reference Line Toggle */}
          <button
            type="button"
            onClick={() => setShowTargetLine(!showTargetLine)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
              showTargetLine
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle standard 8.0-hour reference line"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Target (8h)</span>
          </button>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {(['7D', '14D', '30D'] as TimeRange[]).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range === '7D' ? '7 Days' : range === '14D' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('new-daily-report')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Hours */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Hours Logged</span>
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {metrics.totalHours} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Over {metrics.loggedDaysCount} submitted sessions
          </div>
        </div>

        {/* Daily Average */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Daily Average</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {metrics.avgHours} <span className="text-xs font-normal text-slate-500">hrs/day</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Standard baseline: 8.0 hrs
          </div>
        </div>

        {/* Compliance Rate */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Shift Compliance</span>
            <CalendarCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {metrics.compliancePct}%
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {metrics.loggedDaysCount} of {metrics.workdaysTotal} working days
          </div>
        </div>

        {/* Peak Session */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Peak Productivity</span>
            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {metrics.peakDay ? `${metrics.peakDay.hours} hrs` : '0 hrs'}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
            {metrics.peakDay ? `${metrics.peakDay.dayName}, ${metrics.peakDay.displayDate}` : 'No records yet'}
          </div>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="pt-2">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: axisTextColor }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                interval={timeRange === '7D' ? 0 : timeRange === '14D' ? 1 : 3}
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax + 1))]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fontSize: 11, fill: axisTextColor }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip content={<CustomTooltip />} />

              {showTargetLine && (
                <ReferenceLine
                  y={8}
                  stroke={targetStroke}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '8h Target Shift',
                    position: 'top',
                    fill: targetStroke,
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="hours"
                name="Productivity Hours"
                stroke={primaryStroke}
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return null;
                  const hasHours = payload.hours > 0;
                  return (
                    <circle
                      key={`dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={hasHours ? 3.5 : 2}
                      fill={hasHours ? primaryStroke : (isDark ? '#475569' : '#cbd5e1')}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{
                  r: 6,
                  fill: primaryStroke,
                  stroke: isDark ? '#1e293b' : '#ffffff',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Insights and Legend Strip */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap text-slate-600 dark:text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            <span>Daily Hours Logged</span>
          </div>
          {showTargetLine && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-500" />
              <span>8h Corporate Standard Shift</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>Sunday Rest Days / Off</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Hover over data points to inspect shift remarks and direct report links</span>
        </div>
      </div>
    </div>
  );
};
