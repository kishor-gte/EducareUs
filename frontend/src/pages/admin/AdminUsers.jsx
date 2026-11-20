import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Shield, ShieldAlert, UserCheck, UserX, MapPin, Mail, Phone, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { user: currentAdmin, isSuperAdmin } = useAuth();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState(null);

  const roles = [
    { label: 'All Users', value: '' },
    { label: 'Beneficiaries', value: 'BENEFICIARY' },
    { label: 'Administrators', value: 'ADMIN' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-list', roleFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  // Toggle user suspension mutation
  const userMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const res = await api.patch(`/admin/users/${id}`, updates);
      return res.data;
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries(['admin-users-list']);
    },
    onError: (err) => {
      toast.error(err.friendlyMessage || 'Failed to update user');
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/admin/users/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'User deleted successfully');
      queryClient.invalidateQueries(['admin-users-list']);
      setUserToDelete(null);
    },
    onError: (err) => {
      toast.error(err.friendlyMessage || 'Failed to delete user');
    },
  });

  const columns = [
    {
      header: 'User Details',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
            {u.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-bold text-slate-900">{u.fullName}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {u.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (u) => {
        const roleColors = {
          SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
          ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          BENEFICIARY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          DONOR: 'bg-amber-100 text-amber-800 border-amber-200',
        };
        return (
          <span
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
              roleColors[u.role] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {u.role}
          </span>
        );
      },
    },
    {
      header: 'Verification Status',
      render: (u) => <StatusBadge status={u.verificationStatus} />,
    },
    {
      header: 'Location & Phone',
      render: (u) => (
        <div className="text-xs text-slate-600">
          <div>{u.location || 'India'}</div>
          <div className="text-slate-400">{u.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      header: 'Account Status',
      render: (u) => (
        <StatusBadge status={u.isSuspended ? 'SUSPENDED' : 'ACTIVE'} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          {/* Suspend / Unsuspend Toggle */}
          <button
            onClick={() =>
              userMutation.mutate({
                id: u.id,
                updates: { isSuspended: !u.isSuspended },
              })
            }
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
              u.isSuspended
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
          >
            {u.isSuspended ? 'Unblock' : 'Suspend'}
          </button>

          {/* Role Change (Super Admin only) */}
          {isSuperAdmin && u.role !== 'SUPER_ADMIN' && (
            <select
              value={u.role}
              onChange={(e) =>
                userMutation.mutate({
                  id: u.id,
                  updates: { role: e.target.value },
                })
              }
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-hidden"
            >
              <option value="BENEFICIARY">BENEFICIARY</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          )}

          {/* Delete User Button */}
          <button
            onClick={() => setUserToDelete(u)}
            disabled={u.id === currentAdmin?.id}
            title={u.id === currentAdmin?.id ? 'Cannot delete your active account' : `Delete ${u.fullName || u.email}`}
            className="p-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage student scholars and administrator access control.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {roles.map((r) => (
          <button
            key={r.value}
            onClick={() => {
              setRoleFilter(r.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              roleFilter === r.value
                ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, or phone..."
        pagination={pagination}
        onPageChange={setPage}
      />

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <Modal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          title="Confirm Permanent Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-base font-black text-slate-900">
                Delete User Account?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-slate-900">{userToDelete.fullName}</span> (
                <span className="font-mono text-slate-700">{userToDelete.email}</span>)?
              </p>
              <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl text-[11px] text-rose-700 font-medium">
                ⚠️ This will permanently remove their profile, authentication credentials, and associated user data. This action cannot be undone.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(userToDelete.id)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsers;
