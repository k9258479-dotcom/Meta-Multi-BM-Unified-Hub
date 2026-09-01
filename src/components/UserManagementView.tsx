import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  fetchAllUsers, 
  createUserAccount, 
  deleteUserAccount, 
  updateUserStatus, 
  StoredUserAccount 
} from '../services/firestoreService';
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserCheck, 
  Trash2, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  ShieldAlert,
  UserX,
  X,
  Mail,
  User,
  BadgeAlert
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: StoredUserAccount;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<StoredUserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAllUsers();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Username and Password are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const email = newEmail.trim() || `${newUsername.trim().toLowerCase()}@local.hub`;
      await createUserAccount({
        username: newUsername,
        email,
        displayName: newDisplayName.trim() || newUsername.trim(),
        password: newPassword,
        role: newRole,
        createdBy: currentUser.userId,
      });

      setFeedbackMsg({ type: 'success', text: `User "${newUsername}" created successfully! They can now log in with their password.` });
      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('member');
      loadUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create user account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: StoredUserAccount) => {
    if (user.id === currentUser.id) {
      alert('You cannot suspend your own admin account.');
      return;
    }
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(user.id, newStatus);
      setFeedbackMsg({ type: 'success', text: `User ${user.username} is now ${newStatus}.` });
      loadUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleDeleteUser = async (user: StoredUserAccount) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${user.username}"? All their Business Managers and Ad Accounts will be permanently deleted.`)) {
      return;
    }

    try {
      await deleteUserAccount(user.id);
      setFeedbackMsg({ type: 'success', text: `User ${user.username} and their data were removed.` });
      loadUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to delete user.' });
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 p-4 lg:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs border border-indigo-200 flex items-center gap-1 font-bold">
                <Shield className="w-3.5 h-3.5" />
                Administrator Control Center
              </span>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                User Access & Accounts Management
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Create and manage user IDs and passwords for team members. Every registered user has their own isolated workspace where their Business Managers and Ad Accounts are saved securely in Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadUsers}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Refresh Users"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Create New User Account
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className={`mt-4 p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Registered Users</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{users.length}</span>
            </div>
            <Users className="w-5 h-5 text-indigo-500 opacity-70" />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Active Members</span>
              <span className="text-lg font-bold text-emerald-600 font-mono">
                {users.filter(u => u.status === 'active').length}
              </span>
            </div>
            <UserCheck className="w-5 h-5 text-emerald-500 opacity-70" />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Administrator Roles</span>
              <span className="text-lg font-bold text-indigo-700 font-mono">
                {users.filter(u => u.role === 'admin').length}
              </span>
            </div>
            <Shield className="w-5 h-5 text-indigo-600 opacity-70" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by username, display name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User / Identity</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Created On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {user.displayName}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-100 text-sky-800 font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'admin' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1 w-fit">
                            <Shield className="w-3 h-3" />
                            Administrator
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-semibold flex items-center gap-1 w-fit">
                            <User className="w-3 h-3" />
                            Member
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1 w-fit">
                            <UserX className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCurrent && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                                  user.status === 'active'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {user.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete user and all associated BM data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User Account */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Create User Account</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  User ID / Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. john_marketer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. John Doe (Media Buyer)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Assign user password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Role & Permissions
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium"
                >
                  <option value="member">Member (Own Workspace & BM Data)</option>
                  <option value="admin">Administrator (Can create/manage other users)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Save & Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
