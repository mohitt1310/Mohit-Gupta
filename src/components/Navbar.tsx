import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UttamLogo } from './UttamLogo';
import {
  Bell,
  Menu,
  Shield,
  UserCheck,
  LogOut,
  ChevronDown,
  FileSpreadsheet,
  CheckCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Keyboard,
  PlusCircle,
  Sun,
  Moon,
  Search,
  Radio,
  FileEdit
} from 'lucide-react';
import { useUserDrafts } from '../hooks/useUserDrafts';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onMenuClick?: () => void;
  onNavigate: (view: string) => void;
  onOpenShortcuts?: () => void;
  onOpenQuickNew?: () => void;
  onOpenSearch?: () => void;
  activeView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onMenuClick,
  onNavigate,
  onOpenShortcuts,
  onOpenQuickNew,
  onOpenSearch,
  activeView
}) => {
  const toggleMenu = onToggleSidebar || onMenuClick || (() => {});
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const {
    currentUser,
    users,
    logout,
    switchUser,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    googleAppsScriptUrl,
    syncLogs,
    theme,
    toggleTheme,
    openSearch
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { draftCount } = useUserDrafts();

  if (!currentUser) return null;

  // Filter notifications for this user or admin
  const userNotifications = notifications.filter(
    n => n.userId === currentUser.id || (currentUser.role === 'ADMIN' && (n.userId === 'ADMIN' || n.userId === currentUser.id))
  );
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleUserSwitch = (userId: string) => {
    switchUser(userId);
    setShowUserMenu(false);
    // switch to dashboard view suitable for role
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'ADMIN') {
      onNavigate('admin-dashboard');
    } else {
      onNavigate('user-dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-sm transition-colors duration-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar"
            onClick={toggleMenu}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center">
              <UttamLogo className="h-7 sm:h-8 text-slate-900 dark:text-white" showSubtitle={false} />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 text-xs sm:text-sm leading-tight">
                <span>Training Report Management</span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  v2.6
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                GET & DET Technical Training Program
              </div>
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle, Sync status, Notifications, Shortcuts, User Profile & Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global Search Button (Ctrl+F) */}
          <button
            id="btn-navbar-global-search"
            onClick={onOpenSearch || openSearch}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs group"
            title={`Search reports by keyword, date, trainee (${modKey}+F)`}
            aria-label={`Search reports (${modKey}+F)`}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
              {modKey}+F
            </kbd>
          </button>

          {/* Quick New Report Button for Trainees */}
          {currentUser.role === 'TRAINEE' && (
            <button
              id="btn-navbar-quick-new"
              onClick={onOpenQuickNew || (() => onNavigate('new-daily-report'))}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              title={`Create New Report (${modKey}+N)`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Report</span>
              <kbd className="px-1 py-0.2 text-[9px] font-mono bg-blue-800 dark:bg-blue-700 text-blue-100 rounded border border-blue-600/70">
                {modKey}+N
              </kbd>
            </button>
          )}

          {/* Theme Toggle Button (Light/Dark mode) */}
          <button
            id="btn-navbar-theme-toggle"
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center group relative"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:-rotate-12 transition-transform" />
            )}
            <span className="sr-only">Toggle Theme</span>
          </button>

          {/* Keyboard Shortcuts Trigger Button */}
          <button
            id="btn-navbar-shortcuts"
            onClick={onOpenShortcuts}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
              ?
            </kbd>
          </button>

          {/* Google Sheets Sync Pill */}
          <button
            id="btn-sync-status-indicator"
            onClick={() => currentUser.role === 'ADMIN' ? onNavigate('admin-sheets') : null}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              googleAppsScriptUrl
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={
              googleAppsScriptUrl
                ? 'Google Sheets Live Sync Connected'
                : 'Google Sheets sync in Local Queue mode. Admin can configure Web App URL.'
            }
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{googleAppsScriptUrl ? 'Sheets Synced' : 'Sheets: Local'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${googleAppsScriptUrl ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          </button>

          {/* In-App Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-navbar-notifications"
              onClick={() => setShowNotifications(prev => !prev)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                id="panel-notifications-dropdown"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {userNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No notifications at this time.
                    </div>
                  ) : (
                    userNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.reportId) {
                            if (currentUser.role === 'ADMIN') {
                              onNavigate(n.reportType === 'WEEKLY' ? 'admin-weekly' : 'admin-daily');
                            } else {
                              onNavigate('my-reports');
                            }
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                          !n.read ? 'bg-blue-50/40 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.type === 'SUCCESS' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                          {n.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                          {n.type === 'INFO' && <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                          {n.type === 'ERROR' && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                            <span>{n.title}</span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
                            {n.message}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Role Switcher Menu */}
          <div className="relative">
            <button
              id="btn-navbar-user-menu"
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-semibold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                      : (currentUser.role === 'DET' || (currentUser.role === 'USER' && (currentUser.designation?.toUpperCase().includes('DET') || currentUser.employeeId?.toUpperCase().startsWith('DET'))))
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                  }`}>
                    {currentUser.role === 'ADMIN'
                      ? 'ADMIN'
                      : (currentUser.role === 'DET' || (currentUser.role === 'USER' && (currentUser.designation?.toUpperCase().includes('DET') || currentUser.employeeId?.toUpperCase().startsWith('DET'))))
                      ? 'DET'
                      : 'GET'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {currentUser.employeeId}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </button>

            {showUserMenu && (
              <div
                id="panel-user-dropdown"
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2"
              >
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Signed in as</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">{currentUser.department}</div>
                </div>

                {/* Theme Toggle within Menu */}
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={toggleTheme}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                      <span>Mode</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {theme}
                    </span>
                  </button>
                </div>

                {/* Quick Role / User Switcher */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Demo Role Switcher
                  </div>
                  <div className="space-y-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleUserSwitch(u.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{u.employeeId} • {u.designation.split('(')[0]}</div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ml-1 ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            : (u.role === 'DET' || (u.role === 'USER' && (u.designation?.toUpperCase().includes('DET') || u.employeeId?.toUpperCase().startsWith('DET'))))
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        }`}>
                          {u.role === 'ADMIN'
                            ? 'ADMIN'
                            : (u.role === 'DET' || (u.role === 'USER' && (u.designation?.toUpperCase().includes('DET') || u.employeeId?.toUpperCase().startsWith('DET'))))
                            ? 'DET'
                            : 'GET'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {currentUser.role !== 'ADMIN' && (
                  <div className="px-1 py-1 border-b border-slate-100 dark:border-slate-800">
                    <button
                      id="navbar-menu-draft-reports"
                      onClick={() => {
                        onNavigate('draft-reports');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileEdit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">Draft Reports</span>
                      </div>
                      {draftCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {draftCount}
                        </span>
                      )}
                    </button>
                    <button
                      id="navbar-menu-my-reports"
                      onClick={() => {
                        onNavigate('my-reports');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>My Submitted Reports</span>
                    </button>
                  </div>
                )}

                <div className="px-1 pt-1">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    My Profile & Password
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      onNavigate('login');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
