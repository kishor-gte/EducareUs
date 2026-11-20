import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { FileText, CheckCircle2, XCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export const AdminVerifications = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications-list', statusFilter],
    queryFn: async () => {
      const url = statusFilter
        ? `/admin/verifications?status=${statusFilter}`
        : '/admin/verifications';
      const res = await api.get(url);
      return res.data?.data || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason, remarks }) => {
      const res = await api.patch(`/admin/verifications/${id}/review`, {
        status,
        rejectionReason,
        remarks,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document review recorded successfully');
      setSelectedDoc(null);
      setActionType(null);
      setRejectionReason('');
      setRemarks('');
      queryClient.invalidateQueries(['admin-verifications-list']);
    },
    onError: (err) => {
      toast.error(err.friendlyMessage || 'Failed to review verification');
    },
  });

  const handleReviewSubmit = () => {
    if (actionType === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason for the student.');
      return;
    }

    reviewMutation.mutate({
      id: selectedDoc.id,
      status: actionType === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
      rejectionReason: actionType === 'REJECT' ? rejectionReason : null,
      remarks,
    });
  };

  const columns = [
    {
      header: 'Student Candidate',
      render: (v) => (
        <div>
          <div className="font-bold text-slate-900">{v.user?.fullName}</div>
          <div className="text-xs text-slate-400">{v.user?.email}</div>
        </div>
      ),
    },
    {
      header: 'Document Type',
      render: (v) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">{v.documentType}</span>
          {v.idNumber && (
            <div className="text-[11px] text-slate-400 font-mono">ID: {v.idNumber}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Submission Date',
      render: (v) => (
        <span className="text-xs text-slate-600">
          {new Date(v.submittedAt).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (v) => <StatusBadge status={v.status} />,
    },
    {
      header: 'Reviewed By',
      render: (v) => (
        <span className="text-xs text-slate-500">
          {v.reviewedBy?.fullName || 'Pending Assignment'}
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (v) => (
        <button
          onClick={() => {
            setSelectedDoc(v);
            setActionType(null);
          }}
          className="px-3 py-1.5 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-slate-800"
        >
          Inspect & Review
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Document Verification Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Validate Class 12th scorecards, university admission letters, and family income certificates.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Filter candidate documents..."
      />

      {/* Verification Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title="Document Verification Review"
        maxWidth="max-w-xl"
      >
        {selectedDoc && (
          <div className="space-y-5 text-sm text-slate-800">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{selectedDoc.user?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Document Type:</span>
                <span className="font-bold text-slate-900">{selectedDoc.documentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Document URL:</span>
                <a
                  href={selectedDoc.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-600 hover:underline flex items-center gap-1"
                >
                  Open File <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Action Selection */}
            {!actionType ? (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActionType('APPROVE')}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Document
                </button>
                <button
                  onClick={() => setActionType('REJECT')}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject Document
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold uppercase text-slate-700">
                  Confirming {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
                </div>

                {actionType === 'REJECT' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reason for Rejection *
                    </label>
                    <textarea
                      rows="2"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Blurred document, seal missing, or mismatch in candidate name"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Internal Compliance Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Notes for fellow administrators"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewMutation.isPending}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white ${
                      actionType === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {reviewMutation.isPending ? 'Saving...' : 'Submit Decision'}
                  </button>
                  <button
                    onClick={() => setActionType(null)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminVerifications;
