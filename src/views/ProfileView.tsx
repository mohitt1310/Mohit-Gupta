import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HR_DEPARTMENTS, POST_LEVELS } from '../data/departments';
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  Edit3,
  X,
  Award
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, updateUser, addToast } = useApp();

  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isEditingDept, setIsEditingDept] = useState(false);
  const [deptSelection, setDeptSelection] = useState(
    currentUser?.department && (currentUser.department.includes('HR') || currentUser.department.toLowerCase().includes('human'))
      ? currentUser.department
      : HR_DEPARTMENTS[0]
  );
  const [postSelection, setPostSelection] = useState(
    currentUser?.designation || POST_LEVELS[0]
  );

  if (!currentUser) return null;

  const handleUpdateContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, { phone });
    addToast('success', 'Contact details updated successfully.');
  };

  const handleUpdateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, {
      department: deptSelection,
      designation: postSelection,
      subDepartment: undefined,
    });
    addToast('success', 'HR Department and Post Level updated successfully.');
    setIsEditingDept(false);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'New passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    setTimeout(() => {
      updateUser(currentUser.id, { password: newPassword });
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('success', 'Your password has been changed securely.');
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Employee Profile & Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Account credentials, corporate plant assignment, and contact information
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-700 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {currentUser.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentUser.role === 'ADMIN'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700'
                  : (currentUser.role === 'DET' || (currentUser.role === 'USER' && (currentUser.designation?.toUpperCase().includes('DET') || currentUser.employeeId?.toUpperCase().startsWith('DET'))))
                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700'
                  : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
              }`}>
                {currentUser.role === 'ADMIN'
                  ? 'ADMIN'
                  : (currentUser.role === 'DET' || (currentUser.role === 'USER' && (currentUser.designation?.toUpperCase().includes('DET') || currentUser.employeeId?.toUpperCase().startsWith('DET'))))
                  ? 'DET'
                  : 'GET'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser.designation}</p>
            <p className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 mt-1">{currentUser.employeeId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium block">Corporate Email</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 mt-1">
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{currentUser.email}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium block">Role & Access Tier</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 mt-1">
              <span className="font-semibold">
                {currentUser.role === 'ADMIN'
                  ? 'Administrator'
                  : (currentUser.role === 'DET' || (currentUser.role === 'USER' && (currentUser.designation?.toUpperCase().includes('DET') || currentUser.employeeId?.toUpperCase().startsWith('DET'))))
                  ? 'Diploma Engineer Trainee (DET)'
                  : 'Graduate Engineer Trainee (GET)'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Contact Form */}
        <form onSubmit={handleUpdateContact} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Contact Number</h3>
          <div className="flex items-center gap-3 max-w-sm">
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              Update Phone
            </button>
          </div>
        </form>
      </div>

      {/* Department & Organization Section */}
      <div id="section-profile-department" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2>Department & Organizational Assignment</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              {currentUser.department}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {currentUser.designation}
            </span>
            <button
              type="button"
              onClick={() => {
                setDeptSelection(currentUser.department);
                setPostSelection(currentUser.designation);
                setIsEditingDept(!isEditingDept);
              }}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {isEditingDept ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change Assignment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isEditingDept && (
          <form onSubmit={handleUpdateAssignment} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-4 text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Update Assigned HR Department & Level of Post
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* HR Department */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  HR Department <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={deptSelection}
                  onChange={e => setDeptSelection(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-600"
                >
                  {HR_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Select HR functional division / department
                </p>

                {/* Quick suggested chips for HR Department */}
                <div className="mt-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                    Suggested HR Departments:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {HR_DEPARTMENTS.map(d => {
                      const label = d.replace('HR - ', '').replace('Human Resources ', '');
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDeptSelection(d)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                            deptSelection === d
                              ? 'bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700'
                              : 'bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Level of Post / Designation */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Level of Post / Designation <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={postSelection}
                  onChange={e => setPostSelection(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-600"
                >
                  {POST_LEVELS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Select hierarchical rank or level of post
                </p>

                {/* Quick suggested chips for Level of Post */}
                <div className="mt-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                    Suggested Levels of Post:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POST_LEVELS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPostSelection(p)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                          postSelection === p
                            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                Save Assignment
              </button>
              <button
                type="button"
                onClick={() => setIsEditingDept(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-medium block">HR Department</span>
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Building2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span className="truncate">{currentUser.department}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Assigned Human Resources functional division
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-medium block">Level of Post / Designation</span>
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">{currentUser.designation}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Current organizational rank & job level
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-medium block">Reporting Manager</span>
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="truncate">{currentUser.reportingManager || 'Senior DGM'}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Direct technical evaluation & supervisory lead
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-medium block">Date of Joining</span>
            <div className="flex items-center gap-2 font-bold font-mono text-slate-900 dark:text-white text-sm">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>{currentUser.joiningDate}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Official company onboarding & training start date
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Change Account Password</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enhance security by updating your account credentials regularly.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-3.5 max-w-md text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password (min. 6 characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Retype new password"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-5 py-2.5 font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-60"
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
