import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useUserDrafts } from '../hooks/useUserDrafts';
import { DraftSummaryItem, formatDraftTimeAgo } from '../utils/draftsUtils';
import { DailyReport, WeeklyReport } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  FileEdit,
  Clock,
  PlusCircle,
  CalendarPlus,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

interface UserDraftsViewProps {
  onNavigate: (view: string) => void;
  onEditReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
  onOpenReport?: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
}

export const UserDraftsView: React.FC<UserDraftsViewProps> = ({
  onNavigate,
  onEditReport
}) => {
  const { currentUser, addToast } = useApp();
  const {
    drafts,
    draftCount,
    dailyCount,
    weeklyCount,
    isRefreshing,
    refresh,
    discardDraftItem,
    discardAll
  } = useUserDrafts();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'LOCAL_AUTO_SAVE' | 'SAVED_DRAFT'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [discardingId, setDiscardingId] = useState<string | null>(null);
  const [draftToDiscard, setDraftToDiscard] = useState<DraftSummaryItem | null>(null);
  const [showDiscardAllModal, setShowDiscardAllModal] = useState(false);

  const filteredDrafts = useMemo(() => {
    let list = [...drafts];

    // Filter by type
    if (typeFilter !== 'ALL') {
      list = list.filter(d => d.type === typeFilter);
    }

    // Filter by source
    if (sourceFilter !== 'ALL') {
      list = list.filter(d => d.source === sourceFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => {
        return (
          d.title.toLowerCase().includes(q) ||
          d.previewText.toLowerCase().includes(q) ||
          d.workAreaOrDept.toLowerCase().includes(q) ||
          d.subtitle.toLowerCase().includes(q) ||
          (d.reportId && d.reportId.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      return sortBy === 'NEWEST' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return list;
  }, [drafts, typeFilter, sourceFilter, searchQuery, sortBy]);

  const handleResume = (item: DraftSummaryItem) => {
    onEditReport(item.reportObj, item.type);
  };

  const handleDiscardClick = (item: DraftSummaryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftToDiscard(item);
  };

  const handleConfirmDiscardItem = async () => {
    if (!draftToDiscard) return;
    setDiscardingId(draftToDiscard.id);
    await discardDraftItem(draftToDiscard);
    setDiscardingId(null);
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

  if (!currentUser) return null;

  return (
    <div id="user-drafts-view-container" className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60">
              <FileEdit className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Draft Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Work-in-progress daily logbooks and weekly reviews saved automatically or as drafts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-refresh-drafts"
            onClick={refresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors shadow-2xs"
            title="Refresh drafts from local storage and cloud"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          {drafts.length > 0 && (
            <button
              id="btn-discard-all-drafts"
              onClick={handleDiscardAllClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Discard All ({drafts.length})</span>
            </button>
          )}

          <button
            id="btn-drafts-new-daily"
            onClick={() => onNavigate('new-daily-report')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ New Daily</span>
          </button>

          <button
            id="btn-drafts-new-weekly"
            onClick={() => onNavigate('new-weekly-report')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>+ New Weekly</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Drafts</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{draftCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">active items</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Available for immediate continuation
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daily Log Drafts</span>
            <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{dailyCount}</span>
            <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">Daily modules</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Shop-floor observation drafts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Weekly Summary Drafts</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{weeklyCount}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Weekly reviews</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Departmental synthesis drafts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Auto-Save Protection</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">Continuous Active</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Saves on typing idle & every 30s
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-drafts"
            type="text"
            placeholder="Search topic, work area, or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs placeholder-slate-400"
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            id="select-draft-type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Report Types ({draftCount})</option>
            <option value="DAILY">Daily Reports ({dailyCount})</option>
            <option value="WEEKLY">Weekly Reports ({weeklyCount})</option>
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <select
            id="select-draft-source-filter"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Storage Sources</option>
            <option value="LOCAL_AUTO_SAVE">Auto-Saved Drafts</option>
            <option value="SAVED_DRAFT">Manually Saved Drafts</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <select
            id="select-draft-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
          >
            <option value="NEWEST">Sort: Most Recently Modified</option>
            <option value="OLDEST">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Drafts List / Grid */}
      {filteredDrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDrafts.map(item => {
            const isDaily = item.type === 'DAILY';
            const pct = Math.round((item.fieldsFilledCount / item.totalKeyFields) * 100);

            return (
              <div
                key={item.id}
                id={`draft-card-${item.id}`}
                onClick={() => handleResume(item)}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/80 p-5 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Badges + Timestamp */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                          isDaily
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-800/60'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60'
                        }`}
                      >
                        {isDaily ? (
                          <>
                            <FileText className="w-3 h-3" />
                            Daily Report
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3 h-3" />
                            Weekly Report
                          </>
                        )}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          item.source === 'LOCAL_AUTO_SAVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                        }`}
                      >
                        {item.source === 'LOCAL_AUTO_SAVE' ? 'Auto-Saved' : 'Draft Status'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDraftTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{item.subtitle}</span>
                    <span>•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.workAreaOrDept}</span>
                  </div>

                  {/* Content Preview Snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 italic bg-slate-50/80 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                    "{item.previewText}"
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Completion</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.fieldsFilledCount} of {item.totalKeyFields} sections filled ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(15, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {item.reportId ? `ID: ${item.reportId}` : 'Unsubmitted Form Entry'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-discard-draft-${item.id}`}
                      onClick={e => handleDiscardClick(item, e)}
                      disabled={discardingId === item.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Discard this draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-resume-draft-${item.id}`}
                      onClick={() => handleResume(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                    >
                      <span>Resume Draft</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/60">
            <FolderOpen className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery || typeFilter !== 'ALL' || sourceFilter !== 'ALL'
              ? 'No matching draft reports found'
              : 'No Draft Reports In Progress'}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
            {searchQuery || typeFilter !== 'ALL' || sourceFilter !== 'ALL'
              ? 'Try changing your search keywords or resetting your type filter.'
              : 'As you fill out daily logbooks or weekly reviews, your edits are automatically preserved here. You can safely close or switch tabs without losing your work.'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {searchQuery || typeFilter !== 'ALL' || sourceFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                  setSourceFilter('ALL');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            ) : (
              <>
                <button
                  id="btn-empty-start-daily"
                  onClick={() => onNavigate('new-daily-report')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Start Daily Report</span>
                </button>

                <button
                  id="btn-empty-start-weekly"
                  onClick={() => onNavigate('new-weekly-report')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>+ Start Weekly Report</span>
                </button>

                <button
                  id="btn-empty-view-submitted"
                  onClick={() => onNavigate('my-reports')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>View Submitted Reports</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
        message={`Are you sure you want to permanently discard all ${drafts.length} draft reports? This will remove all local and cloud-synced in-progress reports.`}
        confirmText="Discard All Drafts"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDiscardAll}
        onCancel={() => setShowDiscardAllModal(false)}
      />
    </div>
  );
};
