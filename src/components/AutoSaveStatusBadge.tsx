import React, { useState } from 'react';
import { Cloud, CloudCheck, Loader2, Info, Save } from 'lucide-react';

interface AutoSaveStatusBadgeProps {
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  secondsUntilNextSave: number;
  onManualSave?: () => void;
  variant?: 'blue' | 'purple';
  className?: string;
}

export const AutoSaveStatusBadge: React.FC<AutoSaveStatusBadgeProps> = ({
  isSaving,
  lastSaved,
  secondsUntilNextSave,
  onManualSave,
  variant = 'blue',
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatLastSavedTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const accentRing = variant === 'purple' ? 'border-purple-200 dark:border-purple-800' : 'border-blue-200 dark:border-blue-800';
  const textAccent = variant === 'purple' ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300';

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white/90 dark:bg-slate-800/90 text-xs shadow-2xs transition-all ${accentRing}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isSaving ? (
          <>
            <Loader2 className={`w-3.5 h-3.5 animate-spin ${textAccent}`} />
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
              Auto-saving...
            </span>
          </>
        ) : lastSaved ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Auto-saved
              </span>
              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                {formatLastSavedTime(lastSaved)}
              </span>
            </div>
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Auto-save: 30s interval
            </span>
          </>
        )}

        {/* 30s countdown pill */}
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium"
          title="Next auto-save countdown"
        >
          {secondsUntilNextSave}s
        </span>

        {onManualSave && (
          <button
            type="button"
            onClick={onManualSave}
            disabled={isSaving}
            className="p-1 -mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Save draft immediately now"
          >
            <Save className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Info popover tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-1 z-30 w-64 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl border border-slate-700 pointer-events-none">
          <div className="flex items-start gap-1.5 mb-1 font-semibold text-slate-200">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>Continuous Dual Auto-Save</span>
          </div>
          <p className="text-slate-300 text-[10px]">
            Your report draft is automatically saved to local storage and Firestore Cloud every 30 seconds. If your tab closes or computer reboots, your draft can be recovered instantly.
          </p>
          {lastSaved && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
