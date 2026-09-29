import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, ReportStatus } from '../types';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Edit2,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { exportDailyReportsToCSV, exportReportsToExcel } from '../utils/exportUtils';
import { DEPARTMENTS, PRODUCTION_SUB_DEPARTMENTS, DEPARTMENT_SUB_DEPARTMENTS } from '../data/departments';
import { ConfirmModal } from '../components/ConfirmModal';

interface AdminDailyReportsViewProps {
  onOpenReport: (report: DailyReport, type: 'DAILY') => void;
  onEditReport?: (report: DailyReport, type: 'DAILY') => void;
}

export const AdminDailyReportsView: React.FC<AdminDailyReportsViewProps> = ({
  onOpenReport,
  onEditReport,
}) => {
  const { dailyReports, users, updateReportStatus, deleteReport } = useApp();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [subDepartmentFilter, setSubDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'USER_ASC'>('NEWEST');

  // Modal for adding remark on Reject / Approve
  const [actionTarget, setActionTarget] = useState<{ id: string; status: ReportStatus } | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const availableDepartments = useMemo(() => {
    const fromReports = dailyReports.map(r => r.department).filter(Boolean);
    return Array.from(new Set([...DEPARTMENTS, ...fromReports]));
  }, [dailyReports]);

  const filteredReports = useMemo(() => {
    let list = [...dailyReports];

    if (departmentFilter !== 'ALL') {
      list = list.filter(r => r.department === departmentFilter);
    }
    if (subDepartmentFilter !== 'ALL') {
      list = list.filter(r => r.subDepartment === subDepartmentFilter);
    }
    if (statusFilter !== 'ALL') {
      list = list.filter(r => r.status === statusFilter);
    }
    if (userFilter !== 'ALL') {
      list = list.filter(r => r.userId === userFilter || r.employeeId === userFilter);
    }
    if (dateFilter) {
      list = list.filter(r => r.date === dateFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        r =>
          r.id.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          (r.nameOfGet && r.nameOfGet.toLowerCase().includes(q)) ||
          r.employeeId.toLowerCase().includes(q) ||
          (r.processValueAdded && r.processValueAdded.toLowerCase().includes(q)) ||
          (r.inputDept && r.inputDept.toLowerCase().includes(q)) ||
          (r.outputNextDept && r.outputNextDept.toLowerCase().includes(q)) ||
          (r.nameOfHod && r.nameOfHod.toLowerCase().includes(q)) ||
          (r.staffMet1 && r.staffMet1.toLowerCase().includes(q)) ||
          (r.topicActivity && r.topicActivity.toLowerCase().includes(q)) ||
          (r.trainingWorkArea && r.trainingWorkArea.toLowerCase().includes(q)) ||
          (r.subDepartment && r.subDepartment.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      if (sortBy === 'OLDEST') return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return a.userName.localeCompare(b.userName);
    });

    return list;
  }, [dailyReports, departmentFilter, subDepartmentFilter, statusFilter, userFilter, dateFilter, search, sortBy]);

  const handleApplyStatus = () => {
    if (!actionTarget) return;
    updateReportStatus('DAILY', actionTarget.id, actionTarget.status, remarkText);
    setActionTarget(null);
    setRemarkText('');
  };

  const handleDelete = (id: string) => {
    setReportToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;
    deleteReport('DAILY', reportToDelete);
    setReportToDelete(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">All Daily Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor, inspect, approve, reject, or export trainee daily logs across all engineering plant divisions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportReportsToExcel(filteredReports, [], users, 'Admin_Daily_Reports.xlsx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => exportDailyReportsToCSV(filteredReports, 'Admin_Daily_Reports.csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ID, Trainee, Section..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={e => {
              setDepartmentFilter(e.target.value);
              setSubDepartmentFilter('ALL');
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="ALL">All Departments</option>
            {availableDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={subDepartmentFilter}
            onChange={e => setSubDepartmentFilter(e.target.value)}
            disabled={departmentFilter !== 'Production' && !DEPARTMENT_SUB_DEPARTMENTS[departmentFilter]}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-600"
          >
            <option value="ALL">{departmentFilter === 'Production' ? 'All Production Sub-Depts' : 'Sub-Department (All)'}</option>
            {PRODUCTION_SUB_DEPARTMENTS.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="SUBMITTED">SUBMITTED (Pending)</option>
            <option value="UNDER REVIEW">UNDER REVIEW</option>
            <option value="DRAFT">DRAFT</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs"
            title="Filter by Specific Date"
          />
        </div>

        <div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="OLDEST">Sort: Oldest First</option>
            <option value="USER_ASC">Sort: Trainee Name</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing <strong className="text-slate-800 dark:text-slate-200">{filteredReports.length}</strong> daily report(s)</span>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear date filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Trainee / GET</th>
                <th className="py-3 px-4">Department & Sub Section</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Process & Value Added</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Admin Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No daily reports match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {rep.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{rep.nameOfGet || rep.userName}</div>
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{rep.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[170px]">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{rep.department}</div>
                      {rep.subDepartment && (
                        <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 truncate max-w-full">
                          <span>↳ {rep.subDepartment}</span>
                        </div>
                      )}
                      {rep.nameOfHod && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          HOD: {rep.nameOfHod}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {rep.date}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={rep.processValueAdded || rep.topicActivity}>
                        {rep.processValueAdded || rep.topicActivity || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate" title={rep.inputDept || rep.trainingWorkArea}>
                        <span className="font-semibold text-slate-500">In:</span> {rep.inputDept || rep.trainingWorkArea || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {rep.status === 'REVIEWED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                          REVIEWED
                        </span>
                      )}
                      {(rep.status === 'SUBMITTED' || rep.status === 'UNDER REVIEW') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                          PENDING
                        </span>
                      )}
                      {rep.status === 'DRAFT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={rep.adminRemark || ''}>
                      {rep.adminRemark ? (
                        <span className="text-slate-700 dark:text-slate-300">{rep.adminRemark}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-open-daily-${rep.id}`}
                          onClick={() => onOpenReport(rep, 'DAILY')}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors"
                          title="Open Full Details & Print"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {rep.status !== 'REVIEWED' && (
                          <button
                            onClick={() => {
                              setActionTarget({ id: rep.id, status: 'REVIEWED' });
                              setRemarkText('Reviewed & verified by Training Administrator');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                          >
                            Mark Reviewed
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rep.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remark Modal for Review */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Review Daily Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Provide feedback or technical remarks for the trainee regarding report{' '}
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{actionTarget.id}</span>:
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Remark / Technical Feedback
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Good technical observations. Procedures verified."
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setActionTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyStatus}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Confirm Review
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(reportToDelete)}
        title="Delete Daily Report?"
        message={`Are you sure you want to permanently delete Daily Report ${reportToDelete || ''}? This action cannot be undone.`}
        confirmText="Delete Report"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setReportToDelete(null)}
      />
    </div>
  );
};
