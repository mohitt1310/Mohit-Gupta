import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UttamLogo } from '../components/UttamLogo';
import { UserRole } from '../types';
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  UserCheck,
  Building2,
  HelpCircle,
  CheckCircle2,
  Info,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';

interface LoginViewProps {
  onSuccess: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, users, theme, toggleTheme, refreshUsersFromCloud, isCloudConnected } = useApp();
  const [emailOrEmpId, setEmailOrEmpId] = useState('get1@uttam-bharat.com');
  const [password, setPassword] = useState('Trainee@123');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Sync users immediately on login page load so newly created users can sign in instantly
  useEffect(() => {
    refreshUsersFromCloud();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let ok = login(emailOrEmpId, password);
    if (!ok) {
      // Re-fetch from server in case user was just added in Admin view
      await refreshUsersFromCloud();
      ok = login(emailOrEmpId, password);
    }

    setLoading(false);
    if (ok) {
      const cleanId = emailOrEmpId.trim().toLowerCase();
      const found = users.find(
        u => u.email.toLowerCase() === cleanId || u.employeeId.toLowerCase() === cleanId
      );
      if (found) {
        onSuccess(found.role);
      }
    }
  };

  const handleQuickLogin = (email: string, pass: string, role: UserRole) => {
    setEmailOrEmpId(email);
    setPassword(pass);
    const ok = login(email, pass);
    if (ok) {
      onSuccess(role);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors relative">
      {/* Top-right theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          id="btn-login-theme-toggle"
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors shadow-2xs flex items-center gap-2 text-xs font-medium"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center mb-3">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 inline-flex items-center justify-center transition-colors">
            <UttamLogo className="h-12 text-slate-900 dark:text-white" showSubtitle={true} />
          </div>
        </div>
        <h1 className="mt-2 text-center text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Training Report Management
        </h1>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          GET & DET Technical Training Program • Enterprise Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-6 transition-colors">
          <form id="form-login" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="emailOrEmpId" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address or Employee ID
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-login-id"
                  name="emailOrEmpId"
                  type="text"
                  required
                  placeholder="e.g. get1@uttam-bharat.com or GET-2026-042"
                  value={emailOrEmpId}
                  onChange={e => setEmailOrEmpId(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workstation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for instant evaluation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mb-2.5">
              Instant Demo Logins
            </div>
            <div className="space-y-2">
              <button
                id="btn-demo-login-get"
                onClick={() => handleQuickLogin('get1@uttam-bharat.com', 'Trainee@123', 'GET')}
                className="w-full text-left p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200">Aarav Sharma (GET Trainee)</div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 font-mono">get1@uttam-bharat.com • Electrical & Inst.</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-200/80 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200">
                  GET
                </span>
              </button>

              <button
                id="btn-demo-login-admin"
                onClick={() => handleQuickLogin('admin@company.com', 'Admin@123', 'ADMIN')}
                className="w-full text-left p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100/70 dark:hover:bg-purple-900/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200">Vikramaditya Rao (Training Head)</div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-400 font-mono">admin@company.com • Admin Reviewer</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-200/80 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200">
                  ADMIN
                </span>
              </button>

              <button
                id="btn-demo-login-sattu"
                onClick={() => handleQuickLogin('get4@uttam-bharat.com', 'Trainee@123', 'GET')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">sattu (GET Trainee)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">get4@uttam-bharat.com • Learning & Dev</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200">
                  GET
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security / System Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Role-Based Access Control</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Google Sheets Connected</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-400 font-bold text-base">
              <HelpCircle className="w-5 h-5" />
              <span>Password Recovery</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              In this corporate deployment, password resets are centrally managed by the Training Administrator or HR Department.
            </p>
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div>Default GET Password: <span className="font-mono font-bold text-blue-700 dark:text-blue-400">Trainee@123</span></div>
              <div>Default Admin Password: <span className="font-mono font-bold text-purple-700 dark:text-purple-400">Admin@123</span></div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
