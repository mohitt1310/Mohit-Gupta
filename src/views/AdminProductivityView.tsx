import React from 'react';
import { AdminProductivityHoursAnalytics } from '../components/AdminProductivityHoursAnalytics';
import { DailyReport, WeeklyReport } from '../types';
import { ArrowLeft, Clock, BarChart2 } from 'lucide-react';

interface AdminProductivityViewProps {
  onNavigate: (view: string) => void;
  onOpenReport: (report: DailyReport | WeeklyReport, type: 'DAILY' | 'WEEKLY') => void;
}

export const AdminProductivityView: React.FC<AdminProductivityViewProps> = ({
  onNavigate,
  onOpenReport
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Daily Productivity Hours Portal
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Admin Suite
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized plant engineering shift hours audit, GET/DET cohort analytics, and corporate target tracking
          </p>
        </div>
      </div>

      {/* Main Analytics Component */}
      <AdminProductivityHoursAnalytics
        onNavigate={onNavigate}
        onOpenReport={onOpenReport}
        isStandalone={true}
      />
    </div>
  );
};
