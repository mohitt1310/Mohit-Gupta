import React, { useEffect } from 'react';
import { FileText, CalendarDays, PlusCircle, ArrowRight, X } from 'lucide-react';

interface QuickNewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (type: 'DAILY' | 'WEEKLY') => void;
}

export const QuickNewReportModal: React.FC<QuickNewReportModalProps> = ({
  isOpen,
  onClose,
  onSelectReport,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onSelectReport('DAILY');
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        onSelectReport('WEEKLY');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelectReport('DAILY'); // Default selection
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectReport]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-report-title"
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {modKey}+N
              </span>
              <h2 id="quick-report-title" className="text-base font-bold text-slate-900 dark:text-white">
                Create Technical Training Report
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select which report module you want to prepare and submit.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Daily Report Option */}
          <button
            id="btn-quick-select-daily"
            onClick={() => onSelectReport('DAILY')}
            className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all group relative flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Daily Training Report
                </span>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                    {modKey}+D
                  </kbd>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                    Press D / Enter
                  </kbd>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Log today's plant work area, technical tasks executed, engineering learnings, equipment used, and safety observations.
              </p>
            </div>
          </button>

          {/* Weekly Report Option */}
          <button
            id="btn-quick-select-weekly"
            onClick={() => onSelectReport('WEEKLY')}
            className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group relative flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Weekly Synthesis Report
                </span>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                    {modKey}+W
                  </kbd>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                    Press W
                  </kbd>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Consolidate Monday-to-Saturday daily training hours, acquired industrial competencies, challenges faced, and next week's action plan.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <span>Press</span>
            <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300">Esc</kbd>
            <span>to cancel</span>
          </span>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Submit with <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300">{modKey}+S</kbd> anytime
          </span>
        </div>
      </div>
    </div>
  );
};
