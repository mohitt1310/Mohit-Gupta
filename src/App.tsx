import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DailyReport, WeeklyReport } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ReportDetailModal } from './components/ReportDetailModal';
import { QuickNewReportModal } from './components/QuickNewReportModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ToastContainer } from './components/ToastContainer';

// Views
import { LoginView } from './views/LoginView';
import { UserDashboardView } from './views/UserDashboardView';
import { DailyReportFormView } from './views/DailyReportFormView';
import { WeeklyReportFormView } from './views/WeeklyReportFormView';
import { MyReportsView } from './views/MyReportsView';
import { UserDraftsView } from './views/UserDraftsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminDailyReportsView } from './views/AdminDailyReportsView';
import { AdminWeeklyReportsView } from './views/AdminWeeklyReportsView';
import { AdminComplianceView } from './views/AdminComplianceView';
import { AdminProductivityView } from './views/AdminProductivityView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminSheetsIntegrationView } from './views/AdminSheetsIntegrationView';
import { ProfileView } from './views/ProfileView';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    logout,
    addToast,
    theme,
    toggleTheme,
    isSearchOpen,
    openSearch,
    closeSearch
  } = useApp();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Modal detail view state
  const [modalReport, setModalReport] = useState<DailyReport | WeeklyReport | null>(null);
  const [modalReportType, setModalReportType] = useState<'DAILY' | 'WEEKLY'>('DAILY');

  // Edit report state
  const [editingDailyReport, setEditingDailyReport] = useState<DailyReport | null>(null);
  const [editingWeeklyReport, setEditingWeeklyReport] = useState<WeeklyReport | null>(null);

  // Shortcuts & quick action modals
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [quickNewModalOpen, setQuickNewModalOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();

      // Check if user is actively focusing an input / textarea / select / editable
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Handle ESC key for closing modals
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          closeSearch();
          return;
        }
        if (quickNewModalOpen) {
          setQuickNewModalOpen(false);
          return;
        }
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (modalReport) {
          setModalReport(null);
          return;
        }
      }

      // Shortcut: '?' to toggle keyboard shortcuts cheatsheet (only when not typing in text field)
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setShortcutsModalOpen(prev => !prev);
        return;
      }

      // Global shortcuts with Ctrl / Cmd modifier
      if (isModifier) {
        // Ctrl+F or Ctrl+K: Global Search
        if (keyLower === 'f' || keyLower === 'k') {
          e.preventDefault();
          openSearch();
          return;
        }

        // Ctrl+D: Submit / New Daily Report
        if (keyLower === 'd') {
          e.preventDefault();
          setEditingDailyReport(null);
          setCurrentView('new-daily-report');
          setQuickNewModalOpen(false);
          setShortcutsModalOpen(false);
          setModalReport(null);
          setSidebarOpen(false);
          addToast('info', 'Opened Daily Report form (Ctrl+D)');
          return;
        }

        // Ctrl+W: Submit / New Weekly Report
        if (keyLower === 'w') {
          e.preventDefault();
          setEditingWeeklyReport(null);
          setCurrentView('new-weekly-report');
          setQuickNewModalOpen(false);
          setShortcutsModalOpen(false);
          setModalReport(null);
          setSidebarOpen(false);
          addToast('info', 'Opened Weekly Report form (Ctrl+W)');
          return;
        }

        // Ctrl+N: Quick New Report Selector Modal
        if (keyLower === 'n') {
          e.preventDefault();
          setQuickNewModalOpen(true);
          return;
        }

        // Ctrl+H: Return to Dashboard (Home)
        if (keyLower === 'h') {
          e.preventDefault();
          handleNavigate('dashboard');
          setQuickNewModalOpen(false);
          setShortcutsModalOpen(false);
          setModalReport(null);
          return;
        }

        // Ctrl+Shift+L: Toggle Light / Dark Theme
        if (e.shiftKey && keyLower === 'l') {
          e.preventDefault();
          toggleTheme();
          addToast('info', `Switched theme`);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [quickNewModalOpen, shortcutsModalOpen, modalReport, isSearchOpen, openSearch, closeSearch, addToast, toggleTheme]);

  // If not logged in, show Login view
  if (!currentUser) {
    return (
      <>
        <LoginView
          onSuccess={role => {
            if (role === 'ADMIN') {
              setCurrentView('admin-dashboard');
            } else {
              setCurrentView('user-dashboard');
            }
            const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'DET' ? 'Diploma Engineer Trainee (DET)' : 'Graduate Engineer Trainee (GET)';
            addToast('success', `Signed in as ${roleLabel}`);
          }}
        />
        <ToastContainer />
      </>
    );
  }

  // Active view normalization
  const effectiveView = (() => {
    if (currentView === 'dashboard') {
      return currentUser.role === 'ADMIN' ? 'admin-dashboard' : 'user-dashboard';
    }
    // Guard against users navigating to admin views
    if (currentUser.role !== 'ADMIN' && currentView.startsWith('admin-')) {
      return 'user-dashboard';
    }
    return currentView;
  })();

  const handleNavigate = (view: string) => {
    if (view === 'new-daily-report') {
      setEditingDailyReport(null);
    }
    if (view === 'new-weekly-report') {
      setEditingWeeklyReport(null);
    }
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const handleOpenReportModal = (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => {
    setModalReport(report);
    setModalReportType(type);
  };

  const handleEditReport = (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => {
    if (type === 'DAILY') {
      setEditingDailyReport(report as DailyReport);
      setCurrentView('new-daily-report');
    } else {
      setEditingWeeklyReport(report as WeeklyReport);
      setCurrentView('new-weekly-report');
    }
  };

  const handleReportSubmitted = (reportId: string) => {
    addToast('success', `Report ${reportId} processed successfully!`);
    if (currentUser.role === 'ADMIN') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('my-reports');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased text-slate-800 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-150">
      {/* Top Fixed Header */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={handleNavigate}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onOpenQuickNew={() => setQuickNewModalOpen(true)}
        onOpenSearch={openSearch}
        activeView={effectiveView}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentView={effectiveView}
          activeView={effectiveView}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {/* USER VIEWS */}
          {effectiveView === 'user-dashboard' && (
            <UserDashboardView
              onNavigate={handleNavigate}
              onOpenReport={handleOpenReportModal}
              onEditReport={handleEditReport}
            />
          )}

          {effectiveView === 'new-daily-report' && (
            <DailyReportFormView
              initialReport={editingDailyReport}
              onSuccess={handleReportSubmitted}
              onCancel={() => handleNavigate('user-dashboard')}
            />
          )}

          {effectiveView === 'new-weekly-report' && (
            <WeeklyReportFormView
              initialReport={editingWeeklyReport}
              onSuccess={handleReportSubmitted}
              onCancel={() => handleNavigate('user-dashboard')}
            />
          )}

          {effectiveView === 'my-reports' && (
            <MyReportsView
              onOpenReport={handleOpenReportModal}
              onEditReport={handleEditReport}
              onNewDaily={() => handleNavigate('new-daily-report')}
              onNewWeekly={() => handleNavigate('new-weekly-report')}
              onNavigate={handleNavigate}
            />
          )}

          {(effectiveView === 'draft-reports' || effectiveView === 'user-drafts') && (
            <UserDraftsView
              onNavigate={handleNavigate}
              onEditReport={handleEditReport}
              onOpenReport={handleOpenReportModal}
            />
          )}

          {/* ADMIN VIEWS */}
          {effectiveView === 'admin-dashboard' && (
            <AdminDashboardView
              onNavigate={handleNavigate}
              onOpenReport={handleOpenReportModal}
            />
          )}

          {effectiveView === 'admin-daily' && (
            <AdminDailyReportsView
              onOpenReport={handleOpenReportModal}
              onEditReport={handleEditReport}
            />
          )}

          {effectiveView === 'admin-weekly' && (
            <AdminWeeklyReportsView
              onOpenReport={handleOpenReportModal}
              onEditReport={handleEditReport}
            />
          )}

          {effectiveView === 'admin-compliance' && (
            <AdminComplianceView />
          )}

          {effectiveView === 'admin-productivity' && (
            <AdminProductivityView
              onNavigate={handleNavigate}
              onOpenReport={handleOpenReportModal}
            />
          )}

          {effectiveView === 'admin-users' && (
            <AdminUsersView />
          )}

          {effectiveView === 'admin-sheets' && (
            <AdminSheetsIntegrationView />
          )}

          {/* COMMON VIEWS */}
          {effectiveView === 'profile' && (
            <ProfileView />
          )}
        </main>
      </div>

      {/* Quick New Report Modal (Ctrl+N) */}
      <QuickNewReportModal
        isOpen={quickNewModalOpen}
        onClose={() => setQuickNewModalOpen(false)}
        onSelectType={type => {
          setQuickNewModalOpen(false);
          if (type === 'DAILY') {
            setEditingDailyReport(null);
            setCurrentView('new-daily-report');
          } else {
            setEditingWeeklyReport(null);
            setCurrentView('new-weekly-report');
          }
        }}
      />

      {/* Global Keyboard Shortcuts Cheatsheet Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        onNavigate={view => {
          setShortcutsModalOpen(false);
          handleNavigate(view);
        }}
      />

      {/* Global Archive Search Modal (Ctrl+F) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelectReport={(report, type) => {
          handleOpenReportModal(report, type);
        }}
        onEditReport={(report, type) => {
          handleEditReport(report, type);
        }}
      />

      {/* Global Document View & Print Modal */}
      <ReportDetailModal
        report={modalReport}
        reportType={modalReportType}
        isOpen={Boolean(modalReport)}
        onClose={() => setModalReport(null)}
        onEdit={(rep, type) => {
          setModalReport(null);
          handleEditReport(rep, type);
        }}
      />

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
