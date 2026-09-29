import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport, ReportStatus } from '../types';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Eye,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  Send,
  Calendar,
  AlertCircle,
  FileEdit
} from 'lucide-react';
import { exportDailyReportsToCSV, exportWeeklyReportsToCSV, exportReportsToExcel } from '../utils/exportUtils';
import { useUserDrafts } from '../hooks/useUserDrafts';

interface MyReportsViewProps {
  onOpenReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
  onEditReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
  onNewDaily: () => void;
  onNewWeekly: () => void;
  onNavigate?: (view: string) => void;
}

export const MyReportsView: React.FC<MyReportsViewProps> = ({
  onOpenReport,
  onEditReport,
  onNewDaily,
  onNewWeekly,
  onNavigate,
}) => {
  const { currentUser, dailyReports, weeklyReports } = useApp();
  const { draftCount } = useUserDrafts();

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  if (!currentUser) return null;

  const myDaily = dailyReports.filter(r => r.userId === currentUser.id);
  const myWeekly = weeklyReports.filter(r => r.userId === currentUser.id);

  const combinedReports = useMemo(() => {
    let list: Array<(DailyReport | WeeklyReport) & { reportType: 'DAILY' | 'WEEKLY' }> = [];

    if (typeFilter === 'ALL' || typeFilter === 'DAILY') {
      list.push(...myDaily.map(d => ({ ...d, reportType: 'DAILY' as const })));
    }
    if (typeFilter === 'ALL' || typeFilter === 'WEEKLY') {
      list.push(...myWeekly.map(w => ({ ...w, reportType: 'WEEKLY' as const })));
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(r => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => {
        const idMatch = r.id.toLowerCase().includes(q);
        const remarkMatch = (r.adminRemark || '').toLowerCase().includes(q);
        if ('trainingWorkArea' in r) {
          return idMatch || remarkMatch || r.trainingWorkArea.toLowerCase().includes(q) || r.topicActivity.toLowerCase().includes(q);
        }
        if ('assignedProjectDept' in r) {
          return idMatch || remarkMatch || r.assignedProjectDept.toLowerCase().includes(q) || r.majorLearnings.toLowerCase().includes(q);
        }
        return idMatch || remarkMatch;
      });
    }

    list.sort((a, b) => {
      const timeA = new Date(a.submittedAt).getTime();
      const timeB = new Date(b.submittedAt).getTime();
      return sortBy === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [myDaily, myWeekly, typeFilter, statusFilter, searchQuery, sortBy]);

  const handleExportAll = (format: 'CSV' | 'EXCEL') => {
    if (format === 'EXCEL') {
      exportReportsToExcel(myDaily, myWeekly, [currentUser], `My_Training_Reports_${currentUser.employeeId}.xlsx`);
    } else {
      if (typeFilter === 'WEEKLY') {
        exportWeeklyReportsToCSV(myWeekly, `My_Weekly_Reports_${currentUser.employeeId}.csv`);
      } else {
        exportDailyReportsToCSV(myDaily, `My_Daily_Reports_${currentUser.employeeId}.csv`);
      }
    }
  };

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
            <Send className="w-3 h-3" />
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

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">My Submitted Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            History of your daily observations, weekly reviews, and supervisory remarks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-excel-my-reports"
            onClick={() => handleExportAll('EXCEL')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors"
            title="Download full workbook with sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-export-csv-my-reports"
            onClick={() => handleExportAll('CSV')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          {draftCount > 0 && onNavigate && (
            <button
              id="btn-goto-drafts-from-myreports"
              onClick={() => onNavigate('draft-reports')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors shadow-2xs"
            >
              <FileEdit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Draft Reports ({draftCount})</span>
            </button>
          )}

          <button
            onClick={onNewDaily}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ New Daily</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search report ID, area, topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 text-xs placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Report Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium text-slate-700 dark:text-slate-200 text-xs"
          >
            <option value="ALL">All Report Types</option>
            <option value="DAILY">Daily Reports Only</option>
            <option value="WEEKLY">Weekly Reports Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium text-slate-700 dark:text-slate-200 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="SUBMITTED">SUBMITTED (Pending)</option>
            <option value="UNDER REVIEW">UNDER REVIEW</option>
            <option value="DRAFT">DRAFT</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium text-slate-700 dark:text-slate-200 text-xs"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="OLDEST">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Subject / Topic / Module</th>
                <th className="py-3 px-4">Date / Period</th>
                <th className="py-3 px-4">Submitted On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Admin Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {combinedReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No reports match your filters. Try clearing search or change status filter.
                  </td>
                </tr>
              ) : (
                combinedReports.map(report => {
                  const isDaily = report.reportType === 'DAILY';
                  const daily = isDaily ? (report as DailyReport) : null;
                  const weekly = !isDaily ? (report as WeeklyReport) : null;

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {report.id}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isDaily
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50'
                          }`}
                        >
                          {isDaily ? 'DAILY' : 'WEEKLY'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-800 dark:text-slate-200 font-medium">
                        <div className="truncate">{isDaily ? daily?.topicActivity : weekly?.assignedProjectDept}</div>
                        {report.subDepartment && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                            <span>↳ {report.subDepartment}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {isDaily ? daily?.date : `W${weekly?.weekNumber} (${weekly?.weekStart})`}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(report.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={report.adminRemark || ''}>
                        {report.adminRemark ? (
                          <span className="text-slate-700 dark:text-slate-300">
                            <span className="truncate">{report.adminRemark}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-open-my-report-${report.id}`}
                            onClick={() => onOpenReport(report, report.reportType)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                            title="View / Print Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-my-report-${report.id}`}
                            onClick={() => onEditReport(report, report.reportType)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                          >
                            Edit Report
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
