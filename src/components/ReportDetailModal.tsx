import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport, ReportStatus } from '../types';
import {
  X,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Building,
  User,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Edit3,
  Send,
  MessageSquare
} from 'lucide-react';
import { exportDailyReportsToCSV, exportWeeklyReportsToCSV } from '../utils/exportUtils';
import { UttamLogo } from './UttamLogo';

interface ReportDetailModalProps {
  report: DailyReport | WeeklyReport | null;
  reportType: 'DAILY' | 'WEEKLY';
  onClose: () => void;
  onEdit?: (report: DailyReport | WeeklyReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  reportType,
  onClose,
  onEdit
}) => {
  const { currentUser, updateReportStatus } = useApp();
  const [remarkInput, setRemarkInput] = useState('');
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!report) return null;

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOwner = currentUser?.id === report.userId;
  const isDaily = reportType === 'DAILY';
  const dailyRep = isDaily ? (report as DailyReport) : null;
  const weeklyRep = !isDaily ? (report as WeeklyReport) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (isDaily && dailyRep) {
      exportDailyReportsToCSV([dailyRep], `${dailyRep.id}_Export.csv`);
    } else if (weeklyRep) {
      exportWeeklyReportsToCSV([weeklyRep], `${weeklyRep.id}_Export.csv`);
    }
  };

  const handleMarkReviewed = async () => {
    setActionLoading(true);
    await updateReportStatus(
      reportType,
      report.id,
      'REVIEWED',
      remarkInput.trim() ? remarkInput.trim() : (report.adminRemark || 'Reviewed & Verified by Training Administrator')
    );
    setActionLoading(false);
    onClose();
  };

  const getStatusBadge = (status: ReportStatus) => {
    const badges: Record<ReportStatus, { bg: string; text: string; icon: any }> = {
      REVIEWED: { bg: 'bg-emerald-100 border-emerald-200 text-emerald-800', text: 'REVIEWED', icon: CheckCircle2 },
      'UNDER REVIEW': { bg: 'bg-amber-100 border-amber-200 text-amber-800', text: 'UNDER REVIEW', icon: Clock },
      SUBMITTED: { bg: 'bg-blue-100 border-blue-200 text-blue-800', text: 'SUBMITTED', icon: Send },
      DRAFT: { bg: 'bg-slate-100 border-slate-200 text-slate-700', text: 'DRAFT', icon: Edit3 },
    };
    const b = badges[status] || badges.SUBMITTED;
    const Icon = b.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${b.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {b.text}
      </span>
    );
  };

  return (
    <div
      id="modal-report-details-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div
        id="modal-report-details"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:shadow-none print:border-none print:max-h-none print:m-0 print:bg-white"
      >
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="print:hidden px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
              {report.id}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isDaily ? 'Daily Training Report' : 'Weekly Synthesis Report'}
            </span>
            {getStatusBadge(report.status)}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors"
              title="Print official report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Print / PDF</span>
            </button>
            <button
              id="btn-export-csv-modal"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors"
              title="Export report data"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Corporate Formal Document Layout */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:space-y-4 text-slate-800 dark:text-slate-200 print:text-slate-800">
          {/* Letterhead Header */}
          <div className="border-b-2 border-slate-800 dark:border-slate-700 print:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <UttamLogo className="h-9 mb-2" />
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white print:text-slate-900 tracking-tight">
                TRAINING REPORT MANAGEMENT SYSTEM
              </div>
              <div className="text-xs font-semibold text-blue-800 dark:text-blue-400 print:text-blue-800 tracking-wide mt-0.5">
                TECHNICAL TRAINING & ENGINEERING DEVELOPMENT DIVISION
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-500 mt-1">
                Official Trainee Performance & Industrial Activity Record
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-400 print:text-slate-600">
              <div className="font-bold text-sm text-slate-900 dark:text-white print:text-slate-900">{report.id}</div>
              <div>Submitted: {new Date(report.submittedAt).toLocaleDateString()}</div>
              <div>Time: {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="mt-1 font-sans">{getStatusBadge(report.status)}</div>
            </div>
          </div>

          {/* Trainee Profile Grid */}
          <div className="bg-slate-50 dark:bg-slate-800/60 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-500 font-medium block">Trainee Name:</span>
              <span className="font-bold text-slate-900 dark:text-white print:text-slate-900 text-sm">{report.userName}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-500 font-medium block">Employee ID:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white print:text-slate-900">{report.employeeId}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-500 font-medium block">Designation / Program:</span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-slate-900">{report.designation}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-500 font-medium block">Department / Unit:</span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-slate-900">{report.department}</span>
              {report.subDepartment && (
                <span className="text-blue-700 dark:text-blue-400 print:text-blue-700 font-semibold text-[11px] block mt-0.5">
                  ↳ {report.subDepartment}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-500 font-medium block">Reporting Manager:</span>
              <span className="text-slate-900 dark:text-white print:text-slate-900">{report.reportingManager || 'Senior Training Lead'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-500 font-medium block">
                {isDaily ? 'Report Date:' : 'Reporting Period:'}
              </span>
              <span className="font-bold text-blue-900 dark:text-blue-300 print:text-blue-900">
                {isDaily
                  ? dailyRep?.date
                  : `Week ${weeklyRep?.weekNumber} (${weeklyRep?.weekStart} to ${weeklyRep?.weekEnd})`}
              </span>
            </div>
          </div>

          {/* Admin Remark Callout if Present */}
          {report.adminRemark && (
            <div className="p-4 rounded-xl border flex items-start gap-3 text-xs bg-emerald-50 dark:bg-emerald-950/60 print:bg-emerald-50 border-emerald-200 dark:border-emerald-800 print:border-emerald-200 text-emerald-900 dark:text-emerald-200 print:text-emerald-900">
              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" />
              <div className="flex-1">
                <div className="font-bold uppercase tracking-wider text-[11px] text-emerald-800 dark:text-emerald-300">
                  Administrator Remarks / Review Notes:
                </div>
                <div className="mt-1 leading-relaxed text-sm font-medium">{report.adminRemark}</div>
                {report.reviewedBy && (
                  <div className="text-[11px] opacity-80 mt-1">
                    Reviewed by {report.reviewedBy} on {report.reviewedDate ? new Date(report.reviewedDate).toLocaleString() : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specific Daily Report Content (Matches PPT / Plant Visit Training Format) */}
          {isDaily && dailyRep && (
            <div className="space-y-5 border-2 border-slate-300 dark:border-slate-700 print:border-slate-800 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900/60 print:bg-white shadow-xs">
              
              {/* Boxed Title matching PPT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 dark:border-slate-600 print:border-slate-900 pb-3">
                <div className="px-4 py-1.5 border-2 border-slate-900 dark:border-slate-200 print:border-slate-900 bg-slate-50 dark:bg-slate-800 print:bg-slate-50 rounded-xs text-center self-start sm:self-auto">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white print:text-slate-900 uppercase font-serif tracking-wide">
                    Daily Report for plant visit/training
                  </h3>
                </div>
                <div className="text-xs font-serif font-bold text-slate-800 dark:text-slate-200 print:text-slate-800 self-end sm:self-auto">
                  Date: <span className="font-mono underline">{dailyRep.date}</span>
                </div>
              </div>

              {/* PPT Bullet Meta Details */}
              <div className="space-y-2 text-xs sm:text-sm font-sans">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                    • Name of GET:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 border-b border-dotted border-slate-400 flex-1">
                    {dailyRep.nameOfGet || dailyRep.userName} ({dailyRep.employeeId})
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                  <div className="flex items-baseline gap-2 flex-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                      • Today's Department:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 border-b border-dotted border-slate-400 flex-1">
                      {dailyRep.department}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 flex-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                      Department Sub Section:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 border-b border-dotted border-slate-400 flex-1">
                      {dailyRep.subDepartment || 'General Area'}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                    • Name of HOD:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 border-b border-dotted border-slate-400 flex-1">
                    {dailyRep.nameOfHod || dailyRep.reportingManager || 'N/A'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                    • Name of sub section staff met:
                  </span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="border-b border-dotted border-slate-400 text-slate-800 dark:text-slate-200 print:text-slate-800">
                      <span className="font-bold text-slate-600 dark:text-slate-400">(1) </span>
                      <span>{dailyRep.staffMet1 || '—'}</span>
                    </div>
                    <div className="border-b border-dotted border-slate-400 text-slate-800 dark:text-slate-200 print:text-slate-800">
                      <span className="font-bold text-slate-600 dark:text-slate-400">(2) </span>
                      <span>{dailyRep.staffMet2 || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Section 1: Input */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                  <span>Input (for Today's deptt.)</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {dailyRep.inputDept || dailyRep.workDescription || 'N/A'}
                </div>
              </div>

              {/* Core Section 2: Process */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                  <span>Process (value added by this deptt.)</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {dailyRep.processValueAdded || dailyRep.workDescription || 'N/A'}
                </div>
              </div>

              {/* Core Section 3: Output */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                  <span>Output (final output to next deptt.)</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {dailyRep.outputNextDept || dailyRep.learningOutcome || 'N/A'}
                </div>
              </div>

              {/* Core Section 4: IS standard & Global standards */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                  <span>IS standard & Global standards (for this deptt's process)</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {dailyRep.standards || 'IS 2026 (Power Transformers), IEC 60076'}
                </div>
              </div>

              {/* Core Section 5: Safety standards */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                  <span>Safety standards (for this deptt's)</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {dailyRep.safetyStandards || dailyRep.safetyObservations || 'Standard plant PPE compliance adhered'}
                </div>
              </div>

              {/* Core Section 6: Chronic problems /challenges/bottlenecks */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block"></span>
                  <span>Chronic problems /challenges/bottlenecks</span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm font-sans">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">1.</span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-slate-800">
                      {dailyRep.chronicProblem1 || dailyRep.challengesFaced || 'None documented'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">2.</span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-slate-800">
                      {dailyRep.chronicProblem2 || dailyRep.bottlenecks || 'None documented'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">3.</span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-slate-800">
                      {dailyRep.chronicProblem3 || 'None documented'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PPT Footnote */}
              <div className="pt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 italic font-serif">
                  Note: if there is less space then you can use at the back of the page
                </p>
                {dailyRep.backOfPageNotes && (
                  <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 print:bg-slate-100 rounded-md text-xs border border-slate-200 dark:border-slate-700">
                    <span className="font-bold block uppercase tracking-wider text-[11px] mb-1">
                      Back of the Page / Extended Notes:
                    </span>
                    <div className="text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap">
                      {dailyRep.backOfPageNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specific Weekly Report Content (Matches Paper Weekly Training Report Format) */}
          {!isDaily && weeklyRep && (
            <div className="space-y-5 border-2 border-slate-300 dark:border-slate-700 print:border-slate-800 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900/60 print:bg-white shadow-xs">
              
              {/* Boxed Title matching Paper Document */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 dark:border-slate-600 print:border-slate-900 pb-3">
                <div className="px-5 py-1.5 border-2 border-slate-900 dark:border-slate-200 print:border-slate-900 bg-slate-50 dark:bg-slate-800 print:bg-slate-50 rounded-xs text-center self-start sm:self-auto shadow-2xs">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white print:text-slate-900 uppercase font-serif tracking-wide">
                    Weekly Training Report
                  </h3>
                </div>
                <div className="text-xs font-serif font-bold text-slate-800 dark:text-slate-200 print:text-slate-800 self-end sm:self-auto">
                  Week from <span className="font-mono underline">{weeklyRep.weekStart}</span> to <span className="font-mono underline">{weeklyRep.weekEnd}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-500">(Week {weeklyRep.weekNumber})</span>
                </div>
              </div>

              {/* Paper Bullet Meta Details */}
              <div className="space-y-2.5 text-xs sm:text-sm font-sans">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                    • Name of student trainee/GET:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 border-b border-dotted border-slate-400 flex-1">
                    {weeklyRep.nameOfStudentTrainee || weeklyRep.userName} ({weeklyRep.employeeId})
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                  <div className="flex items-baseline gap-2 flex-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                      • Days present (in this week):
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 border-b border-dotted border-slate-400 flex-1">
                      {weeklyRep.daysPresent !== undefined ? `${weeklyRep.daysPresent} days` : '6 days'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 flex-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900 shrink-0">
                      • Department / Section:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 border-b border-dotted border-slate-400 flex-1">
                      {weeklyRep.department} {weeklyRep.subDepartment ? `— ${weeklyRep.subDepartment}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: Classroom Training Summary */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block"></span>
                  <span className="font-serif tracking-wide uppercase text-[11px] sm:text-xs">Classroom training summary</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {weeklyRep.classroomTrainingSummary || weeklyRep.majorLearnings || 'N/A'}
                </div>
              </div>

              {/* Section 2: Shop Floor Training Summary */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                  <span className="font-serif tracking-wide uppercase text-[11px] sm:text-xs">Shop floor training summary</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {weeklyRep.shopFloorTrainingSummary || (weeklyRep.dailySummary ? weeklyRep.dailySummary.map(d => `${d.day}: ${d.activity}`).join('\n') : 'N/A')}
                </div>
              </div>

              {/* Section 3: Projects Summary (a) & (b) */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                  <span className="font-serif tracking-wide uppercase text-[11px] sm:text-xs">Projects summary</span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm pl-2 sm:pl-3">
                  <div className="border-l-2 border-emerald-500 pl-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 print:text-slate-700 font-mono">(a) </span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap">
                      {weeklyRep.projectSummaryA || weeklyRep.assignedProjectDept || '—'}
                    </span>
                  </div>

                  <div className="border-l-2 border-emerald-500/70 pl-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 print:text-slate-700 font-mono">(b) </span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap">
                      {weeklyRep.projectSummaryB || weeklyRep.solutionsImplemented || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Self-Learning Summary */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block"></span>
                  <span className="font-serif tracking-wide uppercase text-[11px] sm:text-xs">Self-learning summary</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {weeklyRep.selfLearningSummary || weeklyRep.technicalSkillsAcquired || 'N/A'}
                </div>
              </div>

              {/* Section 5: Suggestion */}
              <div className="border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/40 print:bg-slate-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block"></span>
                  <span className="font-serif tracking-wide uppercase text-[11px] sm:text-xs">Suggestion</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 print:text-slate-800 whitespace-pre-wrap font-sans">
                  {weeklyRep.suggestion || 'No process suggestions recorded for this week.'}
                </div>
              </div>

              {/* Day-by-Day Activity Schedule (Integrated Schedule) */}
              {weeklyRep.dailySummary && weeklyRep.dailySummary.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 print:border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 print:text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Day-by-Day Activity Schedule</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Total Hours: {weeklyRep.dailySummary.reduce((sum, item) => sum + (Number(item.hours) || 0), 0)} hrs
                    </span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-50 text-slate-600 dark:text-slate-400 print:text-slate-600 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <tr>
                        <th className="py-2 px-3 w-28">Day</th>
                        <th className="py-2 px-3 w-28">Date</th>
                        <th className="py-2 px-3">Activities & Tasks Performed</th>
                        <th className="py-2 px-3 w-20 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {weeklyRep.dailySummary.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{item.day}</td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono">{item.date}</td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{item.activity || '—'}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{item.hours} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Plan & Trainee Self-Assessment if present */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyRep.planForNextWeek && (
                  <div className="border border-slate-200 dark:border-slate-800 print:border-slate-200 rounded-lg p-3 bg-white dark:bg-slate-800 print:bg-white text-xs">
                    <div className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Action Plan For Next Week
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {weeklyRep.planForNextWeek}
                    </div>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-800 print:border-slate-200 rounded-lg p-3 bg-white dark:bg-slate-800 print:bg-white text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Trainee Self-Assessment Rating
                    </div>
                    <span className="inline-block font-bold text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 mt-1">
                      {weeklyRep.traineeSelfAssessment || 'Met Expectations'}
                    </span>
                  </div>
                  {weeklyRep.remarks && (
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-2">
                      <span className="font-semibold">Remarks:</span> {weeklyRep.remarks}
                    </div>
                  )}
                </div>
              </div>

              {/* Back of Page Notes from physical sheet */}
              {weeklyRep.backOfPageNotes && (
                <div className="border-2 border-dashed border-amber-300 dark:border-amber-800/80 rounded-lg p-3.5 bg-amber-50/40 dark:bg-amber-950/20">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200 font-serif italic mb-1">
                    Note: if there is less space than you can use at the back of the page
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {weeklyRep.backOfPageNotes}
                  </div>
                </div>
              )}

              {/* Signature of Trainee / GET matching Paper Sheet */}
              <div className="pt-3 border-t border-slate-300 dark:border-slate-700 print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-serif">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                    Signature of Trainee/GET:
                  </span>
                  <div className="mt-1 font-mono italic text-sm text-purple-900 dark:text-purple-300 font-semibold border-b border-slate-400 inline-block min-w-48 pb-0.5">
                    {weeklyRep.traineeSignature || `${weeklyRep.nameOfStudentTrainee || weeklyRep.userName} (Signed)`}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  * Note: if there is less space than you can use at the back of the page
                </div>
              </div>
            </div>
          )}

          {/* Official Sign-off Footer (visible in print & on screen) */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 print:border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 print:text-slate-700">Trainee Signature</div>
              <div className="mt-8 pt-1 border-t border-slate-300 dark:border-slate-700 print:border-slate-300 font-mono text-slate-500 dark:text-slate-400">
                {report.userName} ({report.employeeId})
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 print:text-slate-700">Technical Supervisor / Admin Sign-off</div>
              <div className="mt-8 pt-1 border-t border-slate-300 dark:border-slate-700 print:border-slate-300 font-mono text-slate-500 dark:text-slate-400">
                {report.reviewedBy ? `${report.reviewedBy} (Reviewed & Verified)` : 'Pending Supervisor Review'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer (Hidden in Print) */}
        <div className="print:hidden px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* If user is owner, allow edit/resubmit */}
            {isOwner && onEdit && (
              <button
                id="btn-modal-edit-report"
                onClick={() => {
                  onEdit(report);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit & Update Report</span>
              </button>
            )}
          </div>

          {/* Admin Decision Actions */}
          {isAdmin ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {!showRemarkForm ? (
                <>
                  <button
                    id="btn-admin-modal-remark"
                    onClick={() => setShowRemarkForm(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Add Feedback / Remark</span>
                  </button>

                  <button
                    id="btn-admin-modal-mark-reviewed"
                    onClick={handleMarkReviewed}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Reviewed</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Enter supervisor feedback / remark..."
                    value={remarkInput}
                    onChange={e => setRemarkInput(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkReviewed}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                    >
                      Save & Mark Reviewed
                    </button>
                    <button
                      onClick={() => setShowRemarkForm(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
