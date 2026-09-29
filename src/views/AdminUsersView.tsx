import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  DEPARTMENTS,
  PRODUCTION_SUB_DEPARTMENTS,
  DEPARTMENT_SUB_DEPARTMENTS,
  getDepartmentColor,
  POST_LEVELS,
} from '../data/departments';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  Shield,
  CheckCircle2,
  XCircle,
  Building,
  Mail,
  UserCheck,
  RefreshCw,
  Cloud,
  Database,
  ArrowDownCircle
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    addToast,
    pullUsersFromGoogleSheets,
    refreshUsersFromCloud,
    isCloudConnected,
    googleAppsScriptUrl,
    syncBothEditionsNow,
    editionSyncStatus
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'GET' | 'DET'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingEditions, setIsSyncingEditions] = useState(false);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('Trainee@123');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<string>('Production');
  const [subDepartment, setSubDepartment] = useState<string>('Coil Winding (HV & LV)');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'GET' | 'DET'>('GET');
  const [reportingManager, setReportingManager] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempPassword, setTempPassword] = useState('Trainee@123');
  const [phone, setPhone] = useState('');

  // Department list merged from actual departments and current users
  const departments = useMemo(() => {
    const set = new Set<string>(DEPARTMENTS);
    users.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL') {
      if (roleFilter === 'ADMIN' && u.role !== 'ADMIN') return false;
      if (roleFilter === 'GET') {
        const isGet = u.role === 'GET' || (u.role === 'USER' && !u.designation?.toUpperCase().includes('DET') && !u.employeeId?.toUpperCase().startsWith('DET'));
        if (!isGet) return false;
      }
      if (roleFilter === 'DET') {
        const isDet = u.role === 'DET' || (u.role === 'USER' && (u.designation?.toUpperCase().includes('DET') || u.employeeId?.toUpperCase().startsWith('DET')));
        if (!isDet) return false;
      }
    }
    if (departmentFilter !== 'ALL' && u.department !== departmentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        (u.subDepartment && u.subDepartment.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const openAddModal = (defaultRole: 'ADMIN' | 'GET' | 'DET' = 'GET') => {
    setEditingUserId(null);
    setName('');
    setRole(defaultRole);
    if (defaultRole === 'DET') {
      setEmployeeId(`DET-2026-${String(users.length + 10).padStart(3, '0')}`);
      setDesignation('Diploma Engineer Trainee (DET)');
    } else if (defaultRole === 'ADMIN') {
      setEmployeeId(`ADM-${String(users.length + 1001).padStart(4, '0')}`);
      setDesignation('Training Supervisor / Admin');
    } else {
      setEmployeeId(`GET-2026-${String(users.length + 10).padStart(3, '0')}`);
      setDesignation('Graduate Engineer Trainee (GET)');
    }
    setEmail('');
    setDepartment('Production');
    setSubDepartment('Coil Winding (HV & LV)');
    setReportingManager('Rajesh Verma - Production DGM');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setTempPassword(defaultRole === 'ADMIN' ? 'Admin@123' : 'Trainee@123');
    setPhone('+91 98111 22334');
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUserId(u.id);
    setName(u.name);
    setEmployeeId(u.employeeId);
    setEmail(u.email);
    setDepartment(u.department || 'Production');
    setSubDepartment(u.subDepartment || (u.department === 'Production' ? 'Coil Winding (HV & LV)' : ''));
    setDesignation(u.designation);

    let effectiveRole: 'ADMIN' | 'GET' | 'DET' = 'GET';
    if (u.role === 'ADMIN') {
      effectiveRole = 'ADMIN';
    } else if (u.role === 'DET' || u.designation?.toUpperCase().includes('DET') || u.employeeId?.toUpperCase().startsWith('DET')) {
      effectiveRole = 'DET';
    } else {
      effectiveRole = 'GET';
    }
    setRole(effectiveRole);

    setReportingManager(u.reportingManager || '');
    setJoiningDate(u.joiningDate);
    setPhone(u.phone || '');
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      updateUser(editingUserId, {
        name,
        employeeId,
        email,
        department,
        subDepartment: subDepartment.trim() || undefined,
        designation,
        role,
        reportingManager,
        joiningDate,
        phone,
      });
      addToast('success', `Updated user details for ${name}`);
    } else {
      addUser({
        employeeId,
        name,
        email,
        department,
        subDepartment: subDepartment.trim() || undefined,
        designation,
        role,
        reportingManager,
        joiningDate,
        password: tempPassword,
        phone,
        isActive: true,
      });
      addToast('success', `Created user account for ${name} (${employeeId})`);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (u: User) => {
    const newState = !(u.isActive !== false);
    updateUser(u.id, { isActive: newState });
    addToast(newState ? 'success' : 'info', `User ${u.name} is now ${newState ? 'Active' : 'Disabled'}.`);
  };

  const handleDelete = (u: User) => {
    if (u.role === 'ADMIN' && users.filter(x => x.role === 'ADMIN').length <= 1) {
      addToast('error', 'Cannot delete the sole Administrator account.');
      return;
    }
    setUserToDelete(u);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    addToast('info', `User ${userToDelete.name} deleted.`);
    setUserToDelete(null);
  };

  const handleConfirmResetPassword = () => {
    if (!resetTargetUser) return;
    resetUserPassword(resetTargetUser.id, newPassword);
    setResetTargetUser(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">User & Trainee Management</h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isCloudConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <Database className="w-3 h-3" />
              <span>{isCloudConnected ? 'Persistent Database Live' : 'Local Mode'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accounts created here automatically persist across deployments and synchronize live to Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-sync-both-editions-users"
            onClick={async () => {
              setIsSyncingEditions(true);
              try {
                await syncBothEditionsNow();
              } finally {
                setIsSyncingEditions(false);
              }
            }}
            disabled={isSyncingEditions}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 rounded-xl transition-colors shadow-2xs"
            title="Real-time multi-edition synchronization: sync users across all open tabs, dev preview, and live deployed edition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEditions ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncingEditions ? 'Syncing...' : 'Sync Both Editions'}</span>
          </button>

          <button
            id="btn-refresh-users"
            onClick={async () => {
              setIsRefreshing(true);
              await refreshUsersFromCloud();
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
            title="Refresh user list from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {googleAppsScriptUrl && (
            <button
              id="btn-pull-sheet-users"
              onClick={async () => {
                setIsPulling(true);
                await pullUsersFromGoogleSheets();
                setIsPulling(false);
              }}
              disabled={isPulling}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors shadow-2xs"
              title="Import or sync users from the connected Google Sheet"
            >
              <ArrowDownCircle className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Pulling...' : 'Sync from Sheet'}</span>
            </button>
          )}

          <button
            id="btn-add-new-user"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Trainee / Admin</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Name, Emp ID, or Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div>
          <select
            id="filter-role-select"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Roles (Admin, GET, DET)</option>
            <option value="ADMIN">ADMIN (Administrators)</option>
            <option value="GET">GET (Graduate Engineer Trainees)</option>
            <option value="DET">DET (Diploma Engineer Trainees)</option>
          </select>
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Registered Members: <strong className="text-slate-800 dark:text-slate-200">{filteredUsers.length}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department & Designation</th>
                <th className="py-3 px-4">Reporting Manager</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map(u => {
                const isActive = u.isActive !== false;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {u.employeeId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getDepartmentColor(u.department).badgeClass}`}>
                          {u.department}
                        </span>
                      </div>
                      {u.subDepartment && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 flex items-center gap-1">
                          <span className="text-slate-400 dark:text-slate-500 font-bold">↳</span>
                          <span>{u.subDepartment}</span>
                        </div>
                      )}
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{u.designation}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {u.reportingManager || 'Senior DGM'}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                          ADMIN
                        </span>
                      ) : (u.role === 'DET' || (u.role === 'USER' && (u.designation?.toUpperCase().includes('DET') || u.employeeId?.toUpperCase().startsWith('DET')))) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                          DET
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                          GET
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                        }`}
                        title="Click to toggle status"
                      >
                        {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setResetTargetUser(u);
                            setNewPassword('Trainee@123');
                          }}
                          className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {editingUserId ? 'Edit User Details' : 'Add New User Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify employee credentials, plant assignment, and authorization role
            </p>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role *</label>
                  <select
                    id="select-system-role"
                    value={role}
                    onChange={e => {
                      const newRole = e.target.value as 'ADMIN' | 'GET' | 'DET';
                      setRole(newRole);
                      if (!editingUserId) {
                        if (newRole === 'GET') {
                          setDesignation('Graduate Engineer Trainee (GET)');
                          if (employeeId.startsWith('DET-') || employeeId.startsWith('ADM-')) {
                            setEmployeeId(employeeId.replace(/^(DET|ADM)-/, 'GET-'));
                          }
                          setTempPassword('Trainee@123');
                        } else if (newRole === 'DET') {
                          setDesignation('Diploma Engineer Trainee (DET)');
                          if (employeeId.startsWith('GET-') || employeeId.startsWith('ADM-')) {
                            setEmployeeId(employeeId.replace(/^(GET|ADM)-/, 'DET-'));
                          }
                          setTempPassword('Trainee@123');
                        } else if (newRole === 'ADMIN') {
                          setDesignation('Training Supervisor / Admin');
                          if (employeeId.startsWith('GET-') || employeeId.startsWith('DET-')) {
                            setEmployeeId(employeeId.replace(/^(GET|DET)-/, 'ADM-'));
                          }
                          setTempPassword('Admin@123');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-800 dark:text-white"
                  >
                    <option value="ADMIN">ADMIN (Training Head / Supervisor)</option>
                    <option value="GET">GET (Graduate Engineer Trainee)</option>
                    <option value="DET">DET (Diploma Engineer Trainee)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                  <select
                    required
                    value={department}
                    onChange={e => {
                      const newDept = e.target.value;
                      setDepartment(newDept);
                      const subOpts = DEPARTMENT_SUB_DEPARTMENTS[newDept];
                      if (subOpts && subOpts.length > 0) {
                        setSubDepartment(subOpts[0]);
                      } else {
                        setSubDepartment('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Official plant & business division</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sub-Department / Plant Section {department === 'Production' && <span className="text-blue-600 dark:text-blue-400 font-bold">(Production Unit)</span>}
                  </label>
                  {DEPARTMENT_SUB_DEPARTMENTS[department] ? (
                    <select
                      value={subDepartment}
                      onChange={e => setSubDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 font-medium"
                    >
                      <option value="">-- Select Sub-Department / Section --</option>
                      {DEPARTMENT_SUB_DEPARTMENTS[department].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={subDepartment}
                      onChange={e => setSubDepartment(e.target.value)}
                      placeholder="Optional section or unit"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    {department === 'Production' ? 'Core manufacturing shop floor section' : 'Division unit or specialization'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation / Level of Post *</label>
                  <input
                    type="text"
                    required
                    list="admin-post-levels-list"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. HR Executive, MT, or GET"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                  <datalist id="admin-post-levels-list">
                    {POST_LEVELS.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {POST_LEVELS.slice(0, 7).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDesignation(p)}
                        className={`px-1.5 py-0.5 text-[9px] rounded font-medium border transition-colors ${
                          designation === p
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    value={reportingManager}
                    onChange={e => setReportingManager(e.target.value)}
                    placeholder="e.g. Senior DGM"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Joining Date *</label>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={e => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              {!editingUserId && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Default: Trainee@123</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Reset Account Password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Set a new password for <strong className="text-slate-800 dark:text-slate-200">{resetTargetUser.name}</strong> ({resetTargetUser.employeeId}):
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5 text-xs">
              <button
                onClick={() => setResetTargetUser(null)}
                className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="px-4 py-2 font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Delete User Account?"
        message={userToDelete ? `Are you sure you want to permanently delete ${userToDelete.name} (${userToDelete.employeeId})? Their login credentials and access will be removed.` : ''}
        confirmText="Delete Account"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
