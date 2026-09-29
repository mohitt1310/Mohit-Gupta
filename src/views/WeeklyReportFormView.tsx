import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyReport, WeeklyDayEntry } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAutoDraft } from '../hooks/useAutoDraft';
import { AutoSaveStatusBadge } from '../components/AutoSaveStatusBadge';
import {
  DEPARTMENTS,
  DEPARTMENT_SUB_DEPARTMENTS,
} from '../data/departments';
import {
  Send,
  Save,
  RotateCcw,
  AlertCircle,
  ArrowLeft,
  Clock,
  CheckCircle2,
  BookOpen,
  Wrench,
  FolderGit2,
  GraduationCap,
  Lightbulb,
  FileText,
  PenTool,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WeeklyReportFormViewProps {
  initialReport?: WeeklyReport | null;
  onSuccess: (reportId: string) => void;
  onCancel?: () => void;
}

const DEFAULT_DAYS: WeeklyDayEntry[] = [
  { day: 'Monday', date: '2026-09-14', activity: '', hours: 8 },
  { day: 'Tuesday', date: '2026-09-15', activity: '', hours: 8 },
  { day: 'Wednesday', date: '2026-09-16', activity: '', hours: 8 },
  { day: 'Thursday', date: '2026-09-17', activity: '', hours: 8 },
  { day: 'Friday', date: '2026-09-18', activity: '', hours: 8 },
  { day: 'Saturday', date: '2026-09-19', activity: '', hours: 8 }
];

export const WeeklyReportFormView: React.FC<WeeklyReportFormViewProps> = ({
  initialReport,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, submitWeeklyReport, updateWeeklyReport, addToast } = useApp();

  const isRealExistingReport = Boolean(initialReport?.id && !initialReport.id.startsWith('DRAFT-'));
  const isEditing = isRealExistingReport;

  // Metadata & Period
  const [weekNumber, setWeekNumber] = useState<number>(initialReport?.weekNumber || 37);
  const [weekStart, setWeekStart] = useState<string>(initialReport?.weekStart || '2026-09-14');
  const [weekEnd, setWeekEnd] = useState<string>(initialReport?.weekEnd || '2026-09-19');
  const [nameOfStudentTrainee, setNameOfStudentTrainee] = useState<string>(
    initialReport?.nameOfStudentTrainee || currentUser?.name || ''
  );
  const [daysPresent, setDaysPresent] = useState<number>(
    initialReport?.daysPresent !== undefined ? Number(initialReport.daysPresent) : 6
  );
  const [department, setDepartment] = useState<string>(
    initialReport?.department || currentUser?.department || 'Production'
  );
  const [subDepartment, setSubDepartment] = useState<string>(
    initialReport?.subDepartment || currentUser?.subDepartment || (
      (initialReport?.department || currentUser?.department || 'Production') === 'Production'
        ? 'Coil Winding (HV & LV)'
        : ''
    )
  );
  const [assignedProjectDept, setAssignedProjectDept] = useState<string>(
    initialReport?.assignedProjectDept || ''
  );

  // Authentic Paper Format Sections
  const [classroomTrainingSummary, setClassroomTrainingSummary] = useState<string>(
    initialReport?.classroomTrainingSummary || initialReport?.majorLearnings || ''
  );
  const [shopFloorTrainingSummary, setShopFloorTrainingSummary] = useState<string>(
    initialReport?.shopFloorTrainingSummary || ''
  );
  const [projectSummaryA, setProjectSummaryA] = useState<string>(
    initialReport?.projectSummaryA || initialReport?.assignedProjectDept || ''
  );
  const [projectSummaryB, setProjectSummaryB] = useState<string>(
    initialReport?.projectSummaryB || initialReport?.solutionsImplemented || ''
  );
  const [selfLearningSummary, setSelfLearningSummary] = useState<string>(
    initialReport?.selfLearningSummary || initialReport?.technicalSkillsAcquired || ''
  );
  const [suggestion, setSuggestion] = useState<string>(
    initialReport?.suggestion || ''
  );
  const [traineeSignature, setTraineeSignature] = useState<string>(
    initialReport?.traineeSignature || (currentUser?.name ? `${currentUser.name} (Signed)` : '')
  );
  const [backOfPageNotes, setBackOfPageNotes] = useState<string>(
    initialReport?.backOfPageNotes || ''
  );

  // Supporting fields
  const [dailySummary, setDailySummary] = useState<WeeklyDayEntry[]>(
    initialReport?.dailySummary || DEFAULT_DAYS
  );
  const [planForNextWeek, setPlanForNextWeek] = useState<string>(
    initialReport?.planForNextWeek || ''
  );
  const [traineeSelfAssessment, setTraineeSelfAssessment] = useState<
    'Exceptional' | 'Exceeded Expectations' | 'Met Expectations' | 'Needs Improvement'
  >(initialReport?.traineeSelfAssessment || 'Met Expectations');
  const [remarks, setRemarks] = useState<string>(initialReport?.remarks || '');

  // UI States
  const [showSchedule, setShowSchedule] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const currentFormData = useMemo(() => ({
    weekNumber,
    weekStart,
    weekEnd,
    nameOfStudentTrainee,
    daysPresent,
    department,
    subDepartment,
    assignedProjectDept,
    classroomTrainingSummary,
    shopFloorTrainingSummary,
    projectSummaryA,
    projectSummaryB,
    selfLearningSummary,
    suggestion,
    traineeSignature,
    backOfPageNotes,
    dailySummary,
    planForNextWeek,
    traineeSelfAssessment,
    remarks,
  }), [
    weekNumber,
    weekStart,
    weekEnd,
    nameOfStudentTrainee,
    daysPresent,
    department,
    subDepartment,
    assignedProjectDept,
    classroomTrainingSummary,
    shopFloorTrainingSummary,
    projectSummaryA,
    projectSummaryB,
    selfLearningSummary,
    suggestion,
    traineeSignature,
    backOfPageNotes,
    dailySummary,
    planForNextWeek,
    traineeSelfAssessment,
    remarks,
  ]);

  const draftKey = `trms_draft_weekly_${currentUser?.id || 'anon'}_${isRealExistingReport ? initialReport!.id : 'new'}`;

  const {
    hasRecoverableDraft,
    draftTimestamp,
    draftSource,
    lastSaved,
    isSaving,
    saveStatus,
    secondsUntilNextSave,
    saveDraft,
    restoreDraft,
    discardDraft,
    clearDraft,
  } = useAutoDraft({
    key: draftKey,
    formData: currentFormData,
    intervalMs: 30000,
    userId: currentUser?.id,
    reportType: 'WEEKLY',
    reportId: isRealExistingReport ? initialReport?.id : undefined,
    syncWithFirestore: true,
    hasMeaningfulContent: (d) =>
      Boolean(
        d.classroomTrainingSummary?.trim() ||
        d.shopFloorTrainingSummary?.trim() ||
        d.projectSummaryA?.trim() ||
        d.projectSummaryB?.trim() ||
        d.selfLearningSummary?.trim() ||
        d.suggestion?.trim() ||
        d.backOfPageNotes?.trim() ||
        d.planForNextWeek?.trim() ||
        d.dailySummary?.some(day => day.activity?.trim())
      ),
    onRestore: (saved) => {
      if (saved.weekNumber) setWeekNumber(saved.weekNumber);
      if (saved.weekStart) setWeekStart(saved.weekStart);
      if (saved.weekEnd) setWeekEnd(saved.weekEnd);
      if (saved.nameOfStudentTrainee !== undefined) setNameOfStudentTrainee(saved.nameOfStudentTrainee);
      if (saved.daysPresent !== undefined) setDaysPresent(Number(saved.daysPresent));
      if (saved.department) setDepartment(saved.department);
      if (saved.subDepartment !== undefined) setSubDepartment(saved.subDepartment);
      if (saved.assignedProjectDept !== undefined) setAssignedProjectDept(saved.assignedProjectDept);
      if (saved.classroomTrainingSummary !== undefined) setClassroomTrainingSummary(saved.classroomTrainingSummary);
      if (saved.shopFloorTrainingSummary !== undefined) setShopFloorTrainingSummary(saved.shopFloorTrainingSummary);
      if (saved.projectSummaryA !== undefined) setProjectSummaryA(saved.projectSummaryA);
      if (saved.projectSummaryB !== undefined) setProjectSummaryB(saved.projectSummaryB);
      if (saved.selfLearningSummary !== undefined) setSelfLearningSummary(saved.selfLearningSummary);
      if (saved.suggestion !== undefined) setSuggestion(saved.suggestion);
      if (saved.traineeSignature !== undefined) setTraineeSignature(saved.traineeSignature);
      if (saved.backOfPageNotes !== undefined) setBackOfPageNotes(saved.backOfPageNotes);
      if (saved.dailySummary && Array.isArray(saved.dailySummary)) setDailySummary(saved.dailySummary);
      if (saved.planForNextWeek !== undefined) setPlanForNextWeek(saved.planForNextWeek);
      if (saved.traineeSelfAssessment) setTraineeSelfAssessment(saved.traineeSelfAssessment);
      if (saved.remarks !== undefined) setRemarks(saved.remarks);
    },
    enabled: true,
  });

  if (!currentUser) return null;

  const handleDayChange = (index: number, field: keyof WeeklyDayEntry, value: any) => {
    setDailySummary(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const validateForm = () => {
    if (!nameOfStudentTrainee.trim()) return 'Please enter Name of Student Trainee / GET.';
    if (!classroomTrainingSummary.trim() && !shopFloorTrainingSummary.trim()) {
      return 'Please enter at least one training summary (Classroom or Shop Floor).';
    }
    if (!selfLearningSummary.trim()) {
      return 'Please provide your Self-learning summary.';
    }
    if (!suggestion.trim()) {
      return 'Please provide at least one Suggestion for improvement.';
    }
    return null;
  };

  const handleSaveDraft = async () => {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);

    const payload = {
      weekNumber,
      weekStart,
      weekEnd,
      nameOfStudentTrainee: nameOfStudentTrainee.trim(),
      daysPresent: Number(daysPresent) || 6,
      department,
      subDepartment: subDepartment.trim() || undefined,
      assignedProjectDept: projectSummaryA.trim() || assignedProjectDept.trim() || 'General Weekly Training',
      classroomTrainingSummary: classroomTrainingSummary.trim(),
      shopFloorTrainingSummary: shopFloorTrainingSummary.trim(),
      projectSummaryA: projectSummaryA.trim(),
      projectSummaryB: projectSummaryB.trim(),
      selfLearningSummary: selfLearningSummary.trim(),
      suggestion: suggestion.trim(),
      traineeSignature: traineeSignature.trim() || `${nameOfStudentTrainee} (Signed)`,
      backOfPageNotes: backOfPageNotes.trim(),
      majorLearnings: classroomTrainingSummary.trim(),
      technicalSkillsAcquired: selfLearningSummary.trim(),
      solutionsImplemented: projectSummaryB.trim(),
      dailySummary,
      planForNextWeek: planForNextWeek.trim(),
      traineeSelfAssessment,
      remarks,
      status: 'DRAFT' as const,
    };

    if (isEditing && initialReport) {
      await updateWeeklyReport(initialReport.id, payload);
      clearDraft();
      setIsSubmitting(false);
      onSuccess(initialReport.id);
    } else {
      const id = await submitWeeklyReport(
        {
          ...payload,
          userId: currentUser.id,
          employeeId: currentUser.employeeId,
          userName: currentUser.name,
          designation: currentUser.designation,
          reportingManager: currentUser.reportingManager,
        },
        true
      );
      clearDraft();
      setIsSubmitting(false);
      onSuccess(id);
    }
  };

  const handleOpenConfirm = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    const payload = {
      weekNumber,
      weekStart,
      weekEnd,
      nameOfStudentTrainee: nameOfStudentTrainee.trim(),
      daysPresent: Number(daysPresent) || 6,
      department,
      subDepartment: subDepartment.trim() || undefined,
      assignedProjectDept: projectSummaryA.trim() || assignedProjectDept.trim() || 'General Weekly Training',
      classroomTrainingSummary: classroomTrainingSummary.trim(),
      shopFloorTrainingSummary: shopFloorTrainingSummary.trim(),
      projectSummaryA: projectSummaryA.trim(),
      projectSummaryB: projectSummaryB.trim(),
      selfLearningSummary: selfLearningSummary.trim(),
      suggestion: suggestion.trim(),
      traineeSignature: traineeSignature.trim() || `${nameOfStudentTrainee} (Signed)`,
      backOfPageNotes: backOfPageNotes.trim(),
      majorLearnings: classroomTrainingSummary.trim(),
      technicalSkillsAcquired: selfLearningSummary.trim(),
      solutionsImplemented: projectSummaryB.trim(),
      dailySummary,
      planForNextWeek: planForNextWeek.trim(),
      traineeSelfAssessment,
      remarks,
      status: 'SUBMITTED' as const,
    };

    if (isEditing && initialReport) {
      await updateWeeklyReport(initialReport.id, payload, true);
      clearDraft();
      setIsSubmitting(false);
      onSuccess(initialReport.id);
    } else {
      const id = await submitWeeklyReport({
        ...payload,
        userId: currentUser.id,
        employeeId: currentUser.employeeId,
        userName: currentUser.name,
        designation: currentUser.designation,
        reportingManager: currentUser.reportingManager,
      });
      clearDraft();
      setIsSubmitting(false);
      onSuccess(id);
    }
  };

  // Keyboard shortcut listener for Ctrl+S (Submit) and Ctrl+Shift+S (Draft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (isSubmitting) return;

        if (e.shiftKey) {
          handleSaveDraft();
        } else {
          if (showConfirmModal) {
            handleFinalSubmit();
          } else {
            handleOpenConfirm();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showConfirmModal,
    isSubmitting,
    weekNumber,
    weekStart,
    weekEnd,
    nameOfStudentTrainee,
    daysPresent,
    classroomTrainingSummary,
    shopFloorTrainingSummary,
    projectSummaryA,
    projectSummaryB,
    selfLearningSummary,
    suggestion,
    traineeSignature,
    backOfPageNotes,
  ]);

  const handleReset = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = () => {
    setClassroomTrainingSummary('');
    setShopFloorTrainingSummary('');
    setProjectSummaryA('');
    setProjectSummaryB('');
    setSelfLearningSummary('');
    setSuggestion('');
    setBackOfPageNotes('');
    setPlanForNextWeek('');
    setRemarks('');
    setDailySummary(DEFAULT_DAYS);
    setValidationError(null);
    clearDraft();
    setShowResetConfirmModal(false);
    addToast('info', 'Weekly report form reset to defaults.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>{isEditing ? `Edit Weekly Report (${initialReport?.id})` : 'Weekly Training Report'}</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                PPT Format
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Weekly plant visit & training record with classroom, shop floor, project, and self-learning summaries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutoSaveStatusBadge
            isSaving={isSaving}
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            secondsUntilNextSave={secondsUntilNextSave}
            onManualSave={() => saveDraft(true)}
            variant="purple"
          />

          {initialReport && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {initialReport.id}
            </span>
          )}
        </div>
      </div>

      {/* Auto-Draft Recovery Banner */}
      {hasRecoverableDraft && (
        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/90 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Interrupted Session Recovered</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200">
                  {draftSource === 'firestore' ? 'Firestore Cloud' : draftSource === 'both' ? 'Cloud & Local' : 'Local Storage'}
                </span>
              </div>
              <span className="text-purple-700 dark:text-purple-300 font-medium">
                (Auto-saved draft from {draftTimestamp ? new Date(draftTimestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : 'previous session'})
              </span>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">
                We detected previously entered weekly report contents that were continuously auto-saved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Reviewer Feedback Callout */}
      {initialReport?.adminRemark && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Reviewer Remarks / Feedback:</div>
            <div className="mt-1 leading-relaxed">{initialReport.adminRemark}</div>
            <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
              Please update the relevant sections below and resubmit for verification.
            </div>
          </div>
        </div>
      )}

      {validationError && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Document Form Container */}
      <form
        id="form-weekly-report"
        onSubmit={handleOpenConfirm}
        className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        {/* Pro-Tip Shortcuts Banner */}
        <div className="px-5 py-2.5 bg-purple-50/70 dark:bg-purple-950/40 border-b border-purple-100/80 dark:border-purple-900/40 flex items-center justify-between text-xs text-purple-900 dark:text-purple-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold flex items-center gap-1.5 text-purple-950 dark:text-purple-100">
              <span className="text-[11px] uppercase tracking-wider text-purple-700 dark:text-purple-300 font-bold">Shortcuts:</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-purple-800 dark:text-purple-200 rounded border border-purple-200 dark:border-purple-800 shadow-2xs">
                {modKey}+S
              </kbd>
              <span>to Submit</span>
            </span>
            <span className="text-purple-300 dark:text-purple-700">•</span>
            <span className="inline-flex items-center gap-1 text-purple-800 dark:text-purple-200">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-purple-800 dark:text-purple-200 rounded border border-purple-200 dark:border-purple-800 shadow-2xs">
                {modKey}+Shift+S
              </kbd>
              <span>Save Draft</span>
            </span>
          </div>
          <span className="text-purple-700 dark:text-purple-300 text-[11px] hidden sm:inline-flex items-center gap-1 font-medium">
            <span>Plant Visit / Training Weekly Format</span>
          </span>
        </div>

        {/* Paper Header Block */}
        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-800/40 border-b-2 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Boxed Title matching PPT/Paper Format */}
            <div className="border-2 border-slate-900 dark:border-slate-300 px-5 py-2 bg-white dark:bg-slate-800 inline-block shadow-2xs rounded-xs">
              <h2 className="text-base sm:text-lg font-serif font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Weekly Training Report
              </h2>
            </div>

            {/* Week Range Inputs */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-serif font-bold text-slate-800 dark:text-slate-200">
              <span className="font-sans font-bold text-slate-900 dark:text-slate-100">Week from</span>
              <input
                type="date"
                required
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600"
              />
              <span className="font-sans font-bold text-slate-900 dark:text-slate-100">to</span>
              <input
                type="date"
                required
                value={weekEnd}
                onChange={e => setWeekEnd(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600"
              />
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] ml-1">
                (Week #{weekNumber})
              </span>
            </div>
          </div>

          {/* Paper Bullet Row 1: Name of student trainee & Days present */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                <span className="text-purple-600 text-sm">•</span>
                <span>Name of student trainee/GET:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Full name of student trainee / GET"
                value={nameOfStudentTrainee}
                onChange={e => setNameOfStudentTrainee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>Employee ID: {currentUser.employeeId}</span>
                <span>Designation: {currentUser.designation}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                <span className="text-purple-600 text-sm">•</span>
                <span>Days present (in this week):</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={7}
                  required
                  value={daysPresent}
                  onChange={e => setDaysPresent(Math.max(1, Math.min(7, Number(e.target.value))))}
                  className="w-24 px-3 py-2 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 text-center"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Days</span>
                
                {/* Quick Presets for Days */}
                <div className="flex items-center gap-1 ml-auto">
                  {[5, 6, 7].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPresent(num)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                        daysPresent === num
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-purple-50'
                      }`}
                    >
                      {num}d
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Standard plant working week is typically 6 working days (Mon–Sat)
              </p>
            </div>
          </div>

          {/* Plant Department & Sub-Department Section */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Department Visited / Stationed <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={e => {
                  const newDept = e.target.value;
                  setDepartment(newDept);
                  const subOpts = DEPARTMENT_SUB_DEPARTMENTS[newDept];
                  if (subOpts && subOpts.length > 0) {
                    setSubDepartment(subOpts[0]);
                  } else {
                    setSubDepartment('');
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Sub-Department / Section {department === 'Production' && <span className="text-purple-600 font-bold">(Production Unit)</span>}
              </label>
              {DEPARTMENT_SUB_DEPARTMENTS[department] ? (
                <select
                  value={subDepartment}
                  onChange={e => setSubDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">-- Select Sub-Department / Section --</option>
                  {DEPARTMENT_SUB_DEPARTMENTS[department].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Plant Section or Sub-Department"
                  value={subDepartment}
                  onChange={e => setSubDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-600"
                />
              )}
            </div>
          </div>
        </div>

        {/* Paper Format Main Sections */}
        <div className="p-5 sm:p-6 space-y-6 text-xs">
          
          {/* Section 1: Classroom Training Summary */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>• Classroom training summary</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Technical lectures, theory, IS/IEC calculations</span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Summary of classroom technical sessions, design standards (IS 2026, IEC 60076), insulation materials, testing methodologies, and engineering theories learned during the week..."
              value={classroomTrainingSummary}
              onChange={e => setClassroomTrainingSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600 leading-relaxed"
            />
          </div>

          {/* Section 2: Shop Floor Training Summary */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>• Shop floor training summary</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Practical machines, assembly, testing bays</span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Summary of hands-on activities on shop floor bays (Coil Winding, Core Building, Tanking, Vacuum Drying Plant, Testing Lab, Finishing), observing operations and line workflows..."
              value={shopFloorTrainingSummary}
              onChange={e => setShopFloorTrainingSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600 leading-relaxed"
            />
          </div>

          {/* Section 3: Projects Summary (a) & (b) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>• Projects summary</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Optional</span>
              </label>
              <span className="text-[11px] text-slate-400">Assignments, study projects & case evaluations</span>
            </div>

            {/* Sub-item (a) */}
            <div className="pl-2 border-l-2 border-emerald-500">
              <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  (a)
                </span>
                <span>Project / Study Assignment 1 (Optional):</span>
              </div>
              <textarea
                rows={3}
                placeholder="Summary of project/task (a): Objective, technical observations, component analysis, design calculations, or workflow improvement findings..."
                value={projectSummaryA}
                onChange={e => {
                  setProjectSummaryA(e.target.value);
                  if (!assignedProjectDept) {
                    setAssignedProjectDept(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600 leading-relaxed"
              />
            </div>

            {/* Sub-item (b) */}
            <div className="pl-2 border-l-2 border-emerald-500/70">
              <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  (b)
                </span>
                <span>Project / Study Assignment 2 (or Solutions Implemented):</span>
              </div>
              <textarea
                rows={3}
                placeholder="Summary of project/task (b): Secondary study, experimental trials, test results comparison, or continuous improvement actions..."
                value={projectSummaryB}
                onChange={e => setProjectSummaryB(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: Self-Learning Summary */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>• Self-learning summary</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Manuals, CBIP, SOPs, self-study & research</span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Summary of self-directed technical learning: transformer reference manuals, SOP guidelines, reading IEEE/IEC papers, safety guidelines, and online technical portals..."
              value={selfLearningSummary}
              onChange={e => setSelfLearningSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600 leading-relaxed"
            />
          </div>

          {/* Section 5: Suggestion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>• Suggestion</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Process, 5S, safety, or tooling suggestions</span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Your practical suggestions for plant efficiency, material handling fixtures, workplace 5S, safety protocols, tooling improvements, or shop layout optimizations..."
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600 leading-relaxed"
            />
          </div>

          {/* Optional Toggle: Day-by-Day Activity Schedule */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSchedule(prev => !prev)}
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-4 py-3 flex items-center justify-between text-left hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Day-by-Day Activity Schedule (Monday – Saturday Breakdown)
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950">
                  {dailySummary.reduce((sum, item) => sum + (Number(item.hours) || 0), 0)} hrs total
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <span>{showSchedule ? 'Collapse' : 'Expand Schedule'}</span>
                {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showSchedule && (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 p-2">
                {dailySummary.map((dayItem, idx) => (
                  <div key={idx} className="p-2.5 sm:p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors">
                    <div className="w-28 shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white text-xs block">{dayItem.day}</span>
                      <input
                        type="date"
                        value={dayItem.date}
                        onChange={e => handleDayChange(idx, 'date', e.target.value)}
                        className="text-[11px] text-slate-500 dark:text-slate-400 border-none p-0 bg-transparent focus:ring-0 font-mono"
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder={`Activities performed on ${dayItem.day}...`}
                        value={dayItem.activity}
                        onChange={e => handleDayChange(idx, 'activity', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={16}
                        step={0.5}
                        value={dayItem.hours}
                        onChange={e => handleDayChange(idx, 'hours', Number(e.target.value))}
                        className="w-16 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-right font-mono"
                      />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Plan & Trainee Self-Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Action Plan For Next Week
              </label>
              <textarea
                rows={2}
                placeholder="Upcoming department rotation, specific tasks, scheduled tests or topics to be covered..."
                value={planForNextWeek}
                onChange={e => setPlanForNextWeek(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Trainee Self-Assessment Rating
              </label>
              <select
                value={traineeSelfAssessment}
                onChange={e => setTraineeSelfAssessment(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600 font-semibold text-slate-800 dark:text-white"
              >
                <option value="Exceptional">Exceptional (Far exceeded weekly objectives)</option>
                <option value="Exceeded Expectations">Exceeded Expectations (High achievement)</option>
                <option value="Met Expectations">Met Expectations (Standard objectives fulfilled)</option>
                <option value="Needs Improvement">Needs Improvement (Requires additional guidance)</option>
              </select>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 mb-1">
                  General Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional note for supervisor..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Back of Page Notes from physical sheet */}
          <div className="border-2 border-dashed border-amber-300 dark:border-amber-800/80 rounded-xl p-4 bg-amber-50/30 dark:bg-amber-950/20">
            <div className="flex items-center justify-between mb-2">
              <label className="font-serif italic font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Note: if there is less space than you can use at the back of the page</span>
              </label>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-sans">Extended log</span>
            </div>
            <textarea
              rows={3}
              placeholder="Use this space for overflow notes, extended calculations, transformer winding formulas, additional observations or sketches..."
              value={backOfPageNotes}
              onChange={e => setBackOfPageNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-amber-300 dark:border-amber-800/80 rounded-lg focus:ring-2 focus:ring-amber-500 leading-relaxed font-mono"
            />
          </div>

          {/* Signature of Trainee/GET matching physical sheet */}
          <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-serif">
            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Signature of Trainee/GET:</span>
                <span className="text-rose-500 font-sans">*</span>
              </label>
              <input
                type="text"
                required
                value={traineeSignature}
                onChange={e => setTraineeSignature(e.target.value)}
                placeholder="Digital signature / Full Name"
                className="w-full px-3 py-1.5 text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-purple-900 dark:text-purple-300 focus:ring-2 focus:ring-purple-600"
              />
              <div className="mt-1 text-[11px] text-slate-400 font-sans italic">
                Formally certifies this weekly training submission
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-sans italic self-end sm:self-center">
              Plant Visit & Technical Training Document Form
            </div>
          </div>
        </div>

        {/* Form Action Controls */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              id="btn-weekly-reset"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            {/* Periodic Auto-save status */}
            <AutoSaveStatusBadge
              isSaving={isSaving}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              secondsUntilNextSave={secondsUntilNextSave}
              onManualSave={() => saveDraft(true)}
              variant="purple"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              type="button"
              id="btn-weekly-save-draft"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Save Draft</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-600">
                {modKey}+Shift+S
              </kbd>
            </button>

            <button
              type="submit"
              id="btn-weekly-submit-report"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 rounded-xl shadow-xs transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Weekly Report</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-purple-800 dark:bg-purple-700 text-purple-100 rounded border border-purple-600/60 shadow-xs">
                    {modKey}+S
                  </kbd>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Weekly Report Submission"
        message="Are you sure you want to submit this Weekly Training Report? Your classroom, shop floor, project, and self-learning summaries will be officially transmitted to the Training Administrator."
        confirmText="Yes, Submit Weekly Report"
        cancelText="Review Form"
        confirmVariant="primary"
        loading={isSubmitting}
        onConfirm={handleFinalSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Reset Form Confirm Modal */}
      <ConfirmModal
        isOpen={showResetConfirmModal}
        title="Reset Weekly Report Form?"
        message="Are you sure you want to clear all fields and auto-saved drafts for this weekly report? All entered section summaries will be cleared."
        confirmText="Reset Form"
        cancelText="Keep Editing"
        type="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirmModal(false)}
      />
    </div>
  );
};
