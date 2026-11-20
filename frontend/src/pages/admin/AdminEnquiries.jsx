import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  HelpCircle,
  GraduationCap,
  CheckCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Compass,
  MessageSquare,
  Search,
  Filter,
  Save,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const AdminEnquiries = () => {
  const queryClient = useQueryClient();
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [enquiryStatus, setEnquiryStatus] = useState('PENDING');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data: enquiryData, isLoading } = useQuery({
    queryKey: ['admin-enquiries', statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);
      const res = await api.get(`/admin/enquiries?${params.toString()}`);
      return res.data;
    },
  });

  const enquiries = enquiryData?.data || [];
  const stats = enquiryData?.stats || { totalAll: 0, pending: 0, inProgress: 0, resolved: 0 };

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }) => {
      const res = await api.patch(`/admin/enquiries/${id}`, {
        status,
        adminNotes,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Enquiry updated successfully');
      setSelectedEnquiry(null);
      setAdminNotes('');
      queryClient.invalidateQueries(['admin-enquiries']);
    },
    onError: (err) => {
      toast.error(err.friendlyMessage || 'Failed to update enquiry');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/admin/enquiries/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Enquiry removed');
      setSelectedEnquiry(null);
      queryClient.invalidateQueries(['admin-enquiries']);
    },
    onError: (err) => {
      toast.error(err.friendlyMessage || 'Failed to delete enquiry');
    },
  });

  const openReviewModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setEnquiryStatus(enquiry.status);
    setAdminNotes(enquiry.adminNotes || '');
  };

  const handleSave = () => {
    if (!selectedEnquiry) return;
    updateMutation.mutate({
      id: selectedEnquiry.id,
      status: enquiryStatus,
      adminNotes,
    });
  };

  const columns = [
    {
      header: 'Student Name & Contact',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <span>{item.fullName}</span>
            {item.user && (
              <span className="text-[10px] font-black px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                Registered
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400" />
            <span>{item.email}</span>
          </div>
          {item.phone && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{item.phone}</span>
            </div>
          )}
          {item.location && (
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{item.location}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Completed Education',
      render: (item) => (
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            {item.highestEducation}
          </span>
          {item.currentStream && (
            <span className="text-[11px] text-slate-500 block font-medium">
              Stream: {item.currentStream}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Aspires to Pursue',
      render: (item) => (
        <div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 inline-block mb-0.5">
            {item.interestedCourse}
          </span>
          {item.preferredInstitutions && (
            <span className="text-[11px] text-slate-400 block truncate max-w-xs">
              Pref: {item.preferredInstitutions}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Query / Questions',
      render: (item) => (
        <div className="max-w-xs">
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            "{item.queryDetails}"
          </p>
        </div>
      ),
    },
    {
      header: 'Date Submitted',
      render: (item) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (item) => {
        const statusConfig = {
          PENDING: { label: 'Pending Review', color: 'bg-amber-50 text-amber-800 border-amber-200' },
          IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 text-blue-800 border-blue-200' },
          RESOLVED: { label: 'Contacted & Resolved', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
          CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        };
        const cfg = statusConfig[item.status] || statusConfig.PENDING;
        return (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Action',
      render: (item) => (
        <button
          onClick={() => openReviewModal(item)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
        >
          Review & Respond
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            <span>Student Career & Education Enquiries</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feed of scholar enquiries regarding post-12th options, degree pathways, college admissions, and career counseling.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enquiries</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-heading">{stats.totalAll}</div>
        </div>
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Review</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-heading">{stats.pending}</div>
        </div>
        <div className="bg-white border border-blue-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">In Progress / Contacted</div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-heading">{stats.inProgress}</div>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Counseling Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-heading">{stats.resolved}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, email, course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved / Contacted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={enquiries}
        isLoading={isLoading}
        emptyMessage="No student career or course enquiries found in the database."
      />

      {/* Interactive Review & Counseling Response Modal */}
      {selectedEnquiry && (
        <Modal
          isOpen={Boolean(selectedEnquiry)}
          onClose={() => setSelectedEnquiry(null)}
          title="Student Education & Career Enquiry Review"
        >
          <div className="space-y-5">
            {/* Student Identity Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-500" />
                  {selectedEnquiry.fullName}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-600 hover:underline">
                    {selectedEnquiry.email}
                  </a>
                </div>
                {selectedEnquiry.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${selectedEnquiry.phone}`} className="font-semibold text-slate-800">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                )}
                {selectedEnquiry.location && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedEnquiry.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Academic Journey & Aspiration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-1">
                <span className="text-[11px] font-black uppercase text-blue-800 tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Completed Education
                </span>
                <p className="text-xs font-bold text-slate-900">{selectedEnquiry.highestEducation}</p>
                {selectedEnquiry.currentStream && (
                  <p className="text-[11px] text-slate-600">Stream: {selectedEnquiry.currentStream}</p>
                )}
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-1">
                <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" /> Wants to Pursue
                </span>
                <p className="text-xs font-bold text-amber-900">{selectedEnquiry.interestedCourse}</p>
                {selectedEnquiry.preferredInstitutions && (
                  <p className="text-[11px] text-slate-600">Pref: {selectedEnquiry.preferredInstitutions}</p>
                )}
              </div>
            </div>

            {/* Student's Full Query Details */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Scholar's Question & Needs
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {selectedEnquiry.queryDetails}
              </p>
            </div>

            {/* Counselor Review Form */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Update Enquiry Status
                </label>
                <select
                  value={enquiryStatus}
                  onChange={(e) => setEnquiryStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="IN_PROGRESS">In Progress (Counselor Assigned / Called)</option>
                  <option value="RESOLVED">Resolved (Counseled & Recommended)</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Counselor Notes & Recommendations (Internal & Record)
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record counseling suggestions, entrance exam recommendations, fee structures shared, or call follow-up summary..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this enquiry?')) {
                    deleteMutation.mutate(selectedEnquiry.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updateMutation.isPending ? 'Saving...' : 'Save & Update'}</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminEnquiries;
