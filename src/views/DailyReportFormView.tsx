import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAutoDraft } from '../hooks/useAutoDraft';
import { AutoSaveStatusBadge } from '../components/AutoSaveStatusBadge';
import { DEPARTMENTS, PRODUCTION_SUB_DEPARTMENTS, DEPARTMENT_SUB_DEPARTMENTS } from '../data/departments';
import { UttamLogo } from '../components/UttamLogo';
import {
  FileText,
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Calendar,
  ShieldAlert,
  ArrowLeft,
  Clock,
  Eye,
  Printer,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

interface DailyReportFormViewProps {
  initialReport?: DailyReport | null;
  onSuccess: (reportId: string) => void;
  onCancel?: () => void;
}

export const DailyReportFormView: React.FC<DailyReportFormViewProps> = ({
  initialReport,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, submitDailyReport, updateDailyReport, addToast } = useApp();

  const isEditing = Boolean(initialReport?.id && !initialReport.id.startsWith('DRAFT-'));

  // Form State matching exact PPT Format
  const [date, setDate] = useState<string>(
    initialReport ? initialReport.date : new Date().toISOString().split('T')[0]
  );
  const [nameOfGet, setNameOfGet] = useState<string>(
    initialReport?.nameOfGet || initialReport?.userName || currentUser?.name || ''
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
  const [nameOfHod, setNameOfHod] = useState<string>(
    initialReport?.nameOfHod || currentUser?.reportingManager || 'Rajesh Verma (Senior DGM / HOD)'
  );
  const [staffMet1, setStaffMet1] = useState<string>(
    initialReport?.staffMet1 || ''
  );
  const [staffMet2, setStaffMet2] = useState<string>(
    initialReport?.staffMet2 || ''
  );

  // Core Sections from PPT
  const [inputDept, setInputDept] = useState<string>(
    initialReport?.inputDept || ''
  );
  const [processValueAdded, setProcessValueAdded] = useState<string>(
    initialReport?.processValueAdded || initialReport?.workDescription || ''
  );
  const [outputNextDept, setOutputNextDept] = useState<string>(
    initialReport?.outputNextDept || initialReport?.learningOutcome || ''
  );
  const [standards, setStandards] = useState<string>(
    initialReport?.standards || ''
  );
  const [safetyStandards, setSafetyStandards] = useState<string>(
    initialReport?.safetyStandards || initialReport?.safetyObservations || ''
  );

  // Chronic problems 1, 2, 3
  const [chronicProblem1, setChronicProblem1] = useState<string>(
    initialReport?.chronicProblem1 || initialReport?.challengesFaced || ''
  );
  const [chronicProblem2, setChronicProblem2] = useState<string>(
    initialReport?.chronicProblem2 || initialReport?.bottlenecks || ''
  );
  const [chronicProblem3, setChronicProblem3] = useState<string>(
    initialReport?.chronicProblem3 || ''
  );

  // Back of page notes
  const [backOfPageNotes, setBackOfPageNotes] = useState<string>(
    initialReport?.backOfPageNotes || initialReport?.remarks || ''
  );

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [showBackOfPage, setShowBackOfPage] = useState(Boolean(initialReport?.backOfPageNotes || initialReport?.remarks));

  // Shortcuts
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const currentFormData = useMemo(() => ({
    date,
    nameOfGet,
    department,
    subDepartment,
    nameOfHod,
    staffMet1,
    staffMet2,
    inputDept,
    processValueAdded,
    outputNextDept,
    standards,
    safetyStandards,
    chronicProblem1,
    chronicProblem2,
    chronicProblem3,
    backOfPageNotes,
  }), [
    date, nameOfGet, department, subDepartment, nameOfHod, staffMet1, staffMet2,
    inputDept, processValueAdded, outputNextDept, standards, safetyStandards,
    chronicProblem1, chronicProblem2, chronicProblem3, backOfPageNotes
  ]);

  const isRealExistingReport = Boolean(initialReport?.id && !initialReport.id.startsWith('DRAFT-'));
  const draftKey = `trms_draft_daily_ppt_${currentUser?.id || 'anon'}_${isRealExistingReport ? initialReport!.id : 'new'}`;

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
    reportType: 'DAILY',
    reportId: isRealExistingReport ? initialReport?.id : undefined,
    syncWithFirestore: true,
    hasMeaningfulContent: (d) =>
      Boolean(
        d.inputDept?.trim() ||
        d.processValueAdded?.trim() ||
        d.outputNextDept?.trim() ||
        d.standards?.trim() ||
        d.safetyStandards?.trim() ||
        d.chronicProblem1?.trim() ||
        d.staffMet1?.trim() ||
        d.backOfPageNotes?.trim()
      ),
    onRestore: (saved) => {
      if (saved.date) setDate(saved.date);
      if (saved.nameOfGet) setNameOfGet(saved.nameOfGet);
      if (saved.department) setDepartment(saved.department);
      if (saved.subDepartment !== undefined) setSubDepartment(saved.subDepartment);
      if (saved.nameOfHod !== undefined) setNameOfHod(saved.nameOfHod);
      if (saved.staffMet1 !== undefined) setStaffMet1(saved.staffMet1);
      if (saved.staffMet2 !== undefined) setStaffMet2(saved.staffMet2);
      if (saved.inputDept !== undefined) setInputDept(saved.inputDept);
      if (saved.processValueAdded !== undefined) setProcessValueAdded(saved.processValueAdded);
      if (saved.outputNextDept !== undefined) setOutputNextDept(saved.outputNextDept);
      if (saved.standards !== undefined) setStandards(saved.standards);
      if (saved.safetyStandards !== undefined) setSafetyStandards(saved.safetyStandards);
      if (saved.chronicProblem1 !== undefined) setChronicProblem1(saved.chronicProblem1);
      if (saved.chronicProblem2 !== undefined) setChronicProblem2(saved.chronicProblem2);
      if (saved.chronicProblem3 !== undefined) setChronicProblem3(saved.chronicProblem3);
      if (saved.backOfPageNotes !== undefined) {
        setBackOfPageNotes(saved.backOfPageNotes);
        if (saved.backOfPageNotes) setShowBackOfPage(true);
      }
    },
    enabled: true,
  });

  if (!currentUser) return null;

  // Available sub-departments
  const availableSubDepartments = DEPARTMENT_SUB_DEPARTMENTS[department] || [];

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const subList = DEPARTMENT_SUB_DEPARTMENTS[newDept] || [];
    if (subList.length > 0) {
      setSubDepartment(subList[0]);
    } else {
      setSubDepartment('');
    }
  };

  const validateForm = () => {
    if (!date) return 'Please select a report date.';
    if (!nameOfGet.trim()) return 'Name of GET is required.';
    if (!department.trim()) return 'Today’s Department is required.';
    if (!nameOfHod.trim()) return 'Name of HOD is required.';
    if (!inputDept.trim()) return 'Input (for Today\'s deptt.) is required.';
    if (!processValueAdded.trim()) return 'Process (value added by this deptt.) is required.';
    if (!outputNextDept.trim()) return 'Output (final output to next deptt.) is required.';
    if (!standards.trim()) return 'IS standard & Global standards field is required.';
    if (!safetyStandards.trim()) return 'Safety standards field is required.';
    return null;
  };

  const handleSaveDraft = async () => {
    setValidationError(null);
    setIsSubmitting(true);

    const payload: Partial<DailyReport> = {
      date,
      nameOfGet: nameOfGet.trim(),
      userName: nameOfGet.trim() || currentUser.name,
      department: department.trim(),
      subDepartment: subDepartment.trim() || undefined,
      nameOfHod: nameOfHod.trim(),
      staffMet1: staffMet1.trim(),
      staffMet2: staffMet2.trim(),
      inputDept: inputDept.trim(),
      processValueAdded: processValueAdded.trim(),
      outputNextDept: outputNextDept.trim(),
      standards: standards.trim(),
      safetyStandards: safetyStandards.trim(),
      chronicProblem1: chronicProblem1.trim(),
      chronicProblem2: chronicProblem2.trim(),
      chronicProblem3: chronicProblem3.trim(),
      backOfPageNotes: backOfPageNotes.trim(),
      // Compatibility fields
      trainingWorkArea: subDepartment.trim() ? `${department} - ${subDepartment}` : department,
      topicActivity: processValueAdded.slice(0, 120),
      workDescription: processValueAdded,
      learningOutcome: outputNextDept,
      safetyObservations: safetyStandards,
      challengesFaced: chronicProblem1,
      bottlenecks: [chronicProblem2, chronicProblem3].filter(Boolean).join('; '),
      remarks: backOfPageNotes,
      status: 'DRAFT',
    };

    try {
      if (isEditing && initialReport) {
        await updateDailyReport(initialReport.id, payload);
        clearDraft();
        setIsSubmitting(false);
        onSuccess(initialReport.id);
      } else {
        const id = await submitDailyReport(
          {
            userId: currentUser.id,
            employeeId: currentUser.employeeId,
            userName: nameOfGet.trim() || currentUser.name,
            nameOfGet: nameOfGet.trim(),
            department: department.trim(),
            subDepartment: subDepartment.trim() || undefined,
            designation: currentUser.designation,
            reportingManager: nameOfHod.trim() || currentUser.reportingManager,
            nameOfHod: nameOfHod.trim(),
            staffMet1: staffMet1.trim(),
            staffMet2: staffMet2.trim(),
            date,
            inputDept: inputDept.trim(),
            processValueAdded: processValueAdded.trim(),
            outputNextDept: outputNextDept.trim(),
            standards: standards.trim(),
            safetyStandards: safetyStandards.trim(),
            chronicProblem1: chronicProblem1.trim(),
            chronicProblem2: chronicProblem2.trim(),
            chronicProblem3: chronicProblem3.trim(),
            backOfPageNotes: backOfPageNotes.trim(),
            // Compatibility
            trainingWorkArea: subDepartment.trim() ? `${department} - ${subDepartment}` : department,
            topicActivity: processValueAdded.slice(0, 120),
            workDescription: processValueAdded,
            learningOutcome: outputNextDept,
            safetyObservations: safetyStandards,
            challengesFaced: chronicProblem1,
            bottlenecks: [chronicProblem2, chronicProblem3].filter(Boolean).join('; '),
            remarks: backOfPageNotes,
            status: 'DRAFT',
          },
          true
        );
        clearDraft();
        setIsSubmitting(false);
        onSuccess(id);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirm = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const error = validateForm();
    if (error) {
      setValidationError(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setValidationError(null);
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    const payload: Partial<DailyReport> = {
      date,
      nameOfGet: nameOfGet.trim(),
      userName: nameOfGet.trim() || currentUser.name,
      department: department.trim(),
      subDepartment: subDepartment.trim() || undefined,
      nameOfHod: nameOfHod.trim(),
      staffMet1: staffMet1.trim(),
      staffMet2: staffMet2.trim(),
      inputDept: inputDept.trim(),
      processValueAdded: processValueAdded.trim(),
      outputNextDept: outputNextDept.trim(),
      standards: standards.trim(),
      safetyStandards: safetyStandards.trim(),
      chronicProblem1: chronicProblem1.trim(),
      chronicProblem2: chronicProblem2.trim(),
      chronicProblem3: chronicProblem3.trim(),
      backOfPageNotes: backOfPageNotes.trim(),
      // Compatibility fields
      trainingWorkArea: subDepartment.trim() ? `${department} - ${subDepartment}` : department,
      topicActivity: processValueAdded.slice(0, 120),
      workDescription: processValueAdded,
      learningOutcome: outputNextDept,
      safetyObservations: safetyStandards,
      challengesFaced: chronicProblem1,
      bottlenecks: [chronicProblem2, chronicProblem3].filter(Boolean).join('; '),
      remarks: backOfPageNotes,
      status: 'SUBMITTED',
    };

    try {
      if (isEditing && initialReport) {
        await updateDailyReport(initialReport.id, payload, true);
        clearDraft();
        setIsSubmitting(false);
        onSuccess(initialReport.id);
      } else {
        const id = await submitDailyReport({
          userId: currentUser.id,
          employeeId: currentUser.employeeId,
          userName: nameOfGet.trim() || currentUser.name,
          nameOfGet: nameOfGet.trim(),
          department: department.trim(),
          subDepartment: subDepartment.trim() || undefined,
          designation: currentUser.designation,
          reportingManager: nameOfHod.trim() || currentUser.reportingManager,
          nameOfHod: nameOfHod.trim(),
          staffMet1: staffMet1.trim(),
          staffMet2: staffMet2.trim(),
          date,
          inputDept: inputDept.trim(),
          processValueAdded: processValueAdded.trim(),
          outputNextDept: outputNextDept.trim(),
          standards: standards.trim(),
          safetyStandards: safetyStandards.trim(),
          chronicProblem1: chronicProblem1.trim(),
          chronicProblem2: chronicProblem2.trim(),
          chronicProblem3: chronicProblem3.trim(),
          backOfPageNotes: backOfPageNotes.trim(),
          // Compatibility
          trainingWorkArea: subDepartment.trim() ? `${department} - ${subDepartment}` : department,
          topicActivity: processValueAdded.slice(0, 120),
          workDescription: processValueAdded,
          learningOutcome: outputNextDept,
          safetyObservations: safetyStandards,
          challengesFaced: chronicProblem1,
          bottlenecks: [chronicProblem2, chronicProblem3].filter(Boolean).join('; '),
          remarks: backOfPageNotes,
          status: 'SUBMITTED',
        });
        clearDraft();
        setIsSubmitting(false);
        onSuccess(id);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listener
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
  }, [showConfirmModal, isSubmitting, date, nameOfGet, department, subDepartment, nameOfHod, staffMet1, staffMet2, inputDept, processValueAdded, outputNextDept, standards, safetyStandards, chronicProblem1, chronicProblem2, chronicProblem3, backOfPageNotes, isEditing, initialReport]);

  const handleReset = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setNameOfGet(currentUser?.name || '');
    setDepartment(currentUser?.department || 'Production');
    setSubDepartment(currentUser?.subDepartment || 'Coil Winding (HV & LV)');
    setNameOfHod(currentUser?.reportingManager || 'Rajesh Verma (Senior DGM / HOD)');
    setStaffMet1('');
    setStaffMet2('');
    setInputDept('');
    setProcessValueAdded('');
    setOutputNextDept('');
    setStandards('');
    setSafetyStandards('');
    setChronicProblem1('');
    setChronicProblem2('');
    setChronicProblem3('');
    setBackOfPageNotes('');
    setShowBackOfPage(false);
    clearDraft();
    setShowResetConfirmModal(false);
    addToast('info', 'Daily report form reset to defaults.');
  };

  // Helper chip append
  const appendToField = (currentVal: string, addition: string, setter: (val: string) => void) => {
    if (!currentVal.trim()) {
      setter(addition);
    } else if (!currentVal.includes(addition)) {
      setter(`${currentVal}, ${addition}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Controls & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-xs"
              title="Return to previous view"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {isEditing ? `Edit Daily Report (${initialReport?.id})` : 'New Daily Report'}
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                Plant Visit / Training Format
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official GET technical plant visit report matching company standard
            </p>
          </div>
        </div>

        {/* Action Buttons & Auto-Save Badge */}
        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          <AutoSaveStatusBadge
            isSaving={isSaving}
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            secondsUntilNextSave={secondsUntilNextSave}
            onManualSave={() => saveDraft(true)}
            variant="blue"
          />

          <button
            type="button"
            onClick={() => setShowPreviewMode(!showPreviewMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              showPreviewMode
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPreviewMode ? 'Edit Mode' : 'Print / Sheet Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-xs"
            title={`Save as draft (${modKey}+Shift+S)`}
          >
            <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-colors"
            title="Clear form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-Draft Notification */}
      {hasRecoverableDraft && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Unsaved Daily Report Draft Found</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                  {draftSource === 'firestore' ? 'Firestore Cloud' : draftSource === 'both' ? 'Cloud & Local' : 'Local Storage'}
                </span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Auto-saved from {new Date(draftTimestamp || 0).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}. Would you like to restore your progress?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1.5 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors shadow-2xs"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300 hover:underline hover:bg-amber-100/50 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Required Information Missing:</div>
            <div className="mt-0.5">{validationError}</div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OFFICIAL FORM SHEET CONTAINER (Matches the PPT format)     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-md p-6 sm:p-10 space-y-7 relative print:border-none print:shadow-none print:p-0">
        
        {/* Paper Sheet Header */}
        <div className="border-b-2 border-slate-900 dark:border-slate-600 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Top Left: UTTAM Brand */}
            <div className="flex items-center gap-3">
              <UttamLogo className="h-10" />
            </div>

            {/* Top Center: Bordered Box Title exactly as in PPT */}
            <div className="self-center sm:self-auto px-6 py-2 border-2 border-slate-900 dark:border-slate-200 bg-slate-50/70 dark:bg-slate-800/80 rounded-xs shadow-xs text-center">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide uppercase font-serif">
                Daily Report for plant visit/training
              </h2>
            </div>

            {/* Top Right: Date */}
            <div className="flex items-center justify-end gap-2 text-xs font-serif sm:w-48">
              <span className="font-bold text-slate-800 dark:text-slate-200">Date:</span>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border-b-2 border-dotted border-slate-400 dark:border-slate-500 font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Bullet Section 1: Trainee & Department Meta (Exact PPT layout) */}
        <div className="space-y-3.5 text-xs sm:text-sm font-sans pt-1">
          {/* Bullet: Name of GET */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800 dark:bg-slate-200 inline-block"></span>
              <span>Name of GET:</span>
            </span>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={nameOfGet}
                onChange={e => setNameOfGet(e.target.value)}
                placeholder="Full name of Graduate Engineer Trainee"
                className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-transparent border-b-2 border-dotted border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-blue-50/20"
              />
              <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded shrink-0 border border-slate-200 dark:border-slate-700">
                {currentUser.employeeId}
              </span>
            </div>
          </div>

          {/* Bullet: Today's Department & Department Sub Section */}
          <div className="flex flex-col lg:flex-row lg:items-baseline gap-3">
            <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 dark:bg-slate-200 inline-block"></span>
                <span>Today's Department:</span>
              </span>
              <div className="flex-1 relative">
                <select
                  value={department}
                  onChange={e => handleDepartmentChange(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs sm:text-sm bg-transparent border-b-2 border-dotted border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-blue-600 cursor-pointer"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">
                Department Sub Section:
              </span>
              <div className="flex-1 flex items-center gap-1.5">
                {availableSubDepartments.length > 0 ? (
                  <select
                    value={subDepartment}
                    onChange={e => setSubDepartment(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-transparent border-b-2 border-dotted border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-500">Select Sub Section...</option>
                    {availableSubDepartments.map(sub => (
                      <option key={sub} value={sub} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subDepartment}
                    onChange={e => setSubDepartment(e.target.value)}
                    placeholder="e.g. Coil Winding, Core Assembly, Lab"
                    className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-transparent border-b-2 border-dotted border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-blue-600"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bullet: Name of HOD */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800 dark:bg-slate-200 inline-block"></span>
              <span>Name of HOD:</span>
            </span>
            <input
              type="text"
              value={nameOfHod}
              onChange={e => setNameOfHod(e.target.value)}
              placeholder="Name of Head of Department / Reporting Lead"
              className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-transparent border-b-2 border-dotted border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* Bullet: Name of sub section staff met: (1) ... (2) ... */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800 dark:bg-slate-200 inline-block"></span>
              <span>Name of sub section staff met:</span>
            </span>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">(1)</span>
                <input
                  type="text"
                  value={staffMet1}
                  onChange={e => setStaffMet1(e.target.value)}
                  placeholder="Staff member 1 (e.g. S. K. Gupta - Section Incharge)"
                  className="flex-1 px-2 py-1 text-xs sm:text-sm bg-transparent border-b-2 border-dotted border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">(2)</span>
                <input
                  type="text"
                  value={staffMet2}
                  onChange={e => setStaffMet2(e.target.value)}
                  placeholder="Staff member 2 (e.g. P. N. Mishra - Senior Test Engineer)"
                  className="flex-1 px-2 py-1 text-xs sm:text-sm bg-transparent border-b-2 border-dotted border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800 my-2"></div>

        {/* Core Section 1: Input (for Today's deptt.) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-400 inline-block"></span>
              <span>Input (for Today's deptt.)</span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {inputDept.length} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Raw materials, components, incoming drawings, parts, or assemblies received from previous department / vendor
          </p>
          <div className="relative">
            <textarea
              rows={4}
              value={inputDept}
              onChange={e => setInputDept(e.target.value)}
              placeholder="e.g. High-conductivity electrolytic copper strips, Kraft insulation paper rolls (0.05mm - 0.25mm), Nomex spacer strips, and core assembly dimensions drawings from Design division..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-sans"
            />
          </div>
        </div>

        {/* Core Section 2: Process (value added by this deptt.) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-400 inline-block"></span>
              <span>Process (value added by this deptt.)</span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {processValueAdded.length} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Specific manufacturing, assembly, winding, calibration, insulation wrapping, brazing, or testing procedures executed
          </p>
          <div className="relative">
            <textarea
              rows={5}
              value={processValueAdded}
              onChange={e => setProcessValueAdded(e.target.value)}
              placeholder="e.g. Executed continuous disc winding for 33kV High Voltage coil with 48 turns per section. Applied paper inter-turn insulation, fitted oil cooling ducts, completed lead brazing with silver alloy, and verified winding diameter with vernier calipers..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-sans"
            />
          </div>
        </div>

        {/* Core Section 3: Output (final output to next deptt.) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-400 inline-block"></span>
              <span>Output (final output to next deptt.)</span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {outputNextDept.length} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Final finished items, processed assemblies, tested components, or deliverables forwarded to the subsequent department
          </p>
          <div className="relative">
            <textarea
              rows={4}
              value={outputNextDept}
              onChange={e => setOutputNextDept(e.target.value)}
              placeholder="e.g. Completed HV and LV coil sets checked for resistance balance and dimensions, tagged with QR inspection card, and dispatched to Core-Coil Assembly and Vacuum Drying Oven bay..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-sans"
            />
          </div>
        </div>

        {/* Core Section 4: IS standard & Global standards (for this deptt's process) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-400 inline-block"></span>
              <span>IS standard & Global standards (for this deptt's process)</span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {standards.length} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Indian Standards (IS), IEC, IEEE, ISO, or corporate manufacturing and testing specifications adhered to
          </p>
          <div className="relative">
            <textarea
              rows={3}
              value={standards}
              onChange={e => setStandards(e.target.value)}
              placeholder="e.g. IS 2026 (Part 1 to 5) - Power Transformers specifications; IEC 60076; IS 11171; IEEE C57.12..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-sans"
            />
          </div>
          {/* Quick-fill chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick add:</span>
            {[
              'IS 2026 (Power Transformers)',
              'IS 11171 (Dry Type)',
              'IEC 60076',
              'IEEE C57.12',
              'IS 6792 (Insulating Oil)',
              'ISO 9001:2015'
            ].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => appendToField(standards, tag, setStandards)}
                className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Core Section 5: Safety standards (for this deptt's) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-400 inline-block"></span>
              <span>Safety standards (for this deptt's)</span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {safetyStandards.length} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Mandatory PPE, equipment safety protocols, hazardous material handling, LOTO, and safety precautions observed
          </p>
          <div className="relative">
            <textarea
              rows={3}
              value={safetyStandards}
              onChange={e => setSafetyStandards(e.target.value)}
              placeholder="e.g. Mandatory safety shoes with steel toe, safety helmet, cut-resistant gloves during conductor strip handling, face shield during lead brazing, emergency stop checks on winding machine..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-sans"
            />
          </div>
          {/* Quick-fill chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick add:</span>
            {[
              'Safety Shoes & Helmet',
              'Cut-Resistant Gloves',
              'LOTO (Lockout/Tagout)',
              'Brazing Face Shield & Goggles',
              'Crane Rigging Clearance'
            ].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => appendToField(safetyStandards, tag, setSafetyStandards)}
                className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Core Section 6: Chronic problems /challenges/bottlenecks (Exact 1, 2, 3 layout from PPT) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400 inline-block"></span>
              <span>Chronic problems /challenges/bottlenecks</span>
            </label>
            <span className="text-[11px] text-slate-400 italic">
              Numbered technical observations
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Document recurring defects, bottlenecks, machine calibration variations, or manufacturing delays observed
          </p>

          <div className="space-y-2.5">
            {/* Number 1 */}
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-2 shrink-0 w-5">
                1.
              </span>
              <input
                type="text"
                value={chronicProblem1}
                onChange={e => setChronicProblem1(e.target.value)}
                placeholder="e.g. Conductor tension fluctuation during high-speed disc winding causing edge paper wrinkling"
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border-b-2 border-dotted border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500 focus:bg-rose-50/10 font-sans"
              />
            </div>

            {/* Number 2 */}
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-2 shrink-0 w-5">
                2.
              </span>
              <input
                type="text"
                value={chronicProblem2}
                onChange={e => setChronicProblem2(e.target.value)}
                placeholder="e.g. Lead time delay in oven moisture extraction for thick pressboard barrier blocks"
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border-b-2 border-dotted border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500 focus:bg-rose-50/10 font-sans"
              />
            </div>

            {/* Number 3 */}
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-2 shrink-0 w-5">
                3.
              </span>
              <input
                type="text"
                value={chronicProblem3}
                onChange={e => setChronicProblem3(e.target.value)}
                placeholder="e.g. Slit edge micro-burrs on raw copper conductor requiring extra manual scraping before winding"
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/40 border-b-2 border-dotted border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500 focus:bg-rose-50/10 font-sans"
              />
            </div>
          </div>
        </div>

        {/* PPT Footnote: Note: if there is less space then you can use at the back of the page */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 italic font-serif">
              Note: if there is less space then you can use at the back of the page
            </p>
            <button
              type="button"
              onClick={() => setShowBackOfPage(!showBackOfPage)}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{showBackOfPage ? 'Hide back of page' : '+ Add back of the page notes'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBackOfPage ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showBackOfPage && (
            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Back of the Page / Extended Notes & Calculations
              </label>
              <textarea
                rows={4}
                value={backOfPageNotes}
                onChange={e => setBackOfPageNotes(e.target.value)}
                placeholder="Document any additional engineering sketches, mathematical formulas, winding turns calculations, test figures, or extended plant visit remarks..."
                className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-blue-600 font-sans"
              />
            </div>
          )}
        </div>
      </div>

      {/* Submit / Save Floating Action Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AutoSaveStatusBadge
            isSaving={isSaving}
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            secondsUntilNextSave={secondsUntilNextSave}
            onManualSave={() => saveDraft(true)}
            variant="blue"
          />
          <span className="hidden md:inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Ready to submit to HOD & Admin</span>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : isEditing ? 'Update & Submit Report' : 'Submit Daily Report'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={isEditing ? 'Update Daily Report?' : 'Submit Daily Report?'}
        message={`You are submitting the Daily Report for plant visit/training for ${date} in ${department}${subDepartment ? ` (${subDepartment})` : ''}. Once submitted, it will be marked as SUBMITTED and forwarded to ${nameOfHod || 'the Training Administrator'} for review.`}
        confirmText={isEditing ? 'Update Report' : 'Confirm & Submit'}
        cancelText="Review Changes"
        type="info"
        onConfirm={handleFinalSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Reset Fields Confirm Modal */}
      <ConfirmModal
        isOpen={showResetConfirmModal}
        title="Reset Daily Report Form?"
        message="Are you sure you want to clear all fields and auto-saved drafts for this daily report? All entered notes will be removed."
        confirmText="Reset Form"
        cancelText="Keep Editing"
        type="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirmModal(false)}
      />
    </div>
  );
};
