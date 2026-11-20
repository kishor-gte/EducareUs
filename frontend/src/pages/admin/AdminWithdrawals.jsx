import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { ArrowDownToLine, CheckCircle2, XCircle, Building2 } from 'lucide-react';

export const AdminWithdrawals = () => {
  const queryClient = useQueryClient();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals-list'],
    queryFn: async () => {
      const res = await api.get('/admin/withdrawals');
      return res.data?.data || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, transactionRef, rejectionReason }) => {
      const res = await api.patch(`/admin/withdrawals/${id}/review`, {
        status,
        transactionRef,
        rejectionReason,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Disbursement status updated');
      setSelectedWithdrawal(null);
      setTransactionRef('');
      setRejectionReason('');
      queryClient.invalidateQueries(['admin-withdrawals-list']);
    },
    onError: (err) => {
      toast.error(err.friendlyMessage || 'Failed to update withdrawal');
    },
  });

  const columns = [
    {
      header: 'Beneficiary & Student',
      render: (w) => (
        <div>
          <div className="font-bold text-slate-900">{w.beneficiary?.fullName}</div>
          <div className="text-xs text-slate-500 line-clamp-1">{w.beneficiary?.email}</div>
        </div>
      ),
    },
    {
      header: 'Requested Payout',
      render: (w) => (
        <div>
          <span className="font-extrabold text-slate-900">
            ₹{Number(w.amount).toLocaleString('en-IN')}
          </span>
          <div className="text-[11px] text-emerald-600 font-semibold">
            Direct Bank Payout
          </div>
        </div>
      ),
    },
    {
      header: 'Bank Details',
      render: (w) => (
        <div className="text-xs text-slate-600">
          <div className="font-bold">{w.bankName}</div>
          <div>A/C: {w.bankAccountNumber}</div>
          <div className="font-mono text-slate-400">IFSC: {w.bankIfsc}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (w) => <StatusBadge status={w.status} />,
    },
    {
      header: 'Requested At',
      render: (w) => (
        <span className="text-xs text-slate-500">
          {new Date(w.requestedAt).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (w) => (
        <button
          onClick={() => setSelectedWithdrawal(w)}
          className="px-3 py-1.5 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-slate-800"
        >
          Process Payout
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Beneficiary Payout Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Approve university tuition fee disbursements directly to college institutional accounts.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Search payout requests..."
      />

      {/* Payout Processing Modal */}
      <Modal
        isOpen={Boolean(selectedWithdrawal)}
        onClose={() => setSelectedWithdrawal(null)}
        title="College Fee Disbursement Action"
      >
        {selectedWithdrawal && (
          <div className="space-y-5 text-sm text-slate-800">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-bold text-slate-900">
                  {selectedWithdrawal.beneficiary?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Disbursement Amount:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  ₹{Number(selectedWithdrawal.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank & IFSC:</span>
                <span className="font-bold text-slate-900">
                  {selectedWithdrawal.bankName} ({selectedWithdrawal.bankIfsc})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank UTR / NEFT Reference Number (For Approval)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-2026-HDFC-9918231"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason (If rejecting)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invalid college account IFSC or name mismatch"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() =>
                  reviewMutation.mutate({
                    id: selectedWithdrawal.id,
                    status: 'COMPLETED',
                    transactionRef: transactionRef || 'NEFT-SIMULATED-REF',
                  })
                }
                disabled={reviewMutation.isPending}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                Approve & Mark Transferred
              </button>
              <button
                onClick={() =>
                  reviewMutation.mutate({
                    id: selectedWithdrawal.id,
                    status: 'REJECTED',
                    rejectionReason: rejectionReason || 'Bank account details incomplete',
                  })
                }
                disabled={reviewMutation.isPending}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
              >
                Reject Payout
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminWithdrawals;
