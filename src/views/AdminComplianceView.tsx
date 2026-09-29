import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Send,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Settings,
  BellRing
} from 'lucide-react';
import { exportDailyReportsToCSV } from '../utils/exportUtils';

export const AdminComplianceView: React.FC = () => {
  const {
    users,
    dailyReports,
    weeklyReports,
    complianceSettings: contextComplianceSettings,
    complianceConfig,
    updateComplianceSettings,
    updateComplianceConfig,
    addToast,
  } = useApp();

  const complianceSettings = useMemo(() => ({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dailyDeadline: '18:30',
    weeklyDeadlineDay: 'Saturday',
    weeklyDeadlineTime: '20:00',
    ...(complianceConfig || {}),
    ...(contextComplianceSettings || {}),
  }), [complianceConfig, contextComplianceSettings]);

  const handleUpdateCompliance = (partial: Partial<typeof complianceSettings>) => {
    if (updateComplianceSettings) {
      updateComplianceSettings(partial);
    } else if (updateComplianceConfig) {
      updateComplianceConfig({ ...complianceSettings, ...partial });
    }
  };

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState<number>(37);
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY' | 'SETTINGS'>('DAILY');

  // Filter all trainees (GET and DET)
  const trainees = useMemo(() => {
    return users.filter(u => u.role !== 'ADMIN' && u.isActive !== false);
  }, [users]);

  // 1. Daily Compliance on selectedDate
  const dailySubmittedTraineeIds = useMemo(() => {
    const ids = new Set<string>();
    dailyReports.forEach(r => {
      if (r.date === selectedDate && r.status !== 'DRAFT') {
        ids.add(r.userId);
      }
    });
    return ids;
  }, [dailyReports, selectedDate]);

  const dailyCompliantUsers = trainees.filter(u => dailySubmittedTraineeIds.has(u.id));
  const dailyNonCompliantUsers = trainees.filter(u => !dailySubmittedTraineeIds.has(u.id));
  const dailyCompliancePercentage = trainees.length > 0
    ? Math.round((dailyCompliantUsers.length / trainees.length) * 100)
    : 100;

  // 2. Weekly Compliance on selectedWeek
  const weeklySubmittedTraineeIds = useMemo(() => {
    const ids = new Set<string>();
    weeklyReports.forEach(r => {
      if (r.weekNumber === selectedWeek && r.status !== 'DRAFT') {
        ids.add(r.userId);
      }
    });
    return ids;
  }, [weeklyReports, selectedWeek]);

  const weeklyCompliantUsers = trainees.filter(u => weeklySubmittedTraineeIds.has(u.id));
  const weeklyNonCompliantUsers = trainees.filter(u => !weeklySubmittedTraineeIds.has(u.id));
  const weeklyCompliancePercentage = trainees.length > 0
    ? Math.round((weeklyCompliantUsers.length / trainees.length) * 100)
    : 100;

  // Reminders simulation
  const handleSendReminders = (type: 'DAILY' | 'WEEKLY') => {
    const list = type === 'DAILY' ? dailyNonCompliantUsers : weeklyNonCompliantUsers;
    if (list.length === 0) {
      addToast('info', 'All trainees are already compliant! No reminders needed.');
      return;
    }
    addToast(
      'success',
      `Sent automated email/portal submission reminder to ${list.length} non-compliant trainee(s).`
    );
  };

  const handleExportMissingList = (type: 'DAILY' | 'WEEKLY') => {
    const list = type === 'DAILY' ? dailyNonCompliantUsers : weeklyNonCompliantUsers;
    const header = 'Employee ID,Name,Email,Department,Designation,Reporting Manager\n';
    const rows = list
      .map(
        u =>
          `"${u.employeeId}","${u.name}","${u.email}","${u.department}","${u.designation}","${u.reportingManager || ''}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Missing_${type}_Reports_${type === 'DAILY' ? selectedDate : `Week_${selectedWeek}`}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', `Exported missing ${type.toLowerCase()} report list as CSV.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Training Report Compliance & Audit</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor daily/weekly submission compliance, identify defaulters, set deadlines, and dispatch reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('DAILY')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'DAILY' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daily Compliance
            </button>
            <button
              onClick={() => setActiveTab('WEEKLY')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'WEEKLY' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekly Compliance
            </button>
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'SETTINGS' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Deadlines</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Compliance Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Daily Compliance ({selectedDate})</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{dailyCompliancePercentage}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({dailyCompliantUsers.length}/{trainees.length} Submitted)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${dailyCompliancePercentage}%` }}
              className={`h-full rounded-full transition-all ${
                dailyCompliancePercentage >= 90 ? 'bg-emerald-500' : dailyCompliancePercentage >= 70 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>

        {/* Weekly Compliance Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Weekly Compliance (Week {selectedWeek})</span>
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{weeklyCompliancePercentage}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({weeklyCompliantUsers.length}/{trainees.length} Submitted)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${weeklyCompliancePercentage}%` }}
              className={`h-full rounded-full transition-all ${
                weeklyCompliancePercentage >= 90 ? 'bg-emerald-500' : weeklyCompliancePercentage >= 70 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>

        {/* Missing Daily Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
            <span>Missing Daily Reports</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-900 dark:text-rose-200 mt-2">{dailyNonCompliantUsers.length}</div>
          <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 font-medium">
            Trainees who haven't logged today
          </div>
        </div>

        {/* Missing Weekly Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span>Missing Weekly Reports</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-900 dark:text-amber-200 mt-2">{weeklyNonCompliantUsers.length}</div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
            Pending synthesis for Week {selectedWeek}
          </div>
        </div>
      </div>

      {/* TAB 1: DAILY COMPLIANCE */}
      {activeTab === 'DAILY' && (
        <div className="space-y-4">
          {/* Controls toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Select Audit Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportMissingList('DAILY')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Export Defaulter List (CSV)</span>
              </button>
              <button
                onClick={() => handleSendReminders('DAILY')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Dispatch Daily Reminders ({dailyNonCompliantUsers.length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Non-Compliant Trainees List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Missing Daily Submissions ({dailyNonCompliantUsers.length})</span>
                </div>
                <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Deadline: {complianceSettings.dailyDeadline}</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {dailyNonCompliantUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold">
                    🎉 100% compliance! All active trainees have submitted their daily report.
                  </div>
                ) : (
                  dailyNonCompliantUsers.map(u => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{u.employeeId}</span> • {u.department}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                        NOT SUBMITTED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Compliant Trainees List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Submitted Reports ({dailyCompliantUsers.length})</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{dailyCompliancePercentage}% Recorded</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {dailyCompliantUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No submissions recorded yet for {selectedDate}.
                  </div>
                ) : (
                  dailyCompliantUsers.map(u => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{u.employeeId}</span> • {u.department}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        SUBMITTED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY COMPLIANCE */}
      {activeTab === 'WEEKLY' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Select Audit Week:</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
              >
                {[35, 36, 37, 38].map(w => (
                  <option key={w} value={w}>Week {w} (2026)</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportMissingList('WEEKLY')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Export Defaulter List (CSV)</span>
              </button>
              <button
                onClick={() => handleSendReminders('WEEKLY')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Dispatch Weekly Reminders ({weeklyNonCompliantUsers.length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Non-Compliant Weekly */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Missing Weekly Submissions ({weeklyNonCompliantUsers.length})</span>
                </div>
                <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Deadline: Saturday 20:00</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {weeklyNonCompliantUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold">
                    🎉 Outstanding! All trainees have submitted their Week {selectedWeek} report.
                  </div>
                ) : (
                  weeklyNonCompliantUsers.map(u => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{u.employeeId}</span> • {u.department}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                        NOT SUBMITTED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Compliant Weekly */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Submitted Weekly Reports ({weeklyCompliantUsers.length})</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{weeklyCompliancePercentage}% Recorded</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {weeklyCompliantUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No weekly reports submitted yet for Week {selectedWeek}.
                  </div>
                ) : (
                  weeklyCompliantUsers.map(u => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{u.employeeId}</span> • {u.department}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        SUBMITTED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEADLINES & COMPLIANCE SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Submission Deadlines & Shift Windows</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set standard daily cutoff hours and weekly submission limits for compliance calculations
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Report Submission Deadline (EOD)
              </label>
              <input
                type="time"
                value={complianceSettings.dailyDeadline}
                onChange={e => handleUpdateCompliance({ dailyDeadline: e.target.value })}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white w-48"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Submissions after this time will be flagged as late submissions in supervisory audits.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weekly Report Submission Deadline Day & Time
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={complianceSettings.weeklyDeadlineDay}
                  onChange={e => handleUpdateCompliance({ weeklyDeadlineDay: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                </select>
                <input
                  type="time"
                  value={complianceSettings.weeklyDeadlineTime}
                  onChange={e => handleUpdateCompliance({ weeklyDeadlineTime: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white w-40"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mandatory Working Days per Week
              </label>
              <div className="flex items-center gap-3 pt-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved automatically to enterprise config
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
