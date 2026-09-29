import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  PlusCircle,
  CalendarPlus,
  Users,
  Award,
  FileSpreadsheet,
  UserCheck,
  LogOut,
  X,
  Clock,
  ShieldCheck,
  Keyboard,
  Sun,
  Moon,
  Search,
  FileEdit
} from 'lucide-react';
import { useUserDrafts } from '../hooks/useUserDrafts';

interface SidebarProps {
  activeView?: string;
  currentView?: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  currentView,
  onNavigate,
  isOpen,
  onClose,
  onOpenShortcuts,
}) => {
  const { currentUser, logout, dailyReports, weeklyReports, theme, toggleTheme, openSearch } = useApp();
  const effectiveActiveView = activeView || currentView || '';

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN';

  const { draftCount } = useUserDrafts();

  // Count pending reports for admin badges
  const pendingDaily = dailyReports.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER REVIEW').length;
  const pendingWeekly = weeklyReports.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER REVIEW').length;

  const handleNav = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex flex-col border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center">
            <span className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">
              {isAdmin ? 'Administrator Portal' : 'Trainee Workstation'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Pill */}
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser.employeeId}</div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                isAdmin
                  ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700/50'
                  : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700/50'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Global Search Button */}
          <div className="pb-3">
            <button
              id="btn-sidebar-global-search"
              onClick={() => {
                onClose();
                openSearch();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100/80 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:hover:text-white border border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs group"
              title={`Global Report Search (${modKey}+F)`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                <span>Quick Search...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
                {modKey}+F
              </kbd>
            </button>
          </div>

          {isAdmin ? (
            <>
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Administration
              </div>
              <button
                id="nav-admin-dashboard"
                onClick={() => handleNav('admin-dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'admin-dashboard'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Admin Dashboard</span>
                </div>
              </button>

              <button
                id="nav-admin-daily"
                onClick={() => handleNav('admin-daily')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'admin-daily'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>All Daily Reports</span>
                </div>
                {pendingDaily > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500 dark:text-slate-950">
                    {pendingDaily}
                  </span>
                )}
              </button>

              <button
                id="nav-admin-weekly"
                onClick={() => handleNav('admin-weekly')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'admin-weekly'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>All Weekly Reports</span>
                </div>
                {pendingWeekly > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500 dark:text-slate-950">
                    {pendingWeekly}
                  </span>
                )}
              </button>

              <button
                id="nav-admin-compliance"
                onClick={() => handleNav('admin-compliance')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'admin-compliance'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Report Compliance</span>
                </div>
              </button>

              <button
                id="nav-admin-productivity"
                onClick={() => handleNav('admin-productivity')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'admin-productivity'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Daily Productivity Hours</span>
                </div>
              </button>

              <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Management & Settings
              </div>

              <button
                id="nav-admin-users"
                onClick={() => handleNav('admin-users')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'admin-users'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Manage Users</span>
                </div>
              </button>

              <button
                id="nav-admin-sheets"
                onClick={() => handleNav('admin-sheets')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'admin-sheets'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>Google Sheets Setup</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Sync
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Trainee Workstation
              </div>

              <button
                id="nav-user-dashboard"
                onClick={() => handleNav('user-dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'user-dashboard'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>My Dashboard</span>
                </div>
              </button>

              <button
                id="nav-new-daily"
                onClick={() => handleNav('new-daily-report')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'new-daily-report'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>Submit Daily Report</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700/80">
                  {modKey}+D
                </kbd>
              </button>

              <button
                id="nav-new-weekly"
                onClick={() => handleNav('new-weekly-report')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'new-weekly-report'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarPlus className="w-4 h-4 shrink-0" />
                  <span>Submit Weekly Report</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700/80">
                  {modKey}+W
                </kbd>
              </button>

              <button
                id="nav-user-drafts"
                onClick={() => handleNav('draft-reports')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'draft-reports'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileEdit className="w-4 h-4 shrink-0" />
                  <span>Draft Reports</span>
                </div>
                {draftCount > 0 && (
                  <span
                    id="badge-drafts-count"
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                      effectiveActiveView === 'draft-reports'
                        ? 'bg-white text-blue-700'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}
                  >
                    {draftCount}
                  </span>
                )}
              </button>

              <button
                id="nav-my-reports"
                onClick={() => handleNav('my-reports')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  effectiveActiveView === 'my-reports'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>My Submitted Reports</span>
                </div>
              </button>
            </>
          )}

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Account & System
          </div>

          <button
            id="nav-profile"
            onClick={() => handleNav('profile')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              effectiveActiveView === 'profile'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Profile & Password</span>
            </div>
          </button>

          {onOpenShortcuts && (
            <button
              id="nav-shortcuts-sidebar"
              onClick={() => {
                onClose();
                onOpenShortcuts();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Keyboard Shortcuts</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700/80">
                ?
              </kbd>
            </button>
          )}
        </nav>

        {/* Footer Theme Switcher & Logout */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <button
            id="btn-sidebar-theme-toggle"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
              {theme}
            </span>
          </button>

          <button
            id="btn-sidebar-logout"
            onClick={() => {
              logout();
              onClose();
              onNavigate('login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-200 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
