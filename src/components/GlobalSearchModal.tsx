import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport, WeeklyReport, ReportStatus, GlobalSearchResult } from '../types';
import {
  Search,
  X,
  FileText,
  CalendarDays,
  User,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  CornerDownLeft,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Building2,
  SlidersHorizontal,
  Eye,
  Edit3
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
  onEditReport?: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
}

// Highlight matched substring safely
const HighlightSnippet: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim() || !text) {
    return <span>{text}</span>;
  }

  const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200 dark:bg-amber-900/70 text-amber-950 dark:text-amber-200 px-0.5 rounded font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectReport,
  onEditReport,
}) => {
  const {
    currentUser,
    users,
    searchReports,
    searchQuery,
    setSearchQuery,
    searchFilters,
    setSearchFilters,
  } = useApp();

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Quick preset search terms for engineering trainees & plant supervisors
  const quickSearchKeywords = [
    'Substation',
    'VFD',
    'Relay Testing',
    'LOTO',
    'Omicron',
    'SCADA',
    'PLC',
    'Safety',
    'Turbine',
  ];

  // Auto-focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Compute search results instantly from AppContext
  const results: GlobalSearchResult[] = useMemo(() => {
    if (!isOpen) return [];
    return searchReports(searchFilters);
  }, [isOpen, searchReports, searchFilters]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex(prev => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        const item = results[selectedIndex];
        onSelectReport(item.report, item.type);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleKeywordChange = (val: string) => {
    setSearchQuery(val);
    setSearchFilters(prev => ({ ...prev, keyword: val }));
    setSelectedIndex(0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchFilters({
      keyword: '',
      date: '',
      traineeId: 'ALL',
      traineeName: '',
      reportType: 'ALL',
      status: 'ALL',
      scope: 'ALL',
    });
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const hasActiveFilters =
    Boolean(searchFilters.keyword) ||
    Boolean(searchFilters.date) ||
    (searchFilters.traineeId && searchFilters.traineeId !== 'ALL') ||
    Boolean(searchFilters.traineeName) ||
    (searchFilters.reportType && searchFilters.reportType !== 'ALL') ||
    (searchFilters.status && searchFilters.status !== 'ALL') ||
    (searchFilters.scope && searchFilters.scope !== 'ALL');

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Reviewed
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            Submitted
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Draft
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-2 sm:p-4 pt-12 sm:pt-4 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 max-w-3xl w-full flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-title"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              id="input-global-search"
              type="text"
              value={searchQuery}
              onChange={e => handleKeywordChange(e.target.value)}
              placeholder="Search reports by keyword, activity, date, or trainee name..."
              className="w-full pl-11 pr-24 py-3 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleKeywordChange('')}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                  title="Clear keyword"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-mono font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
                {modKey}+F
              </kbd>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Filter Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-xs">
            {/* Type selector tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <button
                id="btn-filter-type-all"
                type="button"
                onClick={() => setSearchFilters(prev => ({ ...prev, reportType: 'ALL' }))}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  (searchFilters.reportType || 'ALL') === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Reports
              </button>
              <button
                id="btn-filter-type-daily"
                type="button"
                onClick={() => setSearchFilters(prev => ({ ...prev, reportType: 'DAILY' }))}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  searchFilters.reportType === 'DAILY'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                Daily
              </button>
              <button
                id="btn-filter-type-weekly"
                type="button"
                onClick={() => setSearchFilters(prev => ({ ...prev, reportType: 'WEEKLY' }))}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  searchFilters.reportType === 'WEEKLY'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3 h-3" />
                Weekly
              </button>
            </div>

            {/* Filter Toggle & Clear Filters Button */}
            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-advanced-filters"
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  showFilters || searchFilters.date || searchFilters.traineeName || (searchFilters.status && searchFilters.status !== 'ALL')
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {(searchFilters.date || searchFilters.traineeName || (searchFilters.status && searchFilters.status !== 'ALL')) && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {hasActiveFilters && (
                <button
                  id="btn-clear-all-filters"
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                  title="Reset all search criteria"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters: Date, Trainee Name, and Status */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in slide-in-from-top-2 duration-150">
              {/* Date Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Filter by Date / Month
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    id="filter-date-input"
                    type="text"
                    value={searchFilters.date || ''}
                    onChange={e => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="YYYY-MM-DD or 2026-09"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Trainee Name / Employee ID */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Trainee Name / Emp ID
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    id="filter-trainee-name-input"
                    type="text"
                    value={searchFilters.traineeName || ''}
                    onChange={e => setSearchFilters(prev => ({ ...prev, traineeName: e.target.value }))}
                    placeholder="e.g. Aarav, Priya, GET-2026"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Report Status
                </label>
                <select
                  id="filter-status-select"
                  value={searchFilters.status || 'ALL'}
                  onChange={e => setSearchFilters(prev => ({ ...prev, status: e.target.value as ReportStatus | 'ALL' }))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>
          )}

          {/* Quick Keyword Pills if no keyword entered yet */}
          {!searchQuery && (
            <div className="flex items-center gap-1.5 mt-3 pt-1 overflow-x-auto text-[11px] text-slate-500 dark:text-slate-400 no-scrollbar">
              <span className="shrink-0 flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Popular:
              </span>
              {quickSearchKeywords.map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleKeywordChange(term)}
                  className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Results Area */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/80"
        >
          {/* Result Count Header */}
          <div className="pb-1 px-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{results.length}</strong> matching report
              {results.length === 1 ? '' : 's'}
            </span>
            {results.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                Use <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono">↑</kbd> <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono">↓</kbd> to navigate, <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono">Enter</kbd> to view
              </span>
            )}
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="pt-2 space-y-2">
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isDaily = item.type === 'DAILY';

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    data-index={index}
                    onClick={() => {
                      onSelectReport(item.report, item.type);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group cursor-pointer rounded-xl p-3 sm:p-3.5 border transition-all text-left relative ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/80 shadow-xs'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Top line: ID, Type, Date, Trainee, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            isDaily
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {isDaily ? <FileText className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
                          {item.id}
                        </span>

                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <HighlightSnippet text={item.userName} highlight={searchFilters.traineeName || searchQuery} />
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            ({item.employeeId})
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <HighlightSnippet text={item.dateStr} highlight={searchFilters.date || searchQuery} />
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Main Title / Topic */}
                    <div className="mt-1.5 font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      <HighlightSnippet text={item.title} highlight={searchQuery} />
                    </div>

                    {/* Department / Work Area info */}
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        <HighlightSnippet text={item.workAreaOrDept} highlight={searchQuery} />
                        <span className="text-slate-400 dark:text-slate-500 ml-1.5">
                          • {item.department}
                        </span>
                      </span>
                    </div>

                    {/* Matched Snippets highlight preview */}
                    {item.matchedFields.length > 0 && (
                      <div className="mt-2 space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        {item.matchedFields.slice(0, 2).map((mf, i) => (
                          <div key={i} className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                              {mf.label}:
                            </span>
                            <span className="italic text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                              "<HighlightSnippet text={mf.snippet} highlight={searchQuery} />"
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hover Actions */}
                    <div className="mt-2.5 flex items-center justify-end gap-2 text-xs">
                      {onEditReport && (currentUser?.role === 'ADMIN' || item.report.userId === currentUser?.id) && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onEditReport(item.report, item.type);
                            onClose();
                          }}
                          className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit this report"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onSelectReport(item.report, item.type);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Document</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No matching reports found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                We couldn't find any daily or weekly reports matching your current search terms, dates, or trainee filters.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Search & Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                <CornerDownLeft className="w-2.5 h-2.5 inline" /> Enter
              </kbd>
              <span>Open Document</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                Esc
              </kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="hidden sm:block text-[11px] font-medium text-slate-400">
            Training Report Management System • Global Archive Search
          </div>
        </div>
      </div>
    </div>
  );
};
