import React, { useEffect } from 'react';
import { Keyboard, X, Sparkles, Check } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Report Creation & Navigation',
      items: [
        {
          keys: [modKey, 'F'],
          label: 'Global Report Search',
          desc: 'Quickly find reports by keyword, date, or trainee name across all archives',
          highlight: true,
        },
        {
          keys: [modKey, 'D'],
          label: 'New Daily Report',
          desc: 'Immediately opens the Daily Training Report creation form',
          highlight: true,
        },
        {
          keys: [modKey, 'W'],
          label: 'New Weekly Report',
          desc: 'Immediately opens the Weekly Synthesis Report creation form',
          highlight: true,
        },
        {
          keys: [modKey, 'N'],
          label: 'New Report Launcher',
          desc: 'Opens the quick selector dialog to choose Daily or Weekly report',
          highlight: true,
        },
        {
          keys: [modKey, 'H'],
          label: 'Go to Dashboard',
          desc: 'Navigates back to the primary Trainee or Admin Dashboard',
          highlight: false,
        },
      ],
    },
    {
      category: 'Report Form Actions',
      items: [
        {
          keys: [modKey, 'S'],
          label: 'Submit Report',
          desc: 'Validates and submits the active Daily or Weekly report form',
          highlight: true,
        },
        {
          keys: [modKey, 'Shift', 'S'],
          label: 'Save as Draft',
          desc: 'Saves current report progress as a draft without formal submission',
          highlight: false,
        },
        {
          keys: ['Enter'],
          label: 'Confirm Modal Action',
          desc: 'Confirms submission in the review & approval prompt dialog',
          highlight: false,
        },
      ],
    },
    {
      category: 'Interface & Dialogs',
      items: [
        {
          keys: ['?'],
          label: 'Toggle Shortcuts Help',
          desc: 'Displays or hides this keyboard shortcuts reference dialog',
          highlight: false,
        },
        {
          keys: [modKey, 'Shift', 'L'],
          label: 'Toggle Dark / Light Mode',
          desc: 'Switches between light and dark visual themes',
          highlight: true,
        },
        {
          keys: ['Esc'],
          label: 'Close Active Modal',
          desc: 'Dismisses open dialogs, detail modals, or cancels confirmation',
          highlight: false,
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 max-w-xl w-full p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="shortcuts-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Global Keyboard Shortcuts
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Speed up technical reporting workflows with global keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {shortcutGroups.map(group => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map(item => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      item.highlight
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <span>{item.label}</span>
                        {item.highlight && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map(k => (
                        <kbd
                          key={k}
                          className="px-2 py-1 min-w-[24px] text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300">
              ?
            </kbd>
            <span>anytime to view this guide</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-xs text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
