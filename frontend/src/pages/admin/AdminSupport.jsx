import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { LifeBuoy, MessageSquare, CheckCircle, Clock, Edit3, Trash2, Reply } from 'lucide-react';

export const AdminSupport = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  // Form states for Reply/Manage
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [ticketStatus, setTicketStatus] = useState('IN_PROGRESS');

  // Form states for Edit
  const [editFormData, setEditFormData] = useState({
    subject: '',
    category: 'General Inquiry',
    priority: 'MEDIUM',
    status: 'OPEN',
    message: '',
    resolutionNotes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const res = await api.get('/admin/support-tickets?limit=150');
      return res.data?.data || [];
    },
  });

  // Reply / Manage status mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNotes }) => {
      const res = await api.patch(`/admin/support-tickets/${id}`, {
        status,
        resolutionNotes,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Ticket response updated and saved!');
      setSelectedTicket(null);
      setResolutionNotes('');
      queryClient.invalidateQueries(['admin-support-tickets']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.friendlyMessage || 'Failed to update ticket');
    },
  });

  // Full Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.patch(`/admin/support-tickets/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Support ticket details updated successfully!');
      setEditingTicket(null);
      queryClient.invalidateQueries(['admin-support-tickets']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.friendlyMessage || 'Failed to edit ticket');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/admin/support-tickets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Support ticket deleted successfully.');
      setTicketToDelete(null);
      queryClient.invalidateQueries(['admin-support-tickets']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.friendlyMessage || 'Failed to delete ticket');
    },
  });

  const handleOpenEdit = (t) => {
    setEditingTicket(t);
    setEditFormData({
      subject: t.subject || '',
      category: t.category || 'General Inquiry',
      priority: t.priority || 'MEDIUM',
      status: t.status || 'OPEN',
      message: t.message || '',
      resolutionNotes: t.resolutionNotes || '',
    });
  };

  const columns = [
    {
      header: 'Ticket ID',
      render: (t) => (
        <span className="font-mono font-bold text-xs text-slate-800">
          #ST-{t.id ? t.id.slice(0, 6).toUpperCase() : '000'}
        </span>
      ),
    },
    {
      header: 'User & Subject',
      render: (t) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{t.subject}</div>
          <div className="text-[11px] text-slate-400">
            {t.user?.fullName || 'Guest'} ({t.user?.email || 'N/A'})
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (t) => (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {t.category || 'General'}
        </span>
      ),
    },
    {
      header: 'Priority',
      render: (t) => {
        const priorityColors = {
          URGENT: 'text-rose-700 bg-rose-50 border-rose-200',
          HIGH: 'text-amber-700 bg-amber-50 border-amber-200',
          MEDIUM: 'text-blue-700 bg-blue-50 border-blue-200',
          LOW: 'text-slate-600 bg-slate-50 border-slate-200',
        };
        return (
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
              priorityColors[t.priority] || priorityColors.MEDIUM
            }`}
          >
            {t.priority}
          </span>
        );
      },
    },
    {
      header: 'Status',
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      header: 'Date',
      render: (t) => (
        <span className="text-[11px] text-slate-500">
          {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* EDIT BUTTON */}
          <button
            onClick={() => handleOpenEdit(t)}
            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1 transition-all"
            title="Edit Ticket Details"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          {/* REPLY BUTTON */}
          <button
            onClick={() => {
              setSelectedTicket(t);
              setTicketStatus(t.status === 'OPEN' ? 'RESOLVED' : t.status);
              setResolutionNotes(t.resolutionNotes || '');
            }}
            className="px-2.5 py-1 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1 transition-all"
            title="Reply to Student"
          >
            <Reply className="w-3 h-3" />
            <span>Reply</span>
          </button>

          {/* DELETE BUTTON */}
          <button
            onClick={() => setTicketToDelete(t)}
            className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
            title="Delete Ticket"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Desk & Inquiries</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review candidate and student assistance requests, provide advisor responses, edit details, or remove records.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Search support tickets by ID, name, email, subject..."
      />

      {/* ─── MODAL 1: REPLY / RESOLVE MODAL ─── */}
      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title="Support Ticket Resolution"
      >
        {selectedTicket && (
          <div className="space-y-4 text-sm text-slate-800">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">User:</span>
                <span className="font-bold">{selectedTicket.user?.fullName} ({selectedTicket.user?.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subject:</span>
                <span className="font-bold">{selectedTicket.subject}</span>
              </div>
              <div className="pt-2 text-slate-600 border-t border-slate-200 whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="OPEN">OPEN (Under Review)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Working on Resolution)</option>
                  <option value="RESOLVED">RESOLVED (Issue Answered & Resolved)</option>
                  <option value="CLOSED">CLOSED (Completed & Archived)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Advisor Reply & Guidance *
                </label>
                <textarea
                  rows="4"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record resolution steps or advisor guidance message to student..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() =>
                  updateMutation.mutate({
                    id: selectedTicket.id,
                    status: ticketStatus,
                    resolutionNotes,
                  })
                }
                disabled={updateMutation.isPending || !resolutionNotes.trim()}
                className="flex-1 py-2.5 bg-slate-900 text-amber-400 rounded-xl font-bold text-xs disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Sending...' : 'Send Reply to Student'}
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 2: EDIT TICKET DETAILS MODAL ─── */}
      <Modal
        isOpen={Boolean(editingTicket)}
        onClose={() => setEditingTicket(null)}
        title="Edit Support Ticket Details"
      >
        {editingTicket && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editMutation.mutate({
                id: editingTicket.id,
                payload: editFormData,
              });
            }}
            className="space-y-4 text-xs text-slate-800"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={editFormData.subject}
                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Admissions & Courses">Admissions & Courses</option>
                  <option value="Fee & Scholarship Aid">Fee & Scholarship Aid</option>
                  <option value="Document Verification">Document Verification</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing & Payments">Billing & Payments</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="OPEN">OPEN (Under Review)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Working on Resolution)</option>
                <option value="RESOLVED">RESOLVED (Resolved & Answered)</option>
                <option value="CLOSED">CLOSED (Completed & Archived)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Inquiry Message *</label>
              <textarea
                rows="3"
                required
                value={editFormData.message}
                onChange={(e) => setEditFormData({ ...editFormData, message: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Resolution Notes (Optional)</label>
              <textarea
                rows="2"
                value={editFormData.resolutionNotes}
                onChange={(e) => setEditFormData({ ...editFormData, resolutionNotes: e.target.value })}
                placeholder="Optional internal resolution notes..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={editMutation.isPending}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700"
              >
                {editMutation.isPending ? 'Saving...' : 'Save Ticket Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── MODAL 3: DELETE CONFIRMATION MODAL ─── */}
      <Modal
        isOpen={Boolean(ticketToDelete)}
        onClose={() => setTicketToDelete(null)}
        title="Delete Support Ticket"
      >
        {ticketToDelete && (
          <div className="space-y-4 text-xs text-slate-700">
            <p>
              Are you sure you want to permanently delete ticket{' '}
              <strong className="text-rose-600">
                #ST-{ticketToDelete.id ? ticketToDelete.id.slice(0, 6).toUpperCase() : '000'}
              </strong>{' '}
              ({ticketToDelete.subject})?
            </p>
            <p className="text-[11px] text-slate-400">
              This will remove the ticket from the database and cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(ticketToDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Ticket'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSupport;
