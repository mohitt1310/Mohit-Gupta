import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useUserDrafts } from '../hooks/useUserDrafts';
import { DraftSummaryItem, formatDraftTimeAgo } from '../utils/draftsUtils';
import { DailyReport, WeeklyReport } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  FileEdit,
  Clock,
  ArrowRight,
  Trash2,
  Calendar,
  CalendarPlus,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';

export type { DraftSummaryItem };

interface UserDraftsSectionProps {
  onNavigate: (view: string) => void;
  onEditReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
}

export const UserDraftsSection: React.FC<UserDraftsSectionProps> = ({
  onNavigate,
  onEditReport
}) => {
  const { currentUser } = useApp();
  const {
    drafts,
    isRefreshing,
    refresh,
    discardDraftItem,
    discardAll
  } = useUserDrafts();

  const [draftToDiscard, setDraftToDiscard] = useState<DraftSummaryItem | null>(null);
  const [showDiscardAllModal, setShowDiscardAllModal] = useState(false);

  if (!currentUser) return null;

  const handleResume = (item: DraftSummaryItem) => {
    if (item.reportObj) {
      onEditReport(item.reportObj, item.type);
    } else {
      onNavigate(item.type === 'DAILY' ? 'new-daily-report' : 'new-weekly-report');
    }
  };

  const handleDiscardClick = (item: DraftSummaryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftToDiscard(item);
  };

  const handleConfirmDiscardItem = async () => {
    if (!draftToDiscard) return;
    await discardDraftItem(draftToDiscard);
    setDraftToDiscard(null);
  };

  const handleDiscardAllClick = () => {
    if (drafts.length === 0) return;
    setShowDiscardAllModal(true);
  };

  const handleConfirmDiscardAll = async () => {
    await discardAll();
    setShowDiscardAllModal(false);
  };

  // If no drafts exist, render a clean, compact reassurance card so trainees know auto-saving is active
  if (drafts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Report Drafts & Auto-Save
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                No drafts currently in progress. As you type in any report form, your progress is automatically saved every 30 seconds to prevent data loss.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => onNavigate('new-daily-report')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              + Daily Report
            </button>
            <button
              onClick={() => onNavigate('new-weekly-report')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
            >
              + Weekly Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="user-dashboard-drafts-section"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 shadow-xs overflow-hidden"
    >
      {/* Drafts Section Header */}
      <div className="px-5 py-4 sm:px-6 bg-gradient-to-r from-amber-50/70 via-amber-50/30 to-transparent dark:from-amber-950/30 dark:via-transparent dark:to-transparent border-b border-amber-100 dark:border-amber-900/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-2xs">
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Drafts in Progress
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Auto-saved in real-time so you never lose progress. Click any card to resume editing immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-view-all-drafts-top"
            onClick={() => onNavigate('draft-reports')}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open Drafts View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Refresh drafts"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {drafts.length > 1 && (
            <button
              onClick={handleDiscardAllClick}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              Clear All Drafts
            </button>
          )}
        </div>
      </div>

      {/* Drafts Cards Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {drafts.map(item => {
          const isDaily = item.type === 'DAILY';
          const completionRatio = Math.round((item.fieldsFilledCount / item.totalKeyFields) * 100);

          return (
            <div
              key={item.id}
              id={`draft-card-${item.id}`}
              onClick={() => handleResume(item)}
              className="group relative bg-slate-50/70 hover:bg-blue-50/30 dark:bg-slate-800/60 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/80 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-700/60 p-4 transition-all duration-150 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Top Card Bar */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isDaily
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                      }`}
                    >
                      {isDaily ? <Calendar className="w-2.5 h-2.5" /> : <CalendarPlus className="w-2.5 h-2.5" />}
                      <span>{isDaily ? 'DAILY REPORT DRAFT' : 'WEEKLY REPORT DRAFT'}</span>
                    </span>

                    {item.source === 'LOCAL_AUTO_SAVE' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Auto-Saved</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDraftTimeAgo(item.timestamp)}</span>
                    </span>

                    <button
                      type="button"
                      title="Discard this draft"
                      onClick={e => handleDiscardClick(item, e)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Draft Title & Meta */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.subtitle}</span>
                  <span>•</span>
                  <span className="truncate max-w-[180px]">{item.workAreaOrDept}</span>
                  {item.reportId && item.reportId !== 'new' && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        {item.reportId}
                      </span>
                    </>
                  )}
                </div>

                {/* Draft Content Snippet */}
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  "{item.previewText}"
                </p>
              </div>

              {/* Card Footer with Progress & Resume Action */}
              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(15, completionRatio)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {item.fieldsFilledCount} of {item.totalKeyFields} fields
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Resume Draft</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Discard Single Item Modal */}
      <ConfirmModal
        isOpen={Boolean(draftToDiscard)}
        title="Discard Draft Report?"
        message={draftToDiscard ? `Are you sure you want to discard the ${draftToDiscard.type === 'DAILY' ? 'Daily' : 'Weekly'} draft "${draftToDiscard.title}"? Any unsaved edits will be permanently deleted.` : ''}
        confirmText="Discard Draft"
        cancelText="Keep Draft"
        type="danger"
        onConfirm={handleConfirmDiscardItem}
        onCancel={() => setDraftToDiscard(null)}
      />

      {/* Discard All Modal */}
      <ConfirmModal
        isOpen={showDiscardAllModal}
        title="Discard All Draft Reports?"
        message={`Are you sure you want to discard all ${drafts.length} draft reports? This will remove all local and cloud-synced in-progress reports.`}
        confirmText="Discard All Drafts"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDiscardAll}
        onCancel={() => setShowDiscardAllModal(false)}
      />
    </div>
  );
};
